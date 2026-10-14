import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getMyInterns,
  getMyInternById,
  assignTasks,
} from "../controller/employeeInternController.js";

const router = express.Router();

// Employee portal "My Intern". HR users also work as employees (they can be
// a mentor), so both roles are allowed; everything is scoped to the caller's
// own employee_id inside the controller.
const employeeOnly = [authMiddleware, roleMiddleware("Employee", "HR")];

router.get("/", ...employeeOnly, getMyInterns);
router.post("/tasks", ...employeeOnly, assignTasks);
router.get("/:id", ...employeeOnly, getMyInternById);

export default router;