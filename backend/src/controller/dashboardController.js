import supabase from "../config/supabase.js";
import { getToday, getMonthRange } from "../utils/dateUtils.js";
import { safeErrorMessage } from "../utils/httpError.js";

// Payroll rows that count as "processed" for the dashboard card.
const PROCESSED_PAYROLL_STATUSES = ["Finalized", "Paid"];

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/*
 * Payroll Status card: the latest payroll cycle (most recent payroll_month
 * that has rows). Amounts are summed over processed (Finalized / Paid) rows
 * only - Draft / Review numbers are recalculated at finalize time.
 * Never throws: a failure here must not take the whole dashboard down.
 */
const getPayrollStatus = async () => {
  try {
    const { data: latest, error: latestError } = await supabase
      .from("payroll")
      .select("payroll_month")
      .order("payroll_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;

    if (!latest) {
      return { month: null, processed: 0, total: 0, gross: 0, deductions: 0, net: 0 };
    }

    const { data: rows, error } = await supabase
      .from("payroll")
      .select("status, gross_salary, deductions, net_salary")
      .eq("payroll_month", latest.payroll_month);

    if (error) throw error;

    const processedRows = (rows || []).filter((row) =>
      PROCESSED_PAYROLL_STATUSES.includes(row.status),
    );

    const sum = (key) =>
      round2(processedRows.reduce((total, row) => total + Number(row[key] || 0), 0));

    return {
      month: latest.payroll_month,
      processed: processedRows.length,
      total: (rows || []).length,
      gross: sum("gross_salary"),
      deductions: sum("deductions"),
      net: sum("net_salary"),
    };
  } catch (err) {
    console.error("dashboardController payrollStatus:", err);
    return null;
  }
};

/*
 * announcements.posted_by stores employees.employee_code. The old query used
 * select("*") with no join, so the dashboard always showed "Unknown" as the
 * author. Attach { employees: { first_name } } (the shape the card reads).
 */
const attachAnnouncementPosters = async (announcements) => {
  const list = announcements || [];
  const codes = [...new Set(list.map((a) => a.posted_by).filter(Boolean))];

  if (!codes.length) return list.map((a) => ({ ...a, employees: null }));

  const { data: posters } = await supabase
    .from("employees")
    .select("employee_code, first_name")
    .in("employee_code", codes);

  const byCode = Object.fromEntries(
    (posters || []).map((e) => [e.employee_code, e]),
  );

  return list.map((a) => ({
    ...a,
    employees: byCode[a.posted_by]
      ? { first_name: byCode[a.posted_by].first_name }
      : null,
  }));
};

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
      { data: companySettings },
      payrollStatus,
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

      // Company name (singleton settings row)
      supabase.from("company_settings").select("company_name").maybeSingle(),

      // Latest payroll cycle summary
      getPayrollStatus(),
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
      companyName: companySettings?.company_name ?? "",
      role: req.user.role,
      totalEmployees,
      presentToday,
      absentToday,
      pendingLeaves,
      totalDepartments,
      nextPayroll,
      upcomingHolidays,
      recentAnnouncements: await attachAnnouncementPosters(recentAnnouncements),
      recentLeaveRequests,
      payrollStatus,
    });
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "dashboardController"),
    });
  }
};