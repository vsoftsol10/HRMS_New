// import supabase from "../config/supabase.js";

// /**
//  * Attendance LOP (Loss of Pay) calculation.
//  *
//  * Replaces the old "any shortfall -> flat Half Day" behaviour with a
//  * proportional per-day LOP based on actual hours worked, so a near
//  * no-show (e.g. 2 minutes worked) is no longer treated the same as a
//  * genuine half day.
//  *
//  * Agreed business rules (HRMS payroll redesign, Sep 2026):
//  *
//  * 1. Genuine Half Day -> flat 0.5 LOP, unrelated to hours worked.
//  *    Triggered only by check-in after `half_day_cutoff_time`. (An
//  *    approved half-day LEAVE request never reaches this service - the
//  *    leave flow handles that day directly and is not attendance-LOP.)
//  *
//  * 2. Otherwise, required hours for the day:
//  *      - 4h if an approved half-day PERMISSION (is_half_day = true)
//  *        exists for that date. A permission is NOT a leave, so it does
//  *        not touch leave_balance - it only lowers the hours required.
//  *      - else the policy's standard `working_hours` (e.g. 8h).
//  *    If a half-day permission is approved for the date, any OTHER
//  *    approved permission for the same date is ignored (precedence
//  *    rule - avoids double-crediting two reasons for one day).
//  *
//  * 3. effective_hours = min(check_out, office_end_time) - check_in.
//  *    Hours worked past office_end_time never count.
//  *
//  * 4. Missing check_out -> treated as a full day (lop_days = 0) but
//  *    flagged `needsReview` for a human to look at - never silently
//  *    turned into LOP.
//  *
//  * 5. shortfall_hours = max(0, required_hours - effective_hours).
//  *    Approved non-half-day permission windows (Late Arrival / Early
//  *    Leave / Medical / Personal) offset the shortfall: the gap before
//  *    check_in (`morning_gap`) and the gap after check_out
//  *    (`evening_gap`) are each overlapped against permission windows
//  *    that fall in that gap, and the covered minutes reduce the
//  *    shortfall.
//  *
//  * 6. lop_days = remaining_shortfall_hours / 8, ALWAYS divided by the
//  *    standard 8h day (not by the half-day-adjusted required_hours).
//  *
//  * Note: `grace_period` only affects the Present/Late status label
//  * elsewhere in the codebase - it has no effect on this calculation.
//  * Late itself never causes a deduction; only an uncovered hour
//  * shortfall does.
//  */

// const STANDARD_DAY_HOURS = 8;

// /**
//  * Convert a "HH:mm" or "HH:mm:ss" time string to minutes since midnight.
//  * Returns null for missing/invalid input.
//  */
// const timeToMinutes = (time) => {
//   if (!time) return null;

//   const [hours, minutes] = String(time).split(":").map(Number);

//   if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

//   return hours * 60 + minutes;
// };

// /**
//  * Overlap, in minutes, between [rangeStart, rangeEnd] and
//  * [permStart, permEnd]. Returns 0 if either permission time is missing
//  * or the ranges don't overlap.
//  */
// const overlapMinutes = (rangeStart, rangeEnd, permStart, permEnd) => {
//   if (permStart === null || permEnd === null) return 0;
//   if (rangeEnd <= rangeStart) return 0;

//   const start = Math.max(rangeStart, permStart);
//   const end = Math.min(rangeEnd, permEnd);

//   return Math.max(0, end - start);
// };

// /**
//  * Calculate LOP for a single attendance row.
//  *
//  * @param {object} params
//  * @param {number} params.employeeId
//  * @param {string} params.attendanceDate - "YYYY-MM-DD"
//  * @param {string|null} params.checkIn - "HH:mm:ss"
//  * @param {string|null} params.checkOut - "HH:mm:ss"
//  * @param {string} params.status - current attendance status
//  * @param {object} params.policy - row from attendance_policy
//  *   (office_start_time, office_end_time, half_day_cutoff_time,
//  *   working_hours)
//  *
//  * @returns {Promise<{ lopDays: number, needsReview: boolean, reason: string }>}
//  */
// export const calculateAttendanceLop = async ({
//   employeeId,
//   attendanceDate,
//   checkIn,
//   checkOut,
//   status,
//   policy,
//   autoCheckout = false,
// }) => {
//   // Full leave / absent days are handled by the leave and absence jobs,
//   // not here - avoid double-processing.
//   if (status === "Leave" || status === "Absent") {
//     return {
//       lopDays: 0,
//       needsReview: false,
//       reason: "Handled by leave/absence flow",
//     };
//   }

//   const officeStartMinutes = timeToMinutes(policy.office_start_time);
//   const officeEndMinutes = timeToMinutes(policy.office_end_time);
//   const halfDayCutoffMinutes = timeToMinutes(policy.half_day_cutoff_time);
//   const checkInMinutes = timeToMinutes(checkIn);

//   if (checkInMinutes === null) {
//     return {
//       lopDays: 0,
//       needsReview: true,
//       reason: "Missing check-in",
//     };
//   }

//   // --------------------------------------------------------------
//   // 1. Genuine Half Day: check-in after half_day_cutoff_time.
//   // --------------------------------------------------------------
//   if (
//     halfDayCutoffMinutes !== null &&
//     checkInMinutes > halfDayCutoffMinutes
//   ) {
//     return {
//       lopDays: 0.5,
//       needsReview: false,
//       reason: "Check-in after half-day cutoff",
//     };
//   }

//   // --------------------------------------------------------------
//   // 2. Missing check-out -> full day, flagged for manual review.
//   // --------------------------------------------------------------
//   // The system closed this day at office end time because the employee never
//   // checked out. The real leaving time is unknown, so no hours or LOP are
//   // decided until HR enters the actual check-out.
//   if (autoCheckout) {
//     return {
//       lopDays: 0,
//       needsReview: true,
//       reason: "Auto check-out - awaiting HR review",
//     };
//   }

//   if (!checkOut) {
//     return {
//       lopDays: 0,
//       needsReview: true,
//       reason: "Missing check-out",
//     };
//   }

//   const checkOutMinutes = timeToMinutes(checkOut);

//   // --------------------------------------------------------------
//   // Fetch approved permissions for this employee + date once, reused
//   // for both the half-day check and the shortfall offset below.
//   // --------------------------------------------------------------
//   const { data: permissions, error: permissionError } = await supabase
//     .from("permissions")
//     .select("permission_type, start_time, end_time, is_half_day")
//     .eq("employee_id", employeeId)
//     .eq("permission_date", attendanceDate)
//     .eq("status", "Approved");

//   if (permissionError) throw permissionError;

//   const halfDayPermission = (permissions || []).find((p) => p.is_half_day);

//   // --------------------------------------------------------------
//   // 3. Required hours: 4h if an approved half-day PERMISSION exists
//   //    for this date (takes precedence over any other permission that
//   //    date), else the policy's standard working_hours.
//   // --------------------------------------------------------------
//   const requiredHours = halfDayPermission
//     ? 4
//     : Number(policy.working_hours) || STANDARD_DAY_HOURS;

//   // --------------------------------------------------------------
//   // 4. Effective hours, capped at office_end_time.
//   // --------------------------------------------------------------
//   const cappedCheckOutMinutes =
//     officeEndMinutes !== null
//       ? Math.min(checkOutMinutes, officeEndMinutes)
//       : checkOutMinutes;

//   const effectiveMinutes = Math.max(
//     0,
//     cappedCheckOutMinutes - checkInMinutes,
//   );
//   const effectiveHours = effectiveMinutes / 60;

//   const shortfallHours = Math.max(0, requiredHours - effectiveHours);

//   if (shortfallHours === 0) {
//     return {
//       lopDays: 0,
//       needsReview: false,
//       reason: "No shortfall",
//     };
//   }

//   // --------------------------------------------------------------
//   // 5. Offset the shortfall using approved permission windows -
//   //    skipped entirely if a half-day permission already applies
//   //    (precedence rule: other permissions for that date are ignored).
//   // --------------------------------------------------------------
//   let coveredMinutes = 0;

//   if (!halfDayPermission && officeStartMinutes !== null) {
//     const morningGapStart = officeStartMinutes;
//     const morningGapEnd = checkInMinutes;

//     const eveningGapStart = checkOutMinutes;
//     const eveningGapEnd =
//       officeEndMinutes !== null ? officeEndMinutes : checkOutMinutes;

//     for (const permission of permissions || []) {
//       if (permission.is_half_day) continue;

//       const permStart = timeToMinutes(permission.start_time);
//       const permEnd = timeToMinutes(permission.end_time);

//       coveredMinutes += overlapMinutes(
//         morningGapStart,
//         morningGapEnd,
//         permStart,
//         permEnd,
//       );

//       coveredMinutes += overlapMinutes(
//         eveningGapStart,
//         eveningGapEnd,
//         permStart,
//         permEnd,
//       );
//     }
//   }

//   const shortfallMinutes = shortfallHours * 60;
//   const remainingShortfallMinutes = Math.max(
//     0,
//     shortfallMinutes - coveredMinutes,
//   );

//   // FIX: this divided by a hard-coded 8, so with a 9-hour policy a 1-hour
//   // shortfall became 0.125 day instead of 1/9. A full day is the policy's
//   // own working_hours (8 only as a fallback when it is not configured).
//   const fullDayHours = Number(policy.working_hours) || STANDARD_DAY_HOURS;
//   const lopDays = remainingShortfallMinutes / 60 / fullDayHours;

//   return {
//     lopDays: Number(lopDays.toFixed(2)),
//     needsReview: false,
//     reason:
//       coveredMinutes > 0
//         ? "Partial shortfall offset by approved permission"
//         : "Shortfall against required hours",
//   };
// };

// /**
//  * Calculate and persist lop_days for a single attendance row.
//  * Fetches the attendance_policy internally so callers (jobs, controllers)
//  * don't each need to fetch it separately.
//  */
// export const processAttendanceLop = async (attendanceRow) => {
//   const { data: policy, error: policyError } = await supabase
//     .from("attendance_policy")
//     .select(
//       "office_start_time, office_end_time, half_day_cutoff_time, working_hours",
//     )
//     .limit(1)
//     .maybeSingle();

//   if (policyError) throw policyError;
//   if (!policy) throw new Error("Attendance policy not found.");

//   // Callers do not always select auto_checkout; without it an auto-closed
//   // day would be treated as a full day, so look it up when it is missing.
//   let autoCheckout = attendanceRow.auto_checkout;

//   if (autoCheckout === undefined) {
//     const { data: flagRow, error: flagError } = await supabase
//       .from("attendance")
//       .select("auto_checkout")
//       .eq("id", attendanceRow.id)
//       .maybeSingle();

//     if (flagError) throw flagError;

//     autoCheckout = Boolean(flagRow?.auto_checkout);
//   }

//   const result = await calculateAttendanceLop({
//     employeeId: attendanceRow.employee_id,
//     attendanceDate: attendanceRow.attendance_date,
//     checkIn: attendanceRow.check_in,
//     checkOut: attendanceRow.check_out,
//     status: attendanceRow.status,
//     policy,
//     autoCheckout: Boolean(autoCheckout),
//   });

//   const { error: updateError } = await supabase
//     .from("attendance")
//     .update({ lop_days: result.lopDays })
//     .eq("id", attendanceRow.id);

//   if (updateError) throw updateError;

//   return result;
// };

import supabase from "../config/supabase.js";

/**
 * Attendance LOP (Loss of Pay) calculation.
 *
 * Replaces the old "any shortfall -> flat Half Day" behaviour with a
 * proportional per-day LOP based on actual hours worked, so a near
 * no-show (e.g. 2 minutes worked) is no longer treated the same as a
 * genuine half day.
 *
 * Agreed business rules (HRMS payroll redesign, Sep 2026):
 *
 * 1. Genuine Half Day -> flat 0.5 LOP, unrelated to hours worked.
 *    Triggered only by check-in after `half_day_cutoff_time`. (An
 *    approved half-day LEAVE request never reaches this service - the
 *    leave flow handles that day directly and is not attendance-LOP.)
 *
 * 2. Otherwise, required hours for the day:
 *      - 4h if an approved half-day PERMISSION (is_half_day = true)
 *        exists for that date. A permission is NOT a leave, so it does
 *        not touch leave_balance - it only lowers the hours required.
 *      - else the policy's standard `working_hours` (e.g. 8h).
 *    If a half-day permission is approved for the date, any OTHER
 *    approved permission for the same date is ignored (precedence
 *    rule - avoids double-crediting two reasons for one day).
 *
 * 3. effective_hours = check_out - check_in.
 *    Hours worked past office_end_time DO count, so a late arrival can be
 *    made up by staying beyond office end time.
 *
 * 4. Missing check_out -> treated as a full day (lop_days = 0) but
 *    flagged `needsReview` for a human to look at - never silently
 *    turned into LOP.
 *
 * 5. shortfall_hours = max(0, required_hours - effective_hours).
 *    Approved non-half-day permission windows (Late Arrival / Early
 *    Leave / Medical / Personal) offset the shortfall: the gap before
 *    check_in (`morning_gap`) and the gap after check_out
 *    (`evening_gap`) are each overlapped against permission windows
 *    that fall in that gap, and the covered minutes reduce the
 *    shortfall.
 *
 * 6. lop_days = remaining_shortfall_hours / 8, ALWAYS divided by the
 *    standard 8h day (not by the half-day-adjusted required_hours).
 *
 * Note: `grace_period` only affects the Present/Late status label
 * elsewhere in the codebase - it has no effect on this calculation.
 * Late itself never causes a deduction; only an uncovered hour
 * shortfall does.
 */

const STANDARD_DAY_HOURS = 8;

/**
 * Convert a "HH:mm" or "HH:mm:ss" time string to minutes since midnight.
 * Returns null for missing/invalid input.
 */
const timeToMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = String(time).split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
};

/**
 * Overlap, in minutes, between [rangeStart, rangeEnd] and
 * [permStart, permEnd]. Returns 0 if either permission time is missing
 * or the ranges don't overlap.
 */
const overlapMinutes = (rangeStart, rangeEnd, permStart, permEnd) => {
  if (permStart === null || permEnd === null) return 0;
  if (rangeEnd <= rangeStart) return 0;

  const start = Math.max(rangeStart, permStart);
  const end = Math.min(rangeEnd, permEnd);

  return Math.max(0, end - start);
};

/**
 * Calculate LOP for a single attendance row.
 *
 * @param {object} params
 * @param {number} params.employeeId
 * @param {string} params.attendanceDate - "YYYY-MM-DD"
 * @param {string|null} params.checkIn - "HH:mm:ss"
 * @param {string|null} params.checkOut - "HH:mm:ss"
 * @param {string} params.status - current attendance status
 * @param {object} params.policy - row from attendance_policy
 *   (office_start_time, office_end_time, half_day_cutoff_time,
 *   working_hours)
 *
 * @returns {Promise<{ lopDays: number, needsReview: boolean, reason: string }>}
 */
export const calculateAttendanceLop = async ({
  employeeId,
  attendanceDate,
  checkIn,
  checkOut,
  status,
  policy,
  autoCheckout = false,
}) => {
  // Full leave / absent days are handled by the leave and absence jobs,
  // not here - avoid double-processing.
  if (status === "Leave" || status === "Absent") {
    return {
      lopDays: 0,
      needsReview: false,
      reason: "Handled by leave/absence flow",
    };
  }

  const officeStartMinutes = timeToMinutes(policy.office_start_time);
  const officeEndMinutes = timeToMinutes(policy.office_end_time);
  const halfDayCutoffMinutes = timeToMinutes(policy.half_day_cutoff_time);
  const checkInMinutes = timeToMinutes(checkIn);

  if (checkInMinutes === null) {
    return {
      lopDays: 0,
      needsReview: true,
      reason: "Missing check-in",
    };
  }

  // --------------------------------------------------------------
  // 1. Genuine Half Day: check-in after half_day_cutoff_time.
  // --------------------------------------------------------------
  if (
    halfDayCutoffMinutes !== null &&
    checkInMinutes > halfDayCutoffMinutes
  ) {
    return {
      lopDays: 0.5,
      needsReview: false,
      reason: "Check-in after half-day cutoff",
    };
  }

  // --------------------------------------------------------------
  // 2. Missing check-out -> full day, flagged for manual review.
  // --------------------------------------------------------------
  // The system closed this day at office end time because the employee never
  // checked out. The real leaving time is unknown, so no hours or LOP are
  // decided until HR enters the actual check-out.
  if (autoCheckout) {
    return {
      lopDays: 0,
      needsReview: true,
      reason: "Auto check-out - awaiting HR review",
    };
  }

  if (!checkOut) {
    return {
      lopDays: 0,
      needsReview: true,
      reason: "Missing check-out",
    };
  }

  const checkOutMinutes = timeToMinutes(checkOut);

  // --------------------------------------------------------------
  // Fetch approved permissions for this employee + date once, reused
  // for both the half-day check and the shortfall offset below.
  // --------------------------------------------------------------
  const { data: permissions, error: permissionError } = await supabase
    .from("permissions")
    .select("permission_type, start_time, end_time, is_half_day")
    .eq("employee_id", employeeId)
    .eq("permission_date", attendanceDate)
    .eq("status", "Approved");

  if (permissionError) throw permissionError;

  const halfDayPermission = (permissions || []).find((p) => p.is_half_day);

  // --------------------------------------------------------------
  // 3. Required hours: 4h if an approved half-day PERMISSION exists
  //    for this date (takes precedence over any other permission that
  //    date), else the policy's standard working_hours.
  // --------------------------------------------------------------
  const requiredHours = halfDayPermission
    ? 4
    : Number(policy.working_hours) || STANDARD_DAY_HOURS;

  // --------------------------------------------------------------
  // 4. Effective hours = actual check-out - check-in. NOT capped at
  //    office_end_time: employees who arrive late and stay past office
  //    end time get that extra time tallied.
  // --------------------------------------------------------------

  const effectiveMinutes = Math.max(
    0,
    checkOutMinutes - checkInMinutes,
  );
  const effectiveHours = effectiveMinutes / 60;

  const shortfallHours = Math.max(0, requiredHours - effectiveHours);

  if (shortfallHours === 0) {
    return {
      lopDays: 0,
      needsReview: false,
      reason: "No shortfall",
    };
  }

  // --------------------------------------------------------------
  // 5. Offset the shortfall using approved permission windows -
  //    skipped entirely if a half-day permission already applies
  //    (precedence rule: other permissions for that date are ignored).
  // --------------------------------------------------------------
  let coveredMinutes = 0;

  if (!halfDayPermission && officeStartMinutes !== null) {
    const morningGapStart = officeStartMinutes;
    const morningGapEnd = checkInMinutes;

    const eveningGapStart = checkOutMinutes;
    const eveningGapEnd =
      officeEndMinutes !== null ? officeEndMinutes : checkOutMinutes;

    for (const permission of permissions || []) {
      if (permission.is_half_day) continue;

      const permStart = timeToMinutes(permission.start_time);
      const permEnd = timeToMinutes(permission.end_time);

      coveredMinutes += overlapMinutes(
        morningGapStart,
        morningGapEnd,
        permStart,
        permEnd,
      );

      coveredMinutes += overlapMinutes(
        eveningGapStart,
        eveningGapEnd,
        permStart,
        permEnd,
      );
    }
  }

  const shortfallMinutes = shortfallHours * 60;
  const remainingShortfallMinutes = Math.max(
    0,
    shortfallMinutes - coveredMinutes,
  );

  // FIX: this divided by a hard-coded 8, so with a 9-hour policy a 1-hour
  // shortfall became 0.125 day instead of 1/9. A full day is the policy's
  // own working_hours (8 only as a fallback when it is not configured).
  const fullDayHours = Number(policy.working_hours) || STANDARD_DAY_HOURS;
  const lopDays = remainingShortfallMinutes / 60 / fullDayHours;

  return {
    lopDays: Number(lopDays.toFixed(2)),
    needsReview: false,
    reason:
      coveredMinutes > 0
        ? "Partial shortfall offset by approved permission"
        : "Shortfall against required hours",
  };
};

/**
 * Calculate and persist lop_days for a single attendance row.
 * Fetches the attendance_policy internally so callers (jobs, controllers)
 * don't each need to fetch it separately.
 */
export const processAttendanceLop = async (attendanceRow) => {
  const { data: policy, error: policyError } = await supabase
    .from("attendance_policy")
    .select(
      "office_start_time, office_end_time, half_day_cutoff_time, working_hours",
    )
    .limit(1)
    .maybeSingle();

  if (policyError) throw policyError;
  if (!policy) throw new Error("Attendance policy not found.");

  // Callers do not always select auto_checkout; without it an auto-closed
  // day would be treated as a full day, so look it up when it is missing.
  let autoCheckout = attendanceRow.auto_checkout;

  if (autoCheckout === undefined) {
    const { data: flagRow, error: flagError } = await supabase
      .from("attendance")
      .select("auto_checkout")
      .eq("id", attendanceRow.id)
      .maybeSingle();

    if (flagError) throw flagError;

    autoCheckout = Boolean(flagRow?.auto_checkout);
  }

  const result = await calculateAttendanceLop({
    employeeId: attendanceRow.employee_id,
    attendanceDate: attendanceRow.attendance_date,
    checkIn: attendanceRow.check_in,
    checkOut: attendanceRow.check_out,
    status: attendanceRow.status,
    policy,
    autoCheckout: Boolean(autoCheckout),
  });

  const { error: updateError } = await supabase
    .from("attendance")
    .update({ lop_days: result.lopDays })
    .eq("id", attendanceRow.id);

  if (updateError) throw updateError;

  return result;
};