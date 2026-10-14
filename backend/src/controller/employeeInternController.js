// employeeInternController.js
//
// Employee portal -> "My Intern" (a mentor's view of their interns).
//
// An employee can see and assign tasks to:
//   * interns whose mentor they are                    ("My Interns")
//   * interns HR has temporarily assigned to them for
//     a date range that includes today                 ("Temporary Coverage")
//
// Everything is scoped by req.user.employee_id (from the JWT) - never by an
// id sent in the request - so one employee can never reach another
// employee's interns.
//
// Requires prisma/sql/add_intern_tasks_and_coverage.sql.

import supabase from "../config/supabase.js";
import { getToday } from "../utils/dateUtils.js";
import { createNotification } from "../services/notificationService.js";
import {
  INTERN_SELECT,
  blankToNull,
  handleError,
  isValidDate,
  parseId,
  shapeIntern,
} from "../utils/internHelpers.js";

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_INTERNS_PER_TASK = 50;

// Task statuses that still need work from the intern (used for the
// "Active Tasks" number on the cards).
const FINISHED_TASK_STATUS = "Completed";

/* ------------------------------------------------------------------ */
/* scope: which interns does this employee look after right now?       */
/* ------------------------------------------------------------------ */

const loadScope = async (employeeId) => {
  const today = getToday();

  const [mineResult, coverageResult] = await Promise.all([
    supabase
      .from("interns")
      .select(INTERN_SELECT)
      .eq("mentor_employee_id", employeeId)
      .eq("status", "Active")
      .order("created_at", { ascending: false }),

    supabase
      .from("mentor_coverage")
      .select("intern_id, start_date, end_date")
      .eq("covering_employee_id", employeeId)
      .lte("start_date", today)
      .gte("end_date", today),
  ]);

  if (mineResult.error) throw mineResult.error;
  if (coverageResult.error) throw coverageResult.error;

  const mine = mineResult.data.map(shapeIntern);
  const mineIds = new Set(mine.map((intern) => intern.id));

  // If someone is both the mentor and the covering employee, the intern is
  // simply theirs - it must not appear twice.
  const coverageByIntern = new Map();
  for (const coverage of coverageResult.data) {
    if (!mineIds.has(coverage.intern_id)) {
      coverageByIntern.set(coverage.intern_id, coverage);
    }
  }

  let covering = [];

  if (coverageByIntern.size) {
    const { data, error } = await supabase
      .from("interns")
      .select(INTERN_SELECT)
      .in("id", [...coverageByIntern.keys()])
      .eq("status", "Active");

    if (error) throw error;

    covering = data.map((row) => {
      const intern = shapeIntern(row);
      const coverage = coverageByIntern.get(intern.id);

      return {
        ...intern,
        coverage_start: coverage.start_date,
        coverage_end: coverage.end_date,
      };
    });
  }

  // Is the primary mentor actually on (approved) leave today?
  const primaryIds = [
    ...new Set(covering.map((i) => i.mentor_employee_id).filter(Boolean)),
  ];
  const onLeave = new Set();

  if (primaryIds.length) {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("employee_id")
      .eq("status", "Approved")
      .lte("start_date", today)
      .gte("end_date", today)
      .in("employee_id", primaryIds);

    if (error) throw error;

    data.forEach((leave) => onLeave.add(leave.employee_id));
  }

  covering = covering.map((intern) => ({
    ...intern,
    primary_on_leave: onLeave.has(intern.mentor_employee_id),
  }));

  return { mine, covering };
};

const loadActiveTaskCounts = async (internIds) => {
  const counts = new Map();

  if (!internIds.length) return counts;

  const { data, error } = await supabase
    .from("intern_tasks")
    .select("intern_id")
    .in("intern_id", internIds)
    .neq("status", FINISHED_TASK_STATUS);

  if (error) throw error;

  for (const task of data) {
    counts.set(task.intern_id, (counts.get(task.intern_id) || 0) + 1);
  }

  return counts;
};

// A mentor only needs the basics - contact details, address, stipend and
// documents stay with HR.
const toCard = (intern, counts) => ({
  id: intern.id,
  intern_code: intern.intern_code,
  full_name: intern.full_name,
  designation: intern.designation,
  department_name: intern.department_name,
  display_status: intern.display_status,
  days_left: intern.days_left,
  primary_employee_name: intern.mentor_name,
  active_tasks: counts.get(intern.id) || 0,
});

/* ------------------------------------------------------------------ */
/* handlers                                                            */
/* ------------------------------------------------------------------ */

// GET /api/my-interns
export const getMyInterns = async (req, res) => {
  try {
    const { mine, covering } = await loadScope(req.user.employee_id);
    const counts = await loadActiveTaskCounts(
      [...mine, ...covering].map((intern) => intern.id),
    );

    res.json({
      my_interns: mine.map((intern) => toCard(intern, counts)),
      coverage_interns: covering.map((intern) => ({
        ...toCard(intern, counts),
        primary_on_leave: intern.primary_on_leave,
        coverage_start: intern.coverage_start,
        coverage_end: intern.coverage_end,
      })),
    });
  } catch (err) {
    handleError(res, err, "getMyInterns");
  }
};

// GET /api/my-interns/:id
export const getMyInternById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid intern id." });

    const { mine, covering } = await loadScope(req.user.employee_id);

    const intern = [...mine, ...covering].find((row) => row.id === id);

    // Same answer whether the intern doesn't exist or belongs to someone
    // else - don't reveal which.
    if (!intern) return res.status(404).json({ message: "Intern not found." });

    const { data: tasks, error } = await supabase
      .from("intern_tasks")
      .select(
        "id, title, description, due_date, status, assigned_by_employee_id, created_at",
      )
      .eq("intern_id", id)
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

    const counts = new Map([
      [id, tasks.filter((task) => task.status !== FINISHED_TASK_STATUS).length],
    ]);

    res.json({
      ...toCard(intern, counts),
      via_coverage: "coverage_start" in intern,
      coverage_start: intern.coverage_start ?? null,
      coverage_end: intern.coverage_end ?? null,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        created_at: task.created_at,
        status: task.status,
        assigned_by_name: assigners.get(task.assigned_by_employee_id) ?? null,
      })),
    });
  } catch (err) {
    handleError(res, err, "getMyInternById");
  }
};

// POST /api/my-interns/tasks   { title, description, due_date, intern_ids: [] }
// One task row is created per selected intern.
export const assignTasks = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const body = req.body || {};

    const title = blankToNull(body.title);
    if (!title) return res.status(400).json({ message: "Task title is required." });
    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Task title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
      });
    }

    const description = blankToNull(body.description);
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
      });
    }

    const dueDate = blankToNull(body.due_date);
    if (!isValidDate(dueDate)) {
      return res.status(400).json({ message: "Enter a valid due date." });
    }
    if (dueDate < getToday()) {
      return res.status(400).json({ message: "Due date cannot be in the past." });
    }

    const rawIds = Array.isArray(body.intern_ids) ? body.intern_ids : [];
    const internIds = [...new Set(rawIds.map(parseId))];

    if (!internIds.length || internIds.includes(null)) {
      return res.status(400).json({ message: "Select at least one intern." });
    }
    if (internIds.length > MAX_INTERNS_PER_TASK) {
      return res.status(400).json({
        message: `You can assign a task to at most ${MAX_INTERNS_PER_TASK} interns at once.`,
      });
    }

    const { mine, covering } = await loadScope(employeeId);
    const allowed = new Set([...mine, ...covering].map((intern) => intern.id));

    if (internIds.some((id) => !allowed.has(id))) {
      return res.status(403).json({
        message: "You can only assign tasks to your own interns.",
      });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("intern_tasks")
      .insert(
        internIds.map((internId) => ({
          intern_id: internId,
          title,
          description,
          due_date: dueDate,
          assigned_by_employee_id: employeeId,
          status: "Pending",
          updated_at: now,
        })),
      )
      .select("id");

    if (error) throw error;

    // Tell each intern about their new task. Notifications are keyed by the
    // intern's EMPLOYEE id (interns.employee_id), not interns.id. A failed
    // notification must never undo or fail the assignment itself.
    // (rows come back in insert order, so data[index] is the task for internIds[index])
    const internById = new Map(
      [...mine, ...covering].map((intern) => [intern.id, intern]),
    );

    const results = await Promise.allSettled(
      internIds.map((internId, index) => {
        const intern = internById.get(internId);

        return createNotification({
          title: "New Task Assigned",
          message: `You have a new task: "${title}" (due ${dueDate}).`,
          type: "Task",
          role: "Employee", // same value every other personal notification uses; the intern inbox filters by employee_id
          employee_id: intern.employee_id,
          reference_id: data[index]?.id ?? null,
        });
      }),
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `[TASKS] Failed to notify intern ${internIds[index]}:`,
          result.reason?.message || result.reason,
          result.reason?.details || "",
        );
      }
    });

    const notifyFailed = results.filter((r) => r.status === "rejected").length;

    res.status(201).json({
      created: data.length,
      notified: results.length - notifyFailed,
      notify_failed: notifyFailed,
      ...(notifyFailed
        ? { notify_error: results.find((r) => r.status === "rejected").reason?.message }
        : {}),
    });
  } catch (err) {
    handleError(res, err, "assignTasks");
  }
};