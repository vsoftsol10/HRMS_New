// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { LoginUser } from "../../services/authServices";
// import { setSession, clearAllSessions } from "../../utils/auth";
// import attendanceServices from "../../services/attendanceServices";
// import { useDialog } from "../../components/Dialogbox/DialogContext";
// import Button from "../../components/Button";
// import {
//   Users,
//   ShieldCheck,
//   Settings,
//   Briefcase,
//   User,
//   GraduationCap,
//   Wallet,
//   BadgeCheck,
//   LockKeyhole,
//   Eye,
//   EyeOff,
//   ArrowRight,
// } from "lucide-react";

// export default function Login() {
//   const { alert } = useDialog();
//   const [employeeCode, setEmployeeCode] = useState("");
//   const [password, setPassword] = useState("");
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   // Team photo lives at /public/login-team.jpg - if it's missing we show a soft placeholder instead of a broken image.
//   const [imgFailed, setImgFailed] = useState(false);
//   // Only used when the logged-in user is HR: pauses navigation right after
//   // a successful login so they can pick which dashboard to land on.
//   const [showPortalChoice, setShowPortalChoice] = useState(false);

//   const navigate = useNavigate();

//   // FIX: this used to be two separate pages/forms (LoginPage.jsx for
//   // Admin/HR, EmployeeLogin.jsx for Employee), and which dashboard you
//   // landed on depended on which page you happened to visit - not on the
//   // actual role returned by the backend. There's only one login endpoint
//   // and it already returns `role`, so a single form here decides the
//   // destination correctly regardless of which credentials are typed in.
//   const handleLogin = async (e) => {
//     e.preventDefault();

//     const nextErrors = {};
//     if (!employeeCode) nextErrors.employeeCode = "This field is required";
//     else if (/\s/.test(employeeCode)) nextErrors.employeeCode = "Employee code cannot contain spaces";
//     if (!password) nextErrors.password = "This field is required";
//     else if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
//     if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

//     try {
//       setLoading(true);

//       const data = await LoginUser(employeeCode, password);

//       // Start clean: a token left by a previous user in another portal
//       // must not be reachable by whoever logs in next on this browser.
//       clearAllSessions();

//       if (data.role === "HR" || data.role === "Admin") {
//         setSession("hr", data);

//         // FIX: HR is also an employee, so the same HR login should be
//         // able to reach their own personal employee dashboard (own
//         // attendance/leave/payslip) as well as the admin panel - without
//         // logging in a second time. The JWT already carries role "HR",
//         // which the backend's employee-side routes already accept, so
//         // storing it under emp_token too just unlocks that portal with
//         // the same session. Admin doesn't get this, since the employee
//         // routes are intentionally restricted to Employee/HR only.
//         if (data.role === "HR") {
//           setSession("employee", data);

//           // HR can access both portals with this same session - ask which
//           // one they want instead of assuming admin.
//           setShowPortalChoice(true);
//           return;
//         }

//         navigate("/admin/dashboard", { replace: true });
//       } else if (data.role === "Employee") {
//         setSession("employee", data);

//         // Login succeeded. Attendance is a separate operation, so a
//         // failure here shouldn't block the employee from reaching their
//         // dashboard. "Already checked in today" isn't a real failure -
//         // it just means today's attendance is already marked (e.g. they
//         // logged in earlier and closed the browser) - so don't alarm the
//         // user with an error dialog for it.
//         try {
//           await attendanceServices.signIn(data.token);
//         } catch (attendanceError) {
//           const msg = attendanceError.response?.data?.message || attendanceError.message;

//           if (!msg?.toLowerCase().includes("already checked in")) {
//             await alert({ title: "Attendance Sign-In Failed", message: msg, type: "error" });
//           }
//         }

//         navigate("/employee/dashboard", { replace: true });
//       } else if (data.role === "Intern") {
//         setSession("intern", data);

//         // Same non-blocking sign-in behaviour as the Employee branch above.
//         try {
//           await attendanceServices.signIn(data.token);
//         } catch (attendanceError) {
//           const msg = attendanceError.response?.data?.message || attendanceError.message;

//           if (!msg?.toLowerCase().includes("already checked in")) {
//             await alert({ title: "Attendance Sign-In Failed", message: msg, type: "error" });
//           }
//         }

//         navigate("/intern/dashboard", { replace: true });
//       } else {
//         await alert({ title: "Login Failed", message: "Invalid User", type: "error" });
//       }
//     } catch (err) {
//       await alert({ title: "Login Failed", message: err.response?.data?.message || "Invalid User", type: "error" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const continueToAdmin = () => {
//     setShowPortalChoice(false);
//     navigate("/admin/dashboard", { replace: true });
//   };

//   const continueToEmployee = async () => {
//     setShowPortalChoice(false);

//     // Same as the direct Employee login path - attendance sign-in shouldn't
//     // block reaching the dashboard if it fails, and "already checked in
//     // today" isn't a real failure worth alarming the user about.
//     try {
//       await attendanceServices.signIn();
//     } catch (attendanceError) {
//       const msg = attendanceError.response?.data?.message || attendanceError.message;

//       if (!msg?.toLowerCase().includes("already checked in")) {
//         await alert({ title: "Attendance Sign-In Failed", message: msg, type: "error" });
//       }
//     }

//     navigate("/employee/dashboard", { replace: true });
//   };

//   return (
//     <div className="min-h-screen flex overflow-hidden bg-white">
//       {/* LEFT PANEL */}
//       <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden bg-linear-to-br from-amber-100 via-amber-50 to-white px-10 py-10">
//         {/* Background decorations */}
//         <div className="absolute inset-0 pointer-events-none">
//           <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full border border-amber-200/70"></div>
//           <div className="absolute -top-10 -left-40 w-[420px] h-[420px] rounded-full border border-amber-200/50"></div>
//           <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-amber-200/30 blur-3xl"></div>
//         </div>

//         {/* Floating animation for the chips around the photo */}
//         <style>{`
//           @keyframes hrms-float {
//             0%, 100% { transform: translateY(0); }
//             50% { transform: translateY(-9px); }
//           }
//           .hrms-float { animation: hrms-float 4s ease-in-out infinite; }
//           @media (prefers-reduced-motion: reduce) { .hrms-float { animation: none; } }
//         `}</style>

//         {/* Photo + floating chips */}
//         <div className="relative flex-1 flex items-center justify-center pt-10">
//           <div className="relative w-[66%] max-w-[580px]">
//             {/* top badge - sits just above the photo with a small gap */}
//             <FloatChip
//               plain
//               className="-top-11 left-0 right-0 flex justify-center"
//               delay="0s"
//               duration="4.4s"
//             >
//               <span className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-md">
//                 <ShieldCheck className="w-3.5 h-3.5" />
//                 Role-based access
//               </span>
//             </FloatChip>

//             {/* photo - full original aspect ratio (16:9), no cropping */}
//             <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl bg-amber-100">
//               {!imgFailed ? (
//                 <img
//                   src="/login-team.png"
//                   alt="HRMS team"
//                   onError={() => setImgFailed(true)}
//                   className="h-full w-full object-cover"
//                 />
//               ) : (
//                 <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-200 to-amber-100">
//                   <Users className="w-16 h-16 text-amber-500/70" />
//                 </div>
//               )}
//             </div>

//             {/* floating chips */}
//             <FloatChip icon={Settings} label="Admin & Settings" className="top-[4%] -left-[20%]" delay="0s" duration="4s" />
//             <FloatChip icon={Briefcase} label="HR Operations" className="top-[3%] -right-[18%]" delay="0.6s" duration="4.6s" />
//             <FloatChip icon={User} label="Employee Self-Service" className="top-[38%] -left-[28%]" delay="1.1s" duration="5s" />
//             <FloatChip icon={GraduationCap} label="Intern Workspace" className="top-[42%] -right-[26%]" delay="0.3s" duration="4.2s" />
//             <FloatChip icon={Wallet} label="Payroll & Performance" className="-bottom-[9%] -right-[20%]" delay="0.9s" duration="4.8s" />

//             {/* dark "3 roles" card */}
//             <FloatChip plain className="-bottom-[11%] -left-[8%]" delay="0.4s" duration="5.2s">
//               <span className="block rounded-xl bg-gray-900 px-4 py-3 shadow-xl">
//                 <span className="block text-lg font-bold leading-none">
//                   <span className="text-amber-400">3</span>{" "}
//                   <span className="text-white">roles</span>
//                 </span>
//                 <span className="mt-1 block text-[10px] text-gray-300">HR · Employee · Intern</span>
//               </span>
//             </FloatChip>
//           </div>
//         </div>

//         {/* Headline */}
//         <div className="relative mt-20 max-w-md">
//           <h2 className="text-4xl font-extrabold leading-tight text-gray-900">
//             HRMS.
//             <br />
//             <span className="text-amber-500">One portal, every role.</span>
//           </h2>

//           <p className="mt-3 text-sm text-gray-500 leading-relaxed">
//             Built for admins, HR teams, employees and interns — attendance,
//             leave, payroll, timesheets and appraisals in one secure workspace.
//           </p>

//           <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-gray-800">
//             {["Multi-role access", "HR & payroll automation", "Performance tracking"].map((t) => (
//               <span key={t} className="flex items-center gap-2">
//                 <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
//                 {t}
//               </span>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* RIGHT PANEL */}
//       <div className="flex w-full lg:w-[45%] justify-center items-center p-6 sm:p-10">
//         <div className="w-full max-w-[420px] rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/60">
//           {/* Heading */}
//           <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
//             Welcome back
//           </p>
//           <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Sign in to HRMS</h1>
//           <p className="mt-2 text-sm text-gray-500">
//             Access attendance, leave balance, task update, payroll and Stipend.
//           </p>

//           {/* Form */}
//           <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
//             {/* Employee ID */}
//             <div>
//               <label htmlFor="employeeCode" className="block mb-2 text-xs font-semibold text-gray-800">
//                 Employee ID
//               </label>

//               <div className="relative">
//                 <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

//                 <input
//                   id="employeeCode"
//                   type="text"
//                   value={employeeCode}
//                   onChange={(e) => { setErrors((prev) => ({ ...prev, employeeCode: "" })); setEmployeeCode(e.target.value.toUpperCase()); }}
//                   placeholder="Enter your Employee ID"
//                   className={`w-full rounded-xl border ${errors.employeeCode ? "border-red-500" : "border-gray-200"} bg-gray-50 pl-11 pr-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400`}
//                 />
//               </div>
//               {errors.employeeCode && <p className="text-xs text-red-500 mt-1">{errors.employeeCode}</p>}
//             </div>

//             {/* Password */}
//             <div>
//               <div className="mb-2 flex items-center justify-between">
//                 <label htmlFor="password" className="text-xs font-semibold text-gray-800">
//                   Password
//                 </label>
//                 <button
//                   type="button"
//                   onClick={() => navigate("/forgot-password")}
//                   className="text-xs font-semibold text-amber-500 hover:text-amber-600"
//                 >
//                   Forgot password?
//                 </button>
//               </div>

//               <div className="relative">
//                 <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

//                 <input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => { setErrors((prev) => ({ ...prev, password: "" })); setPassword(e.target.value); }}
//                   placeholder="Enter your password"
//                   className={`w-full rounded-xl border ${errors.password ? "border-red-500" : "border-gray-200"} bg-gray-50 pl-11 pr-11 py-3 text-sm outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400`}
//                 />

//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                 </button>
//               </div>
//               {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
//             </div>

//             {/* Login Button */}
//             <Button
//               type="submit"
//               loading={loading}
//               loadingText="Signing In..."
//               className="mt-1 w-full rounded-xl py-3.5 text-sm font-bold text-gray-900 shadow-lg shadow-amber-200 !bg-[#FFB800] hover:!bg-[#F2AC00]"
//             >
//               Log in
//               {!loading && <ArrowRight className="w-4 h-4" />}
//             </Button>
//           </form>

//           <p className="mt-6 text-center text-xs text-gray-400">
//             Need help? Contact your <span className="font-semibold text-gray-700">HR Administrator.</span>
//           </p>
//         </div>
//       </div>

//       {/* HR portal choice modal - only shown when the logged-in role is HR */}
//       {showPortalChoice && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
//             <h3 className="text-xl font-bold text-gray-800">
//               Welcome, HR 👋
//             </h3>
//             <p className="text-gray-500 mt-2 mb-6">
//               Which dashboard would you like to open?
//             </p>

//             <div className="flex flex-col gap-3">
//               <button
//                 onClick={continueToAdmin}
//                 className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition duration-200"
//               >
//                 Continue as Admin
//               </button>

//               <button
//                 onClick={continueToEmployee}
//                 className="w-full border border-yellow-500 text-yellow-600 hover:bg-yellow-50 py-3 rounded-xl font-semibold transition duration-200"
//               >
//                 Continue as Employee
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function FloatChip({ icon: Icon, label, className = "", delay = "0s", duration = "4s", plain = false, children }) {
//   return (
//     <div className={`absolute z-10 ${className}`}>
//       <div className="hrms-float" style={{ animationDelay: delay, animationDuration: duration }}>
//         {plain ? (
//           children
//         ) : (
//           <div className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-lg">
//             <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
//               <Icon className="h-3.5 w-3.5 text-amber-600" />
//             </span>
//             {label}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
 

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginUser } from "../../services/authServices";
import { setSession } from "../../utils/auth";
import attendanceServices from "../../services/attendanceServices";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import Button from "../../components/Button";
import {
  Users,
  ShieldCheck,
  Settings,
  Briefcase,
  User,
  GraduationCap,
  Wallet,
  BadgeCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const { alert } = useDialog();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Team photo lives at /public/login-team.jpg - if it's missing we show a soft placeholder instead of a broken image.
  const [imgFailed, setImgFailed] = useState(false);
  // Only used when the logged-in user is HR: pauses navigation right after
  // a successful login so they can pick which dashboard to land on.
  const [showPortalChoice, setShowPortalChoice] = useState(false);

  const navigate = useNavigate();

  // FIX: this used to be two separate pages/forms (LoginPage.jsx for
  // Admin/HR, EmployeeLogin.jsx for Employee), and which dashboard you
  // landed on depended on which page you happened to visit - not on the
  // actual role returned by the backend. There's only one login endpoint
  // and it already returns `role`, so a single form here decides the
  // destination correctly regardless of which credentials are typed in.
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

      if (data.role === "HR" || data.role === "Admin") {
        setSession("hr", data);

        // FIX: HR is also an employee, so the same HR login should be
        // able to reach their own personal employee dashboard (own
        // attendance/leave/payslip) as well as the admin panel - without
        // logging in a second time. The JWT already carries role "HR",
        // which the backend's employee-side routes already accept, so
        // storing it under emp_token too just unlocks that portal with
        // the same session. Admin doesn't get this, since the employee
        // routes are intentionally restricted to Employee/HR only.
        if (data.role === "HR") {
          setSession("employee", data);

          // HR can access both portals with this same session - ask which
          // one they want instead of assuming admin.
          setShowPortalChoice(true);
          return;
        }

        navigate("/admin/dashboard", { replace: true });
      } else if (data.role === "Employee") {
        setSession("employee", data);

        // Login succeeded. Attendance is a separate operation, so a
        // failure here shouldn't block the employee from reaching their
        // dashboard. "Already checked in today" isn't a real failure -
        // it just means today's attendance is already marked (e.g. they
        // logged in earlier and closed the browser) - so don't alarm the
        // user with an error dialog for it.
        try {
          await attendanceServices.signIn(data.token);
        } catch (attendanceError) {
          const msg = attendanceError.response?.data?.message || attendanceError.message;

          if (!msg?.toLowerCase().includes("already checked in")) {
            await alert({ title: "Attendance Sign-In Failed", message: msg, type: "error" });
          }
        }

        navigate("/employee/dashboard", { replace: true });
      } else if (data.role === "Intern") {
        setSession("intern", data);

        // Same non-blocking sign-in behaviour as the Employee branch above.
        try {
          await attendanceServices.signIn(data.token);
        } catch (attendanceError) {
          const msg = attendanceError.response?.data?.message || attendanceError.message;

          if (!msg?.toLowerCase().includes("already checked in")) {
            await alert({ title: "Attendance Sign-In Failed", message: msg, type: "error" });
          }
        }

        navigate("/intern/dashboard", { replace: true });
      } else {
        await alert({ title: "Login Failed", message: "Invalid User", type: "error" });
      }
    } catch (err) {
      await alert({ title: "Login Failed", message: err.response?.data?.message || "Invalid User", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const continueToAdmin = () => {
    setShowPortalChoice(false);
    navigate("/admin/dashboard", { replace: true });
  };

  const continueToEmployee = async () => {
    setShowPortalChoice(false);

    // Same as the direct Employee login path - attendance sign-in shouldn't
    // block reaching the dashboard if it fails, and "already checked in
    // today" isn't a real failure worth alarming the user about.
    try {
      await attendanceServices.signIn();
    } catch (attendanceError) {
      const msg = attendanceError.response?.data?.message || attendanceError.message;

      if (!msg?.toLowerCase().includes("already checked in")) {
        await alert({ title: "Attendance Sign-In Failed", message: msg, type: "error" });
      }
    }

    navigate("/employee/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden bg-linear-to-br from-amber-100 via-amber-50 to-white px-10 py-10">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full border border-amber-200/70"></div>
          <div className="absolute -top-10 -left-40 w-[420px] h-[420px] rounded-full border border-amber-200/50"></div>
          <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-amber-200/30 blur-3xl"></div>
        </div>

        {/* Floating animation for the chips around the photo */}
        <style>{`
          @keyframes hrms-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-9px); }
          }
          .hrms-float { animation: hrms-float 4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .hrms-float { animation: none; } }
        `}</style>

        {/* Photo + floating chips */}
        <div className="relative flex-1 flex items-center justify-center pt-10">
          <div className="relative w-[66%] max-w-[580px]">
            {/* top badge - sits just above the photo with a small gap */}
            <FloatChip
              plain
              className="-top-11 left-0 right-0 flex justify-center"
              delay="0s"
              duration="4.4s"
            >
              <span className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                Role-based access
              </span>
            </FloatChip>

            {/* photo - full original aspect ratio (16:9), no cropping */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl bg-amber-100">
              {!imgFailed ? (
                <img
                  src="/login-team.png"
                  alt="HRMS team"
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-200 to-amber-100">
                  <Users className="w-16 h-16 text-amber-500/70" />
                </div>
              )}
            </div>

            {/* floating chips */}
            <FloatChip icon={Settings} label="Admin & Settings" className="top-[4%] -left-[20%]" delay="0s" duration="4s" />
            <FloatChip icon={Briefcase} label="HR Operations" className="top-[3%] -right-[18%]" delay="0.6s" duration="4.6s" />
            <FloatChip icon={User} label="Employee Self-Service" className="top-[38%] -left-[28%]" delay="1.1s" duration="5s" />
            <FloatChip icon={GraduationCap} label="Intern Workspace" className="top-[42%] -right-[26%]" delay="0.3s" duration="4.2s" />
            <FloatChip icon={Wallet} label="Payroll & Performance" className="-bottom-[9%] -right-[20%]" delay="0.9s" duration="4.8s" />

            {/* dark "3 roles" card */}
            <FloatChip plain className="-bottom-[11%] -left-[8%]" delay="0.4s" duration="5.2s">
              <span className="block rounded-xl bg-gray-900 px-4 py-3 shadow-xl">
                <span className="block text-lg font-bold leading-none">
                  <span className="text-amber-400">3</span>{" "}
                  <span className="text-white">roles</span>
                </span>
                <span className="mt-1 block text-[10px] text-gray-300">HR · Employee · Intern</span>
              </span>
            </FloatChip>
          </div>
        </div>

        {/* Headline */}
        <div className="relative mt-20 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight text-gray-900">
            HRMS.
            <br />
            <span className="text-amber-500">One portal, every role.</span>
          </h2>

          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Built for admins, HR teams, employees and interns — attendance,
            leave, payroll, timesheets and appraisals in one secure workspace.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-gray-800">
            {["Multi-role access", "HR & payroll automation", "Performance tracking"].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-[45%] justify-center items-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/60">
          {/* Heading */}
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Sign in to HRMS</h1>
          <p className="mt-2 text-sm text-gray-500">
            Access attendance, leave balance, task update, payroll and Stipend.
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
            {/* Employee ID */}
            <div>
              <label htmlFor="employeeCode" className="block mb-2 text-xs font-semibold text-gray-800">
                Employee ID
              </label>

              <div className="relative">
                <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  id="employeeCode"
                  type="text"
                  value={employeeCode}
                  onChange={(e) => { setErrors((prev) => ({ ...prev, employeeCode: "" })); setEmployeeCode(e.target.value.toUpperCase()); }}
                  placeholder="Enter your Employee ID"
                  className={`w-full rounded-xl border ${errors.employeeCode ? "border-red-500" : "border-gray-200"} bg-gray-50 pl-11 pr-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400`}
                />
              </div>
              {errors.employeeCode && <p className="text-xs text-red-500 mt-1">{errors.employeeCode}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-gray-800">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-semibold text-amber-500 hover:text-amber-600"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setErrors((prev) => ({ ...prev, password: "" })); setPassword(e.target.value); }}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border ${errors.password ? "border-red-500" : "border-gray-200"} bg-gray-50 pl-11 pr-11 py-3 text-sm outline-none placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              loading={loading}
              loadingText="Signing In..."
              className="mt-1 w-full rounded-xl py-3.5 text-sm font-bold text-gray-900 shadow-lg shadow-amber-200 !bg-[#FFB800] hover:!bg-[#F2AC00]"
            >
              Log in
              {!loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Need help? Contact your <span className="font-semibold text-gray-700">HR Administrator.</span>
          </p>
        </div>
      </div>

      {/* HR portal choice modal - only shown when the logged-in role is HR */}
      {showPortalChoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold text-gray-800">
              Welcome, HR 👋
            </h3>
            <p className="text-gray-500 mt-2 mb-6">
              Which dashboard would you like to open?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={continueToAdmin}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition duration-200"
              >
                Continue as Admin
              </button>

              <button
                onClick={continueToEmployee}
                className="w-full border border-yellow-500 text-yellow-600 hover:bg-yellow-50 py-3 rounded-xl font-semibold transition duration-200"
              >
                Continue as Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FloatChip({ icon: Icon, label, className = "", delay = "0s", duration = "4s", plain = false, children }) {
  return (
    <div className={`absolute z-10 ${className}`}>
      <div className="hrms-float" style={{ animationDelay: delay, animationDuration: duration }}>
        {plain ? (
          children
        ) : (
          <div className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-lg">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
              <Icon className="h-3.5 w-3.5 text-amber-600" />
            </span>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}