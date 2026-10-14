import crypto from "crypto";

import supabase from "../config/supabase.js";
import { sendCertificateEmail } from "../services/emailService.js";
import {
  blankToNull,
  handleError,
  isValidDate,
  parseId,
} from "../utils/internHelpers.js";

const TEMPLATE_BUCKET = "certificate-templates";
const CERTIFICATE_TYPES = ["Internship Completion Certificate"];
const DEFAULT_ORGANIZATION = "V Soft Solutions";

const CERTIFICATE_SELECT = `
  id,
  certificate_code,
  certificate_type,
  intern_id,
  template_key,
  template_id,
  role,
  department,
  start_date,
  end_date,
  certificate_date,
  authorized_person,
  organization_name,
  status,
  issued_at,
  sent_at,
  sent_to,
  created_at,
  updated_at,
  intern:interns!certificates_intern_id_fkey (
    id,
    intern_code,
    employee:employees!interns_employee_id_fkey (
      first_name,
      personal_email
    )
  )
`;

const shapeCertificate = (row) => {
  const { intern, ...certificate } = row;

  return {
    ...certificate,
    intern_code: intern?.intern_code ?? null,
    intern_name: intern?.employee?.first_name ?? null,
    intern_email: intern?.employee?.personal_email ?? null,
  };
};

// Keeps the bucket available without a manual Supabase setup step.
let bucketReady = false;
const ensureTemplateBucket = async () => {
  if (bucketReady) return;

  const { data } = await supabase.storage.getBucket(TEMPLATE_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(TEMPLATE_BUCKET, {
      public: false,
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  bucketReady = true;
};

const signedTemplateUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .createSignedUrl(filePath, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
};

const validatePayload = (body) => {
  const errors = {};

  const internId = parseId(body.intern_id);
  if (!internId) errors.intern_id = "Select an intern.";

  const role = blankToNull(body.role);
  if (!role) errors.role = "Internship role is required.";

  for (const field of ["start_date", "end_date", "certificate_date"]) {
    if (!isValidDate(body[field])) errors[field] = "Enter a valid date.";
  }

  if (!errors.start_date && !errors.end_date && body.end_date < body.start_date) {
    errors.end_date = "End date cannot be before the start date.";
  }

  const certificateType = blankToNull(body.certificate_type) ?? CERTIFICATE_TYPES[0];
  if (!CERTIFICATE_TYPES.includes(certificateType)) {
    errors.certificate_type = "Unknown certificate type.";
  }

  const templateKey = body.template_key === "custom" ? "custom" : "vsoft_official";
  const templateId = templateKey === "custom" ? parseId(body.template_id) : null;
  if (templateKey === "custom" && !templateId) {
    errors.template_id = "Select a template.";
  }

  return {
    errors,
    values: {
      intern_id: internId,
      certificate_type: certificateType,
      template_key: templateKey,
      template_id: templateId,
      role,
      department: blankToNull(body.department),
      start_date: body.start_date,
      end_date: body.end_date,
      certificate_date: body.certificate_date,
      authorized_person: blankToNull(body.authorized_person),
      organization_name: blankToNull(body.organization_name) ?? DEFAULT_ORGANIZATION,
    },
  };
};

const loadCertificate = async (id) => {
  const { data, error } = await supabase
    .from("certificates")
    .select(CERTIFICATE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? shapeCertificate(data) : null;
};

// GET /api/certificates/meta - defaults for the details step
export const getCertificateMeta = async (req, res) => {
  try {
    const [{ data: settings }, { data: me }] = await Promise.all([
      supabase.from("company_settings").select("company_name").limit(1).maybeSingle(),
      supabase
        .from("employees")
        .select("first_name, designation")
        .eq("id", req.user.employee_id)
        .maybeSingle(),
    ]);

    const authorizedPerson = me
      ? [me.first_name, me.designation].filter(Boolean).join(", ")
      : "";

    res.json({
      organization_name: settings?.company_name || DEFAULT_ORGANIZATION,
      authorized_person: authorizedPerson,
      certificate_types: CERTIFICATE_TYPES,
    });
  } catch (err) {
    handleError(res, err, "getCertificateMeta");
  }
};

// GET /api/certificates
export const getCertificates = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select(CERTIFICATE_SELECT)
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data.map(shapeCertificate));
  } catch (err) {
    handleError(res, err, "getCertificates");
  }
};

// GET /api/certificates/:id
export const getCertificateById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid certificate id." });

    const certificate = await loadCertificate(id);
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found." });
    }

    if (certificate.template_key === "custom" && certificate.template_id) {
      const { data: template } = await supabase
        .from("certificate_templates")
        .select("file_path")
        .eq("id", certificate.template_id)
        .maybeSingle();

      if (template) {
        certificate.template_url = await signedTemplateUrl(template.file_path);
      }
    }

    res.json(certificate);
  } catch (err) {
    handleError(res, err, "getCertificateById");
  }
};

// POST /api/certificates - saves a Draft when the wizard reaches the preview
export const createCertificate = async (req, res) => {
  try {
    const { errors, values } = validatePayload(req.body);

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    const { data: created, error } = await supabase
      .from("certificates")
      .insert({
        ...values,
        certificate_code: `TMP-${crypto.randomUUID()}`,
        status: "Draft",
        created_by_employee_id: req.user.employee_id ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const { error: codeError } = await supabase
      .from("certificates")
      .update({ certificate_code: `CERT-${1000 + created.id}` })
      .eq("id", created.id);

    if (codeError) throw codeError;

    res.status(201).json(await loadCertificate(created.id));
  } catch (err) {
    handleError(res, err, "createCertificate");
  }
};

// PUT /api/certificates/:id - only a Draft can still be edited
export const updateCertificate = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid certificate id." });

    const existing = await loadCertificate(id);
    if (!existing) return res.status(404).json({ message: "Certificate not found." });

    if (existing.status !== "Draft") {
      return res
        .status(409)
        .json({ message: "Only a draft certificate can be edited." });
    }

    const { errors, values } = validatePayload(req.body);

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    const { error } = await supabase
      .from("certificates")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    res.json(await loadCertificate(id));
  } catch (err) {
    handleError(res, err, "updateCertificate");
  }
};

// POST /api/certificates/:id/issue - the PDF was downloaded
export const markCertificateIssued = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid certificate id." });

    const existing = await loadCertificate(id);
    if (!existing) return res.status(404).json({ message: "Certificate not found." });

    // Sent stays Sent: it already implies the certificate was issued.
    if (existing.status === "Draft") {
      const { error } = await supabase
        .from("certificates")
        .update({ status: "Issued", issued_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    }

    res.json(await loadCertificate(id));
  } catch (err) {
    handleError(res, err, "markCertificateIssued");
  }
};

// POST /api/certificates/:id/send  (multipart: file = certificate PDF)
export const sendCertificate = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid certificate id." });

    if (!req.file) {
      return res.status(400).json({ message: "Certificate PDF is required." });
    }

    const certificate = await loadCertificate(id);
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found." });
    }

    if (!certificate.intern_email) {
      return res.status(400).json({
        message: "This intern has no email address on file.",
      });
    }

    const safeName = String(certificate.intern_name || "Intern").replace(
      /[^a-z0-9]+/gi,
      "_",
    );

    const result = await sendCertificateEmail({
      toEmail: certificate.intern_email,
      internName: certificate.intern_name,
      certificateType: certificate.certificate_type,
      organizationName: certificate.organization_name || DEFAULT_ORGANIZATION,
      fileName: `${certificate.certificate_code}_${safeName}.pdf`,
      pdfBase64: req.file.buffer.toString("base64"),
    });

    if (!result.sent) {
      return res.status(502).json({
        message: `Unable to send the email. ${result.reason || ""}`.trim(),
      });
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("certificates")
      .update({
        status: "Sent",
        sent_at: now,
        sent_to: certificate.intern_email,
        issued_at: certificate.issued_at ?? now,
      })
      .eq("id", id);

    if (error) throw error;

    res.json(await loadCertificate(id));
  } catch (err) {
    handleError(res, err, "sendCertificate");
  }
};

// DELETE /api/certificates/:id - drafts only
export const deleteCertificate = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid certificate id." });

    const existing = await loadCertificate(id);
    if (!existing) return res.status(404).json({ message: "Certificate not found." });

    if (existing.status !== "Draft") {
      return res
        .status(409)
        .json({ message: "Only a draft certificate can be deleted." });
    }

    const { error } = await supabase.from("certificates").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Certificate deleted." });
  } catch (err) {
    handleError(res, err, "deleteCertificate");
  }
};

// GET /api/certificates/templates - uploaded templates with a signed URL
export const getTemplates = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("id, name, file_path, mime_type, created_at")
      .order("id", { ascending: false });

    if (error) throw error;

    const templates = await Promise.all(
      data.map(async ({ file_path, ...template }) => ({
        ...template,
        url: await signedTemplateUrl(file_path),
      })),
    );

    res.json(templates);
  } catch (err) {
    handleError(res, err, "getTemplates");
  }
};

// POST /api/certificates/templates  (multipart: file, name)
export const uploadTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Select a PNG or JPG template." });
    }

    await ensureTemplateBucket();

    const extension = req.file.mimetype === "image/png" ? ".png" : ".jpg";
    const filePath = `${crypto.randomUUID()}${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(TEMPLATE_BUCKET)
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const name =
      blankToNull(req.body.name) ||
      req.file.originalname.replace(/\.[^.]+$/, "") ||
      "Custom template";

    const { data, error } = await supabase
      .from("certificate_templates")
      .insert({
        name,
        file_path: filePath,
        mime_type: req.file.mimetype,
        created_by_employee_id: req.user.employee_id ?? null,
      })
      .select("id, name, mime_type, created_at")
      .single();

    if (error) {
      await supabase.storage.from(TEMPLATE_BUCKET).remove([filePath]);
      throw error;
    }

    res.status(201).json({ ...data, url: await signedTemplateUrl(filePath) });
  } catch (err) {
    handleError(res, err, "uploadTemplate");
  }
};

// PUT /api/certificates/templates/:id  (body: name) - rename an uploaded template
export const updateTemplate = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid template id." });

    const name = blankToNull(req.body.name);
    if (!name) {
      return res.status(400).json({ message: "Template name is required." });
    }
    if (name.length > 80) {
      return res
        .status(400)
        .json({ message: "Template name must be 80 characters or fewer." });
    }

    const { data, error } = await supabase
      .from("certificate_templates")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, file_path, mime_type, created_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Template not found." });

    const { file_path, ...template } = data;
    res.json({ ...template, url: await signedTemplateUrl(file_path) });
  } catch (err) {
    handleError(res, err, "updateTemplate");
  }
};

// DELETE /api/certificates/templates/:id - removes the row and its stored image.
// Certificates already issued keep working: certificates.template_id is SET NULL.
export const deleteTemplate = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid template id." });

    const { data: template, error: findError } = await supabase
      .from("certificate_templates")
      .select("id, file_path")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;
    if (!template) return res.status(404).json({ message: "Template not found." });

    const { error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Best effort - the row is already gone, so a storage hiccup must not fail the request.
    await supabase.storage.from(TEMPLATE_BUCKET).remove([template.file_path]);

    res.json({ message: "Template deleted." });
  } catch (err) {
    handleError(res, err, "deleteTemplate");
  }
};