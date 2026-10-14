// processAutoCheckout.js
//
// Employees / interns who check in but never check out used to be left with
// an empty check-out forever. This job closes such days at the office end
// time and FLAGS them (attendance.auto_checkout = true):
//   - check_out is set to office_end_time so the portal shows a time,
//   - working_hours stays empty and LOP is NOT decided (see
//     calculateAttendanceLop) - HR enters the real check-out later, which
//     clears the flag and recomputes hours / status / LOP.
//
// Idempotent: only rows that still have no check-out are touched.

import supabase from "../config/supabase.js";
import { getToday } from "../utils/dateUtils.js";

const toMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = String(time).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
};

const toTimeString = (minutes) => {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");

  return `${hh}:${mm}:00`;
};

export const processAutoCheckout = async () => {
  try {
    const { data: policy, error: policyError } = await supabase
      .from("attendance_policy")
      .select("office_end_time")
      .limit(1)
      .maybeSingle();

    if (policyError) throw policyError;

    const endMinutes = toMinutes(policy?.office_end_time);

    if (endMinutes === null) {
      console.log("[AUTO-CHECKOUT] office_end_time is not configured. Skipping.");
      return;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const today = getToday();
    const includeToday = nowMinutes >= endMinutes;

    let query = supabase
      .from("attendance")
      .select("id, employee_id, attendance_date, check_in, status")
      .is("check_out", null)
      .not("check_in", "is", null)
      .eq("auto_checkout", false)
      .not("status", "in", "(Leave,Absent)");

    query = includeToday
      ? query.lte("attendance_date", today)
      : query.lt("attendance_date", today);

    const { data: rows, error: rowsError } = await query;

    if (rowsError) throw rowsError;

    // A check-in at/after office end time cannot be closed "at" office end
    // time; those rows are left for HR to fix by hand.
    const closable = (rows || []).filter((row) => {
      const checkInMinutes = toMinutes(row.check_in);
      return checkInMinutes !== null && checkInMinutes < endMinutes;
    });

    if (!closable.length) return;

    const { error: updateError } = await supabase
      .from("attendance")
      .update({
        check_out: toTimeString(endMinutes),
        auto_checkout: true,
      })
      .in(
        "id",
        closable.map((row) => row.id),
      )
      // an employee who checks out right now must not be overwritten
      .is("check_out", null);

    if (updateError) throw updateError;

    console.log(
      `[AUTO-CHECKOUT] Closed ${closable.length} open attendance row(s) at ${policy.office_end_time}; awaiting HR review.`,
    );
  } catch (error) {
    console.error("[AUTO-CHECKOUT] Failed:", error.message);
  }
};