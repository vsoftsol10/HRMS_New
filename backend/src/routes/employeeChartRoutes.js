import express from "express";
import { getEmployeeChart } from "../controller/employeeChartController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getEmployeeChart);

export default router;