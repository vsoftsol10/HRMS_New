import supabase from "../config/supabase.js";
import { rejectSelfAction } from "../utils/selfActionGuard.js";
import { getMonthRange, getToday } from "../utils/dateUtils.js";
import { calculatePayrollForEmployee } from "../services/payrollCalculationService.js";
import { getAttendanceSummaryForMonth } from "../services/attendanceSummaryService.js";
import { getSixMonthSummary } from "../services/sixMonthSummaryService.js";
import { createNotification } from "../services/notificationService.js";
import { safeErrorMessage } from "../utils/httpError.js";

// GET ALL PAYROLLS

export const getPayrolls = async (req, res) => {
  try {
    const { month, fromMonth, toMonth } = req.query;

    // Current month (YYYY-MM-01)
    const { startOfMonth: currentMonth } = getMonthRange();

    let query = supabase.from("payroll").select(
      `
        *,
        employees(
          *,
          departments(
            department_name
          )
        ),
        payroll_items(
          *
        )
      `,
    );

    /*
     * FIX: the Payroll page's month filter is a From/To month range
     * ("YYYY-MM" values from <input type="month">), but this endpoint only
     * understood a single `month`, and the page was reading a `filters.month`
     * key that the filter never sets - so past months could never be
     * loaded. A range is now supported. The upper bound is the LAST day of
     * the "to" month so any row stored anywhere inside that month matches.
     */
    if (fromMonth || toMonth) {
      const from = fromMonth || toMonth;
      const to = toMonth || fromMonth;

      const [fromYear, fromMonthNumber] = from.split("-").map(Number);
      const [toYear, toMonthNumber] = to.split("-").map(Number);

      if (
        !fromYear ||
        !fromMonthNumber ||
        !toYear ||
        !toMonthNumber
      ) {
        return res.status(400).json({
          message: "fromMonth and toMonth must be in YYYY-MM format.",
        });
      }

      const { startOfMonth: rangeStart } = getMonthRange(
        new Date(fromYear, fromMonthNumber - 1, 1),
      );
      const { endOfMonth: rangeEnd } = getMonthRange(
        new Date(toYear, toMonthNumber - 1, 1),
      );

      query = query
        .gte("payroll_month", rangeStart)
        .lte("payroll_month", rangeEnd);
    } else if (month) {
      // Selected single month
      query = query.eq("payroll_month", month);
    } else {
      // Initial load -> current month's payroll
      query = query.eq("payroll_month", currentMonth);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "payrollController"),
    });
  }
};

// GET PAYROLL BY ID
export const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("payroll")
      .select(
        `
        *,
        employees(
          *,
          departments(
            department_name
          )
        ),
        payroll_items(
          *
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "payrollController"),
    });
  }
};
// REVIEW (Draft -> Review): a lightweight status flip, still editable
// and deletable - this is HR acknowledging they've looked at the Draft,
// not a lock.

export const reviewPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: existingError } = await supabase
      .from("payroll")
      .select("id, status, employee_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existing) {
      return res.status(404).json({ message: "Payroll not found." });
    }

    if (rejectSelfAction(req, res, existing.employee_id, "review payroll")) {
      return;
    }

    if (existing.status !== "Draft") {
      return res.status(409).json({
        message: `Only a Draft payroll can be moved to Review (current status: ${existing.status}).`,
      });
    }

    const { data, error } = await supabase
      .from("payroll")
      .update({ status: "Review", updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "payrollController") });
  }
};

// FINALIZE (Review -> Finalized): builds and freezes the snapshot
// (department, designation, structure, components, deductions,
// attendance summary). From this point the row is locked - see
// deletePayroll below, and this endpoint itself refuses to run twice.

export const finalizePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: payroll, error: payrollError } = await supabase
      .from("payroll")
      .select(
        `
        *,
        employees(
          first_name,
          department_id,
          designation_id,
          departments(department_name),
          designations(designation_name)
        ),
        payroll_items(*),
        salary_configurations(structure_name)
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (payrollError) throw payrollError;

    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found." });
    }

    if (rejectSelfAction(req, res, payroll.employee_id, "finalize payroll")) {
      return;
    }

    if (payroll.status !== "Review") {
      return res.status(409).json({
        message: `Only a payroll in Review can be Finalized (current status: ${payroll.status}).`,
      });
    }

    const [year, month] = payroll.payroll_month.split("-").map(Number);

    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
      new Date(year, month, 0).getDate(),
    ).padStart(2, "0")}`;

    if (getToday() <= monthEnd) {
      return res.status(409).json({
        message: `This payroll cannot be finalized until the month has ended (after ${monthEnd}).`,
      });
    }

    /*
     * FIX: Draft/Review numbers were calculated when "Run Payroll" was
     * clicked and never refreshed, while the snapshot below reads the
     * attendance summary fresh - so a payslip could show LOP days that the
     * net salary never deducted. Draft/Review rows are still editable, so
     * the figures are recalculated from the current salary assignment and
     * attendance right before they are frozen.
     */
    const fresh = await calculatePayrollForEmployee(
      payroll.employee_id,
      payroll.payroll_month,
    );

    if (!fresh.basicSalary) {
      return res.status(409).json({
        message: "No salary is configured for this employee - assign a salary structure first.",
      });
    }

    if (fresh.warnings?.negativeNet) {
      return res.status(409).json({
        message: "Deductions (including LOP) exceed gross salary - fix the salary structure or attendance first.",
      });
    }

    const { error: refreshError } = await supabase
      .from("payroll")
      .update({
        basic_salary: fresh.basicSalary,
        gross_salary: fresh.grossSalary,
        deductions: fresh.totalDeductions,
        net_salary: fresh.netSalary,
        lop_days: fresh.lopDays,
        salary_configuration_id: fresh.salaryConfigurationId,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (refreshError) throw refreshError;

    const { error: clearItemsError } = await supabase
      .from("payroll_items")
      .delete()
      .eq("payroll_id", id);

    if (clearItemsError) throw clearItemsError;

    const freshItems = [
      ...fresh.components.map((item) => ({
        payroll_id: Number(id),
        item_type: "Component",
        item_name: item.name,
        amount: item.amount,
      })),
      ...fresh.deductions.map((item) => ({
        payroll_id: Number(id),
        item_type: "Deduction",
        item_name: item.name,
        amount: item.amount,
      })),
    ];

    if (fresh.lopDeduction > 0) {
      freshItems.push({
        payroll_id: Number(id),
        item_type: "Deduction",
        item_name: "Loss Of Pay",
        amount: fresh.lopDeduction,
      });
    }

    if (fresh.joiningDeduction > 0) {
      freshItems.push({
        payroll_id: Number(id),
        item_type: "Deduction",
        item_name: "Pre-joining Days",
        amount: fresh.joiningDeduction,
      });
    }

    if (freshItems.length) {
      const { error: itemsError } = await supabase
        .from("payroll_items")
        .insert(freshItems);

      if (itemsError) throw itemsError;
    }

    const attendanceSummary = await getAttendanceSummaryForMonth(
      payroll.employee_id,
      year,
      month,
    );

    const snapshot = {
      department: payroll.employees?.departments?.department_name ?? null,
      designation: payroll.employees?.designations?.designation_name ?? null,
      structureName: payroll.salary_configurations?.structure_name ?? null,
      basicSalary: fresh.basicSalary,
      grossSalary: fresh.grossSalary,
      deductions: fresh.totalDeductions,
      netSalary: fresh.netSalary,
      components: freshItems
        .filter((item) => item.item_type === "Component")
        .map((item) => ({ name: item.item_name, amount: item.amount })),
      deductionItems: freshItems
        .filter((item) => item.item_type === "Deduction")
        .map((item) => ({ name: item.item_name, amount: item.amount })),
      attendanceSummary,
      // The LOP rate that was applied, so a finalized payslip can always be
      // explained later even if the structure's rule is changed afterwards.
      lop: {
        days: fresh.lopDays,
        mode: fresh.lopMode,
        dailyRate: fresh.lopDailyRate,
        amount: fresh.lopDeduction,
      },
      finalizedAt: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await supabase
      .from("payroll")
      .update({
        status: "Finalized",
        snapshot,
        finalized_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    await createNotification({
      title: "Payroll Generated",
      message: "Your payroll has been generated.",
      type: "Payroll",
      role: "Employee",
      employee_id: payroll.employee_id,
      reference_id: payroll.id,
    });

    // If every payroll row under this run has now reached Finalized/Paid,
    // mark the run itself Completed.
    if (payroll.payroll_run_id) {
      const { data: siblingRows, error: siblingError } = await supabase
        .from("payroll")
        .select("status")
        .eq("payroll_run_id", payroll.payroll_run_id);

      if (siblingError) throw siblingError;

      const allDone = (siblingRows || []).every((row) =>
        ["Finalized", "Paid"].includes(row.status),
      );

      if (allDone) {
        await supabase
          .from("payroll_runs")
          .update({ status: "Completed", processed_at: new Date() })
          .eq("id", payroll.payroll_run_id);
      }
    }

    // FIX: finalize silently recalculates (see above), so the admin could be
    // looking at one net salary on screen and finalize a different one with
    // no sign of it. The response now says whether the figures moved and
    // repeats the data-quality warnings that Run Payroll showed.
    const previousNet = Number(payroll.net_salary);
    const recalculationNotes = [];

    if (fresh.warnings?.usedLegacyFallback) {
      recalculationNotes.push("no salary structure assigned (used monthly salary)");
    }
    if (fresh.warnings?.unprocessedAttendanceRows > 0) {
      recalculationNotes.push(
        `${fresh.warnings.unprocessedAttendanceRows} attendance row(s) not LOP-processed`,
      );
    }
    if (fresh.warnings?.unrecordedWorkingDays > 0) {
      recalculationNotes.push(
        `${fresh.warnings.unrecordedWorkingDays} working day(s) with no attendance record (paid in full)`,
      );
    }

    res.json({
      ...updated,
      recalculation: {
        changed: Math.abs(previousNet - fresh.netSalary) > 0.005,
        previousNetSalary: previousNet,
        newNetSalary: fresh.netSalary,
        warnings: recalculationNotes,
      },
    });
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "payrollController") });
  }
};

// SIX-MONTH SUMMARY (Admin/HR) - pure aggregation, see
// sixMonthSummaryService.js for what's included and why.

export const getSixMonthSummaryForEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { uptoMonth } = req.query;

    const summary = await getSixMonthSummary(employeeId, uptoMonth);

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "payrollController") });
  }
};

// MARK AS PAID (Finalized -> Paid)

export const markPayrollAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: existingError } = await supabase
      .from("payroll")
      .select("id, status, employee_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existing) {
      return res.status(404).json({ message: "Payroll not found." });
    }

    if (rejectSelfAction(req, res, existing.employee_id, "mark payroll as paid")) {
      return;
    }

    if (existing.status !== "Finalized") {
      return res.status(409).json({
        message: `Only a Finalized payroll can be marked Paid (current status: ${existing.status}).`,
      });
    }

    const { data, error } = await supabase
      .from("payroll")
      .update({
        status: "Paid",
        paid_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "payrollController") });
  }
};

// DELETE

export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    /*
     * FIX: any payroll record - including one already Paid - could be
     * deleted, which silently erases a finalized payslip. Paid AND
     * Finalized payroll are now immutable through this endpoint - only
     * Draft/Review rows can be deleted.
     */
    const { data: existing, error: existingError } = await supabase
      .from("payroll")
      .select("id, status, payroll_run_id, employee_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existing) {
      return res.status(404).json({ message: "Payroll not found." });
    }

    if (rejectSelfAction(req, res, existing.employee_id, "delete payroll")) {
      return;
    }

    if (["Finalized", "Paid"].includes(existing.status)) {
      return res.status(409).json({
        message: `A ${existing.status.toLowerCase()} payroll cannot be deleted.`,
      });
    }

    const { error } = await supabase.from("payroll").delete().eq("id", id);

    if (error) throw error;

    // If the deleted row was the last unfinished one in its run, the run is
    // now complete - otherwise it would stay "Pending" forever.
    if (existing.payroll_run_id) {
      const { data: siblingRows, error: siblingError } = await supabase
        .from("payroll")
        .select("status")
        .eq("payroll_run_id", existing.payroll_run_id);

      if (siblingError) throw siblingError;

      if (
        (siblingRows || []).length > 0 &&
        siblingRows.every((row) => ["Finalized", "Paid"].includes(row.status))
      ) {
        await supabase
          .from("payroll_runs")
          .update({ status: "Completed", processed_at: new Date() })
          .eq("id", existing.payroll_run_id);
      }
    }

    res.json({
      message: "Payroll deleted successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "payrollController") });
  }
};