import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import useFetch from "../../hooks/useFetch";
import attendanceChartServices from "../../services/attendanceChartServices";

export default function AttendanceTrend() {
  const { data = {} } = useFetch(attendanceChartServices);

  const attendanceData = data?.attendanceChart || [];
  const totalActiveEmployees = data?.totalActiveEmployees || 0;

  return (
    <div className="bg-white border border-gray-300 rounded-3xl p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Attendance Trend (This Week)
      </h2>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={attendanceData}>
            <CartesianGrid stroke="#b4b6ba" strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis domain={[0, totalActiveEmployees]} allowDecimals={false} />

            <Tooltip
              contentStyle={{
                borderRadius: "7px",
              }}
            />

            <Bar
              dataKey="present"
              fill="#eab308"
              radius={[4, 4, 0, 0]}
              name="Present"
            />

            <Bar
              dataKey="absent"
              fill="#9b9b9b"
              radius={[4, 4, 0, 0]}
              name="Absent"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}