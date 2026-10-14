import "./src/config/timezone.js"; // must stay first: pins the process timezone
import express from "express";
import dotenv from "dotenv";
import supabase from "./src/config/supabase.js";
import {
  configureSecurity,
  validateEnv,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "./src/config/security.js";

// import authRoutes from "./routes/authRoutes.js";
import authRoutes from "./src/routes/authroutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import departmentRoutes from "./src/routes/departmentRoutes.js";
import internRoutes from "./src/routes/internRoutes.js";
import employeeInternRoutes from "./src/routes/employeeInternRoutes.js";
import internPortalRoutes from "./src/routes/internPortalRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import holidayRoutes from "./src/routes/holidayRoutes.js";
import announcementRoutes from "./src/routes/announcementRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import leaveRoutes from "./src/routes/leaveRoutes.js";
import companySettingsRoutes from "./src/routes/companySettingsRoutes.js";
import companyPolicyRoutes from "./src/routes/companyPolicyRoutes.js";
import attendancePolicyRoutes from "./src/routes/attendancePolicyRoutes.js";
import leavePolicyRoutes from "./src/routes/leavePolicyRoutes.js";
import securityRoutes from "./src/routes/securityRoutes.js";
import attendanceChartRoutes from "./src/routes/attendanceChartRoutes.js";
import employeeChartRoutes from "./src/routes/employeeChartRoutes.js";

import salaryConfigurationRoutes from "./src/routes/salaryConfigurationRoutes.js";
import salaryComponentRoutes from "./src/routes/salaryComponentRoutes.js";
import salaryDeductionRoutes from "./src/routes/salaryDeductionRoutes.js";
import designationRoutes from "./src/routes/designationRoutes.js";
import employeeSalaryAssignmentRoutes from "./src/routes/employeeSalaryAssignmentRoutes.js";

import payrollRoutes from "./src/routes/payrollRoutes.js";
import payrollItemRoutes from "./src/routes/payrollItemRoutes.js";
import payrollRunRoutes from "./src/routes/payrollRunRoutes.js";

import salaryComponentMasterRoutes from "./src/routes/salaryComponentMasterRoutes.js";
import salaryDeductionMasterRoutes from "./src/routes/salaryDeductionMasterRoutes.js";

import employeeDashboardRoutes from "./src/routes/employeeDashboardRoutes.js";
import employeePayrollRoutes from "./src/routes/employeePayrollRoutes.js";
import employeeAnnouncementRoutes from "./src/routes/employeeAnnouncementRoutes.js";
import employeeSettingsRoutes from "./src/routes/employeeSettingsRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import employeeLeaveRoutes from "./src/routes/employeeLeaveRoutes.js";
import leaveBalanceRoutes from "./src/routes/leaveBalanceRoutes.js";
import permissionRoutes from "./src/routes/permissionRoutes.js";
import employeePermissionRoutes from "./src/routes/employeePermissionRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import certificateRoutes from "./src/routes/certificateRoutes.js";

import { stopScheduler } from "./src/jobs/scheduler.js";




dotenv.config();

validateEnv();

const app = express();

configureSecurity(app); // security headers + CORS allow-list (CORS_ORIGINS)
app.use(express.json());

// /health = liveness (is the process up). /ready = readiness (can it reach
// the database). Point the platform's health check at /ready.
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});

app.get("/ready", async (req, res) => {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) throw error;
    res.json({ status: "ready" });
  } catch (error) {
    console.error("[ready] database check failed:", error.message);
    res.status(503).json({ status: "unavailable" });
  }
});

// Brute-force / email-spam protection on the public auth endpoints.
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth/reset-password", resetPasswordLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/interns", internRoutes);
app.use("/api/my-interns", employeeInternRoutes);
app.use("/api/intern-portal", internPortalRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/company-settings", companySettingsRoutes);
app.use("/api/company-policy", companyPolicyRoutes);
app.use("/api/attendance-policy", attendancePolicyRoutes);
app.use("/api/leave-policy", leavePolicyRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/attendance-chart", attendanceChartRoutes);
app.use("/api/employee-chart", employeeChartRoutes);


app.use("/api/salary-configurations", salaryConfigurationRoutes);
app.use("/api/salary-components", salaryComponentRoutes);
app.use("/api/salary-deductions", salaryDeductionRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/employee-salary-assignments", employeeSalaryAssignmentRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/payroll-items", payrollItemRoutes);
app.use("/api/payroll-runs", payrollRunRoutes);

app.use("/api/salary-component-master", salaryComponentMasterRoutes);
app.use("/api/salary-deduction-master", salaryDeductionMasterRoutes);

app.use("/api/employee-dashboard", employeeDashboardRoutes);
app.use("/api/employee-payroll", employeePayrollRoutes);
app.use("/api/employee-announcements", employeeAnnouncementRoutes);
app.use("/api/employee-settings", employeeSettingsRoutes);
app.use("/api/employee-leave" , employeeLeaveRoutes);
app.use("/api/leave-balance" , leaveBalanceRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/employee-permissions", employeePermissionRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/certificates", certificateRoutes);

// ---------------------------------------------------------------------
// FIX: there was no catch-all and no error handler, so an unknown URL or a
// malformed JSON body returned Express's default HTML page, and any error
// that reached Express could leak a stack trace. Express 5 already forwards
// rejected promises from async handlers here, so no wrapper is needed.
// ---------------------------------------------------------------------
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON." });
  }

  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }

  // multer (file uploads): wrong type / too large etc. are client errors
  if (err?.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  console.error(`[unhandled] ${req.method} ${req.originalUrl}:`, err);

  res.status(500).json({ message: "Something went wrong. Please try again." });
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown: stop the cron jobs, let in-flight requests finish, then
// exit. Hosting platforms send SIGTERM on every deploy/restart.
let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received - closing server...`);

  stopScheduler();

  server.close((err) => {
    if (err) {
      console.error("[shutdown] error while closing:", err);
      process.exit(1);
    }
    process.exit(0);
  });

  // Safety net: do not hang forever on a stuck connection.
  setTimeout(() => {
    console.error("[shutdown] forced exit after timeout.");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));