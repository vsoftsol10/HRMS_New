// selfActionGuard.js
//
// HR can open the admin portal, so without a rule an HR user could change
// their OWN salary, salary structure or payroll with nobody else involved.
// These helpers make such actions Admin-only when the target record belongs
// to the signed-in user (same idea as "HR cannot approve their own leave").

export const isAdminUser = (req) => req.user?.role === "Admin";

export const isOwnRecord = (req, employeeId) =>
  employeeId !== undefined &&
  employeeId !== null &&
  Number(req.user?.employee_id) === Number(employeeId);

// True when a non-Admin is acting on their own record.
export const isBlockedSelfAction = (req, employeeId) =>
  !isAdminUser(req) && isOwnRecord(req, employeeId);

// Sends the 403 and returns true when blocked, so callers can do:
//   if (rejectSelfAction(req, res, employee_id, "assign your salary structure")) return;
export const rejectSelfAction = (req, res, employeeId, action) => {
  if (!isBlockedSelfAction(req, employeeId)) return false;

  res.status(403).json({
    message: `You cannot ${action} for your own account. Please ask an Admin.`,
  });

  return true;
};

// Fields only an Admin may change on their own employee record.
export const SELF_PROTECTED_EMPLOYEE_FIELDS = [
  "monthly_salary",
  "designation",
  "department_id",
  "joining_date",
  "employment_type",
];

const same = (field, a, b) => {
  const x = a ?? "";
  const y = b ?? "";

  if (field === "monthly_salary" || field === "department_id") {
    return Number(x) === Number(y);
  }

  if (field === "joining_date") {
    return String(x).slice(0, 10) === String(y).slice(0, 10);
  }

  return String(x).trim() === String(y).trim();
};

// Returns the first protected field whose value is really being changed
// (the edit form re-sends unchanged values, which must stay allowed).
export const findChangedProtectedField = (current, updates) =>
  SELF_PROTECTED_EMPLOYEE_FIELDS.find(
    (field) =>
      updates[field] !== undefined && !same(field, updates[field], current[field]),
  );