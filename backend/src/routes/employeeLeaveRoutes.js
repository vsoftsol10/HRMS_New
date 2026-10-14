// employeeLeaveRoutes.js 

import express from "express";

import authMiddleware from "../middleware/authmiddleware.js";
import { uploadLeaveAttachment } from "../middleware/uploadMiddleware.js";

import {
  getEmployeeLeaves,
  createLeaveRequest,
  getLeaveAttachmentUrl,
} from "../controller/employeeLeaveController.js";

const router = express.Router();

router.get("/", authMiddleware, getEmployeeLeaves);

router.post("/", authMiddleware, uploadLeaveAttachment, createLeaveRequest);

router.get("/:id/attachment", authMiddleware, getLeaveAttachmentUrl);

// router.delete("/:id", authMiddleware, deleteAnnouncement);

export default router;