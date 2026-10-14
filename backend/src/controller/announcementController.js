import supabase from "../config/supabase.js";
import { createNotification } from "../services/notificationService.js";
import { sendAnnouncementEmail } from "../services/emailService.js";
import {
  INTERNS_TOKEN,
  departmentsAsArray,
  parseDepartments,
} from "../utils/departmentMatch.js";
import { safeErrorMessage } from "../utils/httpError.js";

const EMPLOYEE_COLUMNS = "id, first_name, personal_email, department_id, role";

// `department` can come back from the database as a real array or as a
// JSON string (text column) - always hand the frontend an array.
const withDepartmentArray = (row) =>
  row ? { ...row, department: departmentsAsArray(row.department) } : row;

// Resolves an announcement's `department` field (may be null, "All", a
// single id, or an array of ids and/or the "Interns" token - see
// AddAnnouncement.jsx) into the list of Active employees who should be
// emailed. Only people with a personal_email on file are included.
//
//   - no targeting / "All"      -> every active employee and intern
//   - department ids            -> people in those departments (interns
//                                  included, they belong to a department)
//   - "Interns"                 -> every active intern, any department
const resolveTargetEmployees = async (department) => {
  const tokens = parseDepartments(department);

  const isAll = !tokens || tokens.some((token) => String(token) === "All");
  const includeInterns =
    !!tokens && tokens.some((token) => String(token) === INTERNS_TOKEN);

  const baseQuery = () =>
    supabase
      .from("employees")
      .select(EMPLOYEE_COLUMNS)
      .eq("status", "Active")
      .not("personal_email", "is", null);

  if (isAll) {
    const { data, error } = await baseQuery();
    if (error) throw error;
    return data || [];
  }

  const departmentIds = tokens
    .filter((token) => String(token) !== INTERNS_TOKEN)
    .map((token) => Number(token))
    .filter((id) => !Number.isNaN(id));

  const recipients = new Map();

  if (departmentIds.length) {
    const { data, error } = await baseQuery().in("department_id", departmentIds);
    if (error) throw error;
    (data || []).forEach((person) => recipients.set(person.id, person));
  }

  if (includeInterns) {
    const { data, error } = await baseQuery().eq("role", "Intern");
    if (error) throw error;
    (data || []).forEach((person) => recipients.set(person.id, person));
  }

  return [...recipients.values()];
};

// Fire-and-forget: emails every targeted employee / intern. Never
// thrown/awaited by the caller so a Brevo outage or a slow batch can't
// delay or break the announcement create/update response.
const emailAnnouncementToEmployees = async ({
  title,
  description,
  department,
  postedByName,
}) => {
  try {
    const employees = await resolveTargetEmployees(department);

    const results = await Promise.allSettled(
      employees.map((emp) =>
        sendAnnouncementEmail({
          toEmail: emp.personal_email,
          employeeName: emp.first_name,
          title,
          description,
          postedByName,
        }),
      ),
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.sent,
    ).length;

    console.log(
      `Announcement "${title}": emailed ${sent}/${employees.length} recipient(s)`,
    );
  } catch (err) {
    console.error("Announcement email dispatch failed:", err.message);
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select(
        `
        *,
        employees (
          employee_code,
          first_name
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json((data || []).map(withDepartmentArray));
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "announcementController") });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, department, status } = req.body;

    // Supabase insert...
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title,
        description,
        posted_by: req.user.employee_code,
        department,
        status,
        updated_at: new Date(),
      })
      .select(
        `
        *,
        employees (
          employee_code,
          first_name
        )
      `,
      )
      .single();

    if (error) throw error;

    // Only Published announcements are visible / notified / emailed.
    // (Drafts used to create a notification too, which employees could see
    // even though the announcement itself stayed hidden.)
    if (status === "Published") {
      await createNotification({
        title: title,
        message: description,
        type: "Announcement",
        role: "Employee",
        department,
        reference_id: data.id,
      });

      emailAnnouncementToEmployees({
        title,
        description,
        department,
        postedByName: data.employees?.first_name,
      });
    }

    res.status(201).json(withDepartmentArray(data));
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "announcementController") });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, department, status } = req.body;

    // Look up the current status first so we only email when a Draft is
    // being published, not on every edit of an already-published post.
    const { data: existing } = await supabase
      .from("announcements")
      .select("status")
      .eq("id", id)
      .single();

    // Supabase update...
    const { data, error } = await supabase
      .from("announcements")
      .update({
        title,
        description,
        department,
        status,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select(
        `
        *,
        employees (
          employee_code,
          first_name
        )
      `,
      )
      .single();

    if (error) throw error;

    if (status === "Published" && existing?.status !== "Published") {
      await createNotification({
        title: title,
        message: description,
        type: "Announcement",
        role: "Employee",
        department,
        reference_id: data.id,
      });

      emailAnnouncementToEmployees({
        title,
        description,
        department,
        postedByName: data.employees?.first_name,
      });
    }

    res.json(withDepartmentArray(data));
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "announcementController") });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) throw error;

    res.json({
      message: "Announcement deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "announcementController") });
  }
};