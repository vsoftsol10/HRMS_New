import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer's memoryStorage gives us a Buffer, not a file path - Cloudinary's
// SDK wants a stream for buffer uploads, so this wraps upload_stream in a
// Promise.
export const uploadImageToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

export default cloudinary;

// ---------------------------------------------------------------------------
// Profile photos
// ---------------------------------------------------------------------------
// One stable public_id per employee, overwritten on every upload, so a
// replaced photo never leaves an orphan behind in Cloudinary. The incoming
// transformation stores a 512x512 face-centred crop rather than the original
// (a 15 MB phone photo becomes a few dozen KB).
export const uploadProfilePhotoToCloudinary = (buffer, employeeId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "hrms/profile-photos",
        public_id: `employee_${employeeId}`,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

export const deleteFromCloudinary = (publicId) =>
  cloudinary.uploader.destroy(publicId, { invalidate: true });