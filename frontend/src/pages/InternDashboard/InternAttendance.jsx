import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Home,
  Info,
  Search,
  XCircle,
} from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import useFetch from "../../hooks/useFetch";
import internAttendanceServices from "../../services/internAttendanceServices";

// Rows per page in the table (design shows 6).
const PAGE_SIZE = 6;

const STATUS_STYLE = {
  Present: { icon: CheckCircle2, cls: "bg-green-50 text-green-600" },
  Late: { icon: Clock, cls: "bg-orange-50 text-orange-500" },
  "Half Day": { icon: Clock, cls: "bg-yellow-50 text-yellow-600" },
  Absent: { icon: XCircle, cls: "bg-red-50 text-red-500" },
  Leave: { icon: Home, cls: "bg-blue-50 text-blue-500" },
};

const toMonthKey = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

// "2026-08-31" or "2026-08-31T00:00:00Z" -> local Date (avoids UTC day shift)
const parseDate = (value) => {
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

// "07:05:24" -> "7.09h"
const formatHours = (value) => {
  if (!value) return "-";
  const [h, m] = String(value).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "-";
  return `${(h + m / 60).toFixed(2)}h`;
};

export default function InternAttendance() {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    // Backend (getEmployeeAttendance) expects month=1-12 and year=YYYY.
    () => ({ month: cursor.month + 1, year: cursor.year }),
    [cursor],
  );
  const { data, loading, error, reload } = useFetch(internAttendanceServices, params);

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const stats = data?.stats || {};
  // Half Day counts as 0.5 (same rule as the backend attendance percentage).
  const present =
    (stats.presentDays || 0) + (stats.lateDays || 0) + (stats.halfDays || 0) * 0.5;
  // Recorded Absent rows + working days with no record (display only).
  const absent = (stats.absentDays || 0) + (data?.missedDates?.length || 0);
  const leave = stats.leaveDays || 0;
  // Working days of the whole month (weekly offs + holidays excluded) from backend.
  const workingDays = data?.workingDays ?? 0;

  const rows = useMemo(() => {
    const records = Array.isArray(data?.attendance) ? data.attendance : [];

    return records.map((item) => {
      const date = parseDate(item.attendance_date);
      return {
        id: item.id,
        date,
        dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
        status: item.status,
        checkIn: formatTime(item.check_in),
        checkOut:
          item.auto_checkout && item.check_out
            ? `${formatTime(item.check_out)} (Auto)`
            : formatTime(item.check_out),
        hours: item.auto_checkout
          ? "Pending review"
          : formatHours(item.working_hours),
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      [row.dateLabel, row.weekday, row.status, row.checkIn, row.checkOut]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeMonth = (delta) => {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
    setPage(1);
  };

  const exportCsv = () => {
    const header = ["Date", "Day", "Status", "Check In", "Check Out", "Hours"];
    const lines = filtered.map((row) =>
      [row.dateLabel, row.weekday, row.status, row.checkIn, row.checkOut, row.hours]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${toMonthKey(cursor.year, cursor.month)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout title="Attendance">
      <div className="space-y-6">
        {/* Heading */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">
              {monthLabel} — Track your daily check-in and check-out.
            </p>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={15} />
            Export
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">Unable to load your attendance.</p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <TopStat icon={Info} iconBg="bg-blue-50" iconColor="text-blue-500" value={workingDays} label="Working Days" />
          <TopStat icon={CheckCircle2} iconBg="bg-green-50" iconColor="text-green-600" value={present} label="Present" />
          <TopStat icon={XCircle} iconBg="bg-red-50" iconColor="text-red-500" value={absent} label="Absent" />
          <TopStat icon={Home} iconBg="bg-gray-100" iconColor="text-gray-600" value={leave} label="Leave" />
        </div>

        {/* Table card */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center gap-4 p-5 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-yellow-400"
              />
            </div>

            <div className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className="cursor-pointer text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="min-w-[110px] text-center">{monthLabel}</span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                disabled={isCurrentMonth}
                aria-label="Next month"
                className="cursor-pointer text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr className="text-xs font-semibold tracking-wide text-gray-500">
                  <th className="px-5 py-3">DATE</th>
                  <th className="px-5 py-3">STATUS</th>
                  <th className="px-5 py-3">CHECK IN</th>
                  <th className="px-5 py-3">CHECK OUT</th>
                  <th className="px-5 py-3">HOURS</th>
                </tr>
              </thead>

              <tbody>
                {loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                      No attendance records for {monthLabel}.
                    </td>
                  </tr>
                )}

                {pageRows.map((row) => {
                  const style = STATUS_STYLE[row.status] || STATUS_STYLE.Present;
                  const Icon = style.icon;

                  return (
                    <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{row.dateLabel}</p>
                        <p className="text-xs text-gray-500">{row.weekday}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${style.cls}`}
                        >
                          <Icon size={11} />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row.checkIn}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row.checkOut}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{row.hours}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 text-sm border-t border-gray-100">
            <span className="text-gray-500">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="font-medium text-gray-900 cursor-pointer disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="font-medium text-gray-900 cursor-pointer disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function TopStat({ icon: Icon, iconBg, iconColor, value, label }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <span className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon size={17} className={iconColor} />
      </span>
      <p className="text-3xl font-bold text-gray-900 mt-4">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}