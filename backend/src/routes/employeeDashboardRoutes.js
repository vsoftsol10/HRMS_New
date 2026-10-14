import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getEmployeeDashboard } from "../controller/employeeDashboardController.js";

const router = express.Router();

// FIX: this route only had authMiddleware, so any valid JWT (regardless
// of role) could hit it. Every other module in this codebase restricts
// its employee-side routes to Employee/HR - this brings it in line.
router.get("/", authMiddleware, roleMiddleware("Employee", "HR"), getEmployeeDashboard);

export default router;