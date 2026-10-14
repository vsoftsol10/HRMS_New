import express from "express";

import {
  getPayrollItems,
  getPayrollItemsByPayroll,
  getPayrollItemById,
} from "../controller/payrollItemController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";


const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getPayrollItems);
router.get("/:id", authMiddleware, roleMiddleware("Admin", "HR"), getPayrollItemById);

export default router;