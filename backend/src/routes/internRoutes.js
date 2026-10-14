import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  uploadInternDocuments,
  uploadInternDocument,
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

// Everything here is HR / Admin only. Auth runs BEFORE the multer upload
// middleware so an unauthenticated request can never push files into memory.
// (The intern's own self-service endpoints live in internPortalRoutes.js,
// mounted at /api/intern-portal.)
const hrOnly = [authMiddleware, roleMiddleware("Admin", "HR")];

// Must stay above "/:id" so "next-codes" isn't treated as an intern id.
router.get("/next-codes", ...hrOnly, getNextInternCodes);

// Payroll > Intern Stipend tab: every intern's stipend for one month.
// Must stay above "/:id" so "stipends" isn't treated as an intern id.
router.get("/stipends/monthly", ...hrOnly, getMonthlyInternStipends);

router.get("/", ...hrOnly, getInterns);
router.post("/", ...hrOnly, uploadInternDocuments, createIntern);

router.get("/:id", ...hrOnly, getInternById);
router.put("/:id", ...hrOnly, updateIntern);
router.delete("/:id", ...hrOnly, deleteIntern);

router.post("/:id/documents", ...hrOnly, uploadInternDocument, uploadDocument);
router.get("/:id/documents/:docId/url", ...hrOnly, getDocumentUrl);
router.delete("/:id/documents/:docId", ...hrOnly, deleteDocument);

// Tasks are created by mentors (see employeeInternRoutes); HR can read them.
router.get("/:id/tasks", ...hrOnly, getInternTasks);

// Temporary mentor coverage is assigned manually by HR.
router.get("/:id/coverage", ...hrOnly, getInternCoverage);
router.post("/:id/coverage", ...hrOnly, addInternCoverage);
router.delete("/:id/coverage/:coverageId", ...hrOnly, removeInternCoverage);

// Stipend: unpaid months are computed on the fly; HR marks a month paid.
router.get("/:id/stipends", ...hrOnly, getInternStipends);
router.post("/:id/stipends/pay", ...hrOnly, markStipendPaid);

// Internship Outcome: convert to employee / complete / extend.
router.get("/:id/convert-defaults", ...hrOnly, getConvertDefaults);
router.post("/:id/convert", ...hrOnly, convertInternToEmployee);
router.post("/:id/complete", ...hrOnly, completeInternship);
router.post("/:id/extend", ...hrOnly, extendInternship);

export default router;