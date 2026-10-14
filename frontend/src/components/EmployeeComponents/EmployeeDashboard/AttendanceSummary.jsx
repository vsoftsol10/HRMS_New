import { CalendarCheck } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";

export default function AttendanceSummary({ attendancePercentage = 0, present = 0, absent = 0, leave = 0, late = 0 }) {
  

  const month = new Date().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const chartData = [
    {
      name: "Present",
      value: present,
      color: "#22C55E",
    },
    {
      name: "Absent",
      value: absent,
      color: "#EF4444",
    },
    {
      name: "Leave",
      value: leave,
      color: "#F97316",
    },
    {
      name: "Late",
      value: late,
      color: "#FACC15",
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
      {/* Header */}

      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
          <CalendarCheck className="text-yellow-600" size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-xl">Attendance Summary</h2>

          <p className="text-sm text-gray-500">{month}</p>
        </div>
      </div>

      {/* Pie Chart */}

      <div className="flex justify-center mt-8 relative">
        <PieChart width={220} height={220}>
          <Pie
            data={chartData}
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
        </PieChart>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold">{attendancePercentage}%</h1>

          <p className="text-sm text-gray-500">Attendance</p>
        </div>
      </div>

      {/* Attendance Stats */}

      <div className="mt-8 space-y-4">
        <AttendanceItem
          color="bg-green-500"
          title="Present Days"
          value={present}
        />

        <AttendanceItem color="bg-red-500" title="Absent Days" value={absent} />

        <AttendanceItem
          color="bg-orange-500"
          title="Leave Days"
          value={leave}
        />

        <AttendanceItem
          color="bg-yellow-500"
          title="Late Check-ins"
          value={late}
        />
      </div>
    </div>
  );
}

function AttendanceItem({ title, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${color}`} />

        <p className="text-gray-700">{title}</p>
      </div>

      <p className="font-semibold">{value}</p>
    </div>
  );
}