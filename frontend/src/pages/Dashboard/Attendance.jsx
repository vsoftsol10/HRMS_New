import {
  CalendarCheck,
  UserCheck,
  UserX,
  Clock3,
  Hourglass,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Table from "../../components/Table";
import StatusBadge from "../../components/StatusBadge";

import MainLayout from "../../components/Layout/layout";

import useFetch from "../../hooks/useFetch";
import attendanceServices from "../../services/attendanceServices";

import Filters from "../../components/Filter/Filter";
import departmentServices from "../../services/departmentServices";
import { formatWorkingHours } from "../../utils/formatDuration";
import InternAttendanceTab from "../../components/Attendance/InternAttendanceTab";
import FixCheckOutButton from "../../components/Attendance/FixCheckOutButton";

import { useState, useEffect } from "react";

const columns = [
  {
    key: "employee_code",
    label: "Employee ID",
  },
  {
    key: "employee",
    label: "Employee",
  },
  {
    key: "department",
    label: "Department",
  },
  {
    key: "Date",
    label: "Date",
  },
  {
    key: "checkIn",
    label: "Check In",
  },
  {
    key: "checkOut",
    label: "Check Out",
  },
  {
    key: "hours",
    label: "Working Hours",
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <StatusBadge status={value} />,
  },
];

const TABS = ["Employees", "Interns"];

export default function Attendance() {

  const [tab, setTab] = useState("Employees");
  const [stats, setStats] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Last column: "Set check-out" for days the system auto-closed or that have
  // no check-out. HR enters the real time; hours / LOP are recomputed.
  const tableColumns = [
    ...columns,
    {
      key: "action",
      label: "Action",
      render: (_, row) =>
        row.needsCheckout ? (
          <FixCheckOutButton
            attendanceId={row.id}
            who={row.employee}
            date={row.Date}
            onDone={() => setRefreshKey((value) => value + 1)}
          />
        ) : null,
    },
  ];

   const statCards = [
     {
       title: "Present Today",
       value: stats.presentToday || 0,
       icon: UserCheck,
       iconBg: "bg-green-100",
       iconColor: "text-green-600",
     },
     {
       title: "Absent Today",
       value: stats.absentToday || 0,
       icon: UserX,
       iconBg: "bg-red-100",
       iconColor: "text-red-600",
     },
     {
       title: "Late Arrivals",
       value: stats.lateArrivals || 0,
       icon: Clock3,
       iconBg: "bg-yellow-100",
       iconColor: "text-yellow-600",
     },
     {
       title: "Avg Working Hours",
       value: stats.avgWorkingHours || "-",
       icon: Hourglass,
       iconBg: "bg-blue-100",
       iconColor: "text-blue-600",
     },
   ];
  
const [filters, setFilters] = useState({
  fromDate: "",
  toDate: "",
  department: "",
  search: "",
});

const [attendance, setAttendance] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    try {
      let response;

      if (filters.fromDate || filters.toDate) {
        response = await attendanceServices.getFiltered({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        });
      } else {
        response = await attendanceServices.getAll();
      }

      setAttendance(response.attendance || []);
      setStats(response.stats || {});
    } catch (err) {
      console.log(err);
    }
  };

  fetchData();
}, [filters.fromDate, filters.toDate, refreshKey]);

  const { data: departments = [] } = useFetch(departmentServices);

  const departmentOptions = departments.map(
    (department) => department.department_name,
  );

  const attendanceData = attendance.map((item) => ({
    id: item.id,
    employee_code: item.employees?.employee_code || "-",
    needsCheckout: Boolean(
      item.auto_checkout ||
        (item.check_in &&
          !item.check_out &&
          String(item.attendance_date).slice(0, 10) <
            new Date().toLocaleDateString("en-CA")),
    ),
    employee: item.employees?.first_name || "-",
    department: item.employees?.departments?.department_name || "-",
    Date: item.attendance_date.split("T")[0],
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

const filteredAttendance = attendanceData.filter((item) => {
  const matchesSearch =
    item.employee.toLowerCase().includes(filters.search.toLowerCase()) ||
    item.employee_code.toLowerCase().includes(filters.search.toLowerCase());

  const matchesDepartment =
    !filters.department || item.department === filters.department;

  return matchesSearch && matchesDepartment;
});


  return (
    <MainLayout title="Attendance" icon={CalendarCheck}>
      <div className="space-y-6">
        <PageHeader
          title={tab === "Interns" ? "Intern Attendance" : "Attendance"}
          description={
            tab === "Interns"
              ? "Track daily attendance across all interns."
              : "Monitor daily check-ins and working hours."
          }
        />

        <div role="tablist" className="flex gap-6 overflow-x-auto border-b border-gray-200">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`-mb-px border-b-2 px-1 pb-2 text-[14px] leading-5 font-medium cursor-pointer transition ${
                tab === name
                  ? "border-yellow-400 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === "Interns" && <InternAttendanceTab />}

        {tab === "Employees" && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
            />
          ))}
        </div>

        <div className="rounded-xl bg-white shadow-sm overflow-visible border border-gray-300">
          <Filters
            filters={filters}
            setFilters={setFilters}
            searchPlaceholder="Search employee..."
            showDateRange
            selects={[
              {
                key: "department",
                placeholder: "All Departments",
                options: departmentOptions,
              },
            ]}
          />
          <Table columns={tableColumns} data={filteredAttendance} />
        </div>
        </>
        )}
      </div>
    </MainLayout>
  );
}