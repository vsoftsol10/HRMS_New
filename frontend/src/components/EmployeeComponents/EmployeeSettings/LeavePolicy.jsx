import { FileX2, ShieldCheck } from "lucide-react";

import useFetch from "../../../hooks/useFetch";
import employeeSettingsServices from "../../../services/employeeSettingsServices";

export default function LeavePolicy() {
  const { data } = useFetch({
    getAll: employeeSettingsServices.getLeavePolicy,
  });

  const policies = [
    {
      title: "Casual Leave",
      description: `${data?.casual_leave} days per year.`,
      icon: FileX2,
    },
    {
      title: "Sick Leave",
      description: `${data?.sick_leave} days per year.`,
      icon: ShieldCheck,
    },
    {
      title: "Earned Leave",
      description: `${data?.earned_leave} days per year.`,
      icon: FileX2,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-8">
      <h2 className="text-2xl font-semibold mb-2">Leave Policy</h2>

      <p className="text-gray-500 mb-8">
        Company leave rules and entitlements.
      </p>

      <div className="space-y-5">
        {policies.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="border border-gray-200 rounded-2xl p-6"
            >
              <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-yellow-50 h-fit">
                  <Icon className="text-yellow-600" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>

                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}