import supabase from "../config/supabase.js";
import { getSixMonthSummary } from "../services/sixMonthSummaryService.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getEmployeePayroll = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

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
        payroll_items(*)
      `,
      )
      .eq("employee_id", employeeId)
      .in("status", ["Finalized", "Paid"])
      .order("payroll_month", {
        ascending: false,
      });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "employeePayrollController"),
    });
  }
};

// SIX-MONTH SUMMARY (self-service) - the logged-in employee's own
// summary only, no employeeId param needed.

export const getMySixMonthSummary = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const { uptoMonth } = req.query;

    const summary = await getSixMonthSummary(employeeId, uptoMonth);

    res.json(summary);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "employeePayrollController"),
    });
  }
};