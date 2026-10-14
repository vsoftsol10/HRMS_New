import multer from "multer";

const storage = multer.memoryStorage();
const MAX_FILE_SIZE = 8 * 1024 * 1024; // generated PDFs / template images

const buildUploader = (allowedMimeTypes, message) =>
  multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (req, file, cb) =>
      allowedMimeTypes.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error(message), false),
  }).single("file");

const wrap = (uploader) => (req, res, next) =>
  uploader(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File must be 8 MB or smaller." : err.message;
    res.status(400).json({ message });
  });

// POST /certificates/:id/send  -> generated certificate PDF
export const uploadCertificatePdf = wrap(
  buildUploader(["application/pdf"], "Only a PDF can be sent."),
);

// POST /certificates/templates -> custom template background
export const uploadTemplateFile = wrap(
  buildUploader(["image/png", "image/jpeg"], "Template must be a PNG or JPG image."),
);