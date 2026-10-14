// emailService.js
// Sends transactional emails via Brevo's HTTP API (no SMTP, just a plain
// fetch call - Brevo's REST endpoint doesn't need an extra npm package).

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// FIX: kept as a function (not top-level) so it reads process.env at call
// time - dotenv.config() runs in server.js before any request comes in,
// but evaluating this at import time in the wrong load order would freeze
// in an empty string.
const getSenderConfig = () => ({
  name: process.env.BREVO_SENDER_NAME || "VsoftSolution",
  email: process.env.BREVO_SENDER_EMAIL,
});

const buildWelcomeEmailHtml = ({ employeeName, employeeCode, password, loginUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #d97706; margin-bottom: 4px;">Welcome aboard, ${employeeName}! 👋</h2>
    <p>Your HRMS account has been created. Here are your login details:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fffbeb; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #fde68a;">Employee Code</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #fde68a;">${employeeCode}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-weight: bold;">Password</td>
        <td style="padding: 12px 16px;">${password}</td>
      </tr>
    </table>

    <p style="margin: 24px 0;">
      <a href="${loginUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Go to Login Page
      </a>
    </p>

    <p style="font-size: 13px; color: #6b7280;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${loginUrl}" style="color: #d97706;">${loginUrl}</a>
    </p>

    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      For security, please change your password after your first login.
    </p>
  </div>
`;

const buildPasswordResetEmailHtml = ({ employeeName, resetUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #d97706; margin-bottom: 4px;">Password Reset Request</h2>
    <p>Hi ${employeeName}, we received a request to reset your HRMS password.</p>

    <p style="margin: 24px 0;">
      <a href="${resetUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </p>

    <p style="font-size: 13px; color: #6b7280;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: #d97706;">${resetUrl}</a>
    </p>

    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email - your password will not be changed.
    </p>
  </div>
`;

// Sends the "reset your password" email. Never throws - same non-blocking
// contract as sendWelcomeEmail, but the caller (forgotPassword) also
// deliberately returns a generic success message to the client regardless
// of whether the email actually sent, to avoid leaking which employee
// codes exist in the system.
export const sendPasswordResetEmail = async ({
  toEmail,
  employeeName,
  resetUrl,
}) => {
  if (!toEmail) {
    console.warn("sendPasswordResetEmail skipped: no personal_email on file");
    return { sent: false, reason: "No email address on file" };
  }

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error(
      "sendPasswordResetEmail skipped: BREVO_API_KEY / BREVO_SENDER_EMAIL not configured in .env",
    );
    return { sent: false, reason: "Email service not configured" };
  }

  const payload = {
    sender: getSenderConfig(),
    to: [{ email: toEmail, name: employeeName || "there" }],
    subject: "Reset your VsoftSolution HRMS password",
    htmlContent: buildPasswordResetEmailHtml({
      employeeName: employeeName || "there",
      resetUrl,
    }),
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
    }

    return { sent: true };
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err.message);
    return { sent: false, reason: err.message };
  }
};

const buildAnnouncementEmailHtml = ({ employeeName, title, description, postedByName, portalUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #d97706; margin-bottom: 4px;">📢 ${title}</h2>
    <p style="color: #6b7280; font-size: 13px; margin-top: 0;">Posted by ${postedByName || "HR"}</p>

    <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin: 20px 0; white-space: pre-wrap; line-height: 1.6;">
      ${description}
    </div>

    <p style="margin: 24px 0;">
      <a href="${portalUrl}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        View in HRMS
      </a>
    </p>

    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      Hi ${employeeName}, you're receiving this because a new announcement was published on your HRMS dashboard.
    </p>
  </div>
`;

// Sends a "new announcement" email to one employee. Same non-blocking
// contract as sendWelcomeEmail/sendPasswordResetEmail - never throws, so
// a bad email address or a Brevo outage can't take down announcement
// creation. Callers should send these in parallel (Promise.allSettled)
// across the target employee list rather than one-by-one.
export const sendAnnouncementEmail = async ({
  toEmail,
  employeeName,
  title,
  description,
  postedByName,
}) => {
  if (!toEmail) {
    return { sent: false, reason: "No email address on file" };
  }

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error(
      "sendAnnouncementEmail skipped: BREVO_API_KEY / BREVO_SENDER_EMAIL not configured in .env",
    );
    return { sent: false, reason: "Email service not configured" };
  }

  const portalUrl = process.env.FRONTEND_LOGIN_URL || "http://localhost:5173";

  const payload = {
    sender: getSenderConfig(),
    to: [{ email: toEmail, name: employeeName || "there" }],
    subject: `📢 New Announcement: ${title}`,
    htmlContent: buildAnnouncementEmailHtml({
      employeeName: employeeName || "there",
      title,
      description,
      postedByName,
      portalUrl,
    }),
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
    }

    return { sent: true };
  } catch (err) {
    console.error(`sendAnnouncementEmail failed for ${toEmail}:`, err.message);
    return { sent: false, reason: err.message };
  }
};

// Sends the "here are your login credentials" email to a newly created
// employee. Never throws - a failed email should not roll back employee
// creation, so callers get back a { sent, reason } result instead.
export const sendWelcomeEmail = async ({
  toEmail,
  employeeName,
  employeeCode,
  password,
}) => {
  if (!toEmail) {
    console.warn(
      `sendWelcomeEmail skipped for ${employeeCode}: no personal_email on file`,
    );
    return { sent: false, reason: "No email address on file" };
  }

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error(
      "sendWelcomeEmail skipped: BREVO_API_KEY / BREVO_SENDER_EMAIL not configured in .env",
    );
    return { sent: false, reason: "Email service not configured" };
  }

  const loginUrl = process.env.FRONTEND_LOGIN_URL || "http://localhost:5173";

  const payload = {
    sender: getSenderConfig(),
    to: [{ email: toEmail, name: employeeName || employeeCode }],
    subject: "Welcome to VsoftSolution HRMS - Your Login Details",
    htmlContent: buildWelcomeEmailHtml({
      employeeName: employeeName || "there",
      employeeCode,
      password,
      loginUrl,
    }),
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
    }

    return { sent: true };
  } catch (err) {
    console.error(`sendWelcomeEmail failed for ${employeeCode}:`, err.message);
    return { sent: false, reason: err.message };
  }
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const buildCertificateEmailHtml = ({ internName, certificateType, organizationName }) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #d97706; margin-bottom: 4px;">Congratulations, ${escapeHtml(internName)}! 🎉</h2>
    <p>
      We are pleased to share your <strong>${escapeHtml(certificateType)}</strong>
      from ${escapeHtml(organizationName)}. You will find it attached to this email as a PDF.
    </p>
    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      We wish you the best of luck in your future endeavours.
    </p>
  </div>
`;

// Sends the generated certificate PDF as an attachment (Brevo takes base64).
export const sendCertificateEmail = async ({
  toEmail,
  internName,
  certificateType,
  organizationName,
  fileName,
  pdfBase64,
}) => {
  if (!toEmail) {
    return { sent: false, reason: "The intern has no email address on file." };
  }

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error(
      "sendCertificateEmail skipped: BREVO_API_KEY / BREVO_SENDER_EMAIL not configured in .env",
    );
    return { sent: false, reason: "Email service not configured" };
  }

  const payload = {
    sender: getSenderConfig(),
    to: [{ email: toEmail, name: internName || "there" }],
    subject: `Your ${certificateType} - ${organizationName}`,
    htmlContent: buildCertificateEmailHtml({
      internName: internName || "there",
      certificateType,
      organizationName,
    }),
    attachment: [{ name: fileName, content: pdfBase64 }],
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
    }

    return { sent: true };
  } catch (err) {
    console.error("sendCertificateEmail failed:", err.message);
    return { sent: false, reason: err.message };
  }
};