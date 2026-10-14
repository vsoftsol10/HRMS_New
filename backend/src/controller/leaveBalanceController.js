import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

const getCurrentYear = () => new Date().getFullYear();

export const getLeaveBalances = async (req, res) => {
  try {
    const year = Number(req.query.year) || getCurrentYear();

    const { data, error } = await supabase
      .from("leave_balance")
      .select(
        `
        id,
        employee_id,
        casual_leave,
        sick_leave,
        earned_leave,
        lop,
        year,
        created_at,
        updated_at,
        employees (
          id,
          employee_code,
          first_name,
          department_id
        )
      `,
      )
      .eq("year", year)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Get leave balances error:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "leaveBalanceController"),
    });
  }
};

export const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const year = Number(req.query.year) || getCurrentYear();

    const { data, error } = await supabase
      .from("leave_balance")
      .select(
        `
        id,
        employee_id,
        casual_leave,
        sick_leave,
        earned_leave,
        lop,
        year,
        created_at,
        updated_at
      `,
      )
      .eq("employee_id", employeeId)
      .eq("year", year)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: `Leave balance not found for ${year}.`,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Get employee leave balance error:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "leaveBalanceController"),
    });
  }
};

export const initializeLeaveBalances = async (req, res) => {
  try {
    const year = Number(req.body.year) || getCurrentYear();

    // Get current leave policy
    const { data: policy, error: policyError } = await supabase
      .from("leave_policy")
      .select("*")
      .single();

    if (policyError) throw policyError;

    // Get active employees only
    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("status", "Active")
      .neq("role", "Intern");

    if (employeeError) throw employeeError;

    if (!employees.length) {
      return res.json({
        message: "No active employees found.",
      });
    }

    // Prepare balances
    const balances = employees.map((employee) => ({
      employee_id: employee.id,
      casual_leave: policy.casual_leave,
      sick_leave: policy.sick_leave,
      earned_leave: policy.earned_leave,
      lop: 0,
      year,
      // FIX: same not-null violation as leaveBalanceService.js -
      // "updated_at" has no DB-level default, so it must be set
      // explicitly when inserting via the raw Supabase client.
      updated_at: new Date().toISOString(),
    }));

    // Prevent duplicate employee/year records
    const { data, error } = await supabase
      .from("leave_balance")
      .upsert(balances, {
        onConflict: "employee_id,year",
        ignoreDuplicates: true,
      })
      .select();

    if (error) throw error;

    res.status(201).json({
      message: `Leave balances initialized for ${year}.`,
      count: data?.length || 0,
      data,
    });
  } catch (err) {
    console.error("Initialize leave balances error:", err);

    res.status(500).json({
      message: safeErrorMessage(err, "leaveBalanceController"),
    });
  }
};

export const getEmployeeBalanceById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = Number(req.query.year) || getCurrentYear();

    const { data, error } = await supabase
      .from("leave_balance")
      .select(
        `
        id,
        employee_id,
        casual_leave,
        sick_leave,
        earned_leave,
        lop,
        year,
        employees (
          id,
          employee_code,
          first_name
        )
      `,
      )
      .eq("employee_id", employeeId)
      .eq("year", year)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Leave balance not found.",
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "leaveBalanceController"),
    });
  }
};