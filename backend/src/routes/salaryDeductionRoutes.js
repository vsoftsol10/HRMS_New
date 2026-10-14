import express from "express";

import {
  getSalaryDeductions,
  getSalaryDeductionById,
  createSalaryDeduction,
  updateSalaryDeduction,
  deleteSalaryDeduction,
} from "../controller/salaryDeductionController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryDeductions);
router.get("/:id", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryDeductionById);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createSalaryDeduction);
router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateSalaryDeduction);
router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteSalaryDeduction);

export default router;