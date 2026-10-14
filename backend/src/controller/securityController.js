import bcrypt from "bcrypt";
import supabase from "../config/supabase.js";
import { validatePassword } from "../utils/passwordPolicy.js";
import { createNotification } from "../services/notificationService.js";

export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "Passwords do not match",
    });
  }

  // FIX: resetPassword (authController.js) enforces a 6-character
  // minimum; this endpoint had no length check at all, so a user
  // could set their password to a single character or an empty
  // string through "Change Password" while the forgot-password flow
  // rejected the same input.
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
      message: "User not found",
    });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);

  if (!valid) {
    return res.status(400).json({
      message: "Current password is incorrect",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      password: hashedPassword,
    })
    .eq("id", userId);

  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  if (req.user.employee_id) {
    try {
      await createNotification({
        title: "Password Changed",
        message: "Your account password was just changed.",
        type: "Security",
        role: req.user.role,
        employee_id: req.user.employee_id,
      });
    } catch (notifyError) {
      console.error("Failed to send password-change notification:", notifyError.message);
    }
  }

  res.json({
    message: "Password updated successfully",
  });
};