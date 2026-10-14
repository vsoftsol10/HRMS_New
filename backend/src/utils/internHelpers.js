import { getToday } from "./dateUtils.js";

// An Active intern whose end date is within this many days is shown as
// "Ending Soon". The label is derived on every read, never stored.
export const ENDING_SOON_DAYS = 15;

// Two FKs point at employees (the intern themself + their mentor), so the
// embeds must name the constraint - see the SQL file for the constraint names.
export const INTERN_SELECT = `
  id,
  intern_code,
  employee_id,
  mentor_employee_id,
  internship_type,
  internship_fee,
  monthly_stipend,
  start_date,
  end_date,
  status,
  created_at,
  emergency_contact_name,
  emergency_contact_relation,
  emergency_contact_phone,
  employee:employees!interns_employee_id_fkey (
    id,
    employee_code,
    first_name,
    gender,
    date_of_birth,
    phone,
    personal_email,
    address,
    department_id,
    designation,
    joining_date,
    status,
    departments ( department_name )
  ),
  mentor:employees!interns_mentor_employee_id_fkey (
    id,
    employee_code,
    first_name,
    designation
  )
`;

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

export const handleError = (res, err, context) => {
  console.error(`[interns] ${context}:`, err);

  if (err?.code === "23505") {
    return res.status(409).json({
      message: "A record with the same ID already exists. Please try again.",
    });
  }

  if (err?.code === "23503") {
    return res.status(400).json({
      message: "A selected department or mentor no longer exists.",
    });
  }

  return res
    .status(500)
    .json({ message: "Something went wrong. Please try again." });
};

export const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const blankToNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed === "" ? null : trimmed;
};

export const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
};

// Whole days from one YYYY-MM-DD string to another, computed in UTC so
// timezone / DST can never shift the result by a day.
export const daysBetween = (fromDate, toDate) => {
  const toUtc = (value) => {
    const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(toDate) - toUtc(fromDate)) / 86400000);
};

export const deriveStatus = (intern) => {
  if (intern.status !== "Active") {
    return { display_status: intern.status, days_left: null };
  }

  const daysLeft = daysBetween(getToday(), intern.end_date);

  return {
    display_status: daysLeft <= ENDING_SOON_DAYS ? "Ending Soon" : "Active",
    // Negative once the end date has passed but nobody has completed /
    // extended / converted the internship yet.
    days_left: daysLeft,
  };
};

// Flatten the embedded employee / mentor rows into one intern object.
export const shapeIntern = (row) => {
  const { employee, mentor, ...intern } = row;

  return {
    ...intern,
    ...deriveStatus(intern),
    internship_fee:
      intern.internship_fee === null ? null : Number(intern.internship_fee),
    monthly_stipend: Number(intern.monthly_stipend),

    full_name: employee?.first_name ?? null,
    login_id: employee?.employee_code ?? null,
    gender: employee?.gender ?? null,
    date_of_birth: employee?.date_of_birth ?? null,
    phone: employee?.phone ?? null,
    email: employee?.personal_email ?? null,
    address: employee?.address ?? null,
    department_id: employee?.department_id ?? null,
    department_name: employee?.departments?.department_name ?? null,
    designation: employee?.designation ?? null,
    account_status: employee?.status ?? null,

    mentor_name: mentor?.first_name ?? null,
    mentor_code: mentor?.employee_code ?? null,
  };
};