import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getNextEmployeeCode,
} from "../controller/employeesController.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getEmployees);

router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createEmployee);

router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateEmployee);

router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteEmployee);

// FIX: this route had no auth at all previously.
router.get(
  "/next-code",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getNextEmployeeCode,
);

export default router;