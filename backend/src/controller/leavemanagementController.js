import supabase from "../config/supabase.js";
import { createNotification } from "../services/notificationService.js";
import { getToday } from "../utils/dateUtils.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getLeaveRequests = async (req, res) => {
  try {
    // FIX: toISOString() converts to UTC first, so on an IST server "today"
    // was still yesterday between 12:00 AM and 5:30 AM.
    const today = getToday();

    const [
      { data: leaves, error },
      { count: pendingRequests },
      { count: approved },
      { count: rejected },
      { count: onLeaveToday },
    ] = await Promise.all([
      supabase
        .from("leave_requests")
        .select(
          `
    id,
    employee_id,
    leave_type,
    start_date,
    end_date,
    days,
    is_half_day,
    reason,
    rejection_reason,
    status,
    applied_at,
    attachment_url,
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
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending"),

      supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "Approved"),

      supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "Rejected"),

      supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .lte("start_date", today)
        .gte("end_date", today)
        .eq("status", "Approved"),
    ]);

      console.log("LEAVES:", JSON.stringify(leaves, null, 2))
      console.log("ERROR:", error)


    if (error) throw error;

    const formattedLeaves = (leaves || []).map((leave) => {
      const departmentName =
        leave.employees?.departments?.department_name || "";

      const isHRRequest = ["hr", "human resource", "human resources"].includes(
        departmentName.trim().toLowerCase(),
      );

      return {
        ...leave,
        employee_name: leave.employees?.first_name || "Unknown",
        employee_code: leave.employees?.employee_code || "",
        employee_role: leave.employees?.role || "",
        department_name: departmentName,
        isHRRequest,
      };
    });

    res.json({
      leaves: formattedLeaves,
      stats: {
        pendingRequests: pendingRequests || 0,
        approved: approved || 0,
        rejected: rejected || 0,
        onLeaveToday: onLeaveToday || 0,
      },
    });
  } catch (err) {
    console.log("LEAVE ERROR:");
    console.log(err);

    res.status(500).json({
      message: safeErrorMessage(err, "leavemanagementController"),
    });
  }
};

// export const createLeaveRequest = async (req, res) => {
//   try {
//     const { leave_type, start_date, end_date, is_half_day, reason } = req.body;

//     const actualEndDate = is_half_day ? start_date : end_date;

//     let totalDays = 1;

//     if (!is_half_day) {
//       const start = new Date(start_date);
//       const end = new Date(end_date);

//       totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
//     }

//     const { data, error } = await supabase
//       .from("leave_requests")
//       .insert({
//         employee_id: req.user.id,
//         leave_type,
//         start_date,
//         end_date: actualEndDate,
//         days: totalDays,
//         is_half_day,
//         reason,
//       })
//       .select()
//       .single();

//     if (error) {
//       return res.status(400).json({
//         message: error.message,
//       });
//     }

//     // Notify HR about the new leave request
//     await createNotification({
//       title: "New Leave Request",
//       message: `${req.user.first_name} has submitted a leave request.`,
//       type: "Leave",
//       role: "HR",
//       reference_id: data.id,
//     });

//     res.status(201).json(data);
//   } catch (err) {
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const requesterRole = req.user.role;

    // Get the leave request + employee department
    const { data: leaveRequest, error: fetchError } = await supabase
      .from("leave_requests")
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

    if (fetchError || !leaveRequest) {
      return res.status(404).json({
        message: "Leave request not found.",
      });
    }

    const employeeDepartment =
      leaveRequest.employees?.departments?.department_name;

    const isHRLeave =
      employeeDepartment?.trim().toLowerCase() === "human resource" ||
      employeeDepartment?.trim().toLowerCase() === "human resources" ||
      employeeDepartment?.trim().toLowerCase() === "hr";

    /*
     * HR leave requests can ONLY be handled by Admin.
     */
    if (isHRLeave && requesterRole !== "Admin") {
      return res.status(403).json({
        message:
          "Leave requests from the Human Resource department can only be approved or rejected by Admin.",
      });
    }

    /*
     * Optional but recommended:
     * HR should not approve/reject their own leave request.
     */
    if (
      leaveRequest.employee_id === req.user.employee_id &&
      requesterRole !== "Admin"
    ) {
      return res.status(403).json({
        message: "You cannot approve or reject your own leave request.",
      });
    }

    const updateData = {
      status,
    };

    // Rejection reason is required
    if (status === "Rejected") {
      if (!rejection_reason?.trim()) {
        return res.status(400).json({
          message: "Rejection reason is required.",
        });
      }

      updateData.rejection_reason = rejection_reason.trim();
    }

    // Clear rejection reason when approved
    if (status === "Approved") {
      updateData.rejection_reason = null;
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        message: safeErrorMessage(error, "leavemanagementController"),
      });
    }

    // Notification
    if (status === "Approved") {
      await createNotification({
        title: "Leave Approved",
        message: "Your leave request has been approved.",
        type: "Leave",
        role: "Employee",
        employee_id: data.employee_id,
        reference_id: data.id,
      });
    }

    if (status === "Rejected") {
      await createNotification({
        title: "Leave Rejected",
        message: `Your leave request was rejected. Reason: ${data.rejection_reason}`,
        type: "Leave",
        role: "Employee",
        employee_id: data.employee_id,
        reference_id: data.id,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("UPDATE LEAVE STATUS ERROR:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "leavemanagementController"),
    });
  }
};

