import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";
import { rejectSelfAction } from "../utils/selfActionGuard.js";

// GET ACTIVE ASSIGNMENT for one employee (effective_to IS NULL)

export const getActiveAssignment = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const { data, error } = await supabase
      .from("employee_salary_assignments")
      .select(
        `
        *,
        salary_configurations(
          id,
          structure_name,
          basic_salary,
          department_id,
          designation_id
        )
      `,
      )
      .eq("employee_id", employeeId)
      .is("effective_to", null)
      .maybeSingle();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "employeeSalaryAssignmentController") });
  }
};

// GET FULL HISTORY for one employee

export const getAssignmentHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const { data, error } = await supabase
      .from("employee_salary_assignments")
      .select(
        `
        *,
        salary_configurations(structure_name, basic_salary)
      `,
      )
      .eq("employee_id", employeeId)
      .order("effective_from", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "employeeSalaryAssignmentController") });
  }
};

// CREATE (assign an employee to a structure, optionally with an override
// Basic). Automatically closes the employee's current active assignment
// (if any) the day before the new one starts, so the partial unique
// index (one active row per employee) is never violated and there is
// no gap or overlap in the history.

export const createAssignment = async (req, res) => {
  try {
    const {
      employee_id,
      salary_configuration_id,
      override_basic_salary,
      effective_from,
    } = req.body;

    if (!employee_id || !salary_configuration_id || !effective_from) {
      return res.status(400).json({
        message: "employee_id, salary_configuration_id and effective_from are required.",
      });
    }

    if (rejectSelfAction(req, res, employee_id, "assign a salary structure")) {
      return;
    }

    // FIX: effective_from and the override were never validated, so a
    // malformed date or a negative / non-numeric override went straight in.
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(String(effective_from)) ||
      Number.isNaN(new Date(effective_from).getTime())
    ) {
      return res.status(400).json({
        message: "effective_from must be a valid date (YYYY-MM-DD).",
      });
    }

    if (
      override_basic_salary !== undefined &&
      override_basic_salary !== null &&
      override_basic_salary !== ""
    ) {
      const overrideValue = Number(override_basic_salary);

      if (Number.isNaN(overrideValue) || overrideValue <= 0) {
        return res.status(400).json({
          message: "Override basic salary must be a positive number.",
        });
      }
    }

    const { data: targetEmployee, error: targetEmployeeError } = await supabase
      .from("employees")
      .select("id, role, status")
      .eq("id", employee_id)
      .maybeSingle();

    if (targetEmployeeError) throw targetEmployeeError;

    if (!targetEmployee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Interns are excluded from payroll, so a salary assignment for one
    // would be dead data.
    if (targetEmployee.role === "Intern") {
      return res.status(400).json({
        message: "Interns are not part of payroll - a salary cannot be assigned.",
      });
    }

    const { data: targetStructure, error: targetStructureError } = await supabase
      .from("salary_configurations")
      .select("id")
      .eq("id", salary_configuration_id)
      .maybeSingle();

    if (targetStructureError) throw targetStructureError;

    if (!targetStructure) {
      return res.status(404).json({ message: "Salary structure not found." });
    }

    const { data: currentActive, error: currentActiveError } = await supabase
      .from("employee_salary_assignments")
      .select("id, effective_from")
      .eq("employee_id", employee_id)
      .is("effective_to", null)
      .maybeSingle();

    if (currentActiveError) throw currentActiveError;

    let closedPrevious = null;

    if (currentActive) {
      if (
        new Date(effective_from) <= new Date(currentActive.effective_from)
      ) {
        return res.status(400).json({
          message: "effective_from must be after the current assignment's start date.",
        });
      }

      const dayBefore = new Date(effective_from);
      dayBefore.setDate(dayBefore.getDate() - 1);

      const { error: closeError } = await supabase
        .from("employee_salary_assignments")
        .update({
          effective_to: dayBefore.toISOString().slice(0, 10),
          updated_at: new Date(),
        })
        .eq("id", currentActive.id);

      if (closeError) throw closeError;

      closedPrevious = currentActive.id;
    }

    const { data, error } = await supabase
      .from("employee_salary_assignments")
      .insert({
        employee_id,
        salary_configuration_id,
        override_basic_salary: override_basic_salary || null,
        effective_from,
        effective_to: null,
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      // FIX: the previous assignment had already been closed above, so a
      // failed insert left the employee with NO active assignment. Re-open
      // it before reporting the failure.
      if (closedPrevious) {
        await supabase
          .from("employee_salary_assignments")
          .update({ effective_to: null, updated_at: new Date() })
          .eq("id", closedPrevious);
      }

      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "employeeSalaryAssignmentController") });
  }
};

// DELETE - only allowed on the currently-active row, and only if no
// Draft/Review/Finalized/Paid payroll has already been generated off it
// (removing it would silently orphan a salary_configuration_id those
// payroll rows still reference for display).

export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: assignment, error: assignmentError } = await supabase
      .from("employee_salary_assignments")
      .select("id, employee_id, effective_to")
      .eq("id", id)
      .maybeSingle();

    if (assignmentError) throw assignmentError;

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (rejectSelfAction(req, res, assignment.employee_id, "remove a salary assignment")) {
      return;
    }

    if (assignment.effective_to !== null) {
      return res.status(409).json({
        message: "Only the current active assignment can be deleted.",
      });
    }

    const { error } = await supabase
      .from("employee_salary_assignments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // FIX: deleting the active assignment left the previous one closed
    // (effective_to still set), so the employee ended up with no active
    // assignment at all. The most recent earlier assignment is re-opened.
    const { data: previous, error: previousError } = await supabase
      .from("employee_salary_assignments")
      .select("id")
      .eq("employee_id", assignment.employee_id)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousError) throw previousError;

    if (previous) {
      const { error: reopenError } = await supabase
        .from("employee_salary_assignments")
        .update({ effective_to: null, updated_at: new Date() })
        .eq("id", previous.id);

      if (reopenError) throw reopenError;
    }

    res.json({ message: "Assignment deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: safeErrorMessage(err, "employeeSalaryAssignmentController") });
  }
};