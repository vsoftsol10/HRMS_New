import { useNavigate } from "react-router-dom";

export default function UpcomingHolidays({ holidays = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-300 rounded-3xl p-4 h-full">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-semibold">Upcoming Holidays</h2>

        <button className="font-medium" onClick={() => navigate("/admin/holidays")}>
          View all
        </button>
      </div>

      <div className="space-y-4">
        {holidays.length > 0 ? (
          holidays.map((holiday) => {
            const date = new Date(holiday.holiday_date);

            return (
              <div key={holiday.id} className="flex items-center gap-4">
                <div className="bg-yellow-100 rounded-xl w-16 h-16 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold uppercase">
                    {date.toLocaleString("default", { month: "short" })}
                  </span>

                  <span className="text-2xl font-bold">{date.getDate()}</span>
                </div>

                <div>
                  <h3 className="font-semibold text-xl">
                    {holiday.holiday_name}
                  </h3>

                  <p className="text-gray-500">{holiday.type}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-8">
            No upcoming holidays.
          </p>
        )}
      </div>
    </div>
  );
}
