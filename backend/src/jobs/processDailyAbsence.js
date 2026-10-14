import supabase from "../config/supabase.js";
import { initializeLeaveBalance } from "../services/leaveBalanceService.js";
import {
  getToday,
  getWeekdayName,
  isWeeklyOffDay,
} from "../utils/dateUtils.js";
import { createNotification } from "../services/notificationService.js";
import { processAttendanceLop } from "../services/attendanceLopService.js";

/**
 * Convert PostgreSQL time value (HH:mm:ss) to minutes.
 */
const timeToMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

/**
 * Process daily absences.
 *
 * Rules:
 *
 * 1. Read attendance policy.
 * 2. Do not process before office_end_time.
 * 3. Skip weekly-off days.
 * 4. Skip holidays.
 * 5. Get active employees.
 * 6. Skip employees who already have attendance.
 * 7. Initialize leave balance if missing.
 * 8. Add one day LOP.
 * 9. Create Absent attendance.
 */
export const processDailyAbsence = async () => {
  const now = new Date();

  const today = getToday();
  const year = now.getFullYear();

  console.log(`[ABSENCE] Processing absences for ${today}`);

  try {
    // --------------------------------------------------
    // 1. Get attendance policy
    // --------------------------------------------------
    const { data: policy, error: policyError } = await supabase
      .from("attendance_policy")
      .select(`
        id,
        office_start_time,
        office_end_time,
        grace_period,
        half_day_cutoff_time,
        working_hours,
        weekly_off_days
      `)
      .limit(1)
      .maybeSingle();

    if (policyError) {
      throw policyError;
    }

    if (!policy) {
      throw new Error("Attendance policy not found.");
    }

    // --------------------------------------------------
    // 2. Check office end time
    // --------------------------------------------------
    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const officeEndMinutes = timeToMinutes(
      policy.office_end_time,
    );

    if (officeEndMinutes === null) {
      throw new Error("office_end_time is not configured.");
    }

    /**
     * Do not mark employees absent before office end time.
     *
     * Example:
     *
     * office_end_time = 18:00
     *
     * Job runs at 15:00
     * → Stop
     *
     * Job runs at 18:05
     * → Continue
     */
    if (currentMinutes < officeEndMinutes) {
      console.log(
        `[ABSENCE] Office end time ${policy.office_end_time} has not been reached. Skipping.`,
      );

      return;
    }

    // --------------------------------------------------
    // 3. Check weekly off day
    // --------------------------------------------------
    if (
      isWeeklyOffDay(
        policy.weekly_off_days,
        now,
      )
    ) {
      console.log(
        `[ABSENCE] ${today} is a weekly off day (${getWeekdayName(now)}). Skipping.`,
      );

      return;
    }

    // --------------------------------------------------
    // 4. Check holiday
    // --------------------------------------------------
    const { data: holiday, error: holidayError } =
      await supabase
        .from("holidays")
        .select(
          "id, holiday_name, holiday_date, type",
        )
        .eq("holiday_date", today)
        .maybeSingle();

    if (holidayError) {
      throw holidayError;
    }

    if (holiday) {
      console.log(
        `[ABSENCE] ${today} is a holiday: ${holiday.holiday_name} (${holiday.type}). Skipping.`,
      );

      return;
    }

    // --------------------------------------------------
    // 5. Get active employees
    // --------------------------------------------------
    // Interns are included here (unlike payroll and the HR "Employees"
    // dashboard counts): the intern portal shows their own attendance, so
    // a missed check-in still needs to be marked Absent + LOP for them too.
    const { data: employees, error: employeeError } =
      await supabase
        .from("employees")
        .select("id")
        .eq("status", "Active");

    if (employeeError) {
      throw employeeError;
    }

    if (!employees?.length) {
      console.log("[ABSENCE] No active employees found.");
      return;
    }

    // --------------------------------------------------
    // 6. Process each employee
    // --------------------------------------------------
    for (const employee of employees) {
      try {
        // ----------------------------------------------
        // Check whether attendance already exists
        // ----------------------------------------------
        const {
          data: attendance,
          error: attendanceError,
        } = await supabase
          .from("attendance")
          .select(
            "id, status, leave_processed",
          )
          .eq("employee_id", employee.id)
          .eq("attendance_date", today)
          .maybeSingle();

        if (attendanceError) {
          throw attendanceError;
        }

        /**
         * If attendance already exists, do nothing.
         *
         * Examples:
         *
         * Present → skip
         * Leave   → skip
         * Absent  → skip
         */
        if (attendance) {
          console.log(
            `[ABSENCE] Employee ${employee.id} already has ${attendance.status} attendance. Skipping.`,
          );

          continue;
        }

        // ----------------------------------------------
        // Initialize leave balance
        // ----------------------------------------------
        const balance = await initializeLeaveBalance(
          employee.id,
          year,
        );

        // ----------------------------------------------
        // Add one day LOP
        // ----------------------------------------------
        const newLop =
          Number(balance.lop || 0) + 1;

        const {
          error: balanceError,
        } = await supabase
          .from("leave_balance")
          .update({
            lop: newLop,
            updated_at: new Date().toISOString(),
          })
          .eq("id", balance.id);

        if (balanceError) {
          throw balanceError;
        }

        // ----------------------------------------------
        // Create absent attendance
        // ----------------------------------------------
        const {
          error: attendanceInsertError,
        } = await supabase
          .from("attendance")
          .insert({
            employee_id: employee.id,
            attendance_date: today,
            status: "Absent",
            leave_processed: true,
            // The whole day is LOP. Payroll reads attendance.lop_days, not
            // the yearly leave_balance.lop counter updated above.
            lop_days: 1,
            lop_processed: true,
          });

        if (attendanceInsertError) {
          throw attendanceInsertError;
        }

        try {
          await createNotification({
            title: "Marked Absent",
            message: `You were marked Absent for ${today} and 1 day LOP was applied since no attendance was recorded.`,
            type: "Attendance",
            role: "Employee",
            employee_id: employee.id,
          });
        } catch (notifyError) {
          console.error(
            `[ABSENCE] Failed to notify employee ${employee.id}:`,
            notifyError.message,
          );
        }

        console.log(
          `[ABSENCE] Employee ${employee.id} marked Absent + 1 LOP.`,
        );
      } catch (error) {
        console.error(
          `[ABSENCE] Failed for employee ${employee.id}:`,
          error.message,
        );
      }
    }

    console.log(
      `[ABSENCE] Completed for ${today}`,
    );

    // Per-day LOP for checked-in rows is handled by processDailyLop(),
    // which the scheduler runs after this job (see scheduler.js) so it also
    // runs on weekly offs / holidays and before office end, when this
    // function returns early.
    await processDailyLop();
  } catch (error) {
    console.error(
      "[ABSENCE] Job failed:",
      error.message,
    );
  }
};

/**
 * Calculate and store lop_days for attendance rows that have a check_in and
 * have not been LOP-processed yet.
 *
 * Which days: every day before today, plus today itself once
 * office_end_time has passed (the day is over, so check-outs are in - this is
 * what lets payroll generated on the 1st see the last day of the previous
 * month). Deliberately not limited to "yesterday": days missed while the
 * backend was down, and rows flagged for review (e.g. missing check-out)
 * once their data is corrected, are picked up automatically on a later run.
 *
 * Runs on every scheduler tick, independent of weekly offs / holidays, so a
 * weekend still catches up Friday's rows. Includes interns (this job now
 * marks their attendance/absence too - see the comment on step 5 above), but
 * payroll itself continues to exclude interns via its own employee query.
 */
export const processDailyLop = async () => {
  const now = new Date();
  const today = getToday();

  try {
    const { data: policy, error: policyError } = await supabase
      .from("attendance_policy")
      .select("office_end_time")
      .limit(1)
      .maybeSingle();

    if (policyError) {
      throw policyError;
    }

    const officeEndMinutes = timeToMinutes(policy?.office_end_time);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const includeToday =
      officeEndMinutes !== null && nowMinutes >= officeEndMinutes;

    console.log(
      `[LOP] Processing unprocessed attendance ${includeToday ? "up to and including" : "before"} ${today}`,
    );

    let query = supabase
      .from("attendance")
      .select(
        "id, employee_id, attendance_date, check_in, check_out, status, lop_processed, auto_checkout",
      )
      .eq("lop_processed", false)
      .not("check_in", "is", null)
      .order("attendance_date", { ascending: true });

    query = includeToday
      ? query.lte("attendance_date", today)
      : query.lt("attendance_date", today);

    const { data: rows, error: rowsError } = await query;

    if (rowsError) {
      throw rowsError;
    }

    if (!rows?.length) {
      console.log("[LOP] No rows to process.");
      return;
    }

    for (const row of rows) {
      try {
        const result = await processAttendanceLop(row);

        if (!result.needsReview) {
          const { error: markError } = await supabase
            .from("attendance")
            .update({ lop_processed: true })
            .eq("id", row.id);

          if (markError) {
            throw markError;
          }

          console.log(
            `[LOP] Employee ${row.employee_id} on ${row.attendance_date}: lop_days=${result.lopDays} (${result.reason})`,
          );
        } else {
          console.log(
            `[LOP] Employee ${row.employee_id} on ${row.attendance_date} needs review: ${result.reason}`,
          );
        }
      } catch (error) {
        console.error(
          `[LOP] Failed for employee ${row.employee_id}:`,
          error.message,
        );
      }
    }

    console.log(`[LOP] Completed (${rows.length} row(s) looked at)`);
  } catch (error) {
    console.error("[LOP] Job failed:", error.message);
  }
};