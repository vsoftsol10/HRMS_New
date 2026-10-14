import { useEffect, useMemo, useState } from "react";
import FixCheckOutButton from "./FixCheckOutButton";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

import useFetch from "../../hooks/useFetch";
import departmentServices from "../../services/departmentServices";
import internAttendanceAdminServices from "../../services/internAttendanceAdminServices";
import { formatWorkingHours } from "../../utils/formatDuration";
import { getInitials } from "../../utils/internUtils";

const PAGE_SIZE = 10;

// Status filter value -> badge label + colours ("Half Day" shows as Half-day).
const STATUS = {
  Present: { label: "Present", cls: "bg-green-100 text-green-700" },
  Late: { label: "Late", cls: "bg-yellow-100 text-yellow-700" },
  "Half Day": { label: "Half-day", cls: "bg-blue-100 text-blue-700" },
  Absent: { label: "Absent", cls: "bg-red-100 text-red-600" },
  Leave: { label: "Leave", cls: "bg-purple-100 text-purple-700" },
};

const PRESENT_LIKE = ["Present", "Late", "Half Day"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthKey = (year, monthIndex) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

const formatTime = (value) => {
  if (!value) return "--";

  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const selectClass =
  "h-10 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-9 text-[14px] leading-5 text-gray-700 outline-none cursor-pointer hover:border-yellow-300 focus:ring-2 focus:ring-yellow-400";

function SummaryCard({ label, value, icon: Icon, tile }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${tile}`}
      >
        <Icon size={22} />
      </div>

      <div>
        <p className="text-[12px] leading-4 font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="text-[24px] leading-8 font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function SelectBox({ value, onChange, children, ariaLabel }) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
      />
    </div>
  );
}

export default function InternAttendanceTab() {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ working_days: 0, rows: [] });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  const { data: departments = [] } = useFetch(departmentServices);

  const key = monthKey(cursor.year, cursor.month);
  const currentKey = monthKey(today.getFullYear(), today.getMonth());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await internAttendanceAdminServices.getByMonth(key);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setData({ working_days: 0, rows: [] });
          setError(
            err.response?.data?.message || "Unable to load intern attendance.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [key, refreshKey]);

  const shiftMonth = (delta) => {
    setPage(1);
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  // Search + department narrow the cards AND the table; status only the table.
  const scoped = useMemo(() => {
    const term = search.trim().toLowerCase();

    return data.rows.filter(
      (row) =>
        (!department || row.department_name === department) &&
        (!term ||
          row.full_name.toLowerCase().includes(term) ||
          row.intern_code.toLowerCase().includes(term)),
    );
  }, [data.rows, search, department]);

  const visible = useMemo(
    () => (status ? scoped.filter((row) => row.status === status) : scoped),
    [scoped, status],
  );

  const count = (statuses) =>
    scoped.filter((row) => statuses.includes(row.status)).length;

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const cards = [
    { label: "Working Days", value: data.working_days, icon: CalendarDays, tile: "bg-blue-50 text-blue-600" },
    { label: "Present", value: count(PRESENT_LIKE), icon: UserCheck, tile: "bg-green-50 text-green-600" },
    { label: "Absent", value: count(["Absent"]), icon: UserX, tile: "bg-red-50 text-red-500" },
    { label: "Leave", value: count(["Leave"]), icon: FileText, tile: "bg-sky-50 text-sky-600" },
  ];

  const headCell =
    "px-4 py-3 text-left text-[12px] leading-4 font-semibold uppercase tracking-wide text-gray-500";
  const cell = "px-4 py-3 text-[14px] leading-5 text-gray-700";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-56 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search interns..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[14px] leading-5 outline-none hover:border-yellow-300 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <SelectBox
          ariaLabel="Department"
          value={department}
          onChange={(value) => {
            setDepartment(value);
            setPage(1);
          }}
        >
          <option value="">All Departments</option>
          {departments.map((item) => (
            <option key={item.id} value={item.department_name}>
              {item.department_name}
            </option>
          ))}
        </SelectBox>

        <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="h-full px-2 text-gray-500 hover:text-gray-900 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-36 text-center text-[14px] leading-5 font-semibold text-gray-900">
            {MONTHS[cursor.month]} {cursor.year}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            disabled={key >= currentKey}
            className="h-full px-2 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <SelectBox
          ariaLabel="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectBox>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px]">
          <thead className="bg-gray-50/70 border-b border-gray-200">
            <tr>
              <th className={headCell}>Intern</th>
              <th className={headCell}>Intern ID</th>
              <th className={headCell}>Department</th>
              <th className={headCell}>Date</th>
              <th className={headCell}>Check In</th>
              <th className={headCell}>Check Out</th>
              <th className={headCell}>Status</th>
              <th className={headCell}>Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-red-600">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-gray-500">
                  No intern attendance found for these filters.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              pageRows.map((row) => {
                const badge = STATUS[row.status] ?? {
                  label: row.status,
                  cls: "bg-gray-100 text-gray-700",
                };

                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className={cell}>
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 shrink-0 rounded-full bg-slate-800 text-white text-[12px] leading-4 font-semibold flex items-center justify-center">
                          {getInitials(row.full_name)}
                        </span>
                        <span className="font-medium text-gray-900">
                          {row.full_name}
                        </span>
                      </div>
                    </td>
                    <td className={cell}>{row.intern_code}</td>
                    <td className={cell}>{row.department_name}</td>
                    <td className={cell}>{row.attendance_date}</td>
                    <td className={cell}>{formatTime(row.check_in)}</td>
                    <td className={cell}>
                      {formatTime(row.check_out)}
                      {row.auto_checkout && row.check_out && (
                        <span className="ml-2 text-[12px] leading-4 text-amber-600">
                          Auto - pending review
                        </span>
                      )}
                      {row.check_out && row.working_hours && (
                        <span className="ml-2 text-[12px] leading-4 text-gray-500">
                          {formatWorkingHours(row.working_hours)}
                        </span>
                      )}
                    </td>
                    <td className={cell}>
                      <span
                        className={`inline-flex min-w-20 justify-center rounded-full px-3 py-1 text-[12px] leading-4 font-semibold ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className={cell}>
                      {(row.auto_checkout ||
                        (row.check_in &&
                          !row.check_out &&
                          row.attendance_date <
                            new Date().toLocaleDateString("en-CA"))) && (
                        <FixCheckOutButton
                          attendanceId={row.id}
                          who={row.full_name}
                          date={row.attendance_date}
                          onDone={() => setRefreshKey((value) => value + 1)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {!loading && !error && visible.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-[14px] leading-5 text-gray-600">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}-
              {Math.min(safePage * PAGE_SIZE, visible.length)} of {visible.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(safePage + 1)}
                disabled={safePage === pageCount}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}