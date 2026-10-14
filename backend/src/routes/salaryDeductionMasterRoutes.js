import express from "express";

import {
  createDeduction,
  getAllDeductions,
  updateDeduction,
  // deleteDeduction,
} from "../controller/salaryDeductionMasterController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getAllDeductions);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createDeduction);

// FIX: this route was missing authMiddleware entirely, so anyone (even
// without logging in) could update a salary deduction master record.
router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateDeduction);

// router.delete("/:id", deleteDeduction);

export default router;