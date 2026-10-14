import express from "express";

import {
  getActiveAssignment,
  getAssignmentHistory,
  createAssignment,
  deleteAssignment,
} from "../controller/employeeSalaryAssignmentController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/:employeeId/active",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getActiveAssignment,
);
router.get(
  "/:employeeId/history",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getAssignmentHistory,
);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createAssignment);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  deleteAssignment,
);

export default router;