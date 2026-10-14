// authroutes.js

import express from "express";
import {
  login,
  forgotPassword,
  resetPassword,
} from "../controller/authController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import { getEmployees } from "../controller/employeesController.js";

const router = express.Router();

// router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
// router.get("/employees", authMiddleware, getEmployees);

export default router;