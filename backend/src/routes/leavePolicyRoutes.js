import express from "express";

import { getLeavePolicy, saveLeavePolicy } from "../controller/leavePolicyController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getLeavePolicy);
// FIX: singleton resource - no id in the URL, see controller for upsert logic.
router.patch(
  "/",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  saveLeavePolicy,
);

export default router;