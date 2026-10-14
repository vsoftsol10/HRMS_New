import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getDashboard } from "../controller/dashboardController.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getDashboard);

export default router;