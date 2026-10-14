import { jsPDF } from "jspdf";

import { formatDate } from "./internUtils";

// The built-in template (public/certificate/vsoft-official.png, 1890 x 1333).
export const BUILT_IN_TEMPLATE = {
  key: "vsoft_official",
  name: "V Soft Official",
  description: "Company certificate, badge & MSME mark",
  url: "/certificate/vsoft-official.png",
};

// Where each value is written on the template. Positions are fractions of the
// image width / height so any uploaded template with the same layout works at
// any resolution. `x` is the centre of the blank, `y` its baseline.
const FIELDS = {
  name: { x: 0.5, y: 0.472, maxWidth: 0.52, size: 0.04, weight: 600 },
  startDate: { x: 0.849, y: 0.5575, maxWidth: 0.125, size: 0.0225 },
  endDate: { x: 0.185, y: 0.5985, maxWidth: 0.125, size: 0.0225 },
  nameInline: { x: 0.562, y: 0.6, maxWidth: 0.125, size: 0.0225 },
  skills: { x: 0.396, y: 0.647, maxWidth: 0.24, size: 0.0225 },
  date: { x: 0.186, y: 0.789, maxWidth: 0.085, size: 0.0225 },
};

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the certificate template."));
    image.src = url;
  });

const loadFonts = async () => {
  try {
    await Promise.all([
      document.fonts.load("600 40px Poppins"),
      document.fonts.load("500 40px Poppins"),
    ]);
  } catch {
    // Falls back to the system font; the certificate still renders.
  }
};

// "UI/UX Design Intern" -> "UI/UX Design" (reads as "skills in UI/UX Design")
const toSkillArea = (role = "") => role.replace(/\s+intern$/i, "").trim() || role;

const drawFitted = (ctx, text, field, width, height) => {
  if (!text) return;

  let size = field.size * height;
  const maxWidth = field.maxWidth * width;
  const weight = field.weight || 500;

  ctx.font = `${weight} ${size}px Poppins, Inter, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 1;
    ctx.font = `${weight} ${size}px Poppins, Inter, sans-serif`;
  }

  ctx.fillText(text, field.x * width, field.y * height);
};

// Draws the certificate onto a canvas: the template image plus the values.
export const renderCertificateCanvas = async ({ templateUrl, certificate }) => {
  const [image] = await Promise.all([
    loadImage(templateUrl || BUILT_IN_TEMPLATE.url),
    loadFonts(),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const { width, height } = canvas;
  const name = certificate.intern_name || "";

  drawFitted(ctx, name, FIELDS.name, width, height);
  drawFitted(ctx, formatDate(certificate.start_date), FIELDS.startDate, width, height);
  drawFitted(ctx, formatDate(certificate.end_date), FIELDS.endDate, width, height);
  drawFitted(ctx, name, FIELDS.nameInline, width, height);
  drawFitted(ctx, toSkillArea(certificate.role), FIELDS.skills, width, height);
  drawFitted(ctx, formatDate(certificate.certificate_date), FIELDS.date, width, height);

  return canvas;
};

export const renderCertificateDataUrl = async (options) => {
  const canvas = await renderCertificateCanvas(options);
  return canvas.toDataURL("image/png");
};

// One landscape page the size of the template (A4 wide), JPEG inside to keep
// the file small enough to email.
export const renderCertificatePdf = async (options) => {
  const canvas = await renderCertificateCanvas(options);

  const pageWidth = 297; // mm
  const pageHeight = (pageWidth * canvas.height) / canvas.width;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageWidth, pageHeight],
    compress: true,
  });

  pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, pageHeight);

  return pdf;
};

export const certificateFileName = (certificate) =>
  `${certificate.certificate_code || "Certificate"}_${String(
    certificate.intern_name || "Intern",
  ).replace(/[^a-z0-9]+/gi, "_")}.pdf`;