import { useNavigate, useLocation } from "react-router-dom";
import { adminMenus, employeeMenus, internMenus } from "./Constants/Menus.js";
import useInternStipendAccess from "../hooks/useInternStipendAccess";
import useFetch from "../hooks/useFetch.js";
import dashboardServices from "../services/dashboardServices.js";
import employeeDashboardServices from "../services/employeeDashboardServices.js";
import internHeaderServices from "../services/internHeaderServices.js";
import attendanceServices from "../services/attendanceServices.js";
import profileServices, { PROFILE_UPDATED_EVENT } from "../services/profileServices.js";

import {
  Bell,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  Repeat,
  CalendarCheck,
  Clock3,
  Wallet,
  Megaphone,
  ShieldAlert,
  ListChecks,
  Trash2,
  Inbox,
  Menu,
} from "lucide-react";

import { useState, useRef, useEffect } from "react";

import notificationServices from "../services/notificationServices";
import { useDialog } from "./Dialogbox/DialogContext";
import { clearAllSessions } from "../utils/auth";

// =========================
// NOTIFICATION TYPE -> ICON / ROUTE
// =========================
// `type` comes from the notifications table (Leave | Permission | Payroll |
// Announcement | Attendance | Security ...). Each maps to an icon and, where
// it makes sense to jump straight to the related record, an admin/employee
// route pair driven off reference_id's subject.
const NOTIFICATION_ICONS = {
  Leave: CalendarCheck,
  Permission: Clock3,
  Payroll: Wallet,
  Announcement: Megaphone,
  Attendance: CalendarCheck,
  Security: ShieldAlert,
  Task: ListChecks,
};

const NOTIFICATION_ROUTES = {
  Leave: {
    admin: "/admin/leavemanagement",
    employee: "/employee/leave",
    intern: "/intern/leave",
  },
  Permission: { admin: "/admin/leavemanagement", employee: "/employee/leave" },
  Payroll: { admin: "/admin/payroll", employee: "/employee/payroll" },
  Announcement: {
    admin: "/admin/announcements",
    employee: "/employee/announcements",
    intern: "/intern/announcements",
  },
  Task: { intern: "/intern/tasks" },
  Attendance: {
    admin: "/admin/attendance",
    employee: "/employee/attendance",
    intern: "/intern/attendance",
  },
};

// =========================
// PER-USER DISMISSED NOTIFICATIONS
// =========================
// Broadcast notifications (announcements, team-wide notices) are ONE shared
// row for every recipient, so deleting that row when someone clicks it would
// remove it for everybody. Clicking a notification therefore hides it only
// for the current user (stored per portal + employee code in this browser).
const DISMISSED_USER_KEYS = {
  admin: "hr_user",
  employee: "employee_user",
  intern: "intern_user",
};

const dismissedStorageKey = (portal) =>
  `dismissed_notifications:${portal}:${
    localStorage.getItem(DISMISSED_USER_KEYS[portal]) || "unknown"
  }`;

const loadDismissedIds = (portal) => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(dismissedStorageKey(portal)) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveDismissedIds = (portal, ids) => {
  try {
    localStorage.setItem(
      dismissedStorageKey(portal),
      JSON.stringify(ids.slice(-500)),
    );
  } catch {
    // storage unavailable - the notification just reappears on reload
  }
};

export default function Header({ search, setSearch, sidebarOpen, setSidebarOpen }) {
  const { alert } = useDialog();
  const navigate = useNavigate();
  const location = useLocation();

  // IMPORTANT
  // Detect which portal the user is currently using
  const isIntern = location.pathname.startsWith("/intern");
  const isEmployee = !isIntern && location.pathname.startsWith("/employee");
  // Interns check in/out too, same as employees.
  const tracksAttendance = isEmployee || isIntern;
  const portal = isIntern ? "intern" : isEmployee ? "employee" : "admin";

  // Dashboard/profile service based on role
  const services = isIntern
    ? internHeaderServices
    : isEmployee
      ? employeeDashboardServices
      : dashboardServices;

  const { data } = useFetch(services);

  // Profile photo (shown in the avatar); refreshed when My Profile changes it.
  const { data: profile, reload: reloadProfile } = useFetch(profileServices);

  useEffect(() => {
    window.addEventListener(PROFILE_UPDATED_EVENT, reloadProfile);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, reloadProfile);
  }, [reloadProfile]);

  // Menu based on role
  const stipendEnabled = useInternStipendAccess(isIntern);

  // Interns on a free internship have no Stipend module (also in search).
  const menus = isIntern
    ? internMenus.filter((menu) => menu.path !== "/intern/stipend" || stipendEnabled)
    : isEmployee
      ? employeeMenus
      : adminMenus;

  const filteredMenus = menus.filter((menu) =>
    menu.name.toLowerCase().includes(search.toLowerCase())
  );

  // Notifications
  const {
    data: notifications,
    reload: reloadNotifications,
  } = useFetch(notificationServices);

  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() =>
    loadDismissedIds(portal),
  );

  // Notifications the user has already clicked stay hidden.
  const visibleNotifications = (
    Array.isArray(notifications) ? notifications : []
  ).filter((item) => !dismissedIds.includes(item.id));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // =========================
  // LOGOUT
  // =========================
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
  // =========================
  // NOTIFICATION POLLING
  // =========================
  useEffect(() => {
    const interval = setInterval(() => {
      reloadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [reloadNotifications]);

  // =========================
  // NOTIFICATION READ + NAVIGATE
  // =========================
  const handleNotificationClick = async (item) => {
    setShowNotifications(false);

    // 1. Redirect to the related module
    const target = NOTIFICATION_ROUTES[item.type]?.[portal];

    if (target) {
      navigate(target);
    }

    // 2. Remove it from this user's notification list
    const nextDismissed = [...dismissedIds, item.id];
    setDismissedIds(nextDismissed);
    saveDismissedIds(portal, nextDismissed);

    // 3. Keep the server-side read flag in sync (never blocks the above)
    if (!item.is_read) {
      try {
        await notificationServices.markAsRead(item.id);
        reloadNotifications();
      } catch (error) {
        console.error("Mark notification as read failed:", error);
      }
    }
  };

  const handleMarkAllRead = async () => {
    await notificationServices.markAllAsRead();
    reloadNotifications();
  };

  // =========================
  // NOTIFICATION DELETE
  // =========================
  const handleNotificationDelete = async (event, id) => {
    event.stopPropagation();
    await notificationServices.remove(id);
    reloadNotifications();
  };

  // =========================
  // CLICK OUTSIDE
  // =========================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="h-18 bg-white border-b border-gray-300 px-3 sm:px-4 lg:px-8 py-3">
      <div className="h-full flex items-center justify-between gap-3 w-full">
        {/* ================= SEARCH ================= */}
        <div className="relative flex-1 max-w-96">
          <button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-3 text-gray-600 lg:hidden"><Menu size={22} /></button>
          <Search
            size={18}
            className="absolute left-12 lg:left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-11 pr-4 h-11 w-[calc(100%-3rem)] sm:w-full bg-gray-100 border border-gray-400 rounded-xl"
          />

          {search && (
            <div className="absolute mt-2 w-full bg-white border border-gray-400 rounded-xl shadow-lg z-50 overflow-hidden">
              {filteredMenus.length > 0 ? (
                filteredMenus.map((menu) => (
                  <button
                    key={menu.path}
                    onClick={() => {
                      navigate(menu.path);
                      setSearch("");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100"
                  >
                    {menu.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500">No results found</div>
              )}
            </div>
          )}
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5 lg:gap-8">
          {/* ================= NOTIFICATIONS ================= */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative"
            >
              <Bell size={20} className="cursor-pointer" />

              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {visibleNotifications.filter((item) => !item.is_read).length}
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-[calc(100vw-1.5rem)] max-w-[400px] bg-white rounded-3xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-300">
                  <h3 className="font-semibold text-xl">Notifications</h3>

                  <button
                    onClick={handleMarkAllRead}
                    className="text-blue-500 text-sm"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[450px] overflow-y-auto">
                  {visibleNotifications.length > 0 ? (
                    visibleNotifications.map((item) => {
                      const Icon = NOTIFICATION_ICONS[item.type] || Bell;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`flex items-start justify-between gap-3 border-b px-5 py-5 border-gray-300 hover:bg-gray-50 cursor-pointer ${
                            item.is_read ? "bg-white" : "bg-yellow-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <Icon
                              size={18}
                              className={`mt-1 shrink-0 ${
                                item.is_read
                                  ? "text-gray-400"
                                  : "text-yellow-600"
                              }`}
                            />

                            <div>
                              <h4
                                className={`text-lg ${
                                  item.is_read
                                    ? "font-medium"
                                    : "font-semibold"
                                }`}
                              >
                                {item.title}
                              </h4>

                              <p className="text-gray-500">{item.message}</p>
                            </div>
                          </div>

                          <button
                            onClick={(event) =>
                              handleNotificationDelete(event, item.id)
                            }
                            className="shrink-0 text-gray-400 hover:text-red-500"
                            aria-label="Delete notification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                      <Inbox size={28} />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= PROFILE ================= */}
          <div
            ref={profileRef}
            className="relative border-l border-gray-300 pl-3 sm:pl-6"
          >
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3"
            >
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={data?.userName || "Profile"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center font-medium">
                  {data?.userName?.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="hidden text-left sm:block">
                <h3 className="font-medium">{data?.userName}</h3>

                <p className="text-sm text-gray-500">{data?.role}</p>
              </div>

              <ChevronDown size={18} className="hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-64 rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                {/*
                 * FIX: HR is also an employee - they need to reach both
                 * the admin panel and their own personal employee
                 * dashboard (attendance/leave/payslip) without logging
                 * in twice. LoginPage.jsx now stores a working session
                 * for both portals when an HR user logs in, so this just
                 * needs a way to jump between them.
                 */}
                {data?.role === "HR" && (
                  <>
                    <button
                      onClick={() => {
                        navigate(
                          isEmployee ? "/admin/dashboard" : "/employee/dashboard",
                        );

                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-4 w-full px-5 py-5 hover:bg-yellow-200"
                    >
                      <Repeat size={20} />
                      {isEmployee ? "Switch to Admin Panel" : "Switch to Employee View"}
                    </button>

                    <div className="border-t border-gray-400" />
                  </>
                )}

                {/* SETTINGS */}
                <button
                  onClick={() => {
                    navigate(
                      isIntern
                        ? "/intern/settings"
                        : isEmployee
                          ? "/employee/settings"
                          : "/admin/settings",
                    );

                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-4 w-full px-5 py-5 hover:bg-yellow-200"
                >
                  <Settings size={20} />
                  Settings
                </button>

                <div className="border-t border-gray-400" />

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full px-5 py-5 text-red-500 hover:bg-red-100"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};