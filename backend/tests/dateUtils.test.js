import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLocalDate,
  getMonthRange,
  isWeeklyOffDay,
  getWorkingDaysInMonth,
} from "../src/utils/dateUtils.js";

test("formatLocalDate pads month and day", () => {
  assert.equal(formatLocalDate(new Date(2026, 0, 5)), "2026-01-05");
});

test("getMonthRange handles leap-year February", () => {
  assert.deepEqual(getMonthRange(new Date(2028, 1, 10)), {
    startOfMonth: "2028-02-01",
    endOfMonth: "2028-02-29",
  });
});

test("isWeeklyOffDay parses a comma separated policy string", () => {
  const saturday = new Date(2027, 1, 6);
  assert.equal(isWeeklyOffDay("Saturday, Sunday", saturday), true);
  assert.equal(isWeeklyOffDay("Sunday", saturday), false);
  assert.equal(isWeeklyOffDay("", saturday), false);
});

// Feb 2027 starts on a Monday: 28 days, 8 weekend days -> 20 working days.
test("getWorkingDaysInMonth excludes weekends and weekday holidays only", () => {
  assert.equal(getWorkingDaysInMonth(2027, 2, "Saturday,Sunday"), 20);
  assert.equal(getWorkingDaysInMonth(2027, 2, "Saturday,Sunday", ["2027-02-10"]), 19);
  // a holiday that falls on a weekend must not be subtracted twice
  assert.equal(getWorkingDaysInMonth(2027, 2, "Saturday,Sunday", ["2027-02-06"]), 20);
});