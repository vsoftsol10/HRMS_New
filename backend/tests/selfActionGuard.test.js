import test from "node:test";
import assert from "node:assert/strict";
import {
  isBlockedSelfAction,
  rejectSelfAction,
  findChangedProtectedField,
} from "../src/utils/selfActionGuard.js";

const hr = { user: { role: "HR", employee_id: 5 } };
const admin = { user: { role: "Admin", employee_id: 1 } };

const fakeRes = () => ({
  statusCode: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("HR is blocked on their own record, not on someone else's", () => {
  assert.equal(isBlockedSelfAction(hr, 5), true);
  assert.equal(isBlockedSelfAction(hr, "5"), true);
  assert.equal(isBlockedSelfAction(hr, 6), false);
});

test("Admin is never blocked, even on their own record", () => {
  assert.equal(isBlockedSelfAction(admin, 1), false);
});

test("missing employee id never blocks", () => {
  assert.equal(isBlockedSelfAction(hr, undefined), false);
  assert.equal(isBlockedSelfAction(hr, null), false);
});

test("rejectSelfAction sends 403 and returns true when blocked", () => {
  const res = fakeRes();
  assert.equal(rejectSelfAction(hr, res, 5, "finalize payroll"), true);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /finalize payroll/);

  const ok = fakeRes();
  assert.equal(rejectSelfAction(hr, ok, 6, "finalize payroll"), false);
  assert.equal(ok.statusCode, null);
});

const current = {
  monthly_salary: "50000.00",
  designation: "Developer",
  department_id: 2,
  joining_date: "2026-01-05",
  employment_type: "Full-Time",
};

test("an unchanged edit form (values re-sent) is allowed", () => {
  assert.equal(
    findChangedProtectedField(current, {
      monthly_salary: 50000,
      designation: "Developer",
      department_id: "2",
      joining_date: "2026-01-05T00:00:00.000Z",
      employment_type: "Full-Time",
      phone: "9999999999",
    }),
    undefined,
  );
});

test("a real change to a protected field is detected", () => {
  assert.equal(findChangedProtectedField(current, { monthly_salary: 90000 }), "monthly_salary");
  assert.equal(findChangedProtectedField(current, { designation: "Manager" }), "designation");
  assert.equal(findChangedProtectedField(current, { department_id: 3 }), "department_id");
});

test("contact fields are not protected", () => {
  assert.equal(findChangedProtectedField(current, { phone: "1", address: "x" }), undefined);
});