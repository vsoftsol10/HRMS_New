import express from "express";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { uploadProfilePhoto } from "../middleware/profilePhotoUploadMiddleware.js";

import {
  getProfile,
  updateProfile,
  uploadPhoto,
  removePhoto,
} from "../controller/profileController.js";

const router = express.Router();

// Every role edits only its own profile (req.user.employee_id).
const anyStaff = roleMiddleware("Admin", "HR", "Employee", "Intern");

router.get("/", authMiddleware, anyStaff, getProfile);
router.put("/", authMiddleware, anyStaff, updateProfile);
router.post("/photo", authMiddleware, anyStaff, uploadProfilePhoto, uploadPhoto);
router.delete("/photo", authMiddleware, anyStaff, removePhoto);

export default router;