// Small display helpers shared by the Interns pages.

// "2026-06-20" -> "20 Jun 2026". Parsed as a LOCAL date on purpose:
// new Date("2026-06-20") is UTC midnight and can render as the previous
// day in timezones behind UTC.
export const formatDate = (value) => {
  if (!value) return "-";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// "2026-09-15" -> "15 Sep" (used for compact date ranges)
export const formatShortDate = (value) => {
  if (!value) return "-";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export const formatStipend = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  return `₹${Number(value).toLocaleString("en-IN")}/mo`;
};

export const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
    .toUpperCase();
};

// days_left comes from the backend (negative once the end date has passed).
export const daysLeftLabel = (days) => {
  if (days === null || days === undefined) return "";

  if (days > 1) return `${days} days left`;
  if (days === 1) return "1 day left";
  if (days === 0) return "Ends today";
  if (days === -1) return "Ended 1 day ago";

  return `Ended ${Math.abs(days)} days ago`;
};

export const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "10th Certificate",
  "12th Certificate",
  "Degree / College Certificate",
  "Resume",
  "Other Documents",
];

// Keep in step with backend/src/middleware/internUploadMiddleware.js
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_UPLOAD = 10;
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Returns an error message, or "" when the file is fine.
export const validateDocumentFile = (file) => {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return `${file.name}: only PDF, JPG, PNG, WEBP, DOC or DOCX files are allowed.`;
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    return `${file.name}: each file must be 5 MB or smaller.`;
  }

  return "";
};