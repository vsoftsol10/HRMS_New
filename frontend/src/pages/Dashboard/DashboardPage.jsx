import {
  Users,
  UserCheck,
  UserX,
  ClipboardList,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import EmployeeGrowth from "../../components/Dashboard/EmployeeChart";
import PayrollStatus from "../../components/Dashboard/PayrollStatus";
import AttendanceTrend from "../../components/Dashboard/AttendanceChart";
import UpcomingHolidays from "../../components/Dashboard/Upcomingholidays";
import RecentLeaveRequests from "../../components/Dashboard/LeaveRequests";
import RecentAnnouncements from "../../components/Dashboard/RecentAnnouncement";
import MainLayout from "../../components/Layout/layout";
import useFetch from "../../hooks/useFetch";
import dashboardServices from "../../services/dashboardServices";



export default function Dashboard() {


const { data } = useFetch(dashboardServices);

  const stats = [
    {
      title: "Total Employees",
      value: data?.totalEmployees || 0,
      icon: Users,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Present Today",
      value: data?.presentToday || 0,
      icon: UserCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Absent Today",
      value: data?.absentToday || 0,
      icon: UserX,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Pending Leaves",
      value: data?.pendingLeaves || 0,
      icon: ClipboardList,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];



  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Welcome back, ${data?.userName || "User"}`}
          description={`Here's what's happening across ${data?.companyName || "your organization"} today.`}
        />

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.map((item) => (
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EmployeeGrowth />
          </div>

          <PayrollStatus />
        </div>

        {/* Attendance & Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AttendanceTrend />
          </div>

          <UpcomingHolidays holidays={data?.upcomingHolidays || []} />
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentLeaveRequests requests={data?.recentLeaveRequests || []} />
          <RecentAnnouncements
            announcements={data?.recentAnnouncements || []}
          />
        </div>
      </div>
    </MainLayout>
  );
}