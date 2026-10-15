// authcontroller.js
  import supabase from "../config/supabase.js";
  import bcrypt from "bcrypt";
  import jwt from "jsonwebtoken";
  import crypto from "crypto";
  import { sendPasswordResetEmail } from "../services/emailService.js";
  import { sendServerError } from "../utils/httpError.js";
  import { validatePassword } from "../utils/passwordPolicy.js";

  // FIX: processDailyLeaves.js switches an employee's status to "On Leave"
  // on their leave days. The login check only allowed "Active", so anyone
  // on approved leave could not sign in. "Inactive" stays blocked.
  const LOGIN_ALLOWED_STATUSES = ["Active", "On Leave"];

  const isNonEmptyString = (value) =>
    typeof value === "string" && value.trim().length > 0;

  export const login = async (req, res) => {
    try {
      const { employee_code, password } = req.body ?? {};

      // FIX: no type check before - an object/array here was passed
      // straight into the query and into bcrypt.compare.
      if (!isNonEmptyString(employee_code) || !isNonEmptyString(password)) {
        return res.status(400).json({
          message: "Employee code and password are required.",
        });
      }

      // Find employee
      const { data: employee, error: empError } = await supabase
        .from("employees")
        .select("id, employee_code, status")
        .eq("employee_code", employee_code)
        .single();

      if (empError || !employee) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      // Find user using employee_id
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("employee_id", employee.id)
        .single();

      if (userError || !user) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      // Status is checked AFTER the password so that someone who does not
      // know the password can't use this endpoint to find out which
      // employee codes are deactivated.
      if (!LOGIN_ALLOWED_STATUSES.includes(employee.status)) {
        return res.status(403).json({
          message: "Your account is inactive. Please contact HR.",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          employee_id: user.employee_id,
          employee_code: user.employee_code,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        },
      );

      res.json({
        token,
        role: user.role,
        employee_code: user.employee_code,
      });
    } catch (error) {
      sendServerError(res, error, "auth.login");
    }
  };

  // Requires the DB columns added in
  // prisma/sql/add_password_reset_columns.sql (users.reset_token,
  // users.reset_token_expiry) - run that in the Supabase SQL Editor first.
  export const forgotPassword = async (req, res) => {
    try {
      const { employee_code } = req.body ?? {};

      if (!isNonEmptyString(employee_code)) {
        return res.status(400).json({
          message: "Employee code is required.",
        });
      }

      // Generic response used for every "account not found / no email on
      // file" case below - never confirm or deny that an employee_code
      // exists, so this endpoint can't be used to enumerate accounts.
      const genericResponse = {
        message:
          "If an account with this employee code exists, a password reset link has been sent to the registered email.",
      };

      const { data: employee, error: empError } = await supabase
        .from("employees")
        .select("id, first_name, personal_email")
        .eq("employee_code", employee_code)
        .maybeSingle();

      if (empError) {
        throw empError;
      }

      if (!employee || !employee.personal_email) {
        return res.json(genericResponse);
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, employee_code")
        .eq("employee_id", employee.id)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return res.json(genericResponse);
      }

      // Raw token goes in the email link; only its hash is stored, so a
      // DB read alone can't be replayed as a valid reset link.
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      // FIX: stored as plain epoch milliseconds (number) instead of a
      // timestamp string. Supabase was returning reset_token_expiry
      // without a "Z"/UTC suffix, so `new Date(...)` on the read side
      // parsed it as local time (IST, UTC+5:30) instead of UTC - making
      // every link appear expired ~5.5 hours before it actually was. A
      // plain number sidesteps timezone parsing entirely.
      const expiry = Date.now() + 60 * 60 * 1000; // 1 hour, epoch ms

      const { error: updateError } = await supabase
        .from("users")
        .update({
          reset_token: hashedToken,
          reset_token_expiry: expiry,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // validateEnv() makes FRONTEND_LOGIN_URL mandatory in production; the
      // localhost fallback only exists for local development.
      const baseUrl = (process.env.FRONTEND_LOGIN_URL || "http://localhost:5173").replace(/\/+$/, "");
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      // Non-blocking, same contract as sendWelcomeEmail - email failure
      // should not change the response the client sees.
      await sendPasswordResetEmail({
        toEmail: employee.personal_email,
        employeeName: employee.first_name,
        resetUrl,
      });

      res.json(genericResponse);
    } catch (error) {
      sendServerError(res, error, "auth.forgotPassword");
    }
  };

  export const resetPassword = async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body ?? {};

      if (
        !isNonEmptyString(token) ||
        !isNonEmptyString(newPassword) ||
        !isNonEmptyString(confirmPassword)
      ) {
        return res.status(400).json({
          message: "Token, new password and confirm password are required.",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match.",
        });
      }

      const passwordError = validatePassword(newPassword);

      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, reset_token_expiry")
        .eq("reset_token", hashedToken)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!user || !user.reset_token_expiry) {
        return res.status(400).json({
          message: "This reset link is invalid. Please request a new one.",
        });
      }

      if (Number(user.reset_token_expiry) < Date.now()) {
        return res.status(400).json({
          message: "This reset link has expired. Please request a new one.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: hashedPassword,
          reset_token: null,
          reset_token_expiry: null,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      res.json({
        message: "Password reset successfully. Please login with your new password.",
      });
    } catch (error) {
      sendServerError(res, error, "auth.resetPassword");
    }
  };