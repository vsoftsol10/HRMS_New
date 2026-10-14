import supabase from "../config/supabase.js";
import { calculatePayrollForEmployee } from "../services/payrollCalculationService.js";
import { getToday } from "../utils/dateUtils.js";
import { safeErrorMessage } from "../utils/httpError.js";

// FIX: two Run Payroll requests for the same month arriving together (a
// double click) both passed the "already has a payroll row" check before
// either had inserted anything, producing duplicate drafts. Only one
// generation per month may be in flight at a time.
const runningMonths = new Set();

// GET ALL RUNS

export const getPayrollRuns = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payroll_runs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "payrollRunController"),
    });
  }
};

// GET RUN BY ID

export const getPayrollRunById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "payrollRunController"),
    });
  }
};

export const generatePayroll = async (req, res) => {
  let payrollRun = null;
  let createdNewRun = false;
  // Payroll rows inserted by THIS request - rolled back if a later insert
  // fails, so a mid-run error never leaves half a run of Drafts behind.
  const createdPayrollIds = [];
  let lockedMonth = null;

  try {
    const { payroll_month: requestedMonth } = req.body;
    if (!requestedMonth) {
      return res.status(400).json({
        message: "Payroll month is required.",
      });
    }

    /*
     * FIX: payroll_month must always be the FIRST day of the month
     * (YYYY-MM-01) - that is what the Payroll list, the month filter and
     * the "already generated" check all compare against. The client used
     * to send a UTC-shifted date (e.g. 2026-08-31 for September), so the
     * value is validated and normalised here instead of trusted as-is.
     */
    const monthMatch = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(
      String(requestedMonth),
    );

    if (!monthMatch || Number(monthMatch[2]) < 1 || Number(monthMatch[2]) > 12) {
      return res.status(400).json({
        message: "Payroll month must be a valid date (YYYY-MM-DD).",
      });
    }

    const payroll_month = `${monthMatch[1]}-${monthMatch[2]}-01`;
    const payrollYear = Number(monthMatch[1]);
    const payrollMonthNumber = Number(monthMatch[2]);

    if (runningMonths.has(payroll_month)) {
      return res.status(409).json({
        message: "Payroll generation for this month is already in progress.",
      });
    }

    runningMonths.add(payroll_month);
    lockedMonth = payroll_month;

    /*
     * FIX: payroll for a month that has not finished yet was generated with
     * LOP = 0 (attendance does not exist yet) and then frozen. A month can
     * only be processed once its last day has passed.
     */
    const lastDay = new Date(payrollYear, payrollMonthNumber, 0).getDate();
    const payrollMonthEnd = `${monthMatch[1]}-${monthMatch[2]}-${String(
      lastDay,
    ).padStart(2, "0")}`;

    if (getToday() <= payrollMonthEnd) {
      return res.status(400).json({
        message: `Payroll for ${monthMatch[1]}-${monthMatch[2]} can only be generated after the month has ended (after ${payrollMonthEnd}), so that attendance and LOP are complete.`,
      });
    }

    /*
     * NOTE: a Completed run no longer blocks here. Employees who already
     * have a payroll row for this month are skipped below, so a second
     * click is harmless - and an employee added after the run completed
     * can still get their own Draft instead of being locked out.
     */

    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .in("status", ["Active", "On Leave"])
      .neq("role", "Intern");

    if (employeeError) throw employeeError;

    if (!employees.length) {
      return res.status(400).json({
        message: "No active employees found.",
      });
    }

    /*
     * Employees who already have a payroll row for this month (a retry, or
     * a second click on "Run Payroll") are left alone - a Draft is never
     * silently recalculated. To regenerate one, delete that Draft first.
     */
    const { data: existingRows, error: existingRowsError } = await supabase
      .from("payroll")
      .select("employee_id")
      .eq("payroll_month", payroll_month);

    if (existingRowsError) throw existingRowsError;

    const alreadyProcessedIds = new Set(
      (existingRows || []).map((row) => row.employee_id),
    );

    // An employee whose joining date is after this month's last day was not
    // employed yet - no payroll row for them.
    const pendingEmployees = employees.filter(
      (employee) =>
        !alreadyProcessedIds.has(employee.id) &&
        !(
          employee.joining_date &&
          String(employee.joining_date).slice(0, 10) > payrollMonthEnd
        ),
    );

    if (!pendingEmployees.length) {
      return res.status(400).json({
        message:
          "Payroll drafts already exist for every active employee this month. Delete a Draft first if it needs to be regenerated.",
      });
    }

    /*
     * Calculate EVERYONE before creating the run, so one employee with no
     * salary can never leave a half-finished run (and a pile of Drafts for
     * the employees before them) behind. The original code had this
     * validation pass; it was lost when the calculation moved into
     * calculatePayrollForEmployee, and is restored here. All offenders are
     * listed at once instead of failing on the first.
     */
    const calculations = new Map();
    const unconfigured = [];
    const negativeNet = [];
    const warningList = [];

    for (const employee of pendingEmployees) {
      const result = await calculatePayrollForEmployee(
        employee.id,
        payroll_month,
      );

      if (!result.basicSalary) {
        unconfigured.push(employee.first_name);
        continue;
      }

      if (result.warnings?.negativeNet) {
        negativeNet.push(employee.first_name);
        continue;
      }

      calculations.set(employee.id, result);

      const notes = [];
      if (result.warnings?.usedLegacyFallback) {
        notes.push("no salary structure assigned (used monthly salary)");
      }
      if (result.warnings?.unprocessedAttendanceRows > 0) {
        notes.push(
          `${result.warnings.unprocessedAttendanceRows} attendance row(s) not LOP-processed`,
        );
      }
      if (result.warnings?.unrecordedWorkingDays > 0) {
        notes.push(
          `${result.warnings.unrecordedWorkingDays} working day(s) with no attendance record (paid in full)`,
        );
      }
      if (notes.length) {
        warningList.push({ employee: employee.first_name, notes });
      }
    }

    if (negativeNet.length) {
      return res.status(400).json({
        message: `Deductions (including LOP) exceed gross salary for: ${negativeNet.join(", ")}. Fix their salary structure or attendance before generating payroll.`,
      });
    }

    if (unconfigured.length) {
      return res.status(400).json({
        message: `No salary configured for: ${unconfigured.join(", ")}. Assign a salary structure (or set a monthly salary) before generating payroll.`,
      });
    }

    // 1. create the payroll run - or reuse this month's still-Pending one
    // (its Drafts are not all finalized yet), so a second click does not
    // leave a stray Pending run that can never complete.
    const { data: pendingRun, error: pendingRunError } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("payroll_month", payroll_month)
      .eq("status", "Pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingRunError) throw pendingRunError;

    if (pendingRun) {
      payrollRun = pendingRun;
    } else {
      const { data: createdRun, error: payrollRunError } = await supabase
        .from("payroll_runs")
        .insert({
          payroll_month,
          status: "Pending",
        })
        .select()
        .single();

      if (payrollRunError) throw payrollRunError;

      payrollRun = createdRun;
      createdNewRun = true;
    }

    // 2. create a Draft for each employee from the calculation above
    for (const employee of pendingEmployees) {
      const result = calculations.get(employee.id);

      // 6. create payroll record - Draft, not Paid. Lifecycle moves
      // forward via reviewPayroll -> finalizePayroll -> markPayrollAsPaid.
      const { data: payroll, error: payrollError } = await supabase
        .from("payroll")
        .insert([
          {
            employee_id: employee.id,
            payroll_month,
            basic_salary: result.basicSalary,
            gross_salary: result.grossSalary,
            deductions: result.totalDeductions,
            net_salary: result.netSalary,
            lop_days: result.lopDays,
            payroll_run_id: payrollRun.id,
            salary_configuration_id: result.salaryConfigurationId,
            status: "Draft",
            updated_at: new Date(),
          },
        ])
        .select()
        .single();

      if (payrollError) throw payrollError;

      createdPayrollIds.push(payroll.id);

      // 7. create payroll items - components, deductions, and LOP as its
      // own line item (matches the existing payroll_items pattern).
      for (const component of result.components) {
        const { error } = await supabase.from("payroll_items").insert([
          {
            payroll_id: payroll.id,
            item_type: "Component",
            item_name: component.name,
            amount: component.amount,
          },
        ]);

        if (error) throw error;
      }

      for (const deduction of result.deductions) {
        const { error } = await supabase.from("payroll_items").insert([
          {
            payroll_id: payroll.id,
            item_type: "Deduction",
            item_name: deduction.name,
            amount: deduction.amount,
          },
        ]);

        if (error) throw error;
      }

      if (result.lopDeduction > 0) {
        const { error } = await supabase.from("payroll_items").insert({
          payroll_id: payroll.id,
          item_type: "Deduction",
          item_name: "Loss Of Pay",
          amount: result.lopDeduction,
        });

        if (error) throw error;
      }

      if (result.joiningDeduction > 0) {
        const { error } = await supabase.from("payroll_items").insert({
          payroll_id: payroll.id,
          item_type: "Deduction",
          item_name: "Pre-joining Days",
          amount: result.joiningDeduction,
        });

        if (error) throw error;
      }

      // NOTE: leave_balance.lop is intentionally never touched here -
      // LOP now comes from attendance.lop_days (Step 2), not the old
      // yearly counter. The "Payroll Generated" notification has moved
      // to finalizePayroll, since Draft is not yet a finished payslip.
    }

    // 8. Run stays "Pending" - it only becomes "Completed" once every
    // payroll row under it reaches Finalized/Paid (see finalizePayroll).

    res.json({
      message: `Payroll draft generated for ${pendingEmployees.length} employee(s).`,
      warnings: warningList,
    });
  } catch (err) {
    /*
     * Roll back every Draft (and its items) this request already inserted,
     * so a retry starts clean instead of silently skipping those employees.
     */
    if (createdPayrollIds.length) {
      await supabase
        .from("payroll_items")
        .delete()
        .in("payroll_id", createdPayrollIds);

      await supabase.from("payroll").delete().in("id", createdPayrollIds);
    }

    /*
     * If a run was already created, mark it as Failed instead of
     * leaving it stuck at "Pending" forever — a stuck "Pending" run
     * would otherwise never block a retry (since only "Completed"
     * runs block regeneration now), but marking it Failed keeps the
     * payroll run history accurate for the admin.
     */
    if (createdNewRun && payrollRun?.id) {
      await supabase
        .from("payroll_runs")
        .update({ status: "Failed" })
        .eq("id", payrollRun.id);
    }

    res.status(500).json({
      message: safeErrorMessage(err, "payrollRunController"),
    });
  } finally {
    if (lockedMonth) {
      runningMonths.delete(lockedMonth);
    }
  }
};