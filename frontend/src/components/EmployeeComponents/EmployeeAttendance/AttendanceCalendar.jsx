export default function AttendanceCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getColor = (day) => {
    if ([1, 2, 5, 6, 8, 9, 12, 15, 16, 20, 21, 22, 23].includes(day)) {
      return "bg-green-100 text-green-700 border-green-300";
    }

    if ([7].includes(day)) {
      return "bg-red-100 text-red-700 border-red-300";
    }

    if ([14, 19].includes(day)) {
      return "bg-orange-100 text-orange-700 border-orange-300";
    }

    if ([13].includes(day)) {
      return "bg-blue-100 text-blue-700 border-blue-300";
    }

    return "bg-gray-50 text-gray-500 border-gray-400";
  };

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h1 className="text-3xl font-bold">Monthly Attendance Calendar</h1>

      <p className="text-gray-500 mb-8">July 2026</p>

      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => (
          <div
            key={day}
            className={`h-28 rounded-xl border flex items-center justify-center text-xl font-semibold ${getColor(day)}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex gap-8 mt-8 flex-wrap">
        <Legend title="Present" color="bg-green-500" />
        <Legend title="Absent" color="bg-red-500" />
        <Legend title="Leave" color="bg-orange-500" />
        <Legend title="Holiday" color="bg-blue-500" />
        <Legend title="Weekend" color="bg-gray-400" />
      </div>
    </div>
  );
}

function Legend({ title, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${color}`} />

      <span>{title}</span>
    </div>
  );
}
