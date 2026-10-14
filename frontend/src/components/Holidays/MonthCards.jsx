export default function MonthCard({ month, startDay, days, holidays = [] }) {
  const week = ["Su", "M", "T", "W", "Th", "F", "S"];

  const blanks = Array(startDay).fill("");

  const calendar = [
    ...blanks,
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-300 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-xl font-semibold">{month}</h2>

      <div className="grid grid-cols-7 gap-3 text-center text-gray-500">
        {week.map((day) => (
          <div key={day}>{day}</div>
        ))}

        {calendar.map((day, index) => {
          const holiday = holidays.find((h) => h.day === day);

          return (
            <div key={index}>
              {holiday ? (
                <div
                  className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 font-semibold"
                  title={holiday.name}
                >
                  {day}
                </div>
              ) : (
                <div>{day}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-gray-300 pt-3 space-y-1 text-sm">
        {holidays.length > 0 ? (
          holidays.map((holiday) => (
            <p key={holiday.day}>
              <strong>{holiday.day}</strong> : {holiday.name}
            </p>
          ))
        ) : (
          <p className="text-gray-400">No Holidays</p>
        )}
      </div>
    </div>
  );
}
