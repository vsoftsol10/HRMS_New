import express from "express";
import { getCompanySettings, saveCompanySettings } from "../controller/companySettingsController.js";
import authMiddleware from "../middleware/authmiddleware.js";
const router = express.Router();
import roleMiddleware from "../middleware/roleMiddleware.js";

router.get(
  "/",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  getCompanySettings,
);
// FIX: singleton resource - no id in the URL, see controller for upsert logic.
router.patch(
  "/",
  authMiddleware,
  roleMiddleware("Admin", "HR"),
  saveCompanySettings,
);

export default router;