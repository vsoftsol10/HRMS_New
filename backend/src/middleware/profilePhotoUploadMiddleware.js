import multer from "multer";

const MAX_PHOTO_MB = 10;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG or WEBP images are allowed."), false);
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_PHOTO_MB * 1024 * 1024 },
}).single("photo");

// Wrapped so multer errors come back as JSON like the rest of this API.
export const uploadProfilePhoto = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `Image is too large. Maximum size is ${MAX_PHOTO_MB} MB.`
          : err.message;
      return res.status(400).json({ message });
    }
    next();
  });
};