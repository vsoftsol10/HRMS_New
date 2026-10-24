import crypto from "crypto";
import supabase from "../config/supabase.js";
import {
  isBlockedSelfAction,
  findChangedProtectedField,
} from "../utils/selfActionGuard.js";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "../services/emailService.js";
import { invalidateAuthCache } from "../middleware/authmiddleware.js";
import { sendServerError, pick } from "../utils/httpError.js";

/* =========================================================
   Write rules
   ========================================================= */

// FIX (mass assignment): create/update used to pass req.body straight into
// the table, so any HR user could also write role, status, employee_code,
// created_at ... Only these columns can be set through the employee form.
// role and status are handled separately below because they need
// permission checks.
const EDITABLE_FIELDS = [
  "first_name",
  "gender",
  "date_of_birth",
  "phone",
  "personal_email",
  "address",
  "department_id",
  "designation",
  "reporting_manager",
  "joining_date",
  "employment_type",
  "monthly_salary",
];

const ALL_ROLES = ["Admin", "HR", "Employee"];

// Roles an HR user may hand out. Admin and HR accounts can only be
// created / promoted by an Admin. Change this list if HR should be able to
// create other HR users.
const ROLES_ASSIGNABLE_BY_HR = ["Employee"];

const EMPLOYEE_STATUSES = ["Active", "Inactive", "On Leave"];

const isAdmin = (req) => req.user?.role === "Admin";

const canAssignRole = (req, role) =>
  isAdmin(req) || ROLES_ASSIGNABLE_BY_HR.includes(role);

const isValidDate = (value) =>
  typeof value === "string" && !Number.isNaN(new Date(value).getTime());

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// "" -> null so Postgres doesn't choke on e.g. invalid input syntax for
// type integer: "", and department_id -> number.
const normalise = (data) => {
  for (const key of Object.keys(data)) {
    if (typeof data[key] === "string") {
      data[key] = data[key].trim();
    }

    if (data[key] === "") {
      data[key] = null;
    }
  }

  if (data.department_id !== null && data.department_id !== undefined) {
    data.department_id = Number(data.department_id);
  }

  return data;
};

// Returns an error string, or null when the (already whitelisted +
// normalised) fields are fine. Only fields that are present are checked,
// so a partial update does not fail on fields it didn't send.
const validateFields = (data) => {
  if ("first_name" in data && (typeof data.first_name !== "string" || !data.first_name)) {
    return "First name is required.";
  }

  if (data.department_id !== undefined && data.department_id !== null) {
    if (!Number.isInteger(data.department_id) || data.department_id <= 0) {
      return "Invalid department.";
    }
  }

  if (data.date_of_birth != null && !isValidDate(data.date_of_birth)) {
    return "Invalid date of birth.";
  }

  if (data.joining_date != null && !isValidDate(data.joining_date)) {
    return "Invalid joining date.";
  }

  if (data.phone != null && !/^\d{10}$/.test(String(data.phone))) {
    return "Enter a valid 10-digit phone number.";
  }

  if (
    data.personal_email != null &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.personal_email))
  ) {
    return "Enter a valid email address.";
  }

  if (data.monthly_salary != null) {
    const salary = Number(data.monthly_salary);

    if (!Number.isFinite(salary) || salary <= 0) {
      return "Monthly salary must be a positive number.";
    }
  }

  return null;
};

// Best-effort, safe wording for the client - never the raw provider error.
const publicEmailError = (reason) =>
  reason === "No email address on file"
    ? reason
    : "The email service could not send the message.";

/* =========================================================
   Employee code / password generation
   ========================================================= */

export const getNextEmployeeCode = async (req, res) => {
  try {
    const employeeCode = await generateEmployeeCode();

    res.json({
      employee_code: employeeCode,
    });
  } catch (err) {
    sendServerError(res, err, "employees.getNextEmployeeCode");
  }
};

// GET
export const generateEmployeeCode = async () => {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_code")
    // Intern login IDs (VSINT..) must not influence the next employee code.
    .neq("role", "Intern")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data.length) {
    return "VSEMP01";
  }

  const CODE_PATTERN = /^([A-Za-z]+)(\d+)$/;

  let bestPrefix = null;
  let bestNumber = -1;
  let bestWidth = 2;

  for (const row of data) {
    const match = CODE_PATTERN.exec(row.employee_code || "");

    if (!match) continue;

    const [, prefix, digits] = match;
    const number = parseInt(digits, 10);

    if (Number.isNaN(number)) continue;

    if (number > bestNumber) {
      bestNumber = number;
      bestPrefix = prefix;
      bestWidth = digits.length;
    }
  }

  if (bestNumber === -1) {
    return "VSEMP01";
  }

  const nextNumber = bestNumber + 1;

  return `${bestPrefix}${String(nextNumber).padStart(bestWidth, "0")}`;
};

// FIX: the first-login password used to be built from the employee code
// and the birth year (e.g. "0012" + "1995"), so anyone who knew a
// colleague's code and roughly their age could guess it. It is now random.
// The arguments are no longer used; they are accepted so existing callers
// (e.g. intern -> employee conversion) keep working unchanged.
export const generatePassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789"; // no 0/1 - easy to confuse with O/l when typed
  const all = upper + lower + digits;

  const pickFrom = (set) => set[crypto.randomInt(set.length)];

  // guarantee at least one of each class, then fill up to 10 characters
  const chars = [pickFrom(upper), pickFrom(lower), pickFrom(digits)];

  while (chars.length < 10) {
    chars.push(pickFrom(all));
  }

  // Fisher-Yates shuffle so the guaranteed characters aren't always first
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};

/* =========================================================
   Handlers
   ========================================================= */

export const getEmployees = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from("employees")
      .select(
        `
        *,
        departments (
          department_name
        )
      `,
      )
      .neq("role", "Intern") // interns are managed under /api/interns
      .order("created_at", { ascending: true });

    if (typeof status === "string" && status) {
      query = query.eq("status", status);
    } else {
      // Default records on initial load
      query = query.in("status", ["Active", "On Leave"]);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    sendServerError(res, err, "employees.getEmployees");
  }
};

// POST
export const createEmployee = async (req, res) => {
  let createdEmployeeId = null;

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};

    const employeeData = normalise(pick(body, EDITABLE_FIELDS));

    // ---- role: must be a known role the caller is allowed to hand out
    const role = body.role;

    if (!ALL_ROLES.includes(role)) {
      return res.status(400).json({
        message: "Please choose a valid role.",
      });
    }

    if (!canAssignRole(req, role)) {
      return res.status(403).json({
        message: "Only an Admin can create HR or Admin accounts.",
      });
    }

    // ---- required fields + format checks
    if (!employeeData.first_name) {
      return res.status(400).json({ message: "First name is required." });
    }

    // The employee form requires a date of birth, so the API does too.
    if (!employeeData.date_of_birth) {
      return res.status(400).json({
        message: "A valid date_of_birth is required.",
      });
    }

    const validationError = validateFields(employeeData);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Server decides these - never the client.
    employeeData.role = role;
    employeeData.status = "Active";
    employeeData.employee_code = await generateEmployeeCode();
    employeeData.created_at = new Date().toISOString();
    employeeData.updated_at = new Date().toISOString();

    // Insert Employee
    const { data: employee, error } = await supabase
      .from("employees")
      .insert(employeeData)
      .select()
      .single();

    if (error) throw error;

    createdEmployeeId = employee.id;

    // Everything after this point must leave no half-created employee
    // behind: the catch block below removes the employee row again if
    // anything here (password hashing OR the users insert) fails.
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const { error: userError } = await supabase.from("users").insert({
      employee_id: employee.id,
      employee_code: employee.employee_code,
      password: hashedPassword,
      role: employee.role,
    });

    if (userError) throw userError;

    createdEmployeeId = null; // fully created - nothing to roll back

    // Email the new employee their login credentials. This is best-effort:
    // a Brevo/network failure here must not undo the employee record that
    // was just created, so the result is only reported back, never thrown.
    const emailResult = await sendWelcomeEmail({
      toEmail: employee.personal_email,
      employeeName: employee.first_name,
      employeeCode: employee.employee_code,
      password: generatedPassword,
    });

    // FIX: the plaintext password used to be echoed back in this response.
    // It is only delivered by email now. If the email failed, HR can ask
    // the employee to use "Forgot password" on the login page.
    res.status(201).json({
      ...employee,
      emailSent: emailResult.sent,
      ...(emailResult.sent
        ? {}
        : { emailError: publicEmailError(emailResult.reason) }),
    });
  } catch (err) {
    if (createdEmployeeId !== null) {
      const { error: rollbackError } = await supabase
        .from("employees")
        .delete()
        .eq("id", createdEmployeeId);

      if (rollbackError) {
        // Logged loudly so an orphan can be found and removed by hand.
        console.error(
          `[employees.createEmployee] ORPHAN employee row id=${createdEmployeeId} could not be rolled back:`,
          rollbackError.message,
        );
      }
    }

    sendServerError(res, err, "employees.createEmployee");
  }
};

// PUT
export const updateEmployee = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid employee id." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};

    // Current state is needed for the role / status permission checks.
    const { data: current, error: currentError } = await supabase
      .from("employees")
      .select("id, role, status, personal_email, monthly_salary, designation, department_id, joining_date, employment_type")
      .eq("id", id)
      .maybeSingle();

    if (currentError) throw currentError;

    if (!current) {
      return res.status(404).json({ message: "Employee not found." });
    }

    if (current.role === "Intern") {
      return res.status(400).json({
        message: "Interns are managed from the Interns page.",
      });
    }

    const updates = normalise(pick(body, EDITABLE_FIELDS));

    const validationError = validateFields(updates);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const isSelf = Number(req.user?.employee_id) === id;

    // An HR user can edit their own contact details, but not the fields that
    // drive pay and employment terms - only an Admin can change those.
    if (isBlockedSelfAction(req, id)) {
      const changedField = findChangedProtectedField(current, updates);

      if (changedField) {
        return res.status(403).json({
          message: `You cannot change your own ${changedField.replace(/_/g, " ")}. Please ask an Admin.`,
        });
      }
    }

    // ---- role change (the edit form always re-sends the current role,
    // so only an actual change is treated as a change)
    let newRole = null;

    if (body.role !== undefined && body.role !== current.role) {
      if (!ALL_ROLES.includes(body.role)) {
        return res.status(400).json({ message: "Please choose a valid role." });
      }

      // FIX: only an Admin may change anyone's role.
      if (!isAdmin(req)) {
        return res.status(403).json({
          message: "Only an Admin can change an employee's role.",
        });
      }

      if (isSelf) {
        return res.status(400).json({
          message: "You cannot change your own role.",
        });
      }

      newRole = body.role;
      updates.role = newRole;
    }

    // ---- status change
    if (body.status !== undefined && body.status !== current.status) {
      if (!EMPLOYEE_STATUSES.includes(body.status)) {
        return res.status(400).json({ message: "Invalid status." });
      }

      if (current.role === "Admin" && !isAdmin(req)) {
        return res.status(403).json({
          message: "Only an Admin can change an Admin account's status.",
        });
      }

      if (isSelf && body.status === "Inactive") {
        return res.status(400).json({
          message: "You cannot deactivate your own account.",
        });
      }

      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // FIX: the login token takes its role from users.role, but only the
    // employees table was updated, so a changed role never reached the
    // login. Keep both tables in step; if the users update fails, put the
    // employee role back so the two never disagree.
    if (newRole) {
      const { error: userRoleError } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("employee_id", id);

      if (userRoleError) {
        const { error: revertError } = await supabase
          .from("employees")
          .update({ role: current.role })
          .eq("id", id);

        if (revertError) {
          console.error(
            `[employees.updateEmployee] employees.role and users.role are OUT OF SYNC for employee ${id}:`,
            revertError.message,
          );
        }

        throw userRoleError;
      }
    }

    // role / status changes must apply to the very next request
    invalidateAuthCache(id);

    /*
     * FIX: the login credentials are only emailed once, when the employee
     * is created. If HR typed a wrong email there and corrected it later,
     * the real address never received anything and the password (stored
     * only as a hash) could not be re-sent. When personal_email actually
     * changes, issue a fresh password and email it to the NEW address.
     *
     * Skipped when: it is your own account, the account is Inactive, or an
     * HR user is editing an Admin / HR account (only an Admin may reset
     * those credentials).
     */
    const newEmail = updates.personal_email;
    const emailChanged =
      Boolean(newEmail) &&
      String(newEmail).toLowerCase() !==
        String(current.personal_email || "").toLowerCase();

    const mayReissueCredentials =
      emailChanged &&
      !isSelf &&
      data.status !== "Inactive" &&
      (current.role === "Employee" || isAdmin(req));

    if (!mayReissueCredentials) {
      return res.json(data);
    }

    let credentialResult = { sent: false, reason: "Credentials could not be reset" };

    try {
      const generatedPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const { error: passwordError } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("employee_id", id);

      if (passwordError) throw passwordError;

      invalidateAuthCache(id);

      credentialResult = await sendWelcomeEmail({
        toEmail: data.personal_email,
        employeeName: data.first_name,
        employeeCode: data.employee_code,
        password: generatedPassword,
      });
    } catch (credentialError) {
      console.error(
        `[employees.updateEmployee] could not re-issue credentials for employee ${id}:`,
        credentialError.message,
      );
    }

    res.json({
      ...data,
      credentialsReissued: true,
      emailSent: credentialResult.sent,
      ...(credentialResult.sent
        ? {}
        : { emailError: publicEmailError(credentialResult.reason) }),
    });
  } catch (err) {
    sendServerError(res, err, "employees.updateEmployee");
  }
};

// DELETE (deactivates - the row is kept for history)
export const deleteEmployee = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid employee id." });
    }

    if (Number(req.user?.employee_id) === id) {
      return res.status(400).json({
        message: "You cannot deactivate your own account.",
      });
    }

    const { data: current, error: currentError } = await supabase
      .from("employees")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (currentError) throw currentError;

    if (!current) {
      return res.status(404).json({ message: "Employee not found." });
    }

    if (current.role === "Admin" && !isAdmin(req)) {
      return res.status(403).json({
        message: "Only an Admin can deactivate an Admin account.",
      });
    }

    const { data, error } = await supabase
      .from("employees")
      .update({
        status: "Inactive",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    invalidateAuthCache(id);

    res.json({
      message: "Employee deactivated successfully.",
      employee: data,
    });
  } catch (err) {
    sendServerError(res, err, "employees.deleteEmployee");
  }
};