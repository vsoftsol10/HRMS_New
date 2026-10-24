// internOutcomeController.js
//
// "Internship Outcome" actions on the HR / Admin intern detail page:
//   - GET  /api/interns/:id/convert-defaults   pre-fill for the Convert dialog
//   - POST /api/interns/:id/convert            intern -> employee
//   - POST /api/interns/:id/complete           mark the internship completed
//   - POST /api/interns/:id/extend             push the end date back
//
// Nothing is deleted: the intern keeps the same employees row (so every
// document, task, submission, certificate, attendance and stipend row that
// points at it stays attached) and the interns row is only flipped to
// Completed / Converted.

import bcrypt from "bcrypt";

import supabase from "../config/supabase.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { getToday } from "../utils/dateUtils.js";
import {
  INTERN_SELECT,
  blankToNull,
  handleError,
  isValidDate,
  parseId,
  shapeIntern,
} from "../utils/internHelpers.js";
import {
  generateEmployeeCode,
  generatePassword,
} from "./employeesController.js";

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract"];
const EMPLOYMENT_STATUSES = ["Active", "Inactive"];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const addDays = (date, days) => {
  const [y, m, d] = String(date).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const loadIntern = async (id) => {
  const { data, error } = await supabase
    .from("interns")
    .select(INTERN_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

const fail = (res, message, errors) =>
  res.status(400).json(errors ? { message, errors } : { message });

/* ------------------------------------------------------------------ */
/* GET /api/interns/:id/convert-defaults                               */
/* ------------------------------------------------------------------ */

export const getConvertDefaults = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, "Invalid intern id.");

    const row = await loadIntern(id);
    if (!row) return res.status(404).json({ message: "Intern not found." });

    res.json({
      employee_code: await generateEmployeeCode(),
      joining_date: getToday(),
    });
  } catch (err) {
    handleError(res, err, "getConvertDefaults");
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/interns/:id/convert                                       */
/* ------------------------------------------------------------------ */

export const convertInternToEmployee = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, "Invalid intern id.");

    const row = await loadIntern(id);
    if (!row) return res.status(404).json({ message: "Intern not found." });

    const intern = shapeIntern(row);

    if (intern.status !== "Active") {
      return fail(
        res,
        intern.status === "Converted"
          ? "This intern has already been converted to an employee."
          : "Only an active internship can be converted to an employee.",
      );
    }

    if (!intern.date_of_birth) {
      return fail(
        res,
        "This intern has no date of birth on file. Add it from Edit before converting - it is needed to create the employee login.",
      );
    }

    const body = req.body || {};
    const errors = {};

    const employeeCode = blankToNull(body.employee_code)?.toString().trim();
    if (!employeeCode || !/^[A-Za-z]+\d+$/.test(employeeCode)) {
      errors.employee_code = "Enter a valid Employee ID (letters followed by digits).";
    }

    const departmentId = parseId(body.department_id);
    if (!departmentId) errors.department_id = "Select a department.";

    const designation = blankToNull(body.designation)?.toString().trim();
    if (!designation) errors.designation = "Designation is required.";

    const employmentType = blankToNull(body.employment_type);
    if (!EMPLOYMENT_TYPES.includes(employmentType)) {
      errors.employment_type = "Select an employee type.";
    }

    const joiningDate = blankToNull(body.joining_date);
    if (!isValidDate(joiningDate)) {
      errors.joining_date = "Select a valid joining date.";
    } else if (joiningDate < String(intern.start_date).slice(0, 10)) {
      errors.joining_date = "Joining date cannot be before the internship start date.";
    }

    const reportingEmployeeId = parseId(body.reporting_employee_id);
    if (!reportingEmployeeId) {
      errors.reporting_employee_id = "Select a reporting employee.";
    } else if (reportingEmployeeId === intern.employee_id) {
      errors.reporting_employee_id = "An employee cannot report to themself.";
    }

    const annualSalary = Number(body.annual_salary);
    if (!Number.isFinite(annualSalary) || annualSalary <= 0) {
      errors.annual_salary = "Enter a salary greater than 0.";
    }

    const employmentStatus = blankToNull(body.status) || "Active";
    if (!EMPLOYMENT_STATUSES.includes(employmentStatus)) {
      errors.status = "Select a valid employment status.";
    }

    if (Object.keys(errors).length) {
      return fail(res, Object.values(errors)[0], errors);
    }

    // The new Employee ID must be free (the intern's own VSINT.. code is
    // released by this conversion).
    const { data: codeOwner, error: codeError } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_code", employeeCode)
      .neq("id", intern.employee_id)
      .maybeSingle();

    if (codeError) throw codeError;
    if (codeOwner) {
      return res.status(409).json({
        message: "That Employee ID is already in use. Generate a new one.",
        errors: { employee_code: "Already in use." },
      });
    }

    const { data: manager, error: managerError } = await supabase
      .from("employees")
      .select("id, first_name, role, status")
      .eq("id", reportingEmployeeId)
      .maybeSingle();

    if (managerError) throw managerError;
    if (!manager || !["Active", "On Leave"].includes(manager.status) ||
      manager.role === "Intern") {
      return fail(res, "The reporting employee must be an active employee.", {
        reporting_employee_id: "Select an active employee.",
      });
    }

    // Link the payroll designation when one with this name exists in the
    // chosen department (payroll structures match on designation_id).
    const { data: designationRow, error: designationError } = await supabase
      .from("designations")
      .select("id")
      .eq("department_id", departmentId)
      .ilike("designation_name", designation)
      .maybeSingle();

    if (designationError) throw designationError;

    // Keep the ORIGINAL rows so a failed step can be rolled back.
    const { data: originalEmployee, error: originalError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", intern.employee_id)
      .single();

    if (originalError) throw originalError;

    const { data: originalUser, error: originalUserError } = await supabase
      .from("users")
      .select("*")
      .eq("employee_id", intern.employee_id)
      .maybeSingle();

    if (originalUserError) throw originalUserError;

    const password = generatePassword(employeeCode, intern.date_of_birth);
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const rollback = async (internTouched) => {
      await supabase
        .from("employees")
        .update({
          employee_code: originalEmployee.employee_code,
          role: originalEmployee.role,
          department_id: originalEmployee.department_id,
          designation: originalEmployee.designation,
          designation_id: originalEmployee.designation_id,
          employment_type: originalEmployee.employment_type,
          reporting_manager: originalEmployee.reporting_manager,
          joining_date: originalEmployee.joining_date,
          monthly_salary: originalEmployee.monthly_salary,
          status: originalEmployee.status,
          updated_at: originalEmployee.updated_at,
        })
        .eq("id", intern.employee_id);

      if (originalUser) {
        await supabase
          .from("users")
          .update({
            employee_code: originalUser.employee_code,
            role: originalUser.role,
            password: originalUser.password,
          })
          .eq("id", originalUser.id);
      }

      if (internTouched) {
        await supabase
          .from("interns")
          .update({
            status: row.status,
            end_date: row.end_date,
            updated_at: row.updated_at ?? now,
          })
          .eq("id", id);
      }
    };

    // 1. employee record (same row - history stays attached)
    const { error: employeeError } = await supabase
      .from("employees")
      .update({
        employee_code: employeeCode,
        role: "Employee",
        department_id: departmentId,
        designation,
        designation_id: designationRow?.id ?? null,
        employment_type: employmentType,
        reporting_manager: manager.first_name,
        joining_date: joiningDate,
        monthly_salary: Math.round((annualSalary / 12) * 100) / 100,
        status: employmentStatus,
        updated_at: now,
      })
      .eq("id", intern.employee_id);

    if (employeeError) {
      await rollback(false);
      throw employeeError;
    }

    // 2. login (the Employee ID is the login ID, so it changes too)
    const userPayload = {
      employee_code: employeeCode,
      role: "Employee",
      password: hashedPassword,
    };

    const { error: userError } = originalUser
      ? await supabase.from("users").update(userPayload).eq("id", originalUser.id)
      : await supabase
          .from("users")
          .insert({ employee_id: intern.employee_id, ...userPayload });

    if (userError) {
      await rollback(false);
      throw userError;
    }

    // 3. internship: Converted + stipend stops the day before payroll starts
    const internUpdate = { status: "Converted", updated_at: now };

    const startDate = String(intern.start_date).slice(0, 10);
    const endDate = String(intern.end_date).slice(0, 10);
    if (joiningDate <= endDate) {
      const stoppedOn = addDays(joiningDate, -1);
      internUpdate.end_date = stoppedOn < startDate ? startDate : stoppedOn;
    }

    const { error: internError } = await supabase
      .from("interns")
      .update(internUpdate)
      .eq("id", id);

    if (internError) {
      await rollback(true);
      throw internError;
    }

    // 4. credentials email (best effort - never undoes the conversion)
    const emailResult = await sendWelcomeEmail({
      toEmail: intern.email,
      employeeName: intern.full_name,
      employeeCode,
      password,
    });

    res.json({
      message: "Intern converted to employee.",
      employee_id: intern.employee_id,
      employee_code: employeeCode,
      full_name: intern.full_name,
      joining_date: joiningDate,
      emailSent: emailResult.sent,
      // Only handed back when the email could not be sent, so HR can pass
      // the login details on themselves.
      ...(emailResult.sent
        ? {}
        : { emailError: emailResult.reason, password }),
    });
  } catch (err) {
    handleError(res, err, "convertInternToEmployee");
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/interns/:id/complete                                      */
/* ------------------------------------------------------------------ */

export const completeInternship = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, "Invalid intern id.");

    const row = await loadIntern(id);
    if (!row) return res.status(404).json({ message: "Intern not found." });

    if (row.status !== "Active") {
      return fail(
        res,
        row.status === "Completed"
          ? "This internship is already completed."
          : "Only an active internship can be completed.",
      );
    }

    const now = new Date().toISOString();

    const { error: internError } = await supabase
      .from("interns")
      .update({ status: "Completed", updated_at: now })
      .eq("id", id);

    if (internError) throw internError;

    // The internship is over: block the intern login so the daily absence
    // job stops marking them Absent. Re-activated if the internship is
    // extended later.
    const { error: employeeError } = await supabase
      .from("employees")
      .update({ status: "Inactive", updated_at: now })
      .eq("id", row.employee_id);

    if (employeeError) {
      await supabase
        .from("interns")
        .update({ status: "Active", updated_at: now })
        .eq("id", id);
      throw employeeError;
    }

    res.json({ message: "Internship marked as completed." });
  } catch (err) {
    handleError(res, err, "completeInternship");
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/interns/:id/extend                                        */
/* ------------------------------------------------------------------ */

export const extendInternship = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, "Invalid intern id.");

    const row = await loadIntern(id);
    if (!row) return res.status(404).json({ message: "Intern not found." });

    if (!["Active", "Completed"].includes(row.status)) {
      return fail(res, "Only an active or completed internship can be extended.");
    }

    const body = req.body || {};
    const errors = {};

    const newEndDate = blankToNull(body.new_end_date);
    if (!isValidDate(newEndDate)) {
      errors.new_end_date = "Select a valid new end date.";
    } else if (newEndDate <= String(row.end_date).slice(0, 10)) {
      errors.new_end_date = "New end date must be after the current end date.";
    }

    const stipend = Number(body.monthly_stipend);
    if (
      blankToNull(body.monthly_stipend) === null ||
      !Number.isFinite(stipend) ||
      stipend < 0
    ) {
      errors.monthly_stipend = "Enter a valid stipend amount.";
    }

    if (Object.keys(errors).length) {
      return fail(res, Object.values(errors)[0], errors);
    }

    const now = new Date().toISOString();

    // Free internship that becomes paid on extension: the stipend starts the
    // month after the old end date, so the earlier free months stay Rs.0.
    const update = {
      end_date: newEndDate,
      monthly_stipend: stipend,
      status: "Active",
      updated_at: now,
    };

    if (Number(row.monthly_stipend) === 0 && stipend > 0) {
      const [y, m] = String(row.end_date).slice(0, 10).split("-").map(Number);
      const next = new Date(Date.UTC(y, m, 1));
      const defaultStart = `${next.getUTCFullYear()}-${String(
        next.getUTCMonth() + 1,
      ).padStart(2, "0")}-01`;

      // HR can choose the start month in the Extend form; it must be the 1st
      // of a month between the old end month and the new end month.
      const requested = blankToNull(body.stipend_start_month);
      const oldEndMonth = `${String(row.end_date).slice(0, 7)}-01`;
      const newEndMonth = `${newEndDate.slice(0, 7)}-01`;

      if (requested === null) {
        update.stipend_start_month = defaultStart;
      } else if (
        !isValidDate(requested) ||
        !requested.endsWith("-01") ||
        requested < oldEndMonth ||
        requested > newEndMonth
      ) {
        return fail(res, "Select a valid stipend start month.", {
          stipend_start_month: "Select a valid stipend start month.",
        });
      } else {
        update.stipend_start_month = requested;
      }
    }

    const { error: internError } = await supabase
      .from("interns")
      .update(update)
      .eq("id", id);

    if (internError) throw internError;

    if (row.status === "Completed") {
      const { error: employeeError } = await supabase
        .from("employees")
        .update({ status: "Active", updated_at: now })
        .eq("id", row.employee_id);

      if (employeeError) {
        await supabase
          .from("interns")
          .update({
            end_date: row.end_date,
            monthly_stipend: row.monthly_stipend,
            stipend_start_month: row.stipend_start_month ?? null,
            status: row.status,
            updated_at: now,
          })
          .eq("id", id);
        throw employeeError;
      }
    }

    res.json({ message: "Internship extended.", end_date: newEndDate });
  } catch (err) {
    handleError(res, err, "extendInternship");
  }
};