import express from "express";

import { getAttendancePolicy, saveAttendancePolicy } from "../controller/attendancePolicyController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAttendancePolicy);
// FIX: singleton resource - no id in the URL. saveAttendancePolicy decides
// insert vs update internally (see controller).
// FIX: this only had authMiddleware, so ANY logged-in employee could change
// the company attendance policy. Writing is now limited to Admin/HR.
router.patch("/", authMiddleware, roleMiddleware("Admin", "HR"), saveAttendancePolicy);

export default router;