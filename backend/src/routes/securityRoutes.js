import express from "express";
import { changePassword } from "../controller/securityController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();



router.put("/change-password", authMiddleware, changePassword);

export default router;
