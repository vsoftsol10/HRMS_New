import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  uploadInternDocument,
  uploadInternDocuments,
} from "../middleware/internUploadMiddleware.js";
import {
  getNextInternCodes,
  getInterns,
  getInternById,
  createIntern,
  updateIntern,
  deleteIntern,
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  getInternTasks,
  getInternCoverage,
  addInternCoverage,
  removeInternCoverage,
  getInternStipends,
  markStipendPaid,
} from "../controller/internController.js";
import {
  getConvertDefaults,
  convertInternToEmployee,
  completeInternship,
  extendInternship,
} from "../controller/internOutcomeController.js";
import { getMonthlyInternStipends } from "../controller/internStipendController.js";

const router = express.Router();

// HR / Admin only - the intern's own portal lives in internPortalRoutes.js
router.use(authMiddleware, roleMiddleware("Admin", "HR"));

// Static paths first so they are not swallowed by "/:id"
router.get("/next-codes", getNextInternCodes);
router.get("/stipends/monthly", getMonthlyInternStipends);

router.get("/", getInterns);
router.post("/", uploadInternDocuments, createIntern);
router.get("/:id", getInternById);
router.put("/:id", updateIntern);
router.delete("/:id", deleteIntern);

router.post("/:id/documents", uploadInternDocument, uploadDocument);
router.get("/:id/documents/:docId/url", getDocumentUrl);
router.delete("/:id/documents/:docId", deleteDocument);

router.get("/:id/tasks", getInternTasks);

router.get("/:id/coverage", getInternCoverage);
router.post("/:id/coverage", addInternCoverage);
router.delete("/:id/coverage/:coverageId", removeInternCoverage);

router.get("/:id/stipends", getInternStipends);
router.post("/:id/stipends/pay", markStipendPaid);

// Internship outcome
router.get("/:id/convert-defaults", getConvertDefaults);
router.post("/:id/convert", convertInternToEmployee);
router.post("/:id/complete", completeInternship);
router.post("/:id/extend", extendInternship);

export default router;