import express from "express";
import { getAttendanceChart } from "../controller/attendanceChartController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getAttendanceChart);

export default router;