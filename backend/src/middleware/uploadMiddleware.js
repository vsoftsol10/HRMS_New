import multer from "multer";

// Memory storage: the file buffer is forwarded straight to Supabase
// Storage in the controller, never written to local disk.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, PNG, WEBP, or PDF files are allowed."),
      false,
    );
  }
  cb(null, true);
};

const singleUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("attachment");

// Wrapped so multer errors (wrong file type, file too large) come back
// as a normal JSON error response like the rest of this API, instead of
// Express's default HTML error page (there's no global error handler
// middleware in server.js to catch this otherwise).
export const uploadLeaveAttachment = (req, res, next) => {
  singleUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};