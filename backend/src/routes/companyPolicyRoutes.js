import express from "express";

import {
  getCompanyPolicies,
  createCompanyPolicy,
  updateCompanyPolicy,
  deleteCompanyPolicy,
} from "../controller/companyPolicyController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Employees need to view the policy list too, so GET stays open to any
// authenticated user. Writes are Admin/HR only.
router.get("/", authMiddleware, getCompanyPolicies);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createCompanyPolicy);
router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateCompanyPolicy);
router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteCompanyPolicy);

export default router;