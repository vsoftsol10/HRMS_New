import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import useFetch from "../../hooks/useFetch";
import employeeChartServices from "../../services/employeeChartServices";

export default function EmployeeGrowth() {
  
  const { data = [] } = useFetch(employeeChartServices);

  return (
    <div className="bg-white rounded-3xl border border-gray-300 p-6">
      <h3 className="font-semibold text-2xl mb-5">Employee Growth</h3>

      <div className="h-[300px]">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#b4b6ba" />

            <XAxis dataKey="month" />
            <YAxis />

            <Tooltip
              contentStyle={{
                borderRadius: "7px",
              }}
            />

            <Line dataKey="total" stroke="#eab308" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
