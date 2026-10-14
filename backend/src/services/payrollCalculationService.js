import supabase from "../config/supabase.js";
import {
  getWorkingDaysInMonth,
  isWeeklyOffDay,
  formatLocalDate,
} from "../utils/dateUtils.js";

/**
 * Payroll calculation engine (Step 5 of the payroll redesign).
 *
 * Order of operations:
 *   1. Resolve the employee's active salary assignment for the month.
 *   2. Resolve Basic (override -> structure -> employee.monthly_salary
 *      legacy fallback).
 *   3. Compute included components (Fixed, or % of Basic only - never
 *      % of Gross, which would be circular). Gross = Basic + components.
 *   4. Compute included deductions against the now-final Gross (Fixed,
 *      % of Basic, or % of Gross).
 *   5. Sum this month's attendance.lop_days -> LOP deduction, using
 *      Basic / applicable working days as the daily rate.
 *   6. Net = Gross - deductions - LOP deduction.
 *
 * Returns a full breakdown (not yet persisted) so the same function can
 * back both a preview and the actual Draft-row generation in Step 6.
 */

const round2 = (value) => Number(Number(value).toFixed(2));

/**
 * Resolve the salary assignment active for an employee during a given
 * payroll month (YYYY-MM-01).
 */
const getActiveAssignment = async (employeeId, payrollMonth) => {
  const [year, month] = payrollMonth.split("-").map(Number);
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    new Date(year, month, 0).getDate(),
  ).padStart(2, "0")}`;

  // FIX: this used to compare effective_from against the 1st of the month,
  // so an assignment starting mid-month (e.g. 15 Oct) was ignored for that
  // whole month and the older assignment / legacy salary was used instead.
  // An assignment now counts if it starts on or before the LAST day of the
  // month and has not ended before the 1st; the latest start wins.
  const { data, error } = await supabase
    .from("employee_salary_assignments")
    .select(
      `
      id,
      override_basic_salary,
      effective_from,
      effective_to,
      salary_configurations (
        id,
        structure_name,
        basic_salary,
        lop_mode,
        lop_value
      )
    `,
    )
    .eq("employee_id", employeeId)
    .lte("effective_from", monthEnd)
    .or(`effective_to.is.null,effective_to.gte.${payrollMonth}`)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
};

/**
 * Sum lop_days for an employee within a payroll month, and count any
 * needs-review rows (e.g. missing check-out) as a separate warning -
 * these are surfaced, never silently folded into the deduction.
 */
const getMonthlyLopSummary = async (employeeId, year, month, joiningDate) => {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    daysInMonth,
  ).padStart(2, "0")}`;

  const { data: allRows, error } = await supabase
    .from("attendance")
    .select("attendance_date, lop_days, lop_processed, check_out")
    .eq("employee_id", employeeId)
    .gte("attendance_date", monthStart)
    .lte("attendance_date", monthEnd);

  if (error) throw error;

  // Rows dated before the joining date belong to a period the employee was
  // not employed - the pre-joining deduction already covers those days, so
  // counting their LOP again would double-deduct.
  const rows = (allRows || []).filter(
    (row) => !joiningDate || String(row.attendance_date) >= joiningDate,
  );

  const totalLopDays = rows.reduce(
    (sum, row) => sum + Number(row.lop_days || 0),
    0,
  );

  // A row that's checked in but never had LOP processed (e.g. still
  // missing check-out) is a warning, not an error - it does not block
  // the preview/draft, per the "unprocessed working days" decision.
  const unprocessedCount = rows.filter((row) => !row.lop_processed).length;

  return {
    totalLopDays,
    unprocessedCount,
    attendanceDates: new Set(rows.map((row) => String(row.attendance_date))),
  };
};

/**
 * Calculate a full payroll breakdown for one employee for one month.
 * Does not write anything to the database.
 *
 * @param {number} employeeId
 * @param {string} payrollMonth - "YYYY-MM-01"
 */
export const calculatePayrollForEmployee = async (
  employeeId,
  payrollMonth,
) => {
  const [year, month] = payrollMonth.split("-").map(Number);

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, first_name, monthly_salary, joining_date")
    .eq("id", employeeId)
    .single();

  if (employeeError) throw employeeError;

  // --------------------------------------------------------------
  // 1 & 2. Active assignment -> Basic salary, with legacy fallback.
  // --------------------------------------------------------------
  const assignment = await getActiveAssignment(employeeId, payrollMonth);

  const configuration = assignment?.salary_configurations || null;

  const usedLegacyFallback = !assignment;

  const basicSalary = round2(
    assignment?.override_basic_salary ??
      configuration?.basic_salary ??
      employee.monthly_salary ??
      0,
  );

  // --------------------------------------------------------------
  // 3. Components -> Gross.
  // --------------------------------------------------------------
  let components = [];

  if (configuration?.id) {
    const { data, error } = await supabase
      .from("salary_components")
      .select("*")
      .eq("salary_configuration_id", configuration.id)
      .eq("is_included", true);

    if (error) throw error;
    components = data || [];
  }

  const componentBreakdown = components.map((component) => {
    const amount =
      component.calculation_type === "Percentage"
        ? round2((Number(component.amount) / 100) * basicSalary)
        : round2(component.amount);

    return {
      name: component.component_name,
      amount,
    };
  });

  const componentTotal = round2(
    componentBreakdown.reduce((sum, item) => sum + item.amount, 0),
  );

  const grossSalary = round2(basicSalary + componentTotal);

  // --------------------------------------------------------------
  // 4. Deductions -> against final Gross.
  // --------------------------------------------------------------
  let deductions = [];

  if (configuration?.id) {
    const { data, error } = await supabase
      .from("salary_deductions")
      .select("*")
      .eq("salary_configuration_id", configuration.id)
      .eq("is_included", true);

    if (error) throw error;
    deductions = data || [];
  }

  const deductionBreakdown = deductions.map((deduction) => {
    let amount;

    if (deduction.calculation_type === "Percentage") {
      const base =
        deduction.calc_base === "Gross" ? grossSalary : basicSalary;
      amount = round2((Number(deduction.amount) / 100) * base);
    } else {
      amount = round2(deduction.amount);
    }

    return {
      name: deduction.deduction_name,
      amount,
    };
  });

  const deductionTotal = round2(
    deductionBreakdown.reduce((sum, item) => sum + item.amount, 0),
  );

  // --------------------------------------------------------------
  // 5. LOP deduction, from this month's attendance.lop_days.
  // --------------------------------------------------------------
  const { data: policy, error: policyError } = await supabase
    .from("attendance_policy")
    .select("weekly_off_days")
    .limit(1)
    .maybeSingle();

  if (policyError) throw policyError;

  const { data: holidayRows, error: holidayError } = await supabase
    .from("holidays")
    .select("holiday_date")
    .gte(
      "holiday_date",
      `${year}-${String(month).padStart(2, "0")}-01`,
    )
    .lte(
      "holiday_date",
      `${year}-${String(month).padStart(2, "0")}-${new Date(
        year,
        month,
        0,
      ).getDate()}`,
    );

  if (holidayError) throw holidayError;

  const workingDays = getWorkingDaysInMonth(
    year,
    month,
    policy?.weekly_off_days,
    (holidayRows || []).map((row) => row.holiday_date),
  );

  const monthStartString = `${year}-${String(month).padStart(2, "0")}-01`;

  // joining_date arrives as "YYYY-MM-DD" (or null). Only a joining date
  // INSIDE this month matters for proration.
  const joiningDate = employee.joining_date
    ? String(employee.joining_date).slice(0, 10)
    : null;

  const { totalLopDays, unprocessedCount, attendanceDates } =
    await getMonthlyLopSummary(employeeId, year, month, joiningDate);

  // The per-day rate used for LOP now follows the salary structure's LOP rule
  // (set by the admin on the structure):
  //   Auto         - Basic / working days of the month (the original rule)
  //   FixedPerDay  - a fixed rupee amount for every LOP day
  //   FixedDivisor - Basic / a fixed number (e.g. 30), regardless of how
  //                  many working days the month has
  // A structure with no rule (or an employee on the legacy monthly_salary
  // fallback) behaves exactly as before: Auto.
  const dailyRate = workingDays > 0 ? basicSalary / workingDays : 0;

  const lopMode = configuration?.lop_mode || "Auto";
  const lopValue = Number(configuration?.lop_value) || 0;

  let lopDailyRate = dailyRate;

  if (lopMode === "FixedPerDay" && lopValue > 0) {
    lopDailyRate = lopValue;
  } else if (lopMode === "FixedDivisor" && lopValue > 0) {
    lopDailyRate = basicSalary / lopValue;
  }

  const lopDeduction = round2(lopDailyRate * totalLopDays);

  // --------------------------------------------------------------
  // 5b. Joining-date proration + working days with no attendance row.
  //     Walk the month once: working days before the joining date are
  //     unpaid (same daily rate as LOP); working days from the joining
  //     date on that have NO attendance row at all are surfaced as a
  //     warning only - never silently turned into LOP.
  // --------------------------------------------------------------
  const holidaySet = new Set((holidayRows || []).map((row) => row.holiday_date));
  const daysInMonth = new Date(year, month, 0).getDate();

  let preJoiningDays = 0;
  const unrecordedDates = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const dateString = formatLocalDate(date);

    if (isWeeklyOffDay(policy?.weekly_off_days, date)) continue;
    if (holidaySet.has(dateString)) continue;

    if (joiningDate && joiningDate > monthStartString && dateString < joiningDate) {
      preJoiningDays += 1;
      continue;
    }

    if (!attendanceDates.has(dateString)) {
      unrecordedDates.push(dateString);
    }
  }

  // Pre-joining days are not LOP - they are days before the employee was on
  // the payroll - so they always use the true Basic / working-days rate,
  // never the admin's LOP rule.
  const joiningDeduction = round2(dailyRate * preJoiningDays);

  // --------------------------------------------------------------
  // 6. Net.
  // --------------------------------------------------------------
  const totalDeductions = round2(
    deductionTotal + lopDeduction + joiningDeduction,
  );
  const netSalary = round2(grossSalary - totalDeductions);

  return {
    employeeId,
    employeeName: employee.first_name,
    payrollMonth,
    salaryConfigurationId: configuration?.id ?? null,
    basicSalary,
    components: componentBreakdown,
    grossSalary,
    deductions: deductionBreakdown,
    lopDays: totalLopDays,
    lopMode,
    lopDailyRate: round2(lopDailyRate),
    lopDeduction,
    preJoiningDays,
    joiningDeduction,
    totalDeductions,
    netSalary,
    warnings: {
      usedLegacyFallback,
      unprocessedAttendanceRows: unprocessedCount,
      unrecordedWorkingDays: unrecordedDates.length,
      negativeNet: netSalary < 0,
    },
  };
};