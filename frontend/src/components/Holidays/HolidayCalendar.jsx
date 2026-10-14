import MonthCard from "./MonthCards";

export default function HolidayCalendar({ holidays = [] }) {
  const year = new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, index) => {
    const firstDay = new Date(year, index, 1);

    const monthHolidays = holidays
      .filter((holiday) => {
        const date = new Date(holiday.holiday_date);

        return date.getFullYear() === year && date.getMonth() === index;
      })
      .map((holiday) => ({
        day: new Date(holiday.holiday_date).getDate(),
        name: holiday.holiday_name,
        type: holiday.type,
      }));

    return {
      month: firstDay.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      startDay: firstDay.getDay(),
      days: new Date(year, index + 1, 0).getDate(),
      holidays: monthHolidays,
    };
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {months.map((month, index) => (
        <MonthCard key={index} {...month} />
      ))}
    </div>
  );
}
