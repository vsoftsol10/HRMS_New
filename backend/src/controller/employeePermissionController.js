// employeePermissionController.js
//
// Half-day and short-absence requests (Late Arrival, Early Leave, Medical,
// Personal, Half Day) live here instead of leave_requests. Unlike leave,
// these do NOT touch leave_balance at all - they're just logged and
// approved/rejected by HR/Admin, same workflow as leave_requests.

import supabase from "../config/supabase.js";
import { createNotification } from "../services/notificationService.js";
import { safeErrorMessage } from "../utils/httpError.js";

const PERMISSION_TYPES = [
  "Late Arrival",
  "Early Leave",
  "Medical",
  "Personal",
  "Half Day",
];

// ======================================================
// GET EMPLOYEE PERMISSIONS
// ======================================================

export const getEmployeePermissions = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    const { data: permissionHistory, error } = await supabase
      .from("permissions")
      .select("*")
      .eq("employee_id", employeeId)
      .order("applied_at", { ascending: false });

    if (error) throw error;

    const pendingRequests = (permissionHistory || []).filter(
      (permission) => permission.status === "Pending",
    ).length;

    res.status(200).json({
      stats: {
        pendingRequests,
      },
      permissionHistory: permissionHistory || [],
    });
  } catch (error) {
    console.error("Get employee permissions error:", error);

    res.status(500).json({
      message: safeErrorMessage(error, "employeePermissionController"),
    });
  }
};

// ======================================================
// CREATE PERMISSION REQUEST
// ======================================================

export const createPermissionRequest = async (req, res) => {
  try {
    const {
      permission_type,
      permission_date,
      start_time,
      end_time,
      is_half_day,
      reason,
    } = req.body;

    const employeeId = req.user.employee_id;

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (!permission_type || !permission_date || !reason) {
      return res.status(400).json({
        message: "Permission type, date and reason are required.",
      });
    }

    if (!PERMISSION_TYPES.includes(permission_type)) {
      return res.status(400).json({
        message: `Invalid permission type: ${permission_type}`,
      });
    }

    if (!is_half_day) {
      if (!start_time || !end_time) {
        return res.status(400).json({
          message:
            "Start time and end time are required unless this is a half-day request.",
        });
      }

      if (end_time <= start_time) {
        return res.status(400).json({
          message: "End time must be after start time.",
        });
      }
    }

    // --------------------------------------------------
    // Create permission request
    // --------------------------------------------------

    const { data, error } = await supabase
      .from("permissions")
      .insert({
        employee_id: employeeId,
        permission_type,
        permission_date,
        start_time: is_half_day ? null : start_time,
        end_time: is_half_day ? null : end_time,
        is_half_day: Boolean(is_half_day),
        reason,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        message: safeErrorMessage(error, "employeePermissionController"),
      });
    }

    // --------------------------------------------------
    // Notify HR
    // --------------------------------------------------

    await createNotification({
      title: "New Permission Request",
      message: `${req.user.employee_code} has submitted a permission request.`,
      type: "Permission",
      role: "HR",
      reference_id: data.id,
    });

    res.status(201).json({
      message: "Permission request submitted successfully.",
      data,
    });
  } catch (err) {
    console.error("Create permission request error:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "employeePermissionController"),
    });
  }
};