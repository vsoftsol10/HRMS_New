import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getEmployeePayroll,
  getMySixMonthSummary,
} from "../controller/employeePayrollController.js";


const router = express.Router();

// FIX: was missing roleMiddleware - restricted to Employee/HR like the
// rest of the employee-side routes.
router.get("/", authMiddleware, roleMiddleware("Employee", "HR"), getEmployeePayroll);
router.get(
  "/six-month-summary",
  authMiddleware,
  roleMiddleware("Employee", "HR"),
  getMySixMonthSummary,
);

export default router;