import MainLayout from "../../components/Layout/layout";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";

import { Calendar, Wallet, CalendarDays, PlaneTakeoff } from "lucide-react";

import AttendanceSummary from "../../components/EmployeeComponents/EmployeeDashboard/AttendanceSummary";
import EmployeeAnnouncements from "../../components/EmployeeComponents/EmployeeDashboard/EmployeeAnnouncements";
import EmployeeLeaveRequests from "../../components/EmployeeComponents/EmployeeDashboard/EmployeeLeaveRequests";
import EmployeeQuickActions from "../../components/EmployeeComponents/EmployeeDashboard/EmployeeQuickActions";

import useFetch from "../../hooks/useFetch";
import employeeDashboardServices from "../../services/employeeDashboardServices";

export default function EmployeeDashboard() {
  const { data = {} } = useFetch(employeeDashboardServices);

  const dashboardStats = data.stats || {};
  const present =
    (dashboardStats.presentDays || 0) +
    (dashboardStats.lateDays || 0) +
    (dashboardStats.halfDays || 0) * 0.5;

   const now = new Date();

   const nextMonthIndex = now.getMonth() + 1;

   const nextPayrollDate = new Intl.DateTimeFormat("en-GB", {
     day: "2-digit",
     month: "short",
   }).format(new Date(now.getFullYear(), nextMonthIndex, 1));

  const stats = [
    {
      title: "Attended Days",
      value: present,
      subtitle: "This Month",
      status: "Attendance",
      icon: Calendar,
      iconBg: "bg-yellow-200",
    },

    {
      title: "Leave Balance",
      value: dashboardStats.leaveBalance || 0,
      subtitle: "Days Available",
      status: "Available",
      icon: PlaneTakeoff,
      iconBg: "bg-green-200",
    },

    {
      title: "Next Payroll",
      value: nextPayrollDate,
      subtitle: "Upcoming",
      status: "Scheduled",
      icon: Wallet,
      iconBg: "bg-blue-200",
    },

    {
      title: "Holidays",
      value: dashboardStats.upcomingHolidays || 0,
      subtitle: "Upcoming",
      status: "Plan Ahead",
      icon: CalendarDays,
      iconBg: "bg-orange-200",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Dashboard" />

        {/* Stat Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        {/* Attendance & Announcement */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <AttendanceSummary
              attendance={data.attendance || []}
              attendancePercentage={dashboardStats.attendancePercentage || 0}
              present={dashboardStats.presentDays || 0}
              absent={dashboardStats.absentDays || 0}
              leave={dashboardStats.leaveDays || 0}
              late={dashboardStats.lateDays || 0}
            />
          </div>

          <div className="lg:col-span-8">
            <EmployeeAnnouncements
              announcements={data.recentAnnouncements || []}
            />
          </div>
        </div>

        {/* Leave & Actions */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <EmployeeLeaveRequests leaveRequests={data.leaveRequests || []} />
          </div>

          <div className="lg:col-span-4">
            <EmployeeQuickActions />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
