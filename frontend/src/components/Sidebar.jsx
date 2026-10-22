import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { adminMenus, employeeMenus, internMenus } from "./Constants/Menus.js";
import attendanceServices from "../services/attendanceServices";
import { useDialog } from "./Dialogbox/DialogContext";
import { clearAllSessions } from "../utils/auth";
import useInternStipendAccess from "../hooks/useInternStipendAccess";

import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
} from "lucide-react";


export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { alert } = useDialog();

  const navigate = useNavigate();
  const location = useLocation();

  // FIX: this state was missing entirely, which meant clicking "Sign Out"
  // threw "loggingOut is not defined" and the button did nothing.
  const [loggingOut, setLoggingOut] = useState(false);

  const isIntern = location.pathname.startsWith("/intern");
  const isEmployee = !isIntern && location.pathname.startsWith("/employee");
  // Interns check in/out too (same attendance endpoints, no role check) -
  // both portals run the checkout-on-logout step admin does not.
  const tracksAttendance = isEmployee || isIntern;

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      // Attendance checkout is a separate operation from logging out - a
      // failure here (e.g. "You have already checked out today.", which
      // is expected if they checked out earlier and are logging out
      // again) must never block clearing the session and returning to
      // the login page. Only genuinely unexpected errors get surfaced.
      if (tracksAttendance) {
        try {
          const response = await attendanceServices.signOut();
          console.log("Checkout successful:", response);
        } catch (attendanceError) {
          const message =
            attendanceError.response?.data?.message ||
            attendanceError.message;

          if (message !== "You have already checked out today.") {
            await alert({
              title: "Sign Out Failed",
              message: message || "Unable to record attendance checkout.",
              type: "error",
            });
          }
        }
      }

      // clears every portal session + the legacy "token" key
      clearAllSessions();

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);

      await alert({ title: "Sign Out Failed", message: error.response?.data?.message || "Unable to sign out. Please try again.", type: "error" });

      setLoggingOut(false);
    }
  };

  const stipendEnabled = useInternStipendAccess(isIntern);

  // Interns on a free internship have no Stipend module.
  const menus = isIntern
    ? internMenus.filter((menu) => menu.path !== "/intern/stipend" || stipendEnabled)
    : isEmployee
      ? employeeMenus
      : adminMenus;

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-300 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:static lg:z-auto lg:translate-x-0 lg:transition-all ${
        sidebarOpen ? "lg:w-72" : "lg:w-20"
      }`}
    >
      <div
        className={`h-18 border-b border-gray-300 ${
          sidebarOpen ? "px-4 py-2" : "py-4 flex justify-center"
        } border-b border-gray-300`}
      >
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-400 rounded-xl flex items-center justify-center text-white">
                <GraduationCap size={20} />
              </div>

              <div className="leading-tight">
                <h2 className="font-bold text-lg text-gray-900">
                  <span className="text-yellow-500">V</span>soft
                </h2>

                <p className="text-xs text-gray-500">
                  {isIntern ? "Intern Portal" : isEmployee ? "Employee Portal" : "Admin Portal"}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden text-gray-600 lg:block"
          >
            {sidebarOpen ? (
              <PanelLeftClose
                size={20}
                style={{ transform: "translateX(-2px)" }}
              />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </button>
        </div>
      </div>
      <div className="p-4 flex-1">
        {sidebarOpen && <p className="text-gray-500 text-sm mb-4">Workspace</p>}
        <div className="space-y-1">
          {menus.map((item, i) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={i}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center ${
                    sidebarOpen ? "gap-3 px-4 justify-start" : "justify-center"
                  } py-3 rounded-xl transition ${
                    isActive
                      ? "bg-yellow-400 text-black"
                      : "text-gray-700 hover:bg-gray-200"
                  }`
                }
              >
                <Icon size={20} />

                {sidebarOpen && <span>{item.name}</span>}

                {!sidebarOpen && (
                  <span
                    className="
              absolute left-16
              invisible opacity-0
              group-hover:visible
              group-hover:opacity-100
              transition-all duration-200
              whitespace-nowrap
              bg-gray-900 text-white
              text-sm px-3 py-1.5
              rounded-lg shadow-lg
              z-50
            "
                  >
                    {item.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-gray-300">
        <button
          onClick={handleLogout}
          className={`flex items-center ${
            sidebarOpen ? "gap-3 px-3" : "justify-center"
          } py-2 rounded-lg hover:bg-gray-100 w-full`}
        >
          <LogOut size={18} />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}