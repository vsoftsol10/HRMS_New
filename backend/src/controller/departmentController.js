import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getDepartments = async (req, res) => {
  try {
    const [{ data: departments }, { data: employees }] = await Promise.all([
      supabase.from("departments").select("*").order("department_name"),

      supabase.from("employees").select("department_id, role, status"),
    ]);

    // Interns are stored in `employees` with role = "Intern". They are
    // counted separately so the "Employees" number stays a headcount of
    // regular staff. Removed interns (Inactive) are not counted.
    const employeeCounts = {};
    const internCounts = {};

    for (const emp of employees) {
      if (emp.role === "Intern") {
        if (emp.status === "Inactive") continue;

        internCounts[emp.department_id] =
          (internCounts[emp.department_id] || 0) + 1;
      } else {
        employeeCounts[emp.department_id] =
          (employeeCounts[emp.department_id] || 0) + 1;
      }
    }

    const result = departments.map((dept) => ({
      ...dept,
      employees: employeeCounts[dept.id] || 0,
      interns: internCounts[dept.id] || 0,
    }));

    res.json(result);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: safeErrorMessage(err, "departmentController"),
    });
  }
};

export const addDepartment = async (req, res) => {
  try {
    const { department_name, department_head, description } = req.body;

    const { data, error } = await supabase
      .from("departments")
      .insert({
        department_name,
        department_head,
        description,
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "departmentController"),
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const { department_name, department_head, description } = req.body;

    const { data, error } = await supabase
      .from("departments")
      .update({
        department_name,
        department_head,
        description,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "departmentController"),
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employees exist
    const { data: employees, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("department_id", id)
      .limit(1);

    if (employeeError) throw employeeError;

    if (employees.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete department. Employees are assigned to this department.",
      });
    }

    const { error } = await supabase.from("departments").delete().eq("id", id);

    if (error) throw error;

    res.json({
      message: "Department deleted successfully.",
    });
  } catch (err) {
    res.status(500).json({
      message: safeErrorMessage(err, "departmentController"),
    });
  }
};