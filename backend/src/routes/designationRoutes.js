import express from "express";

import {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controller/designationController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getDesignations);
router.get("/:id", authMiddleware, roleMiddleware("Admin", "HR"), getDesignationById);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createDesignation);
router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateDesignation);
router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteDesignation);

export default router;