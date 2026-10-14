import crypto from "crypto";
import path from "path";
import bcrypt from "bcrypt";

import supabase from "../config/supabase.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { getToday } from "../utils/dateUtils.js";
import {
  INTERN_SELECT,
  blankToNull,
  handleError,
  isValidDate,
  parseId,
  shapeIntern,
} from "../utils/internHelpers.js";
import { buildStipendSchedule } from "./internPortalController.js";

const BUCKET = "intern-documents";

const OTHER_DOCUMENTS = "Other Documents";
const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "10th Certificate",
  "12th Certificate",
  "Degree / College Certificate",
  "Resume",
  OTHER_DOCUMENTS,
];

const GENDERS = ["Male", "Female", "Other"];
const INTERNSHIP_TYPES = ["Full-Time", "Part-Time"];
// Only these two can be set from the form. Completed / Converted are set by
// the "Internship Outcome" actions (a later phase).
const FORM_STATUSES = ["Active", "Inactive"];

/* ------------------------------------------------------------------ */
/* small helpers (shared ones live in utils/internHelpers.js)           */
/* ------------------------------------------------------------------ */

const nextNumber = (rows, column, regex) => {
  let max = 0;

  for (const row of rows) {
    const match = regex.exec(row[column] || "");
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }

  return max + 1;
};

// Login ID = employees.employee_code, e.g. VSINT01, VSINT02 ...
const generateLoginId = async () => {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_code")
    .ilike("employee_code", "VSINT%");

  if (error) throw error;

  const next = nextNumber(data, "employee_code", /^VSINT(\d+)$/i);

  return `VSINT${String(next).padStart(2, "0")}`;
};

// Intern ID = interns.intern_code, e.g. INT-2026-001 (counter restarts each year)
const generateInternCode = async () => {
  const year = new Date().getFullYear();

  const { data, error } = await supabase
    .from("interns")
    .select("intern_code")
    .like("intern_code", `INT-${year}-%`);

  if (error) throw error;

  const next = nextNumber(data, "intern_code", /^INT-\d{4}-(\d+)$/);

  return `INT-${year}-${String(next).padStart(3, "0")}`;
};

// Random 10-char password (no look-alike characters) - one upper, one
// lower, one digit guaranteed. Emailed to the intern, never derived from
// personal data.
const generateTempPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const pick = (chars) => chars[crypto.randomInt(chars.length)];

  const chars = [pick(upper), pick(lower), pick(digits)];
  while (chars.length < 10) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};

// multer hands file names over as latin1; recover UTF-8 names when that
// round-trip is lossless, otherwise keep the name as it came in.
const fixFileName = (name) => {
  const converted = Buffer.from(name, "latin1").toString("utf8");
  return converted.includes("\uFFFD") ? name : converted;
};

/* ------------------------------------------------------------------ */
/* validation                                                          */
/* ------------------------------------------------------------------ */

const validateInternPayload = (body) => {
  const errors = {};
  const v = {};

  v.full_name = blankToNull(body.full_name);
  if (!v.full_name) {
    errors.full_name = "Full name is required.";
  } else if (!/^[A-Za-z][A-Za-z .'-]{1,99}$/.test(v.full_name)) {
    errors.full_name = "Enter a valid full name.";
  }

  v.gender = blankToNull(body.gender);
  if (!GENDERS.includes(v.gender)) errors.gender = "Select a gender.";

  v.date_of_birth = blankToNull(body.date_of_birth);
  if (!isValidDate(v.date_of_birth)) {
    errors.date_of_birth = "Enter a valid date of birth.";
  } else if (v.date_of_birth > getToday() || v.date_of_birth < "1940-01-01") {
    errors.date_of_birth = "Date of birth is not valid.";
  }

  v.phone = blankToNull(body.phone);
  if (!/^\d{10}$/.test(v.phone || "")) {
    errors.phone = "Enter a valid 10-digit phone number.";
  }

  v.email = blankToNull(body.email)?.toLowerCase() ?? null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email || "")) {
    errors.email = "Enter a valid email address.";
  }

  v.address = blankToNull(body.address);

  v.department_id = parseId(body.department_id);
  if (!v.department_id) errors.department_id = "Select a department.";

  v.designation = blankToNull(body.designation);
  if (!v.designation) errors.designation = "Designation / track is required.";

  v.internship_type = blankToNull(body.internship_type);
  if (!INTERNSHIP_TYPES.includes(v.internship_type)) {
    errors.internship_type = "Select an internship type.";
  }

  const fee = blankToNull(body.internship_fee);
  v.internship_fee = fee === null ? null : Number(fee);
  if (v.internship_fee !== null && !(v.internship_fee >= 0)) {
    errors.internship_fee = "Internship fee must be 0 or more.";
  }

  v.start_date = blankToNull(body.start_date);
  if (!isValidDate(v.start_date)) errors.start_date = "Enter a valid joining date.";

  v.end_date = blankToNull(body.end_date);
  if (!isValidDate(v.end_date)) {
    errors.end_date = "Enter a valid end date.";
  } else if (isValidDate(v.start_date) && v.end_date < v.start_date) {
    errors.end_date = "End date cannot be before the joining date.";
  }

  const stipend = blankToNull(body.monthly_stipend);
  v.monthly_stipend = stipend === null ? NaN : Number(stipend);
  if (!(v.monthly_stipend >= 0)) {
    errors.monthly_stipend = "Enter the monthly stipend (0 or more).";
  }

  const mentor = blankToNull(body.mentor_employee_id);
  v.mentor_employee_id = mentor === null ? null : parseId(mentor);
  if (mentor !== null && !v.mentor_employee_id) {
    errors.mentor_employee_id = "Select a valid mentor.";
  }

  const status = blankToNull(body.status);
  v.status = status === null ? null : status;
  if (v.status !== null && !FORM_STATUSES.includes(v.status)) {
    errors.status = "Status must be Active or Inactive.";
  }

  return { errors, values: v };
};

// A mentor must be an existing, non-intern employee that is still working.
const mentorIsValid = async (mentorId) => {
  const { data, error } = await supabase
    .from("employees")
    .select("id, role, status")
    .eq("id", mentorId)
    .maybeSingle();

  if (error) throw error;

  return (
    !!data && data.role !== "Intern" && ["Active", "On Leave"].includes(data.status)
  );
};

/* ------------------------------------------------------------------ */
/* documents (private Supabase Storage bucket)                         */
/* ------------------------------------------------------------------ */

const storeDocument = async ({ internId, file, docType }) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const safeExtension = /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : "";
  const storagePath = `${internId}/${crypto.randomUUID()}${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from("intern_documents")
    .insert({
      intern_id: internId,
      doc_type: docType,
      file_name: fixFileName(file.originalname || "document"),
      file_path: storagePath,
      mime_type: file.mimetype,
      file_size: file.size,
      updated_at: new Date().toISOString(),
    })
    .select("id, doc_type, file_name, mime_type, file_size, created_at")
    .single();

  if (insertError) {
    // Don't leave an orphaned file behind if the row could not be saved.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw insertError;
  }

  return data;
};

const removeDocuments = async (documents) => {
  if (!documents.length) return;

  await supabase.storage.from(BUCKET).remove(documents.map((d) => d.file_path));

  await supabase
    .from("intern_documents")
    .delete()
    .in(
      "id",
      documents.map((d) => d.id),
    );
};

const findIntern = async (id) => {
  const { data, error } = await supabase
    .from("interns")
    .select(
      "id, employee_id, mentor_employee_id, status, employee:employees!interns_employee_id_fkey ( status )",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

/* ------------------------------------------------------------------ */
/* handlers                                                            */
/* ------------------------------------------------------------------ */

// GET /api/interns/next-codes  -> what the Add Intern form pre-fills
export const getNextInternCodes = async (req, res) => {
  try {
    const [loginId, internCode] = await Promise.all([
      generateLoginId(),
      generateInternCode(),
    ]);

    res.json({ login_id: loginId, intern_code: internCode });
  } catch (err) {
    handleError(res, err, "getNextInternCodes");
  }
};

// GET /api/interns
export const getInterns = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("interns")
      .select(INTERN_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data.map(shapeIntern));
  } catch (err) {
    handleError(res, err, "getInterns");
  }
};

// GET /api/interns/:id
export const getInternById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const { data, error } = await supabase
      .from("interns")
      .select(INTERN_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Intern not found." });

    const { data: documents, error: documentsError } = await supabase
      .from("intern_documents")
      .select("id, doc_type, file_name, mime_type, file_size, created_at")
      .eq("intern_id", id)
      .order("created_at", { ascending: true });

    if (documentsError) throw documentsError;

    res.json({ ...shapeIntern(data), documents });
  } catch (err) {
    handleError(res, err, "getInternById");
  }
};

// POST /api/interns   (multipart/form-data: fields + optional "documents" files)
export const createIntern = async (req, res) => {
  let createdEmployeeId = null;

  try {
    const { errors, values } = validateInternPayload(req.body);

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    if (values.mentor_employee_id && !(await mentorIsValid(values.mentor_employee_id))) {
      return res.status(400).json({
        message: "The selected mentor must be an active employee.",
        errors: { mentor_employee_id: "Select an active employee." },
      });
    }

    // Optional documents sent with the form. document_types is a JSON array
    // aligned with the files (same order).
    const files = req.files || [];
    let documentTypes = [];

    try {
      documentTypes = JSON.parse(req.body.document_types || "[]");
    } catch {
      return res.status(400).json({ message: "Invalid document types." });
    }

    const fileDocTypes = files.map((_, index) =>
      DOCUMENT_TYPES.includes(documentTypes[index])
        ? documentTypes[index]
        : OTHER_DOCUMENTS,
    );

    const temporaryPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const accountStatus = values.status === "Inactive" ? "Inactive" : "Active";

    // Codes are generated from the current max, so two HR users saving at
    // the same moment could collide on the unique constraints - retry with
    // freshly generated codes a couple of times before giving up.
    let employee = null;
    let intern = null;

    for (let attempt = 0; attempt < 3 && !intern; attempt++) {
      const loginId = await generateLoginId();
      const internCode = await generateInternCode();
      const now = new Date().toISOString();

      const { data: employeeRow, error: employeeError } = await supabase
        .from("employees")
        .insert({
          employee_code: loginId,
          first_name: values.full_name,
          gender: values.gender,
          date_of_birth: values.date_of_birth,
          phone: values.phone,
          personal_email: values.email,
          address: values.address,
          department_id: values.department_id,
          designation: values.designation,
          joining_date: values.start_date,
          employment_type: "Intern",
          role: "Intern",
          status: accountStatus,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (employeeError) {
        if (employeeError.code === "23505" && attempt < 2) continue;
        throw employeeError;
      }

      createdEmployeeId = employeeRow.id;

      const { error: userError } = await supabase.from("users").insert({
        employee_id: employeeRow.id,
        employee_code: employeeRow.employee_code,
        password: hashedPassword,
        role: "Intern",
      });

      if (userError) throw userError;

      const { data: internRow, error: internError } = await supabase
        .from("interns")
        .insert({
          employee_id: employeeRow.id,
          intern_code: internCode,
          mentor_employee_id: values.mentor_employee_id,
          internship_type: values.internship_type,
          internship_fee: values.internship_fee,
          monthly_stipend: values.monthly_stipend,
          start_date: values.start_date,
          end_date: values.end_date,
          status: accountStatus,
          updated_at: now,
        })
        .select("id, intern_code")
        .single();

      if (internError) {
        if (internError.code === "23505" && attempt < 2) {
          // intern_code collision: drop the half-created employee and retry.
          await supabase.from("employees").delete().eq("id", employeeRow.id);
          createdEmployeeId = null;
          continue;
        }
        throw internError;
      }

      employee = employeeRow;
      intern = internRow;
    }

    // Documents are best-effort: the intern already exists, so a failed
    // upload is reported instead of undoing the whole creation.
    const documentErrors = [];

    for (let index = 0; index < files.length; index++) {
      try {
        await storeDocument({
          internId: intern.id,
          file: files[index],
          docType: fileDocTypes[index],
        });
      } catch (uploadError) {
        console.error("[interns] document upload failed:", uploadError);
        documentErrors.push(fixFileName(files[index].originalname || "file"));
      }
    }

    // Login credentials by email (non-blocking, same contract as employees).
    const emailResult = await sendWelcomeEmail({
      toEmail: values.email,
      employeeName: values.full_name,
      employeeCode: employee.employee_code,
      password: temporaryPassword,
    });

    res.status(201).json({
      id: intern.id,
      intern_code: intern.intern_code,
      login_id: employee.employee_code,
      emailSent: emailResult.sent,
      // The password is only ever returned when the email could not be
      // delivered, so HR can hand it over securely. Otherwise it never
      // leaves the server.
      ...(emailResult.sent
        ? {}
        : { emailError: emailResult.reason, temporaryPassword }),
      ...(documentErrors.length ? { documentErrors } : {}),
    });
  } catch (err) {
    // Deleting the employee cascades to users + interns.
    if (createdEmployeeId) {
      await supabase.from("employees").delete().eq("id", createdEmployeeId);
    }

    handleError(res, err, "createIntern");
  }
};

// PUT /api/interns/:id
export const updateIntern = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const existing = await findIntern(id);
    if (!existing) return res.status(404).json({ message: "Intern not found." });

    if (existing.status === "Converted") {
      return res.status(400).json({
        message:
          "This intern has been converted to an employee. Edit them from Employees instead.",
      });
    }

    const { errors, values } = validateInternPayload(req.body);

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    if (values.mentor_employee_id && !(await mentorIsValid(values.mentor_employee_id))) {
      return res.status(400).json({
        message: "The selected mentor must be an active employee.",
        errors: { mentor_employee_id: "Select an active employee." },
      });
    }

    // Completed interns keep their status; Active <-> Inactive can be
    // toggled from the form.
    const canChangeStatus = ["Active", "Inactive"].includes(existing.status);
    const nextStatus = canChangeStatus && values.status ? values.status : existing.status;

    const now = new Date().toISOString();

    const employeeUpdate = {
      first_name: values.full_name,
      gender: values.gender,
      date_of_birth: values.date_of_birth,
      phone: values.phone,
      personal_email: values.email,
      address: values.address,
      department_id: values.department_id,
      designation: values.designation,
      joining_date: values.start_date,
      updated_at: now,
    };

    // Keep the login in step with the intern status: Inactive blocks login.
    if (canChangeStatus && nextStatus !== existing.status) {
      employeeUpdate.status = nextStatus === "Inactive" ? "Inactive" : "Active";
    }

    const { error: employeeError } = await supabase
      .from("employees")
      .update(employeeUpdate)
      .eq("id", existing.employee_id);

    if (employeeError) throw employeeError;

    const { error: internError } = await supabase
      .from("interns")
      .update({
        mentor_employee_id: values.mentor_employee_id,
        internship_type: values.internship_type,
        internship_fee: values.internship_fee,
        monthly_stipend: values.monthly_stipend,
        start_date: values.start_date,
        end_date: values.end_date,
        status: nextStatus,
        updated_at: now,
      })
      .eq("id", id);

    if (internError) throw internError;

    res.json({ message: "Intern updated successfully.", id });
  } catch (err) {
    handleError(res, err, "updateIntern");
  }
};

// DELETE /api/interns/:id   (soft delete - the login is blocked, records stay)
export const deleteIntern = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const existing = await findIntern(id);
    if (!existing) return res.status(404).json({ message: "Intern not found." });

    if (existing.status !== "Active") {
      return res.status(400).json({
        message:
          existing.status === "Inactive"
            ? "This intern has already been removed."
            : `A ${existing.status.toLowerCase()} internship cannot be removed. Its records are preserved.`,
      });
    }

    const now = new Date().toISOString();

    const { error: employeeError } = await supabase
      .from("employees")
      .update({ status: "Inactive", updated_at: now })
      .eq("id", existing.employee_id);

    if (employeeError) throw employeeError;

    const { error: internError } = await supabase
      .from("interns")
      .update({ status: "Inactive", updated_at: now })
      .eq("id", id);

    if (internError) throw internError;

    res.json({ message: "Intern removed successfully." });
  } catch (err) {
    handleError(res, err, "deleteIntern");
  }
};

// POST /api/interns/:id/documents   (multipart: "document" file + doc_type)
export const uploadDocument = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const docType = blankToNull(req.body.doc_type);

    if (!DOCUMENT_TYPES.includes(docType)) {
      return res.status(400).json({ message: "Select a valid document type." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Choose a file to upload." });
    }

    const existing = await findIntern(id);
    if (!existing) return res.status(404).json({ message: "Intern not found." });

    // Every type except "Other Documents" holds a single file: a new upload
    // replaces the old one - but only after the new file is safely stored.
    let previous = [];

    if (docType !== OTHER_DOCUMENTS) {
      const { data, error } = await supabase
        .from("intern_documents")
        .select("id, file_path")
        .eq("intern_id", id)
        .eq("doc_type", docType);

      if (error) throw error;
      previous = data;
    }

    const document = await storeDocument({
      internId: id,
      file: req.file,
      docType,
    });

    await removeDocuments(previous);

    res.status(201).json(document);
  } catch (err) {
    handleError(res, err, "uploadDocument");
  }
};

// GET /api/interns/:id/documents/:docId/url[?download=1]
export const getDocumentUrl = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const docId = parseId(req.params.docId);

    if (!id || !docId) {
      return res.status(400).json({ message: "Invalid document." });
    }

    const { data: document, error } = await supabase
      .from("intern_documents")
      .select("id, file_name, file_path")
      .eq("id", docId)
      .eq("intern_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!document) return res.status(404).json({ message: "Document not found." });

    // The bucket is private: hand out a short-lived signed URL (5 minutes).
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        document.file_path,
        300,
        req.query.download ? { download: document.file_name } : undefined,
      );

    if (signError) throw signError;

    res.json({ url: signed.signedUrl });
  } catch (err) {
    handleError(res, err, "getDocumentUrl");
  }
};

// DELETE /api/interns/:id/documents/:docId
export const deleteDocument = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const docId = parseId(req.params.docId);

    if (!id || !docId) {
      return res.status(400).json({ message: "Invalid document." });
    }

    const { data: document, error } = await supabase
      .from("intern_documents")
      .select("id, file_path")
      .eq("id", docId)
      .eq("intern_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!document) return res.status(404).json({ message: "Document not found." });

    await removeDocuments([document]);

    res.json({ message: "Document deleted successfully." });
  } catch (err) {
    handleError(res, err, "deleteDocument");
  }
};

/* ------------------------------------------------------------------ */
/* tasks (read-only for HR) + temporary mentor coverage                */
/* ------------------------------------------------------------------ */

// id -> { id, first_name, employee_code } for a list of employee ids
const employeesById = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean))];

  if (!unique.length) return new Map();

  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, employee_code")
    .in("id", unique);

  if (error) throw error;

  return new Map(data.map((employee) => [employee.id, employee]));
};

const coverageStatus = (coverage, today) => {
  if (today < coverage.start_date) return "Upcoming";
  if (today > coverage.end_date) return "Ended";

  return "Active";
};

// GET /api/interns/:id/tasks
export const getInternTasks = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const existing = await findIntern(id);
    if (!existing) return res.status(404).json({ message: "Intern not found." });

    const { data: tasks, error } = await supabase
      .from("intern_tasks")
      .select(
        "id, title, description, due_date, status, assigned_by_employee_id, created_at",
      )
      .eq("intern_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const people = await employeesById(tasks.map((t) => t.assigned_by_employee_id));

    res.json(
      tasks.map((task) => ({
        ...task,
        assigned_by_name:
          people.get(task.assigned_by_employee_id)?.first_name ?? null,
      })),
    );
  } catch (err) {
    handleError(res, err, "getInternTasks");
  }
};

// GET /api/interns/:id/coverage
export const getInternCoverage = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const existing = await findIntern(id);
    if (!existing) return res.status(404).json({ message: "Intern not found." });

    const { data: rows, error } = await supabase
      .from("mentor_coverage")
      .select("id, covering_employee_id, start_date, end_date, created_at")
      .eq("intern_id", id)
      .order("start_date", { ascending: false });

    if (error) throw error;

    const people = await employeesById(rows.map((r) => r.covering_employee_id));
    const today = getToday();

    res.json(
      rows.map((row) => ({
        ...row,
        covering_name: people.get(row.covering_employee_id)?.first_name ?? null,
        covering_code: people.get(row.covering_employee_id)?.employee_code ?? null,
        status: coverageStatus(row, today),
      })),
    );
  } catch (err) {
    handleError(res, err, "getInternCoverage");
  }
};

// POST /api/interns/:id/coverage   { covering_employee_id, start_date, end_date }
export const addInternCoverage = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const existing = await findIntern(id);
    if (!existing) return res.status(404).json({ message: "Intern not found." });

    if (existing.status !== "Active") {
      return res.status(400).json({
        message: "Temporary coverage can only be set for active interns.",
      });
    }

    if (!existing.mentor_employee_id) {
      return res.status(400).json({
        message: "Assign a mentor to this intern before setting temporary coverage.",
      });
    }

    const coveringId = parseId(req.body?.covering_employee_id);
    const startDate = blankToNull(req.body?.start_date);
    const endDate = blankToNull(req.body?.end_date);

    if (!coveringId) {
      return res.status(400).json({ message: "Select the covering employee." });
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({ message: "Enter a valid start and end date." });
    }

    if (endDate < startDate) {
      return res.status(400).json({ message: "End date cannot be before the start date." });
    }

    if (endDate < getToday()) {
      return res.status(400).json({ message: "Coverage must end today or later." });
    }

    if (coveringId === existing.mentor_employee_id) {
      return res.status(400).json({
        message: "The covering employee must be someone other than the mentor.",
      });
    }

    if (!(await mentorIsValid(coveringId))) {
      return res.status(400).json({
        message: "The covering employee must be an active employee.",
      });
    }

    // No two coverage windows for the same intern may overlap.
    const { data: overlapping, error: overlapError } = await supabase
      .from("mentor_coverage")
      .select("id")
      .eq("intern_id", id)
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    if (overlapError) throw overlapError;

    if (overlapping.length) {
      return res.status(409).json({
        message: "This intern already has temporary coverage during these dates.",
      });
    }

    const { data, error } = await supabase
      .from("mentor_coverage")
      .insert({
        intern_id: id,
        covering_employee_id: coveringId,
        start_date: startDate,
        end_date: endDate,
        created_by_employee_id: req.user?.employee_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    res.status(201).json({ id: data.id });
  } catch (err) {
    handleError(res, err, "addInternCoverage");
  }
};

// DELETE /api/interns/:id/coverage/:coverageId
export const removeInternCoverage = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const coverageId = parseId(req.params.coverageId);

    if (!id || !coverageId) {
      return res.status(400).json({ message: "Invalid coverage." });
    }

    const { data: row, error } = await supabase
      .from("mentor_coverage")
      .select("id")
      .eq("id", coverageId)
      .eq("intern_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!row) return res.status(404).json({ message: "Coverage not found." });

    const { error: deleteError } = await supabase
      .from("mentor_coverage")
      .delete()
      .eq("id", coverageId);

    if (deleteError) throw deleteError;

    res.json({ message: "Temporary coverage removed." });
  } catch (err) {
    handleError(res, err, "removeInternCoverage");
  }
};

/* ------------------------------------------------------------------ */
/* stipend (HR marks a month as paid; unpaid months are computed)      */
/* ------------------------------------------------------------------ */

// GET /api/interns/:id/stipends
export const getInternStipends = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const { data: internRow, error: internError } = await supabase
      .from("interns")
      .select("id, start_date, end_date, monthly_stipend")
      .eq("id", id)
      .maybeSingle();

    if (internError) throw internError;
    if (!internRow) return res.status(404).json({ message: "Intern not found." });

    const { data: paidRows, error } = await supabase
      .from("intern_stipends")
      .select("month, amount, paid_date, reference")
      .eq("intern_id", id);

    if (error) throw error;

    res.json(
      buildStipendSchedule(
        { ...internRow, monthly_stipend: Number(internRow.monthly_stipend) },
        paidRows,
      ),
    );
  } catch (err) {
    handleError(res, err, "getInternStipends");
  }
};

// POST /api/interns/:id/stipends/pay   { month: "2026-09-01", paid_date, reference }
export const markStipendPaid = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const { data: internRow, error: internError } = await supabase
      .from("interns")
      .select("id, monthly_stipend")
      .eq("id", id)
      .maybeSingle();

    if (internError) throw internError;
    if (!internRow) return res.status(404).json({ message: "Intern not found." });

    const month = blankToNull(req.body?.month);
    if (!isValidDate(month) || !month.endsWith("-01")) {
      return res.status(400).json({ message: "Invalid month." });
    }

    const paidDate = blankToNull(req.body?.paid_date) || getToday();
    if (!isValidDate(paidDate)) {
      return res.status(400).json({ message: "Invalid payment date." });
    }

    const reference = blankToNull(req.body?.reference);
    const now = new Date().toISOString();

    // A previous attempt may have left a row for this month (e.g. HR
    // correcting the payment date/reference) - upsert instead of failing on
    // the unique (intern_id, month) constraint.
    const { data: existing, error: findError } = await supabase
      .from("intern_stipends")
      .select("id")
      .eq("intern_id", id)
      .eq("month", month)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("intern_stipends")
        .update({
          amount: internRow.monthly_stipend,
          paid_date: paidDate,
          reference,
          updated_at: now,
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("intern_stipends").insert({
        intern_id: id,
        month,
        amount: internRow.monthly_stipend,
        paid_date: paidDate,
        reference,
        created_by_employee_id: req.user?.employee_id ?? null,
        updated_at: now,
      });

      if (insertError) throw insertError;
    }

    res.json({ message: "Stipend marked as paid." });
  } catch (err) {
    handleError(res, err, "markStipendPaid");
  }
};