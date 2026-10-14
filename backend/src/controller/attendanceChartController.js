import supabase from "../config/supabase.js";
import { formatLocalDate } from "../utils/dateUtils.js";
import { safeErrorMessage } from "../utils/httpError.js";
export const getAttendanceChart = async (req, res) => {
  try {
    const attendanceChart = [];

    const { count: totalActiveEmployees, error: employeeError } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active")
      .neq("role", "Intern");

    if (employeeError) {
      throw employeeError;
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const formattedDate = formatLocalDate(date);

      const day = date.toLocaleDateString("en-US", {
        weekday: "short",
      });

      const { count: present, error: presentError } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", formattedDate)
        .in("status", ["Present", "Late", "Half Day"]);

      if (presentError) {
        throw presentError;
      }

      const { count: absent, error: absentError } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", formattedDate)
        .eq("status", "Absent");

      if (absentError) {
        throw absentError;
      }

      attendanceChart.push({
        day,
        present: present || 0,
        absent: absent || 0,
      });
    }

    res.json({
      totalActiveEmployees: totalActiveEmployees || 0,
      attendanceChart,
    });
  } catch (error) {
    res.status(500).json({
      message: safeErrorMessage(error, "attendanceChartController"),
    });
  }
};