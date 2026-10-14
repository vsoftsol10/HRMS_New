import supabase from "../config/supabase.js";
import { sendServerError, pick } from "../utils/httpError.js";

// FIX: nothing stopped a percentage above 100 (or a zero/negative amount)
// from being saved, which would silently produce a negative net or an
// inflated gross at payroll time. The body is validated before it is
// written; on update, fields the request omits are not re-checked.
const validateAmountPayload = (body) => {
  if (body.amount === undefined && body.calculation_type === undefined) {
    return null;
  }

  const amount = Number(body.amount);

  if (body.amount !== undefined && (Number.isNaN(amount) || amount <= 0)) {
    return "Amount must be a positive number.";
  }

  if (body.calculation_type === "Percentage" && amount > 100) {
    return "A percentage cannot be more than 100.";
  }

  return null;
};

// FIX (mass assignment): req.body used to go straight into insert()/update(),
// letting a caller write any column (id, created_at, ...). Only these
// fields can be set now.
const CREATE_FIELDS = [
  "salary_configuration_id",
  "deduction_name",
  "amount",
  "is_included",
  "calculation_type",
  "calc_base",
];

// A row is never moved to another salary configuration after creation.
const UPDATE_FIELDS = CREATE_FIELDS.filter(
  (field) => field !== "salary_configuration_id",
);

const CALCULATION_TYPES = ["Fixed", "Percentage"];
const CALC_BASES = ["Basic", "Gross"];

// Extra checks on top of validateAmountPayload (amount > 0, % <= 100).
const validateShape = (data, { isCreate }) => {
  if (isCreate) {
    if (!Number.isInteger(Number(data.salary_configuration_id)) || Number(data.salary_configuration_id) <= 0) {
      return "A valid salary configuration is required.";
    }

    if (typeof data.deduction_name !== "string" || !data.deduction_name.trim()) {
      return "Name is required.";
    }

    if (data.amount === undefined) {
      return "Amount is required.";
    }
  }

  if (
    data.calculation_type !== undefined &&
    !CALCULATION_TYPES.includes(data.calculation_type)
  ) {
    return "Calculation type must be Fixed or Percentage.";
  }

  if (
    data.calc_base !== undefined &&
    data.calc_base !== null &&
    !CALC_BASES.includes(data.calc_base)
  ) {
    return "Invalid calculation base.";
  }

  if (data.is_included !== undefined && typeof data.is_included !== "boolean") {
    return "is_included must be true or false.";
  }

  return null;
};

// GET ALL

export const getSalaryDeductions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("salary_deductions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    sendServerError(res, err, "deduction");
  }
};

// GET BY ID

export const getSalaryDeductionById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("salary_deductions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    sendServerError(res, err, "deduction");
  }
};

// GET BY CONFIGURATION ID

export const getSalaryDeductionsByConfiguration = async (req, res) => {
  try {
    const { configurationId } = req.params;

    const { data, error } = await supabase
      .from("salary_deductions")
      .select("*")
      .eq("salary_configuration_id", configurationId);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    sendServerError(res, err, "deduction");
  }
};

// CREATE

export const createSalaryDeduction = async (req, res) => {
  try {
    const payload = pick(req.body, CREATE_FIELDS);

    const validationError =
      validateShape(payload, { isCreate: true }) ||
      validateAmountPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { data, error } = await supabase
      .from("salary_deductions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    sendServerError(res, err, "deduction");
  }
};

// UPDATE

export const updateSalaryDeduction = async (req, res) => {
  try {
    const { id } = req.params;

    const payload = pick(req.body, UPDATE_FIELDS);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const validationError =
      validateShape(payload, { isCreate: false }) ||
      validateAmountPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { data, error } = await supabase
      .from("salary_deductions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    sendServerError(res, err, "deduction");
  }
};

// DELETE

export const deleteSalaryDeduction = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("salary_deductions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      message: "Salary deduction deleted successfully.",
    });
  } catch (err) {
    sendServerError(res, err, "deduction");
  }
};
 