import { useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  Table2,
  UserCheck,
  UserX,
  Clock3,
  Percent,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import StatCard from "../../components/StatCard";
import Table from "../../components/Table";
import StatusBadge from "../../components/StatusBadge";

import useFetch from "../../hooks/useFetch";
import employeeAttendanceServices from "../../services/employeeAttendanceServices";
import { formatWorkingHours } from "../../utils/formatDuration";

import PageHeader from "../../components/PageHeader";

const columns = [
  {
    key: "Date",
    label: "DATE",
  },
  {
    key: "checkIn",
    label: "CHECK IN",
  },
  {
    key: "checkOut",
    label: "CHECK OUT",
  },
  {
    key: "hours",
    label: "WORKING HOURS",
  },
  {
    key: "status",
    label: "STATUS",
    render: (value) => <StatusBadge status={value} />,
  },
];
export default function EmployeeAttendance() {
  
  const [view, setView] = useState("calendar");

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [year, setYear] = useState(today.getFullYear());

  const isCurrentMonth =
    month === today.getMonth() && year === today.getFullYear();

  const goPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const { data = {}, error } = useFetch(employeeAttendanceServices, {
    month: month + 1,
    year,
  });

  console.log(data)

  const attendance = data.attendance || [];
  const stats = data.stats || {};

  const present = stats.presentDays+stats.lateDays+stats.halfDays

  const attendanceData = attendance.map((item) => ({
    id: item.id,

    Date: new Date(item.attendance_date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),

    checkIn: item.check_in
      ? new Date(`1970-01-01T${item.check_in}`).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-",

    checkOut: item.check_out
      ? `${new Date(`1970-01-01T${item.check_out}`).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}${item.auto_checkout ? " (Auto)" : ""}`
      : "-",

    hours: item.auto_checkout
      ? "Pending review"
      : formatWorkingHours(item.working_hours),

    status: item.status.replaceAll(" ", ""),
  }));
  const statCards = [
    {
      title: "Present Days",
      value: present,
      icon: UserCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Absent Days",
      value: stats.absentDays || 0,
      icon: UserX,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Late Days",
      value: stats.lateDays || 0,
      icon: Clock3,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Attendance %",
      value: `${stats.attendancePercentage || 0}%`,
      icon: Percent,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <MainLayout title="Attendance" icon={CalendarCheck}>
      <div className="space-y-6">
        <PageHeader title="Attendance" />

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-red-700">
            Couldn&apos;t load your attendance data
            {error.response?.data?.message
              ? `: ${error.response.data.message}`
              : ". Please refresh the page."}
          </div>
        )}

        {/* Stat Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
            />
          ))}
        </div>

        {/* View Toggle + Month Selector */}

        <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${
              view === "calendar"
                ? "bg-white shadow font-medium"
                : "text-gray-500"
            }`}
          >
            <CalendarDays size={18} />
            Calendar
          </button>

          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${
              view === "table" ? "bg-white shadow font-medium" : "text-gray-500"
            }`}
          >
            <Table2 size={18} />
            Records
          </button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-2 py-1">
          <button
            onClick={goPrevMonth}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="min-w-36 text-center font-medium">{monthLabel}</span>

          <button
            onClick={goNextMonth}
            disabled={isCurrentMonth}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        </div>

        {/* Calendar View */}

        {view === "calendar" && (
          <AttendanceCalendar
            attendance={attendance}
            month={month}
            year={year}
            monthLabel={monthLabel}
          />
        )}

        {/* Table View */}

        {view === "table" && (
          <div className="rounded-xl border border-gray-300 bg-white">
            <div className="p-5">
              <h2 className="text-xl font-semibold">Attendance Records</h2>

              <p className="text-gray-500">Daily attendance history for {monthLabel}.</p>
            </div>

            <Table columns={columns} data={attendanceData} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function AttendanceCalendar({ attendance, month, year, monthLabel }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDay = new Date(year, month, 1).getDay();

  const attendanceMap = {};

  attendance.forEach((item) => {
    const date = item.attendance_date.split("T")[0];
    attendanceMap[date] = item.status;
  });

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-700";

      case "absent":
        return "bg-red-100 text-red-700";

      case "late":
        return "bg-yellow-100 text-yellow-700";

      case "leave":
        return "bg-orange-100 text-orange-700";

      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Monthly Attendance Calendar</h2>

        <p className="text-gray-500">{monthLabel} attendance summary.</p>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-24" />;
          }

          const dateString = `${year}-${String(month + 1).padStart(
            2,
            "0",
          )}-${String(day).padStart(2, "0")}`;

          const status = attendanceMap[dateString];

          return (
            <div
              key={index}
              className={`h-24 rounded-xl border flex items-center justify-center text-lg font-semibold ${getStatusStyles(
                status,
              )}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-6 mt-8 text-sm">
        <Legend color="bg-green-500" title="Present" />
        <Legend color="bg-red-500" title="Absent" />
        <Legend color="bg-yellow-500" title="Late" />
        <Legend color="bg-orange-500" title="Leave" />
      </div>
    </div>
  );
}

function Legend({ color, title }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-4 w-4 rounded-full ${color}`} />
      <span>{title}</span>
    </div>
  );
}