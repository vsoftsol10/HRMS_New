import supabase from "../config/supabase.js";
import { getWorkingDaysInMonth } from "../utils/dateUtils.js";

/**
 * Attendance summary per period, used for the payroll Finalize snapshot.
 *
 * Counts are derived from the attendance.status values already set by
 * the existing attendance flow (check-in/out, leave approval, the daily
 * absence job) - this service does not change how status is assigned,
 * it only aggregates it for the month.
 */
export const getAttendanceSummaryForMonth = async (employeeId, year, month) => {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

  const { data: policy, error: policyError } = await supabase
    .from("attendance_policy")
    .select("weekly_off_days")
    .limit(1)
    .maybeSingle();

  if (policyError) throw policyError;

  const { data: holidayRows, error: holidayError } = await supabase
    .from("holidays")
    .select("holiday_date")
    .gte("holiday_date", monthStart)
    .lte("holiday_date", monthEnd);

  if (holidayError) throw holidayError;

  const workingDays = getWorkingDaysInMonth(
    year,
    month,
    policy?.weekly_off_days,
    (holidayRows || []).map((row) => row.holiday_date),
  );

  const { data: rows, error: rowsError } = await supabase
    .from("attendance")
    .select("status, lop_days, lop_processed")
    .eq("employee_id", employeeId)
    .gte("attendance_date", monthStart)
    .lte("attendance_date", monthEnd);

  if (rowsError) throw rowsError;

  const summary = {
    workingDays,
    presentDays: 0,
    paidLeaveDays: 0,
    absentDays: 0,
    halfDays: 0,
    lopDays: 0,
    unprocessedAttendanceRows: 0,
  };

  for (const row of rows || []) {
    if (row.status === "Present" || row.status === "Late") {
      summary.presentDays += 1;
    } else if (row.status === "Leave") {
      // Unpaid Leave / leave beyond balance carries lop_days on the row -
      // only the covered part counts as paid leave.
      summary.paidLeaveDays += Math.max(0, 1 - Number(row.lop_days || 0));
    } else if (row.status === "Absent") {
      summary.absentDays += 1;
    } else if (row.status === "Half Day") {
      summary.halfDays += 1;
    }

    summary.lopDays += Number(row.lop_days || 0);

    if (!row.lop_processed) {
      summary.unprocessedAttendanceRows += 1;
    }
  }

  summary.lopDays = Number(summary.lopDays.toFixed(2));

  return summary;
};