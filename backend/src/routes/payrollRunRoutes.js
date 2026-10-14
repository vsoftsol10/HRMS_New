import express from "express";

import {
  getPayrollRuns,
  getPayrollRunById,
  generatePayroll,
} from "../controller/payrollRunController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getPayrollRuns);
router.get("/:id", authMiddleware, roleMiddleware("Admin", "HR"), getPayrollRunById);
router.post("/generate", authMiddleware, roleMiddleware("Admin", "HR"), generatePayroll);


export default router;