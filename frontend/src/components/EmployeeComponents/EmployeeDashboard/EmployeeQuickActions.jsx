import { CalendarDays, Wallet, Calendar, ChartPie } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "Apply Leave",
    icon: CalendarDays,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    path: "/employee/leave",
  },
  {
    title: "View Payslip",
    icon: Wallet,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    path: "/employee/payroll",
  },
  {
    title: "View Holidays",
    icon: Calendar,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    path: "/employee/holidays",
  },
  {
    title: "Attendance Summary",
    icon: ChartPie,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    path: "/employee/attendance",
  },
];

export default function EmployeeQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
          <CalendarDays size={22} className="text-yellow-600" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">Quick Actions</h2>

          <p className="text-sm text-gray-500">Shortcuts</p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className="
                rounded-2xl
                border
                border-gray-300
                p-5
                text-left
                transition
                hover:shadow-md
                hover:border-yellow-300
              "
            >
              <div
                className={`
                  h-12
                  w-12
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  ${action.iconBg}
                `}
              >
                <Icon size={22} className={action.iconColor} />
              </div>

              <p className="mt-5 font-semibold text-lg leading-6">
                {action.title}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
