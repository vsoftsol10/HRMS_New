// employeePermissionRoutes.js

import express from "express";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getEmployeePermissions,
  createPermissionRequest,
} from "../controller/employeePermissionController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("Employee", "HR"),
  getEmployeePermissions,
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("Employee", "HR"),
  createPermissionRequest,
);

export default router;