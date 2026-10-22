import crypto from "crypto";
import path from "path";

import supabase from "../config/supabase.js";
import { getToday } from "../utils/dateUtils.js";
import {
  blankToNull,
  handleError,
  isValidDate,
  parseId,
  shapeIntern,
  INTERN_SELECT,
} from "../utils/internHelpers.js";

const TASK_BUCKET = "intern-task-submissions";
const DOCUMENT_BUCKET = "intern-documents";

// Same list as the HR side (internController.js) - kept in sync manually
// since the two controllers don't share constants.
const OTHER_DOCUMENTS = "Other Documents";
const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "10th Certificate",
  "12th Certificate",
  "Degree / College Certificate",
  "Resume",
  OTHER_DOCUMENTS,
];

// Statuses a task can move out of when the intern acts on it. The intern
// works Pending -> In Progress -> Completed, then uploads the project
// (Submitted). "Completed" must stay editable because that is the status
// the task is in when the intern submits. Once a task is Submitted, only
// the mentor/HR can change it further.
const EDITABLE_TASK_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Changes Requested",
];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const fixFileName = (name) => {
  const converted = Buffer.from(name, "latin1").toString("utf8");
  return converted.includes("\uFFFD") ? name : converted;
};

const storeMyDocument = async ({ internId, file, docType }) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const safeExtension = /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : "";
  const storagePath = `${internId}/${crypto.randomUUID()}${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
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
    await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
    throw insertError;
  }

  return data;
};

const removeMyDocuments = async (documents) => {
  if (!documents.length) return;

  await supabase.storage.from(DOCUMENT_BUCKET).remove(documents.map((d) => d.file_path));

  await supabase
    .from("intern_documents")
    .delete()
    .in(
      "id",
      documents.map((d) => d.id),
    );
};

// Loads this intern's row (via employee_id from the JWT) or null.
const loadSelf = async (employeeId) => {
  const { data, error } = await supabase
    .from("interns")
    .select(INTERN_SELECT)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return shapeIntern(data);
};

const firstOfMonth = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

const addMonths = (isoMonth, count) => {
  const [year, month] = isoMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

const monthLabel = (isoMonth) => {
  const [year, month] = isoMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// A free (unpaid) internship has a Rs.0 monthly stipend. The Stipend module
// (menu, page, dashboard card) is only for paid interns: it appears once HR
// raises the stipend above 0 (Free -> Paid) and is hidden/blocked while it is 0.
const hasStipend = (intern) => Number(intern.monthly_stipend) > 0;

// One row per month from the intern's start date up to the current month
// (internships don't get billed for months that haven't happened yet, even
// if end_date is in the future), overlaid with any HR-marked payments.
const buildStipendSchedule = (intern, paidRows) => {
  const paidByMonth = new Map(paidRows.map((row) => [row.month.slice(0, 10), row]));

  const currentMonth = firstOfMonth(new Date());
  const lastBillableMonth =
    intern.end_date.slice(0, 10) < currentMonth
      ? firstOfMonth(new Date(`${intern.end_date}T00:00:00Z`))
      : currentMonth;

  const months = [];
  let cursor = firstOfMonth(new Date(`${intern.start_date}T00:00:00Z`));

  while (cursor <= lastBillableMonth) {
    const paid = paidByMonth.get(cursor);
    const amount = paid ? Number(paid.amount) : Number(intern.monthly_stipend);

    // A Rs.0 stipend is a free (unpaid) internship: there is nothing to pay,
    // so the month is "Free" - never "Pending" and never marked as paid.
    let status = "Pending";
    if (amount === 0) status = "Free";
    else if (paid) status = "Paid";

    months.push({
      month: cursor,
      month_label: monthLabel(cursor),
      amount,
      status,
      paid_date: paid?.paid_date ?? null,
      reference: paid?.reference ?? null,
    });

    cursor = addMonths(cursor, 1);
  }

  return months.reverse(); // most recent first
};

/* ------------------------------------------------------------------ */
/* dashboard                                                            */
/* ------------------------------------------------------------------ */

// GET /api/intern-portal/dashboard
export const getDashboard = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const intern = await loadSelf(employeeId);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const today = getToday();
    const monthStart = firstOfMonth(new Date());

    const [
      { data: allAttendance, error: attendanceError },
      { data: monthAttendance, error: monthError },
      { data: tasks, error: tasksError },
      { data: latestLeave, error: leaveError },
      { data: paidRows, error: stipendError },
      { data: announcement, error: announcementError },
    ] = await Promise.all([
      supabase.from("attendance").select("status").eq("employee_id", employeeId),
      supabase
        .from("attendance")
        .select("status")
        .eq("employee_id", employeeId)
        .gte("attendance_date", monthStart)
        .lte("attendance_date", today),
      supabase
        .from("intern_tasks")
        .select("id, title, status, submitted_at")
        .eq("intern_id", intern.id)
        .order("submitted_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("leave_requests")
        .select("leave_type, days, status, applied_at")
        .eq("employee_id", employeeId)
        .order("applied_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("intern_stipends")
        .select("month, amount, paid_date, reference")
        .eq("intern_id", intern.id),
      supabase
        .from("announcements")
        .select("title, created_at, department")
        .eq("status", "Published")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (attendanceError) throw attendanceError;
    if (monthError) throw monthError;
    if (tasksError) throw tasksError;
    if (leaveError) throw leaveError;
    if (stipendError) throw stipendError;
    if (announcementError) throw announcementError;

    const presentLike = ["Present", "Late", "Half Day"];
    const count = (rows, statuses) =>
      rows.filter((row) => statuses.includes(row.status)).length;

    const stipendEnabled = hasStipend(intern);
    const schedule = stipendEnabled ? buildStipendSchedule(intern, paidRows) : [];
    const currentStipend = schedule[0] ?? null;

    const latestSubmittedTask = tasks.find((task) => task.submitted_at);

    res.json({
      full_name: intern.full_name,
      designation: intern.designation,
      stats: {
        present_days: count(allAttendance, presentLike),
        absent_days: count(allAttendance, ["Absent"]),
        stipend_status: stipendEnabled ? currentStipend?.status ?? "-" : null,
        tasks_uploaded: tasks.filter((task) => task.submitted_at).length,
      },
      attendance_summary: {
        month_label: monthLabel(monthStart),
        present: count(monthAttendance, presentLike),
        absent: count(monthAttendance, ["Absent"]),
        leave: count(monthAttendance, ["Leave"]),
      },
      recent_activity: [
        latestLeave && {
          type: "leave",
          title: "Recent Leave Request",
          subtitle: latestLeave.leave_type,
          days: latestLeave.days,
          status: latestLeave.status,
          date: latestLeave.applied_at,
        },
        latestSubmittedTask && {
          type: "task",
          title: "Recent Submission",
          subtitle: latestSubmittedTask.title,
          status: null,
          date: latestSubmittedTask.submitted_at,
        },
        announcement && {
          type: "announcement",
          title: "Latest Announcement",
          subtitle: announcement.title,
          status: null,
          date: announcement.created_at,
        },
      ].filter(Boolean),
      stipend_enabled: stipendEnabled,
      current_stipend: currentStipend,
    });
  } catch (err) {
    handleError(res, err, "getDashboard");
  }
};

/* ------------------------------------------------------------------ */
/* profile / emergency contact                                         */
/* ------------------------------------------------------------------ */

// GET /api/intern-portal/profile
export const getProfile = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    res.json(intern);
  } catch (err) {
    handleError(res, err, "getProfile");
  }
};

// PUT /api/intern-portal/emergency-contact
export const updateEmergencyContact = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const name = blankToNull(req.body?.name);
    const relation = blankToNull(req.body?.relation);
    const phone = blankToNull(req.body?.phone);

    if (!name || !relation || !phone) {
      return res.status(400).json({
        message: "Contact name, relation and phone are all required.",
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit phone number." });
    }

    const { error } = await supabase
      .from("interns")
      .update({
        emergency_contact_name: name,
        emergency_contact_relation: relation,
        emergency_contact_phone: phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intern.id);

    if (error) throw error;

    res.json({ message: "Emergency contact updated successfully." });
  } catch (err) {
    handleError(res, err, "updateEmergencyContact");
  }
};

// PUT /api/intern-portal/personal-info
// Same rules as the HR-side intern form (internController.validateInternPayload)
// for these six fields. Only this whitelist can change - department,
// designation, employee_code, role, salary etc. are never touched here.
const PERSONAL_GENDERS = ["Male", "Female", "Other"];

export const updatePersonalInfo = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const body = req.body || {};
    const errors = {};

    const fullName = blankToNull(body.full_name);
    if (!fullName) {
      errors.full_name = "Full name is required.";
    } else if (!/^[A-Za-z][A-Za-z .'-]{1,99}$/.test(fullName)) {
      errors.full_name = "Enter a valid full name.";
    }

    const gender = blankToNull(body.gender);
    if (!PERSONAL_GENDERS.includes(gender)) {
      errors.gender = "Select a gender.";
    }

    const dateOfBirth = blankToNull(body.date_of_birth);
    if (!isValidDate(dateOfBirth)) {
      errors.date_of_birth = "Enter a valid date of birth.";
    } else if (dateOfBirth > getToday() || dateOfBirth < "1940-01-01") {
      errors.date_of_birth = "Date of birth is not valid.";
    }

    const phone = blankToNull(body.phone);
    if (!/^\d{10}$/.test(phone || "")) {
      errors.phone = "Enter a valid 10-digit phone number.";
    }

    const email = blankToNull(body.email)?.toLowerCase() ?? null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      errors.email = "Enter a valid email address.";
    }

    const address = blankToNull(body.address);
    if (address && String(address).length > 255) {
      errors.address = "Address must be 255 characters or fewer.";
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({
        message: Object.values(errors)[0],
        errors,
      });
    }

    const { error } = await supabase
      .from("employees")
      .update({
        first_name: fullName,
        gender,
        date_of_birth: dateOfBirth,
        phone,
        personal_email: email,
        address,
      })
      .eq("id", req.user.employee_id);

    if (error) throw error;

    res.json({ message: "Personal information updated successfully." });
  } catch (err) {
    handleError(res, err, "updatePersonalInfo");
  }
};

/* ------------------------------------------------------------------ */
/* documents (interns can upload/delete their own, same as HR can)     */
/* ------------------------------------------------------------------ */

// GET /api/intern-portal/documents
export const getMyDocuments = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const { data, error } = await supabase
      .from("intern_documents")
      .select("id, doc_type, file_name, mime_type, file_size, created_at")
      .eq("intern_id", intern.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    handleError(res, err, "getMyDocuments");
  }
};

// GET /api/intern-portal/documents/:docId/url
export const getMyDocumentUrl = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const docId = parseId(req.params.docId);
    if (!docId) return res.status(400).json({ message: "Invalid document." });

    const { data: document, error } = await supabase
      .from("intern_documents")
      .select("file_name, file_path")
      .eq("id", docId)
      .eq("intern_id", intern.id)
      .maybeSingle();

    if (error) throw error;
    if (!document) return res.status(404).json({ message: "Document not found." });

    const { data: signed, error: signError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(
        document.file_path,
        300,
        req.query.download ? { download: document.file_name } : undefined,
      );

    if (signError) throw signError;

    res.json({ url: signed.signedUrl });
  } catch (err) {
    handleError(res, err, "getMyDocumentUrl");
  }
};

// POST /api/intern-portal/documents   (multipart: "document" file + doc_type)
export const uploadMyDocument = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const docType = blankToNull(req.body.doc_type);

    if (!DOCUMENT_TYPES.includes(docType)) {
      return res.status(400).json({ message: "Select a valid document type." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Choose a file to upload." });
    }

    // Every type except "Other Documents" holds a single file: a new upload
    // replaces the old one - but only after the new file is safely stored.
    // Same rule as HR's own upload on the Intern detail page.
    let previous = [];

    if (docType !== OTHER_DOCUMENTS) {
      const { data, error } = await supabase
        .from("intern_documents")
        .select("id, file_path")
        .eq("intern_id", intern.id)
        .eq("doc_type", docType);

      if (error) throw error;
      previous = data;
    }

    const document = await storeMyDocument({
      internId: intern.id,
      file: req.file,
      docType,
    });

    await removeMyDocuments(previous);

    res.status(201).json(document);
  } catch (err) {
    handleError(res, err, "uploadMyDocument");
  }
};

// DELETE /api/intern-portal/documents/:docId
export const deleteMyDocument = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const docId = parseId(req.params.docId);
    if (!docId) return res.status(400).json({ message: "Invalid document." });

    const { data: document, error } = await supabase
      .from("intern_documents")
      .select("id, file_path")
      .eq("id", docId)
      .eq("intern_id", intern.id)
      .maybeSingle();

    if (error) throw error;
    if (!document) return res.status(404).json({ message: "Document not found." });

    await removeMyDocuments([document]);

    res.json({ message: "Document deleted successfully." });
  } catch (err) {
    handleError(res, err, "deleteMyDocument");
  }
};

/* ------------------------------------------------------------------ */
/* tasks                                                                */
/* ------------------------------------------------------------------ */

const findOwnTask = async (internId, taskId) => {
  const { data, error } = await supabase
    .from("intern_tasks")
    .select("id, status")
    .eq("id", taskId)
    .eq("intern_id", internId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

// GET /api/intern-portal/tasks
export const getTasks = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const { data: tasks, error } = await supabase
      .from("intern_tasks")
      .select(
        "id, title, description, due_date, status, assigned_by_employee_id, submission_file_name, submission_comment, submitted_at, created_at",
      )
      .eq("intern_id", intern.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const assignerIds = [
      ...new Set(tasks.map((task) => task.assigned_by_employee_id).filter(Boolean)),
    ];
    const assigners = new Map();

    if (assignerIds.length) {
      const { data: people, error: peopleError } = await supabase
        .from("employees")
        .select("id, first_name")
        .in("id", assignerIds);

      if (peopleError) throw peopleError;

      people.forEach((person) => assigners.set(person.id, person.first_name));
    }

    res.json(
      tasks.map((task) => ({
        ...task,
        assigned_by_name: assigners.get(task.assigned_by_employee_id) ?? null,
      })),
    );
  } catch (err) {
    handleError(res, err, "getTasks");
  }
};

// PATCH /api/intern-portal/tasks/:id/start
export const startTask = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const taskId = parseId(req.params.id);
    if (!taskId) return res.status(400).json({ message: "Invalid task id." });

    const task = await findOwnTask(intern.id, taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (!EDITABLE_TASK_STATUSES.includes(task.status)) {
      return res.status(400).json({
        message: "This task has already been submitted and can no longer be started.",
      });
    }

    const { error } = await supabase
      .from("intern_tasks")
      .update({ status: "In Progress", updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) throw error;

    res.json({ message: "Task marked as In Progress." });
  } catch (err) {
    handleError(res, err, "startTask");
  }
};

// Statuses an intern may set by hand. "Submitted" only happens through
// submitTask (it needs a file); "Changes Requested" is set by the mentor.
const SELF_SETTABLE_TASK_STATUSES = ["Pending", "In Progress", "Completed"];

// PATCH /api/intern-portal/tasks/:id/status
//   body: { status: "Pending" | "In Progress" | "Completed" }
export const updateTaskStatus = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const taskId = parseId(req.params.id);
    if (!taskId) return res.status(400).json({ message: "Invalid task id." });

    const nextStatus = req.body?.status;
    if (!SELF_SETTABLE_TASK_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        message: `Status must be one of: ${SELF_SETTABLE_TASK_STATUSES.join(", ")}.`,
      });
    }

    const task = await findOwnTask(intern.id, taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (!EDITABLE_TASK_STATUSES.includes(task.status)) {
      return res.status(400).json({
        message: "This task has already been submitted and its status can no longer be changed.",
      });
    }

    if (task.status === nextStatus) {
      return res.json({ message: `Task is already ${nextStatus}.`, status: nextStatus });
    }

    const { error } = await supabase
      .from("intern_tasks")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) throw error;

    res.json({ message: `Task marked as ${nextStatus}.`, status: nextStatus });
  } catch (err) {
    handleError(res, err, "updateTaskStatus");
  }
};

// POST /api/intern-portal/tasks/:id/submit  (multipart: "file" + "comment")
export const submitTask = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const taskId = parseId(req.params.id);
    if (!taskId) return res.status(400).json({ message: "Invalid task id." });

    const task = await findOwnTask(intern.id, taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (!EDITABLE_TASK_STATUSES.includes(task.status)) {
      return res.status(400).json({ message: "This task has already been submitted." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Attach a file before submitting." });
    }

    const extension = path.extname(req.file.originalname || "").toLowerCase();
    const safeExtension = /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : "";
    const storagePath = `${intern.id}/${taskId}/${crypto.randomUUID()}${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(TASK_BUCKET)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { error } = await supabase
      .from("intern_tasks")
      .update({
        status: "Submitted",
        submission_file_path: storagePath,
        submission_file_name: fixFileName(req.file.originalname || "submission"),
        submission_mime_type: req.file.mimetype,
        submission_file_size: req.file.size,
        submission_comment: blankToNull(req.body?.comment),
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      await supabase.storage.from(TASK_BUCKET).remove([storagePath]);
      throw error;
    }

    res.json({ message: "Task submitted successfully." });
  } catch (err) {
    handleError(res, err, "submitTask");
  }
};

// GET /api/intern-portal/tasks/:id/submission-url
export const getSubmissionUrl = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    const taskId = parseId(req.params.id);
    if (!taskId) return res.status(400).json({ message: "Invalid task id." });

    const { data: task, error } = await supabase
      .from("intern_tasks")
      .select("submission_file_path, submission_file_name")
      .eq("id", taskId)
      .eq("intern_id", intern.id)
      .maybeSingle();

    if (error) throw error;
    if (!task?.submission_file_path) {
      return res.status(404).json({ message: "No submission found for this task." });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(TASK_BUCKET)
      .createSignedUrl(
        task.submission_file_path,
        300,
        req.query.download ? { download: task.submission_file_name } : undefined,
      );

    if (signError) throw signError;

    res.json({ url: signed.signedUrl });
  } catch (err) {
    handleError(res, err, "getSubmissionUrl");
  }
};

/* ------------------------------------------------------------------ */
/* stipend                                                              */
/* ------------------------------------------------------------------ */

// GET /api/intern-portal/stipend-access
// Lightweight check used by the sidebar to decide whether to show "Stipend".
export const getStipendAccess = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    res.json({ stipend_enabled: hasStipend(intern) });
  } catch (err) {
    handleError(res, err, "getStipendAccess");
  }
};

// GET /api/intern-portal/stipends
export const getStipends = async (req, res) => {
  try {
    const intern = await loadSelf(req.user.employee_id);

    if (!intern) {
      return res.status(404).json({ message: "Intern profile not found." });
    }

    if (!hasStipend(intern)) {
      return res.status(403).json({
        message: "Stipend is not available for a free internship.",
      });
    }

    const { data: paidRows, error } = await supabase
      .from("intern_stipends")
      .select("month, amount, paid_date, reference")
      .eq("intern_id", intern.id);

    if (error) throw error;

    // The slip modal / PDF needs who the slip is for, not just the month rows.
    const schedule = buildStipendSchedule(intern, paidRows).map((row) => ({
      ...row,
      intern_name: intern.full_name,
      intern_code: intern.intern_code,
      department_name: intern.department_name,
      designation: intern.designation,
    }));

    res.json(schedule);
  } catch (err) {
    handleError(res, err, "getStipends");
  }
};

export { buildStipendSchedule, isValidDate };