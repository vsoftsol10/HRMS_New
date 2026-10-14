import multer from "multer";

// Memory storage: files are streamed straight to the private Supabase
// "intern-documents" bucket by the controller, never written to disk.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword", // .doc (resumes)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, same as the design ("Max 5MB each")
export const MAX_FILES_PER_UPLOAD = 10;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error("Only PDF, JPG, PNG, WEBP, DOC or DOCX files are allowed."),
      false,
    );
  }
  cb(null, true);
};

const buildUploader = () =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES_PER_UPLOAD },
  });

const friendlyMessage = (err) => {
  if (err.code === "LIMIT_FILE_SIZE") return "Each file must be 5 MB or smaller.";
  if (err.code === "LIMIT_FILE_COUNT") {
    return `You can upload at most ${MAX_FILES_PER_UPLOAD} files at a time.`;
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") return "Unexpected file field.";
  return err.message;
};

// Wrapped so multer errors come back as normal JSON like the rest of this
// API (there is no global error handler in server.js).
const wrap = (handler) => (req, res, next) => {
  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: friendlyMessage(err) });
    }
    next();
  });
};

// Add Intern form: several files in one request, field name "documents".
export const uploadInternDocuments = wrap(
  buildUploader().array("documents", MAX_FILES_PER_UPLOAD),
);

// Intern detail -> Documents tab: one file at a time, field name "document".
export const uploadInternDocument = wrap(buildUploader().single("document"));

// Intern portal -> Tasks -> Submit Task: one file, field name "file".
export const uploadTaskSubmission = wrap(buildUploader().single("file"));