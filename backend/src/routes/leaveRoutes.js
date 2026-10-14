import express from "express";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getLeaveRequests,
  updateLeaveStatus,
} from "../controller/leavemanagementController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getLeaveRequests,
);

// router.post("/", authMiddleware, createLeaveRequest );

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  updateLeaveStatus,
);

// router.delete("/:id", authMiddleware, deleteAnnouncement);

export default router;