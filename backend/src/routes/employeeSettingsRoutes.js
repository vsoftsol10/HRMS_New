import express from "express";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {    
  getLeavePolicy,
  getCompanyPolicy,
  changeEmployeePassword,
} from "../controller/employeeSettingsController.js";

const router = express.Router();

// FIX: these routes were missing roleMiddleware - restricted to
// Employee/HR like the rest of the employee-side routes.
router.get("/leave-policy", authMiddleware, roleMiddleware("Employee", "HR"), getLeavePolicy);

router.get("/company-policy", authMiddleware, roleMiddleware("Employee", "HR"), getCompanyPolicy);

router.put("/change-password", authMiddleware, roleMiddleware("Employee", "HR", "Intern"), changeEmployeePassword);

export default router;