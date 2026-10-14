import bcrypt from "bcrypt";
import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";
import { validatePassword } from "../utils/passwordPolicy.js";

// Leave Policy

export const getLeavePolicy = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leave_policy")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "employeeSettingsController"),
    });
  }
};

// Company Policy
// FIX: used to return a hardcoded array. Now reads from the
// company_policies table (see companyPolicyController.js for the
// admin-side CRUD) so admins can manage this without a code change.
// Same response shape as before ([{ title, description }, ...]), so
// CompanyPolicy.jsx (employee side) needed no changes.
export const getCompanyPolicy = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("company_policies")
      .select("title, description")
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "employeeSettingsController"),
    });
  }
};

// Change Password

export const changeEmployeePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    // Same shared rule as the other two password-setting paths.
    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    res.json({
      message: "Password updated successfully.",
    });
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "employeeSettingsController"),
    });
  }
};