import { Building2, Clock3, Laptop, Shield, Users } from "lucide-react";

import useFetch from "../../../hooks/useFetch";
import employeeSettingsServices from "../../../services/employeeSettingsServices";

const icons = [Clock3, Laptop, Users, Shield];

export default function CompanyPolicy() {
  const { data: policies = [] } = useFetch({
    getAll: employeeSettingsServices.getCompanyPolicy,
  });

  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-yellow-50">
          <Building2 className="text-yellow-600" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold">Company Policy</h2>

          <p className="text-gray-500">General company rules and guidelines.</p>
        </div>
      </div>

      <div className="space-y-5">
        {policies.map((item, index) => {
          const Icon = icons[index] || Shield;

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
