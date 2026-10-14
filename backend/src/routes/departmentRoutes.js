import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controller/departmentController.js";

const router = express.Router();

// Reading the department list is harmless (names only) and is used in forms
// across roles, so it stays open to any authenticated user. Writes are
// restricted to Admin/HR.
router.get("/", authMiddleware, getDepartments);

router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), addDepartment);

router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateDepartment);

router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteDepartment);

export default router;