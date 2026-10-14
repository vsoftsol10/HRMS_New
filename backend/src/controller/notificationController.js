import supabase from "../config/supabase.js";
import { matchesDepartment } from "../utils/departmentMatch.js";
import { safeErrorMessage } from "../utils/httpError.js";

/*
 * FIX: markNotificationAsRead and deleteNotification previously did
 * `.eq("id", id)` with no ownership/visibility check at all - any
 * authenticated user (any employee, HR, or Admin) could mark as read
 * or permanently delete ANY notification just by guessing/iterating
 * an id, including another employee's personal notifications (e.g.
 * "Password Changed") or another HR/Admin user's items. This mirrors
 * the same visibility rules getNotifications() already uses to decide
 * what a user is allowed to see, and rejects the request if the
 * target notification isn't one of them.
 */
const canAccessNotification = async (notification, role, employeeId) => {
  if (role === "Employee" || role === "Intern") {
    if (notification.employee_id === employeeId) {
      return true;
    }

    // FIX: a personal notification (employee_id set, department left null -
    // e.g. "Marked Absent", "Password Changed") was falling through to
    // matchesDepartment(null, ...), which treats a null department as
    // "visible to everyone" - so it was readable/deletable by ANY employee,
    // not just its owner. Only a broadcast row (employee_id null) should be
    // matched by department; a personal row that isn't this user's is never
    // accessible here.
    if (notification.employee_id !== null) {
      return false;
    }

    const { data: employee, error } = await supabase
      .from("employees")
      .select("department_id")
      .eq("id", employeeId)
      .single();

    if (error) throw error;

    return matchesDepartment(
      notification.department,
      employee.department_id,
      role === "Intern",
    );
  }

  if (role === "HR" || role === "Admin") {
    if (!["HR", "Admin"].includes(notification.role)) {
      return false;
    }

    return (
      notification.employee_id === null || notification.employee_id === employeeId
    );
  }

  return false;
};

export const getNotifications = async (req, res) => {
  try {
    const role = req.user.role;
    const employeeId = req.user.employee_id;

    let departmentId = null;

    if (role === "Employee" || role === "Intern") {
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("department_id")
        .eq("id", employeeId)
        .single();

      if (employeeError) throw employeeError;

      departmentId = employee.department_id;
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    // HR and Admin share one management inbox: a notification created with
    // role "HR" (e.g. "New Leave Request") must still reach an Admin user,
    // since nothing ever creates a notification with role "Admin"
    // specifically. A scalar .eq("role", role) here would leave Admin
    // permanently empty, so both roles query the same management set.
    if (role === "HR" || role === "Admin") {
      query = query.in("role", ["HR", "Admin"]);
    }

    const { data, error } = await query;

    if (error) throw error;

    // For Employees, department can be stored as null, "All", a single id,
    // or an array of ids (see departmentMatch.js), so filter in JS instead
    // of a scalar .eq()/.or() that can silently miss department-targeted
    // rows. Personally-targeted notifications (employee_id set) still pass.
    let filtered = data;

    if (role === "Employee" || role === "Intern") {
      // FIX: same bug as canAccessNotification above - a personal row
      // (employee_id set, department null) must never fall through to the
      // department match; only department-targeted BROADCASTS (employee_id
      // null) should be matched that way.
      filtered = (data || []).filter(
        (n) =>
          n.employee_id === employeeId ||
          (n.employee_id === null &&
            matchesDepartment(n.department, departmentId, role === "Intern")),
      );
    } else if (role === "HR" || role === "Admin") {
      // Broadcast rows (employee_id null, e.g. "New Leave Request") go to
      // the whole HR/Admin group. A row that has employee_id set (e.g.
      // "Password Changed") is personal and must only reach that specific
      // HR/Admin user, not the entire group.
      filtered = (data || []).filter(
        (n) => n.employee_id === null || n.employee_id === employeeId,
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "notificationController"),
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const employeeId = req.user.employee_id;

    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (!(await canAccessNotification(notification, role, employeeId))) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "notificationController"),
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const role = req.user.role;
    const employeeId = req.user.employee_id;

    let query = supabase.from("notifications").update({
      is_read: true,
    });

    if (role === "Employee" || role === "Intern") {
      query = query.eq("employee_id", employeeId);
    }

    if (role === "HR" || role === "Admin") {
      // Same shared-inbox rule as getNotifications: only mark broadcast
      // rows (employee_id null) and this user's own personal rows, never
      // another HR/Admin user's personal notifications.
      query = query
        .in("role", ["HR", "Admin"])
        .or(`employee_id.is.null,employee_id.eq.${employeeId}`);
    }

    const { error } = await query;

    if (error) throw error;

    res.json({
      message: "Notifications marked as read",
    });
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "notificationController"),
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const employeeId = req.user.employee_id;

    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (!(await canAccessNotification(notification, role, employeeId))) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      message: "Notification deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "notificationController"),
    });
  }
};