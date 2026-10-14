import test from "node:test";
import assert from "node:assert/strict";

// attendanceLopService imports the Supabase client, which needs these to exist.
process.env.SUPABASE_URL ??= "http://127.0.0.1:9";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-key";

const { calculateAttendanceLop } = await import("../src/services/attendanceLopService.js");

const policy = {
  office_start_time: "09:30:00",
  office_end_time: "18:30:00",
  half_day_cutoff_time: "13:00:00",
  working_hours: 8,
};

const base = {
  employeeId: 1,
  attendanceDate: "2026-10-09",
  checkIn: "10:41:00",
  checkOut: "18:30:00",
  status: "Late",
  policy,
};

test("an auto-closed day is held for HR review and gets no LOP decision", async () => {
  const result = await calculateAttendanceLop({ ...base, autoCheckout: true });

  assert.equal(result.needsReview, true);
  assert.equal(result.lopDays, 0);
  assert.match(result.reason, /Auto check-out/);
});

test("a check-in after the half-day cutoff is still 0.5 LOP even when auto-closed", async () => {
  const result = await calculateAttendanceLop({
    ...base,
    checkIn: "14:00:00",
    autoCheckout: true,
  });

  assert.equal(result.lopDays, 0.5);
  assert.equal(result.needsReview, false);
});

test("a day with no check-out at all still needs review", async () => {
  const result = await calculateAttendanceLop({ ...base, checkOut: null });

  assert.equal(result.needsReview, true);
  assert.match(result.reason, /Missing check-out/);
});

test("leave and absent days are untouched by the auto-checkout rule", async () => {
  const result = await calculateAttendanceLop({ ...base, status: "Absent", autoCheckout: true });

  assert.equal(result.needsReview, false);
  assert.equal(result.lopDays, 0);
});