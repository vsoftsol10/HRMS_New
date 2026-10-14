// internAttendanceController.js
//
// HR / Admin -> Attendance -> "Interns" tab.
//   GET /api/attendance/interns?month=YYYY-MM
//
// One row per attendance record of an intern in the month (the daily absence
// job creates Absent / Leave rows, so a missed day is a row too). Interns that
// were converted to employees only show the days up to their conversion (the
// conversion shortens interns.end_date to the day before payroll starts).

import supabase from "../config/supabase.js";
import { getToday, getWorkingDaysInMonth } from "../utils/dateUtils.js";
import { handleError } from "../utils/internHelpers.js";

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const getInternAttendance = async (req, res) => {
  try {
    const requested = req.query.month ? String(req.query.month) : getToday().slice(0, 7);
    const match = MONTH_PATTERN.exec(requested);

    if (!match) {
      return res.status(400).json({ message: "Month must look like 2026-08." });
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const monthStart = `${requested}-01`;
    const monthEnd = `${requested}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

    const { data: interns, error: internError } = await supabase
      .from("interns")
      .select(
        `
        id,
        intern_code,
        employee_id,
        status,
        end_date,
        employee:employees!interns_employee_id_fkey (
          first_name,
          departments ( department_name )
        )
      `,
      );

    if (internError) throw internError;

    const internByEmployee = new Map(
      (interns || []).map((intern) => [intern.employee_id, intern]),
    );

    const [{ data: policy, error: policyError }, { data: holidays, error: holidayError }] =
      await Promise.all([
        supabase.from("attendance_policy").select("weekly_off_days").limit(1).maybeSingle(),
        supabase
          .from("holidays")
          .select("holiday_date")
          .gte("holiday_date", monthStart)
          .lte("holiday_date", monthEnd),
      ]);

    if (policyError) throw policyError;
    if (holidayError) throw holidayError;

    const workingDays = getWorkingDaysInMonth(
      year,
      month,
      policy?.weekly_off_days,
      (holidays || []).map((row) => String(row.holiday_date).slice(0, 10)),
    );

    let rows = [];

    if (internByEmployee.size) {
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("id, employee_id, attendance_date, check_in, check_out, working_hours, status, auto_checkout")
        .in("employee_id", [...internByEmployee.keys()])
        .gte("attendance_date", monthStart)
        .lte("attendance_date", monthEnd)
        .order("attendance_date", { ascending: false })
        .order("check_in", { ascending: true });

      if (attendanceError) throw attendanceError;

      rows = (attendance || [])
        .map((record) => {
          const intern = internByEmployee.get(record.employee_id);
          const date = String(record.attendance_date).slice(0, 10);

          // Converted interns: ignore anything on/after they became employees.
          if (intern.status === "Converted" && date > String(intern.end_date).slice(0, 10)) {
            return null;
          }

          return {
            id: record.id,
            intern_id: intern.id,
            intern_code: intern.intern_code,
            full_name: intern.employee?.first_name ?? "-",
            department_name: intern.employee?.departments?.department_name ?? "-",
            attendance_date: date,
            check_in: record.check_in,
            check_out: record.check_out,
            working_hours: record.working_hours,
            status: record.status,
            auto_checkout: Boolean(record.auto_checkout),
          };
        })
        .filter(Boolean);
    }

    res.json({ month: requested, working_days: workingDays, rows });
  } catch (err) {
    handleError(res, err, "getInternAttendance");
  }
};