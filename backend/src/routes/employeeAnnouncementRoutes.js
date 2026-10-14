import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getEmployeeAnnouncements } from "../controller/employeeAnnouncementController.js";

const router = express.Router();

// FIX: was missing roleMiddleware - restricted to Employee/HR like the
// rest of the employee-side routes.
router.get("/", authMiddleware, roleMiddleware("Employee", "HR", "Intern"), getEmployeeAnnouncements);

export default router;