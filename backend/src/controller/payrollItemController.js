import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

// GET ALL ITEMS

export const getPayrollItems = async (req, res) => {
  try {
    const { data, error } = await supabase.from("payroll_items").select("*");

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "payrollItemController"),
    });
  }
};

// GET ITEMS BY PAYROLL ID
  
export const getPayrollItemsByPayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;

    const { data, error } = await supabase
      .from("payroll_items")
      .select("*")
      .eq("payroll_id", payrollId);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "payrollItemController"),
    });
  }
};

// GET SINGLE ITEM

export const getPayrollItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("payroll_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "payrollItemController"),
    });
  }
};
