import supabase from "../config/supabase.js";
import { deductLeave } from "../services/leaveDeductionService.js";
import { initializeLeaveBalance } from "../services/leaveBalanceService.js";
import {
  getToday,
  getWeekdayName,
  isWeeklyOffDay,
} from "../utils/dateUtils.js";

/* =========================================================
   DAILY LEAVE PROCESSING
========================================================= */

export const processDailyLeaves = async () => {
  const now = new Date();

  const today = getToday();
  const year = now.getFullYear();

  console.log(`[LEAVE] Processing approved leaves for ${today}`);

  try {
    /* =====================================================
       1. GET ATTENDANCE POLICY
    ===================================================== */

    const { data: policy, error: policyError } = await supabase
      .from("attendance_policy")
      .select("weekly_off_days")
      .limit(1)
      .maybeSingle();

    if (policyError) {
      throw policyError;
    }

    if (!policy) {
      throw new Error("Attendance policy not found.");
    }

    /* =====================================================
       2. CHECK WEEKLY OFF
    ===================================================== */

    if (isWeeklyOffDay(policy.weekly_off_days, now)) {
      console.log(
        `[LEAVE] ${today} is a weekly off day (${getWeekdayName(
          now,
        )}). Skipping leave processing.`,
      );

      return;
    }

    /* =====================================================
       3. CHECK HOLIDAY
    ===================================================== */

    const { data: holiday, error: holidayError } = await supabase
      .from("holidays")
      .select("id, holiday_name, holiday_date, type")
      .eq("holiday_date", today)
      .maybeSingle();

    if (holidayError) {
      throw holidayError;
    }

    if (holiday) {
      console.log(
        `[LEAVE] ${today} is a holiday: ${holiday.holiday_name} (${holiday.type}). Skipping leave processing.`,
      );

      return;
    }

    /* =====================================================
       4. SYNC "ON LEAVE" EMPLOYEE STATUS
       -------------------------------------------------
       This is the missing half of the "On Leave" feature:
       the frontend (Employees page) already expects and
       displays this status, but nothing ever set it.

       Step A: revert anyone currently marked "On Leave"
       back to "Active" if they no longer have an approved
       leave covering today (leave ended, was cancelled,
       etc).
       Step B: get today's approved leaves (existing query)
       and, further down, mark each of those employees
       "On Leave".
    ===================================================== */

    const { data: onLeaveEmployees, error: onLeaveEmployeesError } =
      await supabase
        .from("employees")
        .select("id")
        .eq("status", "On Leave");

    if (onLeaveEmployeesError) {
      throw onLeaveEmployeesError;
    }

    /* =====================================================
       5. GET APPROVED LEAVES
    ===================================================== */

    const { data: leaves, error: leaveError } = await supabase
      .from("leave_requests")
      .select(`
        id,
        employee_id,
        leave_type,
        is_half_day,
        start_date,
        end_date
      `)
      .eq("status", "Approved")
      .lte("start_date", today)
      .gte("end_date", today);

    if (leaveError) {
      throw leaveError;
    }

    const todaysLeaveEmployeeIds = new Set(
      (leaves || []).map((leave) => leave.employee_id),
    );

    const staleOnLeaveIds = (onLeaveEmployees || [])
      .map((employee) => employee.id)
      .filter((id) => !todaysLeaveEmployeeIds.has(id));

    if (staleOnLeaveIds.length) {
      const { error: revertError } = await supabase
        .from("employees")
        .update({ status: "Active" })
        .in("id", staleOnLeaveIds);

      if (revertError) {
        console.error(
          "[LEAVE] Failed to revert stale On Leave statuses:",
          revertError.message,
        );
      } else {
        console.log(
          `[LEAVE] Reverted ${staleOnLeaveIds.length} employee(s) from On Leave to Active.`,
        );
      }
    }

    if (!leaves?.length) {
      console.log(`[LEAVE] No approved leaves found for ${today}.`);
      return;
    }

    /* =====================================================
       6. PROCESS EACH LEAVE
    ===================================================== */

    for (const leave of leaves) {
      try {
        // Make sure leave balance exists
        await initializeLeaveBalance(
          leave.employee_id,
          year,
        );

        // Check today's attendance
        const {
          data: attendance,
          error: attendanceError,
        } = await supabase
          .from("attendance")
          .select("id, status, leave_processed")
          .eq("employee_id", leave.employee_id)
          .eq("attendance_date", today)
          .maybeSingle();

        if (attendanceError) {
          throw attendanceError;
        }

        // Already processed
        if (attendance?.leave_processed === true) {
          console.log(
            `[LEAVE] Employee ${leave.employee_id} already processed. Skipping.`,
          );

          continue;
        }

        /* =================================================
           HALF DAY / FULL DAY
        ================================================= */

        const leaveDays = leave.is_half_day ? 0.5 : 1;

        /* =================================================
           DEDUCT PAID LEAVE / ADD LOP
        ================================================= */

        const deduction = await deductLeave({
          employeeId: leave.employee_id,
          leaveType: leave.leave_type,
          days: leaveDays,
          year,
        });

        // Days that could not be paid from balance (Unpaid Leave, or the
        // part beyond the balance) - payroll reads this from attendance.
        const lopAdded = Number(deduction?.lopAdded || 0);

        /* =================================================
           CREATE OR UPDATE ATTENDANCE
        ================================================= */

        if (!attendance) {
          const { error: insertError } = await supabase
            .from("attendance")
            .insert({
              employee_id: leave.employee_id,
              attendance_date: today,
              status: "Leave",
              leave_processed: true,
              lop_days: lopAdded,
              lop_processed: true,
            });

          if (insertError) {
            throw insertError;
          }
        } else {
          const { error: updateError } = await supabase
            .from("attendance")
            .update({
              status: "Leave",
              leave_processed: true,
              lop_days: lopAdded,
              lop_processed: true,
            })
            .eq("id", attendance.id);

          if (updateError) {
            throw updateError;
          }
        }

        /* =================================================
           MARK EMPLOYEE AS "ON LEAVE"
           Skip Inactive employees - an approved leave
           shouldn't resurrect someone who has left the
           company.
        ================================================= */

        const { error: statusError } = await supabase
          .from("employees")
          .update({ status: "On Leave" })
          .eq("id", leave.employee_id)
          .neq("status", "Inactive");

        if (statusError) {
          console.error(
            `[LEAVE] Failed to set On Leave status for employee ${leave.employee_id}:`,
            statusError.message,
          );
        }

        console.log(
          `[LEAVE] Employee ${leave.employee_id} processed successfully.`,
        );
      } catch (error) {
        console.error(
          `[LEAVE] Failed for employee ${leave.employee_id}:`,
          error.message,
        );
      }
    }

    console.log(`[LEAVE] Completed for ${today}`);
  } catch (error) {
    console.error("[LEAVE] Job failed:", error.message);
  }
};