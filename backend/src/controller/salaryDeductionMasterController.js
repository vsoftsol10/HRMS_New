import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getAllDeductions = async (req, res) => {
  const { data, error } = await supabase
    .from("salary_deduction_master")
    .select("*");

  if (error) {
    return res.status(500).json({
      message: safeErrorMessage(error, "salaryDeductionMasterController"),
    });
  }

  res.json(data);
};

export const createDeduction = async (req, res) => {
  const { deduction_name } = req.body;

  const { data, error } = await supabase
    .from("salary_deduction_master")
    .insert([{ deduction_name }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      message: safeErrorMessage(error, "salaryDeductionMasterController"),
    });
  }

  res.status(201).json(data);
};

export const updateDeduction = async (req, res) => {
  const { id } = req.params;
  const { deduction_name } = req.body;

  const { data, error } = await supabase
    .from("salary_deduction_master")
    .update({
      deduction_name,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      message: safeErrorMessage(error, "salaryDeductionMasterController"),
    });
  }

  res.json(data);
};

