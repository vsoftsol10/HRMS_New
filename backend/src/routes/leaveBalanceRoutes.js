import express from "express";

import {
  getLeaveBalances,
  getEmployeeLeaveBalance,
  getEmployeeBalanceById,
  initializeLeaveBalances,
} from "../controller/leaveBalanceController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// FIX: these three endpoints previously had no role check, so any
// authenticated Employee could list everyone's leave balance, or look up
// another specific employee's balance by ID (IDOR). Employees should use
// /my-balance for their own data instead.
router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getLeaveBalances);

router.get("/my-balance", authMiddleware, getEmployeeLeaveBalance);

router.get(
  "/employee/:employeeId",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getEmployeeBalanceById,
);

router.post(
  "/initialize",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  initializeLeaveBalances,
);

export default router;