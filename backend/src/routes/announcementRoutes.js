import express from "express";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controller/announcementController.js";

const router = express.Router();

// This is the admin/HR management endpoint for announcements. Employees
// view announcements through /api/employee-announcements instead, so this
// whole resource is restricted to Admin/HR.
router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getAnnouncements);

router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createAnnouncement);

router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateAnnouncement);

router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteAnnouncement);

export default router;