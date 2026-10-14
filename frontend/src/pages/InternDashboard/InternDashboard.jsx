import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  CreditCard,
  Folder,
  Plane,
} from "lucide-react";
import { Link } from "react-router-dom";

import MainLayout from "../../components/Layout/layout";
import useFetch from "../../hooks/useFetch";
import internPortalServices from "../../services/internPortalServices";
import { formatDate } from "../../utils/internUtils";

// Stipends are shown as paid out on this day of the month after the stipend month.
const STIPEND_PAYOUT_DAY = 5;

const ACTIVITY_STYLE = {
  leave: { icon: Plane, bg: "bg-blue-50", color: "text-blue-500" },
  task: { icon: Folder, bg: "bg-purple-50", color: "text-purple-500" },
  announcement: { icon: Bell, bg: "bg-yellow-50", color: "text-yellow-500" },
};

const STATUS_STYLE = {
  Pending: "bg-orange-50 text-orange-500",
  Approved: "bg-green-50 text-green-600",
  Rejected: "bg-red-50 text-red-500",
};

const QUICK_ACTIONS = [
  { title: "Apply Leave", icon: Plane, path: "/intern/leave" },
  { title: "View Attendance", icon: CalendarCheck, path: "/intern/attendance" },
  { title: "Tasks", icon: Folder, path: "/intern/tasks" },
];

export default function InternDashboard() {
  const { data, loading, error, reload } = useFetch(internPortalServices);

  if (loading && !data?.full_name) {
    return (
      <MainLayout title="Dashboard">
        <p className="text-gray-500">Loading...</p>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Dashboard">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-red-700">Unable to load your dashboard.</p>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  const firstName = (data.full_name || "").split(" ")[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 16 ? "Good Afternoon" : "Good Evening";

  const stats = data.stats || {};
  const recentActivity = data.recent_activity || [];
  const summary = data.attendance_summary || {};

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s your internship overview.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <TopStat
            icon={CalendarCheck}
            iconBg="bg-green-50"
            iconColor="text-green-500"
            value={stats.present_days}
            label="Present Days"
          />
          <TopStat
            icon={CalendarDays}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            value={stats.absent_days}
            label="Absent Days"
          />
          <TopStat
            icon={CreditCard}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-500"
            value={stats.stipend_status}
            label="Stipend Status"
          />
          <TopStat
            icon={Folder}
            iconBg="bg-purple-50"
            iconColor="text-purple-500"
            value={stats.tasks_uploaded}
            label="Tasks Uploaded"
          />
        </div>

        {/* Recent Activity / Attendance Summary / Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Recent Activity */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Recent Activity
            </h2>

            {recentActivity.length === 0 && (
              <p className="text-sm text-gray-500">Nothing here yet.</p>
            )}

            <ul className="space-y-5">
              {recentActivity.map((item, index) => {
                const style = ACTIVITY_STYLE[item.type] || ACTIVITY_STYLE.task;
                const Icon = style.icon;
                const subtitle =
                  item.type === "leave" && item.days != null
                    ? `${item.subtitle} · ${item.days} ${
                        Number(item.days) === 1 ? "day" : "days"
                      }`
                    : item.subtitle;

                return (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`h-9 w-9 shrink-0 rounded-lg ${style.bg} flex items-center justify-center`}
                      >
                        <Icon size={16} className={style.color} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">{item.title}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    {item.status && (
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                          STATUS_STYLE[item.status] || STATUS_STYLE.Pending
                        }`}
                      >
                        {item.status === "Pending" ? "• " : ""}
                        {item.status}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Attendance Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                Attendance Summary
              </h2>
              <span className="text-xs text-gray-500">{summary.month_label}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryTile
                value={summary.present}
                label="Present"
                bg="bg-green-50"
                color="text-green-600"
              />
              <SummaryTile
                value={summary.absent}
                label="Absent"
                bg="bg-red-50"
                color="text-red-500"
              />
              <SummaryTile
                value={summary.leave}
                label="Leave"
                bg="bg-blue-50"
                color="text-blue-500"
              />
            </div>

            <div className="flex items-center justify-center gap-5 mt-5 text-xs text-gray-500">
              <LegendDot color="bg-green-500" label="Present" />
              <LegendDot color="bg-red-500" label="Absent" />
              <LegendDot color="bg-blue-500" label="Leave" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 md:col-span-2 xl:col-span-1">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              Quick Actions
            </h2>

            <div className="space-y-3">
              {QUICK_ACTIONS.map(({ title, icon: Icon, path }) => (
                <Link
                  key={title}
                  to={path}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-gray-900">
                    <Icon size={16} className="text-yellow-500" />
                    {title}
                  </span>
                  <ChevronRight size={16} className="text-gray-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stipend bar */}
        {data.current_stipend && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="h-10 w-10 shrink-0 rounded-lg bg-yellow-50 flex items-center justify-center">
                <CreditCard size={18} className="text-yellow-500" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {data.current_stipend.month_label} Stipend
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ₹{Number(data.current_stipend.amount).toLocaleString("en-IN")}{" "}
                  / month · {data.current_stipend.status}
                </p>
              </div>
            </div>

            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={15} />
              <StipendDateText stipend={data.current_stipend} />
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function TopStat({ icon: Icon, iconBg, iconColor, value, label }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <span
        className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}
      >
        <Icon size={17} className={iconColor} />
      </span>
      <p className="text-2xl font-bold text-gray-900 mt-4">{value ?? "-"}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SummaryTile({ value, label, bg, color }) {
  return (
    <div className={`rounded-xl ${bg} py-5`}>
      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
      <p className={`text-xs font-medium mt-1 ${color}`}>{label}</p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function StipendDateText({ stipend }) {
  if (stipend.status === "Paid") {
    return <span>Paid on {formatDate(stipend.paid_date)}</span>;
  }

  // stipend.month is "YYYY-MM-01"; payout falls in the following month.
  const [year, month] = String(stipend.month)
    .slice(0, 10)
    .split("-")
    .map(Number);
  const payout = new Date(year, month, STIPEND_PAYOUT_DAY);

  if (Number.isNaN(payout.getTime())) return <span>Payment pending</span>;

  return (
    <span>
      Payment scheduled for{" "}
      {payout.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}
    </span>
  );
}