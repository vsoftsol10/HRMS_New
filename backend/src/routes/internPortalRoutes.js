import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { uploadInternDocument, uploadTaskSubmission } from "../middleware/internUploadMiddleware.js";
import {
  getDashboard,
  getProfile,
  updateEmergencyContact,
  updatePersonalInfo,
  getMyDocuments,
  getMyDocumentUrl,
  uploadMyDocument,
  deleteMyDocument,
  getTasks,
  startTask,
  updateTaskStatus,
  submitTask,
  getSubmissionUrl,
  getStipends,
} from "../controller/internPortalController.js";

const router = express.Router();

// Intern self-service only. Attendance, leave and holidays are NOT here -
// the intern portal reuses /api/attendance, /api/employee-leave and
// /api/holidays directly (already scoped by employee_id, no role check).
router.use(authMiddleware, roleMiddleware("Intern"));

router.get("/dashboard", getDashboard);

router.get("/profile", getProfile);
router.put("/emergency-contact", updateEmergencyContact);
router.put("/personal-info", updatePersonalInfo);  

router.get("/documents", getMyDocuments);
router.get("/documents/:docId/url", getMyDocumentUrl);
router.post("/documents", uploadInternDocument, uploadMyDocument);
router.delete("/documents/:docId", deleteMyDocument);

router.get("/tasks", getTasks);
router.patch("/tasks/:id/start", startTask);
router.patch("/tasks/:id/status", updateTaskStatus);
router.post("/tasks/:id/submit", uploadTaskSubmission, submitTask);
router.get("/tasks/:id/submission-url", getSubmissionUrl);

router.get("/stipends", getStipends);

export default router;