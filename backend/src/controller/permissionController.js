// permissionController.js
//
// Admin/HR side of the Permission workflow - mirrors
// leavemanagementController.js, but for the permissions table. HR-request
// handling rules (an HR employee's own request can only be approved or
// rejected by Admin) are kept consistent with leave for the same reason:
// HR shouldn't approve their own or a peer's request.

import supabase from "../config/supabase.js";
import { createNotification } from "../services/notificationService.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getPermissionRequests = async (req, res) => {
  try {
    const [
      { data: permissions, error },
      { count: pendingRequests },
      { count: approved },
      { count: rejected },
    ] = await Promise.all([
      supabase
        .from("permissions")
        .select(
          `
    id,
    employee_id,
    permission_type,
    permission_date,
    start_time,
    end_time,
    is_half_day,
    reason,
    rejection_reason,
    status,
    applied_at,
    employees (
      id,
      employee_code,
      first_name,
      role,
      departments (
        id,
        department_name
      )
    )
  `,
        )
        .order("applied_at", { ascending: false }),

      supabase
        .from("permissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending"),

      supabase
        .from("permissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "Approved"),

      supabase
        .from("permissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "Rejected"),
    ]);

    if (error) throw error;

    const formattedPermissions = (permissions || []).map((permission) => {
      const departmentName =
        permission.employees?.departments?.department_name || "";

      const isHRRequest = ["hr", "human resource", "human resources"].includes(
        departmentName.trim().toLowerCase(),
      );

      return {
        ...permission,
        employee_name: permission.employees?.first_name || "Unknown",
        employee_code: permission.employees?.employee_code || "",
        employee_role: permission.employees?.role || "",
        department_name: departmentName,
        isHRRequest,
      };
    });

    res.json({
      permissions: formattedPermissions,
      stats: {
        pendingRequests: pendingRequests || 0,
        approved: approved || 0,
        rejected: rejected || 0,
      },
    });
  } catch (err) {
    console.error("Get permission requests error:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "permissionController"),
    });
  }
};

export const updatePermissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const requesterRole = req.user.role;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected.",
      });
    }

    // Get the permission request + employee department
    const { data: permissionRequest, error: fetchError } = await supabase
      .from("permissions")
      .select(
        `
        id,
        employee_id,
        status,
        employees (
          id,
          first_name,
          departments (
            department_name
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (fetchError || !permissionRequest) {
      return res.status(404).json({
        message: "Permission request not found.",
      });
    }

    const employeeDepartment =
      permissionRequest.employees?.departments?.department_name;

    const isHRPermission =
      employeeDepartment?.trim().toLowerCase() === "human resource" ||
      employeeDepartment?.trim().toLowerCase() === "human resources" ||
      employeeDepartment?.trim().toLowerCase() === "hr";

    /*
     * HR permission requests can ONLY be handled by Admin.
     */
    if (isHRPermission && requesterRole !== "Admin") {
      return res.status(403).json({
        message:
          "Permission requests from the Human Resource department can only be approved or rejected by Admin.",
      });
    }

    /*
     * HR should not approve/reject their own permission request.
     */
    if (
      permissionRequest.employee_id === req.user.employee_id &&
      requesterRole !== "Admin"
    ) {
      return res.status(403).json({
        message: "You cannot approve or reject your own permission request.",
      });
    }

    const updateData = { status };

    if (status === "Rejected") {
      if (!rejection_reason?.trim()) {
        return res.status(400).json({
          message: "Rejection reason is required.",
        });
      }

      updateData.rejection_reason = rejection_reason.trim();
    }

    if (status === "Approved") {
      updateData.rejection_reason = null;
    }

    const { data, error } = await supabase
      .from("permissions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        message: safeErrorMessage(error, "permissionController"),
      });
    }

    if (status === "Approved") {
      await createNotification({
        title: "Permission Approved",
        message: "Your permission request has been approved.",
        type: "Permission",
        role: "Employee",
        employee_id: data.employee_id,
        reference_id: data.id,
      });
    }

    if (status === "Rejected") {
      await createNotification({
        title: "Permission Rejected",
        message: `Your permission request was rejected. Reason: ${data.rejection_reason}`,
        type: "Permission",
        role: "Employee",
        employee_id: data.employee_id,
        reference_id: data.id,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Update permission status error:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "permissionController"),
    });
  }
};