import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PageLoader from "../components/PageLoader.jsx";
import LoginPage from "../pages/Login/LoginPage";
const ForgotPasswordPage = lazy(() => import("../pages/Login/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/Login/ResetPasswordPage"));

const Dashboard = lazy(() => import("../pages/Dashboard/DashboardPage"));
const EmployeesPage = lazy(() => import("../pages/Dashboard/Employeeslist"));
const Departments = lazy(() => import("../pages/Dashboard/Departments"));
const Interns = lazy(() => import("../pages/Dashboard/Interns"));
const AddIntern = lazy(() => import("../pages/Dashboard/AddIntern"));
const InternDetails = lazy(() => import("../pages/Dashboard/InternDetails"));
const Certificates = lazy(() => import("../pages/Dashboard/Certificates"));
const IssueCertificate = lazy(() => import("../pages/Dashboard/IssueCertificate"));
const EmployeeInterns = lazy(() => import("../pages/EmployeeDashboard/EmployeeInterns"));
const Attendance = lazy(() => import("../pages/Dashboard/Attendance"));
const Holidays = lazy(() => import("../pages/Dashboard/Holidays"));
const LeaveManagement = lazy(() => import("../pages/Dashboard/LeaveManagement"));
const Payroll = lazy(() => import("../pages/Dashboard/Payroll"));
// import Reports from "../pages/Dashboard/Reports"; // not wired up yet - see Reports module notes
const Settings = lazy(() => import("../pages/Dashboard/Settings"));
const Announcements = lazy(() => import("../pages/Dashboard/Announcements"));

const EmployeeSettings = lazy(() => import("../pages/EmployeeDashboard/EmployeeSettings"));
const MyProfile = lazy(() => import("../pages/Profile/MyProfile"));
const EmployeeDashboard = lazy(() => import("../pages/EmployeeDashboard/EmployeeDashboard"));
const EmployeeAttendance = lazy(() => import("../pages/EmployeeDashboard/EmployeeAttendance"));
const EmployeeLeave = lazy(() => import("../pages/EmployeeDashboard/EmployeeLeave"));
const EmployeeHolidays = lazy(() => import("../pages/EmployeeDashboard/EmployeeHolidays"));
const EmployeePayroll = lazy(() => import("../pages/EmployeeDashboard/EmployeePayroll"));
const EmployeeAnnouncements = lazy(() => import("../pages/EmployeeDashboard/EmployeeAnnouncements"));

const InternDashboard = lazy(() => import("../pages/InternDashboard/InternDashboard"));
const InternAttendance = lazy(() => import("../pages/InternDashboard/InternAttendance"));
const InternLeave = lazy(() => import("../pages/InternDashboard/InternLeave"));
const InternStipend = lazy(() => import("../pages/InternDashboard/InternStipend"));
const InternTasks = lazy(() => import("../pages/InternDashboard/InternTasks"));
const InternHolidays = lazy(() => import("../pages/InternDashboard/InternHolidays"));
const InternAnnouncements = lazy(() => import("../pages/InternDashboard/InternAnnouncements"));
const InternSettings = lazy(() => import("../pages/InternDashboard/InternSettings"));

import ProtectedRoute from "./Protectedroutes";

// Pages are loaded on demand (one small file per page instead of one 3 MB
// bundle for the whole app), so show something while a page is fetched.
function RouteLoading() {
  return <PageLoader fullScreen />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Public routes */}
        {/*
         * FIX: this used to be two separate login pages/forms (Admin/HR at
         * "/", Employee at "/login") with no way to switch between them, and
         * which dashboard you landed on depended on which page you visited
         * rather than the actual role returned by the backend. There's only
         * one login endpoint and it already returns `role`, so now there's
         * one form (LoginPage) that reads the role from the response and
         * routes accordingly: Admin/HR -> /admin/dashboard, Employee ->
         * /employee/dashboard. All the old URLs still resolve to it so
         * existing bookmarks don't break.
         */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/employee/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Employee + HR routes */}
        <Route element={<ProtectedRoute allowedRoles={["Employee", "HR"]} />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />

          <Route path="/employee/attendance" element={<EmployeeAttendance />} />

          <Route path="/employee/leave" element={<EmployeeLeave />} />

          <Route path="/employee/interns" element={<EmployeeInterns />} />

          <Route path="/employee/holidays" element={<EmployeeHolidays />} />

          <Route path="/employee/payroll" element={<EmployeePayroll />} />

          <Route
            path="/employee/announcements"
            element={<EmployeeAnnouncements />}
          />

          <Route path="/employee/profile" element={<MyProfile />} />
          <Route path="/employee/settings" element={<EmployeeSettings />} />
        </Route>

        {/* Intern routes */}
        <Route element={<ProtectedRoute allowedRoles={["Intern"]} />}>
          <Route path="/intern/dashboard" element={<InternDashboard />} />
          <Route path="/intern/attendance" element={<InternAttendance />} />
          <Route path="/intern/leave" element={<InternLeave />} />
          <Route path="/intern/stipend" element={<InternStipend />} />
          <Route path="/intern/tasks" element={<InternTasks />} />
          <Route path="/intern/holidays" element={<InternHolidays />} />
          <Route path="/intern/announcements" element={<InternAnnouncements />} />
          <Route path="/intern/settings" element={<InternSettings />} />
        </Route>

        {/* Admin + HR routes */}
        <Route element={<ProtectedRoute allowedRoles={["Admin", "HR"]} />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />

          <Route path="/admin/employees" element={<EmployeesPage />} />

          {/* Interns: "new" must stay above ":id" so it is not read as an id */}
          <Route path="/admin/interns" element={<Interns />} />
          <Route path="/admin/interns/new" element={<AddIntern />} />
          <Route path="/admin/interns/:id" element={<InternDetails />} />
          <Route path="/admin/interns/:id/edit" element={<AddIntern />} />

          <Route path="/admin/certificates" element={<Certificates />} />
          <Route path="/admin/certificates/new" element={<IssueCertificate />} />
          <Route path="/admin/attendance" element={<Attendance />} />

          <Route path="/admin/departments" element={<Departments />} />

          <Route path="/admin/holidays" element={<Holidays />} />

          <Route path="/admin/payroll" element={<Payroll />} />

          <Route path="/admin/leavemanagement" element={<LeaveManagement />} />

          <Route path="/admin/announcements" element={<Announcements />} />

          {/* <Route path="/admin/reports" element={<Reports />} /> */}

          <Route path="/admin/profile" element={<MyProfile />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<h1>403 - Unauthorized</h1>} />
      </Routes>
    </Suspense>
  );
}