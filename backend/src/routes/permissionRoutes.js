// permissionRoutes.js

import express from "express";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getPermissionRequests,
  updatePermissionStatus,
} from "../controller/permissionController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getPermissionRequests,
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  updatePermissionStatus,
);

export default router;