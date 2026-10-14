import supabase from "../config/supabase.js";
import { getToday, getMonthRange } from "../utils/dateUtils.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getDashboard = async (req, res) => {
  try {
    const today = getToday();

    // Logged in employee's name
    const { data: employee } = await supabase
      .from("employees")
      .select("first_name")
      .eq("id", req.user.employee_id)
      .single();

    const [
      { count: totalEmployees },
      { count: pendingLeaves },
      { count: presentToday },
      { count: totalDepartments },
      { data: upcomingHolidays },
      { data: recentAnnouncements },
      { data: recentLeaveRequests, error: recentLeaveRequestsError },
    ] = await Promise.all([
      // Total employees
      supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active")
        .neq("role", "Intern"),

      // Pending leaves
      supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending"),

      // Present today
      supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", today)
        .in("status", ["Present", "Late", "Half Day"]),

      // Departments
      supabase.from("departments").select("*", { count: "exact", head: true }),

      // Upcoming holidays
      supabase
        .from("holidays")
        .select("*")
        .gte("holiday_date", today)
        .order("holiday_date")
        .limit(4),

      // Recent announcements
      supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3),

      // Recent leave requests
      supabase
        .from("leave_requests")
        .select(
          `
    leave_type,
    start_date,
    end_date,
    status,
    employees (
      first_name
    )
  `,
        )
        .eq("status", "Pending")
        .limit(3),
    ]);

    /*
     * FIX: this used to query payroll.pay_date, a column that does not
     * exist (the table has paid_at), so the query always errored and
     * nextPayroll was always null. Payroll rows are only created when a run
     * is generated, so there is nothing to look ahead in that table.
     * Payroll is monthly, so the next payroll is the 1st of next month -
     * the same value the employee dashboard already displays.
     */
    const now = new Date();
    const { startOfMonth: nextPayroll } = getMonthRange(
      new Date(now.getFullYear(), now.getMonth() + 1, 1),
    );



    const absentToday = (totalEmployees || 0) - (presentToday || 0);

    res.json({
      userName: employee?.first_name ?? "",
      role: req.user.role,
      totalEmployees,
      presentToday,
      absentToday,
      pendingLeaves,
      totalDepartments,
      nextPayroll,
      upcomingHolidays,
      recentAnnouncements,
      recentLeaveRequests,
    });
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "dashboardController"),
    });
  }
};