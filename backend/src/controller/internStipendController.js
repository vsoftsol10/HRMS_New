import supabase from "../config/supabase.js";
import { getToday } from "../utils/dateUtils.js";
import { handleError } from "../utils/internHelpers.js";

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const firstOfMonth = (yearMonth) => `${yearMonth}-01`;

const lastDayOfMonth = (yearMonth) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${yearMonth}-${String(last).padStart(2, "0")}`;
};

// GET /api/interns/stipends/monthly?month=YYYY-MM
//
// One row per intern whose internship covers the requested month. Same
// billing rule as the intern portal's stipend schedule: a month is billable
// from the intern's start month up to the earlier of (end month, current
// month) - months that haven't happened yet are never listed.
export const getMonthlyInternStipends = async (req, res) => {
  try {
    const currentMonth = getToday().slice(0, 7);
    const month = String(req.query.month || currentMonth).trim();

    if (!MONTH_REGEX.test(month)) {
      return res
        .status(400)
        .json({ message: "Invalid month. Use the format YYYY-MM." });
    }

    // Future months have no stipend rows yet.
    if (month > currentMonth) {
      return res.json([]);
    }

    const monthStart = firstOfMonth(month);
    const monthEnd = lastDayOfMonth(month);

    const { data: interns, error: internError } = await supabase
      .from("interns")
      .select(
        `
        id,
        intern_code,
        monthly_stipend,
        start_date,
        end_date,
        status,
        employee:employees!interns_employee_id_fkey (
          first_name,
          department_id,
          departments ( department_name )
        )
      `,
      )
      // Internship overlaps the requested month.
      .lte("start_date", monthEnd)
      .gte("end_date", monthStart)
      .order("intern_code", { ascending: true });

    if (internError) throw internError;

    const internIds = (interns || []).map((intern) => intern.id);
    let paidByIntern = new Map();

    if (internIds.length) {
      const { data: paidRows, error: paidError } = await supabase
        .from("intern_stipends")
        .select("intern_id, amount, paid_date, reference")
        .eq("month", monthStart)
        .in("intern_id", internIds);

      if (paidError) throw paidError;

      paidByIntern = new Map(paidRows.map((row) => [row.intern_id, row]));
    }

    const rows = (interns || []).map((intern) => {
      const paid = paidByIntern.get(intern.id);

      return {
        intern_id: intern.id,
        intern_code: intern.intern_code,
        intern_name: intern.employee?.first_name ?? null,
        department_name: intern.employee?.departments?.department_name ?? null,
        month: monthStart,
        amount: paid ? Number(paid.amount) : Number(intern.monthly_stipend),
        status: paid ? "Paid" : "Pending",
        paid_date: paid?.paid_date ?? null,
        reference: paid?.reference ?? null,
        start_date: intern.start_date,
        end_date: intern.end_date,
      };
    });

    res.json(rows);
  } catch (err) {
    handleError(res, err, "getMonthlyInternStipends");
  }
};