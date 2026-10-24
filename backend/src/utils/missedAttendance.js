import supabase from "../config/supabase.js";
import { formatLocalDate } from "./dateUtils.js";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const ymd = (value) => (value ? String(value).slice(0, 10) : null);

/**
 * DISPLAY ONLY - never written to the DB, so payroll / LOP are untouched.
 *
 * Returns the "YYYY-MM-DD" dates in [fromDate, toDate] that were working days
 * for the employee but have NO attendance row at all. The range is clamped to
 * the employee's joining / intern start date, the intern end date, and
 * yesterday (today is not over yet). Weekly offs and holidays are skipped.
 *
 * @param {number} employeeId
 * @param {string|null} fromDate - "YYYY-MM-DD"; null = since joining
 * @param {string} toDate - "YYYY-MM-DD"
 */
export const getMissedAttendanceDates = async (employeeId, fromDate, toDate) => {
  const [{ data: empRow }, { data: internRow }] = await Promise.all([
    supabase
      .from("employees")
      .select("joining_date")
      .eq("id", employeeId)
      .maybeSingle(),
    supabase
      .from("interns")
      .select("start_date, end_date")
      .eq("employee_id", employeeId)
      .maybeSingle(),
  ]);

  const joined = ymd(internRow?.start_date || empRow?.joining_date);
  const firstDay = [fromDate, joined].filter(Boolean).sort().pop();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastDay = [toDate, formatLocalDate(yesterday), ymd(internRow?.end_date)]
    .filter(Boolean)
    .sort()[0];

  if (!firstDay || firstDay > lastDay) return [];

  const [
    { data: policy, error: policyError },
    { data: holidayRows, error: holidayError },
    { data: attendanceRows, error: attendanceError },
    { data: leaveRows, error: leaveError },
  ] = await Promise.all([
    supabase.from("attendance_policy").select("weekly_off_days").limit(1).maybeSingle(),
    supabase
      .from("holidays")
      .select("holiday_date")
      .gte("holiday_date", firstDay)
      .lte("holiday_date", lastDay),
    supabase
      .from("attendance")
      .select("attendance_date")
      .eq("employee_id", employeeId)
      .gte("attendance_date", firstDay)
      .lte("attendance_date", lastDay),
    // Pending / Approved leave requests: those days are not "absent".
    supabase
      .from("leave_requests")
      .select("start_date, end_date")
      .eq("employee_id", employeeId)
      .in("status", ["Pending", "Approved"])
      .lte("start_date", lastDay)
      .gte("end_date", firstDay),
  ]);

  if (policyError) throw policyError;
  if (holidayError) throw holidayError;
  if (attendanceError) throw attendanceError;
  if (leaveError) throw leaveError;

  const recorded = new Set((attendanceRows || []).map((r) => ymd(r.attendance_date)));
  const holidays = new Set((holidayRows || []).map((r) => ymd(r.holiday_date)));
  const weeklyOff = String(policy?.weekly_off_days || "")
    .split(",")
    .map((day) => day.trim().toLowerCase())
    .filter(Boolean);

  const onLeave = new Set();
  for (const leave of leaveRows || []) {
    for (
      const d = new Date(`${ymd(leave.start_date)}T00:00:00`);
      formatLocalDate(d) <= ymd(leave.end_date);
      d.setDate(d.getDate() + 1)
    ) {
      onLeave.add(formatLocalDate(d));
    }
  }

  const missed = [];
  for (
    const d = new Date(`${firstDay}T00:00:00`);
    formatLocalDate(d) <= lastDay;
    d.setDate(d.getDate() + 1)
  ) {
    const key = formatLocalDate(d);
    if (recorded.has(key) || holidays.has(key) || onLeave.has(key)) continue;
    if (weeklyOff.includes(DAY_NAMES[d.getDay()])) continue;
    missed.push(key);
  }

  return missed;
};