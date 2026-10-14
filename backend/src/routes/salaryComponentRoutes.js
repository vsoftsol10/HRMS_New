import express from "express";

import {
  getSalaryComponents,
  getSalaryComponentById,
  getSalaryComponentsByConfiguration,
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
} from "../controller/salaryComponentController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryComponents);
router.get("/:id", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryComponentById);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createSalaryComponent);
router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateSalaryComponent);
router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteSalaryComponent);

export default router;