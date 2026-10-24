import supabase from "../config/supabase.js";
import { formatLocalDate, isWeeklyOffDay } from "../utils/dateUtils.js";
import { safeErrorMessage } from "../utils/httpError.js";

const PRESENT_STATUSES = ["Present", "Late", "Half Day"];

/*
 * Attendance Trend (last 7 days, regular employees only).
 *
 * FIX: "Absent" used to be the count of attendance rows with status Absent.
 * Those rows only exist after the daily absence job has run (after office end
 * time, server running), so days the job missed - and today - always showed
 * 0 absent. Intern attendance rows were also counted as present although the
 * total excludes interns.
 *
 * Now, for every working day (not a weekly-off day, not a holiday):
 *   absent = active employees - present - on leave
 * which also matches the "Absent Today" card on the dashboard. Weekly-off
 * days and holidays show 0 absent.
 */
export const getAttendanceChart = async (req, res) => {
  try {
    // Active, non-intern employees
    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("status", "Active")
      .neq("role", "Intern");

    if (employeeError) throw employeeError;

    const employeeIds = (employees || []).map((e) => e.id);
    const totalActiveEmployees = employeeIds.length;

    // Last 7 days, oldest first
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date,
        key: formatLocalDate(date),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }

    const from = days[0].key;
    const to = days[days.length - 1].key;

    const [policyResult, holidayResult, attendanceResult] = await Promise.all([
      supabase
        .from("attendance_policy")
        .select("weekly_off_days")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("holidays")
        .select("holiday_date")
        .gte("holiday_date", from)
        .lte("holiday_date", to),

      employeeIds.length
        ? supabase
            .from("attendance")
            .select("employee_id, attendance_date, status")
            .gte("attendance_date", from)
            .lte("attendance_date", to)
            .in("employee_id", employeeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (policyResult.error) throw policyResult.error;
    if (holidayResult.error) throw holidayResult.error;
    if (attendanceResult.error) throw attendanceResult.error;

    const weeklyOffDays = policyResult.data?.weekly_off_days;
    const holidayDates = new Set(
      (holidayResult.data || []).map((h) => String(h.holiday_date).slice(0, 10)),
    );

    // Per-day counts from the single attendance query
    const counts = {};
    (attendanceResult.data || []).forEach((row) => {
      const key = String(row.attendance_date).slice(0, 10);
      counts[key] = counts[key] || { present: 0, leave: 0 };

      if (PRESENT_STATUSES.includes(row.status)) counts[key].present++;
      else if (row.status === "Leave") counts[key].leave++;
    });

    const attendanceChart = days.map(({ date, key, label }) => {
      const { present = 0, leave = 0 } = counts[key] || {};
      const nonWorkingDay =
        isWeeklyOffDay(weeklyOffDays, date) || holidayDates.has(key);

      return {
        day: label,
        present,
        absent: nonWorkingDay
          ? 0
          : Math.max(0, totalActiveEmployees - present - leave),
      };
    });

    res.json({ totalActiveEmployees, attendanceChart });
  } catch (error) {
    res.status(500).json({
      message: safeErrorMessage(error, "attendanceChartController"),
    });
  }
};