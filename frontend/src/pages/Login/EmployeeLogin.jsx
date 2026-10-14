import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LoginUser } from "../../services/authServices";
import attendanceServices from "../../services/attendanceServices";
import { useDialog } from "../../components/Dialogbox/DialogContext";


import {
  Users,
  ChartLine,
  CalendarCheck,
  HandCoins,
  TreePalm,
  UserSearch,
  BadgeCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  Headset,
} from "lucide-react";

export default function EmployeeLogin() {
  const { alert } = useDialog();
  const features = [
    {
      title: "Employees",
      desc: "Manage employee information",
      icon: Users,
      bg_color: "yellow",
      position: "top-[120px] left-[0px] rotate-[-5deg]",
    },
    {
      title: "Attendance",
      desc: "Track attendance in real time",
      icon: CalendarCheck,
      bg_color: "green",
      position: "top-[80px] left-[300px] rotate-[-2deg]",
    },
    {
      title: "Payroll",
      desc: "Automate payroll accurately",
      icon: HandCoins,
      bg_color: "purple",
      position: "top-[240px] left-[0px] rotate-[-3deg]",
    },
    {
      title: "Leave",
      desc: "Handle leave requests",
      icon: TreePalm,
      bg_color: "blue",
      position: "top-[200px] left-[400px] rotate-[4deg]",
    },
    {
      title: "Analytics",
      desc: "Powerful HR insights",
      icon: ChartLine,
      bg_color: "indigo",
      position: "top-[370px] left-[100px] rotate-[-6deg]",
    },
    {
      title: "Recruitment",
      desc: "Streamline hiring",
      icon: UserSearch,
      bg_color: "pink",
      position: "top-[350px] left-[350px] rotate-[7deg]",
    },
  ];
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!employeeCode) nextErrors.employeeCode = "This field is required";
    else if (/\s/.test(employeeCode)) nextErrors.employeeCode = "Employee code cannot contain spaces";
    if (!password) nextErrors.password = "This field is required";
    else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    try {
      setLoading(true);
      const data = await LoginUser(employeeCode, password);

    if (data.role === "Employee" || data.role === "HR") {
      localStorage.setItem("emp_token", data.token);
      localStorage.setItem("emp_role", data.role);
      localStorage.setItem("employee_user", data.employee_code);

      // Login succeeded. Attendance is a separate operation.
      try {
        await attendanceServices.signIn();
      } catch (attendanceError) {
        await alert({ title: "Attendance Sign-In Failed", message: attendanceError.response?.data?.message || attendanceError.message, type: "error" });
      }

      // Always navigate after authentication succeeds.
      navigate("/employee/dashboard", { replace: true });
    } else {
      await alert({ title: "Login Failed", message: "Invalid User", type: "error" });
    }
    } catch (err) {
      await alert({ title: "Login Failed", message: err.response?.data?.message || "Invalid User", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-8">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Yellow Glow Bottom Left */}
          <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-yellow-300/20 blur-3xl"></div>

          {/* Top Circle */}
          <div className="absolute -top-32 left-1/2 w-[400px] h-[400px] rounded-full border border-yellow-200"></div>

          {/* Top Circle */}
          <div className="absolute -top-32 left-1/3 w-[350px] h-[350px] rounded-full border border-yellow-200"></div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4 mt-2">
            <h1 className="text-4xl font-bold">
              <span className="text-yellow-500">V</span>Soft
            </h1>
          </div>

          <h2 className="text-2xl font-bold leading-tight">
            Welcome to <span className="text-yellow-500">VSoft</span>
          </h2>

          <p className="text-gray-600 text-lg mt-2">
            Human Resource Management System
          </p>

          <p className="text-gray-500 mt-4 max-w-lg text-lg">
            Manage employees, attendance, payroll, leave, performance and
            company operations securely from one intelligent platform.
          </p>
        </div>
        <div className="relative h-full mt-2">
          {features.map((feature, index) => (
            <div key={index} className={`absolute ${feature.position}`}>
              <FeatureCard
                title={feature.title}
                desc={feature.desc}
                Icon={feature.icon}
                bg_color={feature.bg_color}
              />
            </div>
          ))}
          <div className="absolute top-[200px] left-[260px]">
            <div className="w-30 h-30 bg-yellow-200 rounded-xl shadow-xl flex items-center justify-center rotate-6">
              <h1 className="text-8xl font-bold text-yellow-500">V</h1>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 justify-center items-center p-8">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-10">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              <span className="text-yellow-500">V</span>Soft
            </h1>

            <h2 className="mt-6 text-4xl font-bold">Welcome Back 👋</h2>

            <p className="mt-3 text-gray-500">
              Sign in to access your HRMS account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-10 flex flex-col gap-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block mb-2 font-medium text-gray-700"
              >
                Employee Code
              </label>

              <div className="relative">
                <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  id="employeeCode"
                  type="text"
                  value={employeeCode}
                  onChange={(e) => { setErrors((prev) => ({ ...prev, employeeCode: "" })); setEmployeeCode(e.target.value.toUpperCase()); }}
                  placeholder="Enter Employee Code"
                  className={`w-full border ${errors.employeeCode ? "border-red-500" : "border-gray-300"} rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400`}
                />
              </div>
              {errors.employeeCode && <p className="text-sm text-red-500 mt-1">{errors.employeeCode}</p>}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block mb-2 font-medium text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setErrors((prev) => ({ ...prev, password: "" })); setPassword(e.target.value); }}
                  placeholder="Enter your password"
                  className={`w-full border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Remember */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                Remember Me
              </label>

              <button
                type="button"
                className="text-yellow-500 hover:text-yellow-600 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition duration-200"
            >
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>

          {/* HR/Admin link */}
          <p className="text-center mt-6 text-sm text-gray-500">
            HR or Admin?{" "}
            <Link
              to="/admin/login"
              className="text-yellow-500 font-semibold hover:text-yellow-600"
            >
              Login here
            </Link>
          </p>

          {/* Footer */}
          <div className="flex justify-center mt-6 pt-4 border-t text-gray-500 text-sm">
            <Headset className="h-8 w-8 mt-3 text-black" />
            <p className="mt-2 pl-2">
              Need help? Contact your <br />
              <span className="font-bold text-black">HR Administrator.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, Icon, bg_color }) {
  const colorClasses = {
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    indigo: {
      bg: "bg-indigo-100",
      text: "text-indigo-600",
    },
    pink: {
      bg: "bg-pink-100",
      text: "text-pink-600",
    },
  };
  const colors = colorClasses[bg_color];

  return (
    <div className="flex items-center bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition">
      <div className={`${colors.bg} p-3 rounded-lg`}>
        <Icon className={`w-8 h-8 ${colors.text}`} />
      </div>

      <div className="ml-3 flex flex-col justify-center">
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}