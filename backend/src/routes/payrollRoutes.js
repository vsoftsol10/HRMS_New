import express from "express";

import {
  getPayrolls,
  getPayrollById,
  getSixMonthSummaryForEmployee,
  reviewPayroll,
  finalizePayroll,
  markPayrollAsPaid,
  deletePayroll,
} from "../controller/payrollController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getPayrolls);
router.get(
  "/six-month-summary/:employeeId",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getSixMonthSummaryForEmployee,
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getPayrollById,
);
router.put(
  "/:id/review",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  reviewPayroll,
);
router.put(
  "/:id/finalize",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  finalizePayroll,
);
// NOTE: markPayrollAsPaid existed in the controller but was never wired to a
// route. Added here so the "mark as paid" action is actually reachable.
router.put(
  "/:id/mark-paid",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  markPayrollAsPaid,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  deletePayroll,
);

export default router;