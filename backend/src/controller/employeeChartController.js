import supabase from "../config/supabase.js";
import { safeErrorMessage } from "../utils/httpError.js";

export const getEmployeeChart = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const { data, error } = await supabase
      .from("employees")
      .select("joining_date")
      .neq("role", "Intern");

    if (error) throw error;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const employeeGrowth = months.map((month) => ({
      month,
      total: 0,
    }));

    data?.forEach((employee) => {
      if (!employee.joining_date) return;

      const joiningDate = new Date(employee.joining_date);

      // Ignore employees who joined in previous years
      if (joiningDate.getFullYear() !== currentYear) return;

      const monthIndex = joiningDate.getMonth();
      employeeGrowth[monthIndex].total++;
    });

    res.json(employeeGrowth);
  } catch (error) {
    res.status(500).json({
      message: safeErrorMessage(error, "employeeChartController"),
    });
  }
};