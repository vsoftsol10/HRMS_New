import express from "express";

import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../controller/holidayController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Employees need to view the holiday list too, so GET stays open to any
// authenticated user. Writes are Admin/HR only.
router.get("/", authMiddleware, getHolidays);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createHoliday);
router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateHoliday);
router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteHoliday);

export default router;