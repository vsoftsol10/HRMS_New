import supabase from "../config/supabase.js";
import { getToday, getMonthRange } from "../utils/dateUtils.js";
import { matchesDepartment, departmentsAsArray } from "../utils/departmentMatch.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    const now = new Date();

    const today = getToday();

    const { startOfMonth, endOfMonth } = getMonthRange(now);

    const currentYear = now.getFullYear();

    // Logged in employee's name
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select(
        `
    first_name,
    department_id,
    departments (
      department_name
    )
  `,
      )
      .eq("id", employeeId)
      .single();

    const [
      { data: attendance, error: attendanceError },
      { data: leaveRequests, error: leaveError },
      { data: holidays, error: holidayError },
      { data: announcements, error: announcementError },
    ] = await Promise.all([
      // Current month attendance
      supabase
        .from("attendance")
        .select(
          `
          id,
          attendance_date,
          check_in,
          check_out,
          working_hours,
          status
        `,
        )
        .eq("employee_id", employeeId)
        .gte("attendance_date", startOfMonth)
        .lte("attendance_date", endOfMonth)
        .order("attendance_date", { ascending: false }),

      // Employee leave requests
      supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", employeeId)
        .order("applied_at", { ascending: false })
        .limit(4),

      // Upcoming holidays
      supabase
        .from("holidays")
        .select("*")
        .gte("holiday_date", today)
        .order("holiday_date")
        .limit(3),

      // Recent announcements - fetch a bigger Published pool and filter by
      // department in JS (see departmentMatch.js), since `department` can
      // be stored as null, "All", a single id, or an array of ids.
      supabase
        .from("announcements")
        .select("*")
        .eq("status", "Published")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    // FIX: was querying the non-existent payroll.pay_date column (see
    // dashboardController.js) - payroll is monthly, so next payroll is the
    // 1st of next month, same as the employee dashboard UI shows.
    const { startOfMonth: nextPayroll } = getMonthRange(
      new Date(now.getFullYear(), now.getMonth() + 1, 1),
    );

    // // Present Days

    // const presentDays = (attendance || []).filter(
    //   (item) => item.status === "Present",
    // ).length;
    // --------------------------------------------------
    // Attendance Calculation
    // Same logic as Attendance Module
    // --------------------------------------------------

    const records = attendance || [];

    const presentDays = records.filter(
      (item) => item.status === "Present",
    ).length;

    const lateDays = records.filter((item) => item.status === "Late").length;

    const halfDays = records.filter(
      (item) => item.status === "Half Day",
    ).length;

    const leaveDays = records.filter((item) => item.status === "Leave").length;

    const absentDays = records.filter(
      (item) => item.status === "Absent",
    ).length;

    /*
     * Attendance calculation:
     *
     * Present  = 1
     * Late     = 1
     * Half Day = 0.5
     * Leave    = 0
     * Absent   = 0
     */

    const attendedDays = presentDays + lateDays + halfDays * 0.5;

    const totalRecordedDays =
      presentDays + lateDays + halfDays + absentDays + leaveDays;

    const attendancePercentage =
      totalRecordedDays > 0
        ? Math.round((attendedDays / totalRecordedDays) * 100)
        : 0;

    // Leave Balance (example)

    const approvedLeaves = (leaveRequests || []).filter(
      (item) => item.status === "Approved",
    ).length;

    const leaveBalance = 2 - approvedLeaves;

    const recentAnnouncements = (announcements || [])
      .filter((a) =>
        matchesDepartment(a.department, employee?.department_id, req.user.role === "Intern"),
      )
      .slice(0, 3)
      .map((a) => ({ ...a, department: departmentsAsArray(a.department) }));

    res.json({
      userName: employee?.first_name ?? "",
      role: req.user.role,

      stats: {
        presentDays,
        halfDays,
        leaveDays,
        absentDays,
        lateDays,
        leaveBalance,
        nextPayroll,
        upcomingHolidays: holidays.length,
        attendancePercentage,
      },
      attendance,

      recentAnnouncements,

      leaveRequests,

      holidays,

      nextPayroll,
    });
  } catch (err) {
    console.error("Employee Dashboard Error:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "employeeDashboardController"),
    });
  }
};