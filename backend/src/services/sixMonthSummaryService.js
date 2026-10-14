import supabase from "../config/supabase.js";

/**
 * 6-month payroll summary - aggregates the FINALIZED/PAID monthly
 * payroll rows of the last 6 calendar months for an employee. This does NOT recalculate anything and
 * is not a separate payment cycle - it only summarizes months that have
 * already gone through the Draft -> Review -> Finalized (-> Paid)
 * lifecycle, per the payroll redesign decision ("6-month = monthly
 * payroll + summary aggregating FINALIZED monthly payrolls").
 *
 * Draft/Review rows are deliberately excluded - only settled numbers
 * belong in a summary someone might rely on.
 */
export const getSixMonthSummary = async (employeeId, uptoMonth) => {
  // FIX: this took the latest 6 finalized ROWS, so one skipped month made the
  // "6-month" summary silently span 7-8 calendar months. It now covers the
  // 6 calendar months ending at uptoMonth (default: the employee's most
  // recent finalized month); months with no finalized payroll are simply
  // absent from the result and show in monthsIncluded.
  let endMonth = uptoMonth ? String(uptoMonth).slice(0, 7) : null;

  if (!endMonth) {
    const { data: latest, error: latestError } = await supabase
      .from("payroll")
      .select("payroll_month")
      .eq("employee_id", employeeId)
      .in("status", ["Finalized", "Paid"])
      .order("payroll_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;

    endMonth = latest ? String(latest.payroll_month).slice(0, 7) : null;
  }

  let rows = [];

  if (endMonth) {
    const [endYear, endMon] = endMonth.split("-").map(Number);
    const startDate = new Date(endYear, endMon - 1 - 5, 1);
    const windowStart = `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1,
    ).padStart(2, "0")}-01`;
    const windowEnd = `${endMonth}-01`;

    const { data, error } = await supabase
      .from("payroll")
      .select(
        "id, payroll_month, basic_salary, gross_salary, deductions, net_salary, lop_days, status",
      )
      .eq("employee_id", employeeId)
      .in("status", ["Finalized", "Paid"])
      .gte("payroll_month", windowStart)
      .lte("payroll_month", windowEnd)
      .order("payroll_month", { ascending: false });

    if (error) throw error;

    rows = data || [];
  }

  const months = (rows || [])
    .slice()
    .sort((a, b) => a.payroll_month.localeCompare(b.payroll_month));

  const totals = months.reduce(
    (acc, row) => ({
      grossSalary: acc.grossSalary + Number(row.gross_salary),
      deductions: acc.deductions + Number(row.deductions),
      netSalary: acc.netSalary + Number(row.net_salary),
      lopDays: acc.lopDays + Number(row.lop_days || 0),
    }),
    { grossSalary: 0, deductions: 0, netSalary: 0, lopDays: 0 },
  );

  return {
    employeeId,
    monthsIncluded: months.length,
    months: months.map((row) => ({
      payrollMonth: row.payroll_month,
      basicSalary: Number(row.basic_salary),
      grossSalary: Number(row.gross_salary),
      deductions: Number(row.deductions),
      netSalary: Number(row.net_salary),
      lopDays: Number(row.lop_days || 0),
      status: row.status,
    })),
    totals: {
      grossSalary: Number(totals.grossSalary.toFixed(2)),
      deductions: Number(totals.deductions.toFixed(2)),
      netSalary: Number(totals.netSalary.toFixed(2)),
      lopDays: Number(totals.lopDays.toFixed(2)),
    },
    averageNetSalary:
      months.length > 0
        ? Number((totals.netSalary / months.length).toFixed(2))
        : 0,
  };
};