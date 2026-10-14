     import supabase from "../config/supabase.js";
    import { matchesDepartment, departmentsAsArray } from "../utils/departmentMatch.js";
    import { safeErrorMessage } from "../utils/httpError.js";

    export const getEmployeeAnnouncements = async (req, res) => {
      try {
        const employeeId = req.user.employee_id;

        // Get employee's department information
        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select(
            `
            department_id,
            departments (
              department_name
            )
          `,
          )
          .eq("id", employeeId)
          .single();

        if (employeeError) throw employeeError;

        const departmentId = employee.department_id;

        // Fetch all Published announcements and filter by department in JS
        // (see departmentMatch.js) - `department` can be stored as null,
        // "All", a single id, or an array of ids, so a simple .eq() filter
        // can silently miss rows.
        const { data, error } = await supabase
          .from("announcements")
          .select(
            `
            *,
            employees (
              employee_code,
              first_name
            )
          `,
          )
          .eq("status", "Published")
          .order("created_at", {
            ascending: false,
          });

        if (error) throw error;

        // Interns also receive announcements addressed to "Interns".
        const isIntern = req.user.role === "Intern";

        const filtered = (data || [])
          .filter((a) => matchesDepartment(a.department, departmentId, isIntern))
          .map((a) => ({ ...a, department: departmentsAsArray(a.department) }));

        res.status(200).json(filtered);
      } catch (err) {
        console.error("Employee Announcement Error:", err);

        res.status(500).json({
          message: safeErrorMessage(err, "employeeAnnouncementController"),
        });
      }
    };