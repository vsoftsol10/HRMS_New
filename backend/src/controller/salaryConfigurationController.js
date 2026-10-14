import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

/*
 * FIX: salary bands were accepted with no server-side validation at
 * all - a min_salary >= max_salary, or a band overlapping an existing
 * one, would insert fine. The old generatePayroll() picked a band with
 * `.lte(min_salary, salary).gte(max_salary, salary)...limit(1)`, so
 * an overlapping band meant payroll silently picked whichever one
 * sorts first rather than a deterministic, correct one.
 *
 * min_salary/max_salary are now legacy/optional (Step 3 of the payroll
 * redesign moved structures to department/designation/basic_salary
 * instead) - a new-style structure with neither set skips this
 * validation entirely rather than being forced to fabricate a band.
 */
// FIX: a structure could be saved with no name, a zero/negative/non-numeric
// basic salary or a malformed effective date, and update spread the whole
// request body (including id / created_at) into the row. Fields that are
// present are now validated, and a new-style structure (one that carries a
// name or a basic salary) must have both.
const validateStructureFields = (body, { isCreate }) => {
  const hasName = body.structure_name !== undefined;
  const hasBasic = body.basic_salary !== undefined;

  if (hasName && !String(body.structure_name || "").trim()) {
    return "Structure name cannot be empty.";
  }

  if (hasBasic) {
    const basic = Number(body.basic_salary);
    if (Number.isNaN(basic) || basic <= 0) {
      return "Basic salary must be a positive number.";
    }
  }

  if (isCreate && (hasName || hasBasic) && !(hasName && hasBasic)) {
    return "A salary structure needs both a name and a basic salary.";
  }

  // LOP rule: Auto (no value) | FixedPerDay (rupees per LOP day) |
  // FixedDivisor (Basic / N, N between 1 and 31).
  const lopValueGiven =
    body.lop_value !== undefined &&
    body.lop_value !== null &&
    body.lop_value !== "";

  if (body.lop_mode !== undefined) {
    if (!["Auto", "FixedPerDay", "FixedDivisor"].includes(body.lop_mode)) {
      return "LOP mode must be Auto, FixedPerDay or FixedDivisor.";
    }

    if (body.lop_mode === "Auto") {
      if (lopValueGiven) return "LOP value must be empty when the LOP mode is Auto.";
    } else {
      const lopValue = Number(body.lop_value);

      if (!lopValueGiven || Number.isNaN(lopValue) || lopValue <= 0) {
        return "Enter a positive LOP value.";
      }

      if (body.lop_mode === "FixedDivisor" && (lopValue < 1 || lopValue > 31)) {
        return "LOP divisor must be between 1 and 31.";
      }

      if (
        body.lop_mode === "FixedPerDay" &&
        body.basic_salary !== undefined &&
        lopValue > Number(body.basic_salary)
      ) {
        return "Fixed LOP amount per day cannot be more than the basic salary.";
      }
    }
  } else if (lopValueGiven) {
    return "A LOP value needs a LOP mode.";
  }

  if (
    body.effective_from !== undefined &&
    body.effective_from !== null &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.effective_from)) ||
      Number.isNaN(new Date(body.effective_from).getTime()))
  ) {
    return "Effective from must be a valid date (YYYY-MM-DD).";
  }

  return null;
};

const validateSalaryBand = async ({ min_salary, max_salary, effective_from, excludeId }) => {
  if (min_salary == null && max_salary == null) {
    return null;
  }

  const min = Number(min_salary);
  const max = Number(max_salary);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return "min_salary and max_salary must be numbers.";
  }

  if (min >= max) {
    return "min_salary must be less than max_salary.";
  }

  let query = supabase
    .from("salary_configurations")
    .select("id, min_salary, max_salary, effective_from")
    .lte("min_salary", max)
    .gte("max_salary", min);

  if (effective_from) {
    query = query.eq("effective_from", effective_from);
  }

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data: overlapping, error } = await query;

  if (error) throw error;

  if (overlapping?.length) {
    return `This salary range overlaps an existing configuration (id ${overlapping[0].id}: ${overlapping[0].min_salary}-${overlapping[0].max_salary}).`;
  }

  return null;
};

// GET ALL

export const getSalaryConfigurations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("salary_configurations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "salaryConfigurationController"),
    });
  }
};

// GET BY ID

export const getSalaryConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("salary_configurations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "salaryConfigurationController"),
    });
  }
};

// CREATE

export const createSalaryConfiguration = async (req, res) => {
  try {
    const { min_salary, max_salary, effective_from } = req.body;

    const fieldError = validateStructureFields(req.body, { isCreate: true });

    if (fieldError) {
      return res.status(400).json({ message: fieldError });
    }

    const validationError = await validateSalaryBand({
      min_salary,
      max_salary,
      effective_from,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { data, error } = await supabase
      .from("salary_configurations")
      .insert({
        ...req.body,
        lop_value: req.body.lop_mode && req.body.lop_mode !== "Auto" ? req.body.lop_value : null,
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "salaryConfigurationController"),
    });
  }
};

// UPDATE

export const updateSalaryConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: existingError } = await supabase
      .from("salary_configurations")
      .select("min_salary, max_salary, effective_from")
      .eq("id", id)
      .single();

    if (existingError) throw existingError;

    const fieldError = validateStructureFields(req.body, { isCreate: false });

    if (fieldError) {
      return res.status(400).json({ message: fieldError });
    }

    // Never let a request overwrite the row's identity / audit columns.
    const { id: _ignoredId, created_at: _ignoredCreated, ...updatableBody } =
      req.body;

    // Switching a structure back to Auto clears any stored LOP value.
    if (updatableBody.lop_mode === "Auto") {
      updatableBody.lop_value = null;
    }

    const merged = { ...existing, ...updatableBody };

    const validationError = await validateSalaryBand({
      min_salary: merged.min_salary,
      max_salary: merged.max_salary,
      effective_from: merged.effective_from,
      excludeId: id,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { data, error } = await supabase
      .from("salary_configurations")
      .update({
        ...updatableBody,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "salaryConfigurationController"),
    });
  }
};

// DELETE

export const deleteSalaryConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    // FIX: a structure could be deleted while employees were assigned to it
    // or payroll had been generated from it - the delete either failed with
    // a raw foreign-key error or silently took its components/deductions
    // with it. It is now refused with a clear message instead.
    const { count: assignmentCount, error: assignmentError } = await supabase
      .from("employee_salary_assignments")
      .select("id", { count: "exact", head: true })
      .eq("salary_configuration_id", id);

    if (assignmentError) throw assignmentError;

    if (assignmentCount > 0) {
      return res.status(409).json({
        message: `This salary structure is assigned to ${assignmentCount} employee assignment(s) and cannot be deleted.`,
      });
    }

    const { count: payrollCount, error: payrollError } = await supabase
      .from("payroll")
      .select("id", { count: "exact", head: true })
      .eq("salary_configuration_id", id);

    if (payrollError) throw payrollError;

    if (payrollCount > 0) {
      return res.status(409).json({
        message: `Payroll has already been generated from this salary structure (${payrollCount} record(s)), so it cannot be deleted.`,
      });
    }

    const { error } = await supabase
      .from("salary_configurations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      message: "Salary configuration deleted successfully.",
    });
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "salaryConfigurationController"),
    });
  }
};