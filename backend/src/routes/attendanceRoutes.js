import express from "express";

import {
  getAttendance,
  getEmployeeAttendance,
  signInAttendance,
  signOutAttendance,
  fixMissingCheckOut,
} from "../controller/attendanceController.js";

import { getInternAttendance } from "../controller/internAttendanceController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// FIX: getAttendance returns attendance for ALL employees - it's the
// admin/HR "attendance" management screen, so it needs to be role-gated.
// getEmployeeAttendance is self-scoped (uses req.user.employee_id) so it
// stays open to any authenticated user (Employee/HR/Admin viewing own data).
router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getAttendance);

router.get("/employee", authMiddleware, getEmployeeAttendance);

// HR / Admin: attendance of all interns for a month (Attendance -> Interns tab).
router.get(
  "/interns",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getInternAttendance,
);

router.post("/sign-in", authMiddleware, signInAttendance);

router.post("/sign-out", authMiddleware, signOutAttendance);

// HR / Admin: enter the real check-out for a day the system auto-closed
// (or a day with no check-out at all).
router.put(
  "/:id/check-out",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  fixMissingCheckOut,
);

export default router;