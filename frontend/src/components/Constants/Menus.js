// import {
//   LayoutDashboard,
//   Users,
//   GraduationCap,
//   Building2,
//   CalendarCheck,
//   CalendarDays,
//   Wallet,
//   PartyPopper,
//   Megaphone,
//   // FileText, // only used by the Reports menu item below, not wired up yet
//   Settings,
//   ListTodo,
//   UserCircle,
// } from "lucide-react";

// export const adminMenus = [
//   { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
//   { name: "Employees", path: "/admin/employees", icon: Users },
//   { name: "Interns", path: "/admin/interns", icon: GraduationCap },
//   { name: "Departments", path: "/admin/departments", icon: Building2 },
//   { name: "Attendance", path: "/admin/attendance", icon: CalendarCheck },
//   {
//     name: "Leave Management",
//     path: "/admin/leavemanagement",
//     icon: CalendarDays,
//   },
//   { name: "Payroll", path: "/admin/payroll", icon: Wallet },
//   { name: "Holidays", path: "/admin/holidays", icon: PartyPopper },
//   { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
//   // { name: "Reports", path: "/admin/reports", icon: FileText },
//   { name: "My Profile", path: "/admin/profile", icon: UserCircle },
//   { name: "Settings", path: "/admin/settings", icon: Settings },
// ];

// export const employeeMenus = [
//   { name: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
//   { name: "Attendance", path: "/employee/attendance", icon: CalendarCheck },
//   { name: "Leave", path: "/employee/leave", icon: CalendarDays },
//   { name: "My Interns", path: "/employee/interns", icon: GraduationCap },
//   { name: "Payroll", path: "/employee/payroll", icon: Wallet },
//   { name: "Holidays", path: "/employee/holidays", icon: PartyPopper },
//   { name: "Announcements", path: "/employee/announcements", icon: Megaphone },
//   { name: "My Profile", path: "/employee/profile", icon: UserCircle },
//   { name: "Settings", path: "/employee/settings", icon: Settings },
// ];

// export const internMenus = [
//   { name: "Dashboard", path: "/intern/dashboard", icon: LayoutDashboard },
//   { name: "Attendance", path: "/intern/attendance", icon: CalendarCheck },
//   { name: "Leave", path: "/intern/leave", icon: CalendarDays },
//   { name: "Stipend", path: "/intern/stipend", icon: Wallet },
//   { name: "Tasks", path: "/intern/tasks", icon: ListTodo },
//   { name: "Holidays", path: "/intern/holidays", icon: PartyPopper },
//   { name: "Announcements", path: "/intern/announcements", icon: Megaphone },
//   { name: "Settings", path: "/intern/settings", icon: Settings },
// ];

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CalendarCheck,
  CalendarDays,
  Wallet,
  PartyPopper,
  Megaphone,
  // FileText, // only used by the Reports menu item below, not wired up yet
  Settings,
  ListTodo,
  UserCircle,
  Award,
} from "lucide-react";

export const adminMenus = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Employees", path: "/admin/employees", icon: Users },
  { name: "Interns", path: "/admin/interns", icon: GraduationCap },
  { name: "Certificate", path: "/admin/certificates", icon: Award },
  { name: "Departments", path: "/admin/departments", icon: Building2 },
  { name: "Attendance", path: "/admin/attendance", icon: CalendarCheck },
  {
    name: "Leave Management",
    path: "/admin/leavemanagement",
    icon: CalendarDays,
  },
  { name: "Payroll", path: "/admin/payroll", icon: Wallet },
  { name: "Holidays", path: "/admin/holidays", icon: PartyPopper },
  { name: "Announcements", path: "/admin/announcements", icon: Megaphone },
  // { name: "Reports", path: "/admin/reports", icon: FileText },
  { name: "My Profile", path: "/admin/profile", icon: UserCircle },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export const employeeMenus = [
  { name: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
  { name: "Attendance", path: "/employee/attendance", icon: CalendarCheck },
  { name: "Leave", path: "/employee/leave", icon: CalendarDays },
  { name: "My Interns", path: "/employee/interns", icon: GraduationCap },
  { name: "Payroll", path: "/employee/payroll", icon: Wallet },
  { name: "Holidays", path: "/employee/holidays", icon: PartyPopper },
  { name: "Announcements", path: "/employee/announcements", icon: Megaphone },
  { name: "My Profile", path: "/employee/profile", icon: UserCircle },
  { name: "Settings", path: "/employee/settings", icon: Settings },
];

export const internMenus = [
  { name: "Dashboard", path: "/intern/dashboard", icon: LayoutDashboard },
  { name: "Attendance", path: "/intern/attendance", icon: CalendarCheck },
  { name: "Leave", path: "/intern/leave", icon: CalendarDays },
  { name: "Stipend", path: "/intern/stipend", icon: Wallet },
  { name: "Tasks", path: "/intern/tasks", icon: ListTodo },
  { name: "Holidays", path: "/intern/holidays", icon: PartyPopper },
  { name: "Announcements", path: "/intern/announcements", icon: Megaphone },
  { name: "Settings", path: "/intern/settings", icon: Settings },
];