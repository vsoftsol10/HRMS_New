import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

  export const getAllComponents = async (req, res) => {
    const { data, error } = await supabase
      .from("salary_component_master")
      .select("*");

    if (error) {
      return res.status(500).json({
        message: safeErrorMessage(error, "salaryComponentMasterController"),
      });
    }

    res.json(data);
  };

  export const createComponent = async (req, res) => {
    const { component_name } = req.body;

    const { data, error } = await supabase
      .from("salary_component_master")
      .insert([{ component_name }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        message: safeErrorMessage(error, "salaryComponentMasterController"),
      });
    }

    res.status(201).json(data);
  };

  export const updateComponent = async (req, res) => {
    const { id } = req.params;
    const { component_name } = req.body;

    const { data, error } = await supabase
      .from("salary_component_master")
      .update({
        component_name,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        message: safeErrorMessage(error, "salaryComponentMasterController"),
      });
    }

    res.json(data);
  };

