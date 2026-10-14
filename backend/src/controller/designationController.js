import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

// GET ALL (optionally filtered by department_id, for the Add Employee /
// Structure dropdowns)

export const getDesignations = async (req, res) => {
  try {
    const { department_id } = req.query;

    let query = supabase
      .from("designations")
      .select("*, departments(department_name)")
      .order("designation_name", { ascending: true });

    if (department_id !== undefined) {
      // department_id can genuinely be null (org-wide designations, e.g.
      // "Admin") - .is() handles that, .eq() would not match NULL rows.
      if (department_id === "null" || department_id === "") {
        query = query.is("department_id", null);
      } else {
        query = query.eq("department_id", department_id);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "designationController") });
  }
};

// GET BY ID

export const getDesignationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("designations")
      .select("*, departments(department_name)")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "designationController") });
  }
};

// CREATE

export const createDesignation = async (req, res) => {
  try {
    const { department_id, designation_name } = req.body;

    if (!designation_name?.trim()) {
      return res.status(400).json({
        message: "designation_name is required.",
      });
    }

    const { data, error } = await supabase
      .from("designations")
      .insert({
        department_id: department_id ?? null,
        designation_name: designation_name.trim(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      // Unique (department_id, designation_name) violation
      if (error.code === "23505") {
        return res.status(409).json({
          message: "This designation already exists for the selected department.",
        });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "designationController") });
  }
};

// UPDATE

export const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    // FIX (mass assignment): was { ...req.body }. Only these two columns
    // can be changed from the client.
    const updates = {};

    if (req.body?.designation_name !== undefined) {
      if (
        typeof req.body.designation_name !== "string" ||
        !req.body.designation_name.trim()
      ) {
        return res.status(400).json({
          message: "designation_name cannot be empty.",
        });
      }

      updates.designation_name = req.body.designation_name.trim();
    }

    if (req.body?.department_id !== undefined) {
      updates.department_id = req.body.department_id ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const { data, error } = await supabase
      .from("designations")
      .update({ ...updates, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "designationController") });
  }
};

// DELETE

export const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    // Guard: don't leave employees pointing at a deleted designation.
    const { data: inUse, error: inUseError } = await supabase
      .from("employees")
      .select("id")
      .eq("designation_id", id)
      .limit(1);

    if (inUseError) throw inUseError;

    if (inUse?.length) {
      return res.status(409).json({
        message: "This designation is assigned to one or more employees and cannot be deleted.",
      });
    }

    const { error } = await supabase.from("designations").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Designation deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "designationController") });
  }
};