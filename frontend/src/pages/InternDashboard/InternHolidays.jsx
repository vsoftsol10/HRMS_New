// import Holidays from "../Dashboard/Holidays";

// export default function InternHolidays() {
//   return <Holidays isEmployee />;
// }

import { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import useFetch from "../../hooks/useFetch";
import holidayServices from "../../services/holidayServices";

// "2026-07-25" or "2026-07-25T00:00:00Z" -> "2026-07-25"
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "-");

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n) => String(n).padStart(2, "0");

export default function InternHolidays() {
  const [view, setView] = useState("list");
  const { data, loading, error, reload } = useFetch(holidayServices);

  const holidays = Array.isArray(data) ? data : [];

  return (
    <MainLayout title="Holidays">
      <div className="space-y-6">
        {/* Heading + view toggle */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
            <p className="text-sm text-gray-500 mt-1">
              View the holiday calendar for the year.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <ToggleButton
              active={view === "list"}
              icon={LayoutGrid}
              label="List"
              onClick={() => setView("list")}
            />
            <ToggleButton
              active={view === "calendar"}
              icon={CalendarDays}
              label="Calendar"
              onClick={() => setView("calendar")}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">Unable to load holidays.</p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {view === "list" ? (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-medium text-gray-500">
                    <th className="px-5 py-3">Holiday Name</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && holidays.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  )}

                  {!loading && holidays.length === 0 && !error && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500">
                        No holidays have been added yet.
                      </td>
                    </tr>
                  )}

                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {holiday.holiday_name}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {dateOnly(holiday.holiday_date)}
                      </td>
                      <td className="px-5 py-4">
                        {holiday.type ? (
                          <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                            {holiday.type}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {holiday.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <MonthCalendar holidays={holidays} />
        )}
      </div>
    </MainLayout>
  );
}

function ToggleButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer transition ${
        active ? "bg-yellow-400 text-gray-900" : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function MonthCalendar({ holidays }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  // "YYYY-MM-DD" -> [holiday names]
  const holidaysByDate = useMemo(() => {
    const map = {};

    holidays.forEach((holiday) => {
      const key = dateOnly(holiday.holiday_date);
      (map[key] ||= []).push(holiday.holiday_name);
    });

    return map;
  }, [holidays]);

  const { year, month } = cursor;
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const day = index - leadingBlanks + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const changeMonth = (delta) => {
    const next = new Date(year, month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h2 className="text-lg font-bold text-gray-900">{monthLabel}</h2>

        <div className="flex items-center gap-2">
          <NavButton onClick={() => changeMonth(-1)}>Prev</NavButton>
          <NavButton onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}>
            Today
          </NavButton>
          <NavButton onClick={() => changeMonth(1)}>Next</NavButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-3 mb-3">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {cells.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-[66px] rounded-lg border border-gray-200" />;
              }

              const names = holidaysByDate[`${year}-${pad(month + 1)}-${pad(day)}`] || [];
              const isHoliday = names.length > 0;

              return (
                <div
                  key={index}
                  className={`h-[66px] rounded-lg border px-2.5 py-2 overflow-hidden ${
                    isHoliday ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <p className="text-xs text-gray-900">{day}</p>
                  {names.map((name) => (
                    <p
                      key={name}
                      title={name}
                      className="mt-1 text-[11px] font-semibold text-gray-900 leading-tight line-clamp-2"
                    >
                      {name}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50 cursor-pointer"
    >
      {children}
    </button>
  );
}