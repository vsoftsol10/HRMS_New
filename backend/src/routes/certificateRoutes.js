import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  uploadCertificatePdf,
  uploadTemplateFile,
} from "../middleware/certificateUploadMiddleware.js";
import {
  getCertificateMeta,
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  markCertificateIssued,
  sendCertificate,
  deleteCertificate,
  getTemplates,
  uploadTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controller/certificateController.js";

const router = express.Router();

const hrOnly = [authMiddleware, roleMiddleware("Admin", "HR")];

// Fixed paths first so "meta" / "templates" are never read as an :id
router.get("/meta", ...hrOnly, getCertificateMeta);
router.get("/templates", ...hrOnly, getTemplates);
router.post("/templates", ...hrOnly, uploadTemplateFile, uploadTemplate);
router.put("/templates/:id", ...hrOnly, updateTemplate);
router.delete("/templates/:id", ...hrOnly, deleteTemplate);

router.get("/", ...hrOnly, getCertificates);
router.post("/", ...hrOnly, createCertificate);

router.get("/:id", ...hrOnly, getCertificateById);
router.put("/:id", ...hrOnly, updateCertificate);
router.delete("/:id", ...hrOnly, deleteCertificate);

router.post("/:id/issue", ...hrOnly, markCertificateIssued);
router.post("/:id/send", ...hrOnly, uploadCertificatePdf, sendCertificate);

export default router;