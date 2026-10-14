import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getCompanyPolicies = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("company_policies")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "companyPolicyController") });
  }
};

export const createCompanyPolicy = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const { data, error } = await supabase
      .from("company_policies")
      .insert([{ title, description, updated_at: new Date() }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "companyPolicyController") });
  }
};

export const updateCompanyPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    const { data, error } = await supabase
      .from("company_policies")
      .update({ title, description })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "companyPolicyController") });
  }
};

export const deleteCompanyPolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("company_policies")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Company policy deleted" });
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "companyPolicyController") });
  }
};