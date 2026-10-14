import { useCallback, useEffect, useState } from "react";

import internStipendServices from "../../services/internStipendServices";
import InternStipendSlipModal from "../Payroll/InternStipendSlipModal";
import { formatDate } from "../../utils/internUtils";

const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

// HR -> intern detail -> Stipend tab. Lists every billable month for this
// intern; HR can open a month to mark it as paid.
export default function InternStipendHistory({ intern }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await internStipendServices.getByIntern(intern.id);
      setRows(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.log(err);
      setRows([]);
      setError(err?.response?.data?.message || "Unable to load stipend history.");
    }
  }, [intern.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handlePaid = async () => {
    setSelected(null);
    await load();
  };

  if (rows === null) {
    return <p className="py-10 text-center text-gray-500">Loading...</p>;
  }

  if (error) {
    return <p className="py-10 text-center text-red-600">{error}</p>;
  }

  if (!rows.length) {
    return (
      <div className="py-10 text-center">
        <p className="font-semibold">Stipend History</p>
        <p className="text-gray-500 mt-1">
          No stipend months have started for this internship yet.
        </p>
      </div>
    );
  }

  const paidTotal = rows
    .filter((row) => row.status === "Paid")
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const pendingCount = rows.filter((row) => row.status !== "Paid").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 text-sm">
        <p>
          <span className="text-gray-500">Total paid: </span>
          <span className="font-semibold">{formatAmount(paidTotal)}</span>
        </p>
        <p>
          <span className="text-gray-500">Pending months: </span>
          <span className="font-semibold">{pendingCount}</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-3 pr-4 font-medium">Month</th>
              <th className="py-3 pr-4 font-medium">Amount</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Paid On</th>
              <th className="py-3 pr-4 font-medium">Reference</th>
              <th className="py-3 font-medium text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.month} className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium">{row.month_label}</td>
                <td className="py-3 pr-4">{formatAmount(row.amount)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_STYLE[row.status] || STATUS_STYLE.Pending
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {row.paid_date ? formatDate(row.paid_date) : "-"}
                </td>
                <td className="py-3 pr-4">{row.reference || "-"}</td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-100 cursor-pointer"
                  >
                    {row.status === "Pending" ? "Mark as Paid" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <InternStipendSlipModal
          row={{
            ...selected,
            intern_id: intern.id,
            intern_name: intern.full_name,
            intern_code: intern.intern_code,
            department_name: intern.department_name,
            start_date: intern.start_date,
            end_date: intern.end_date,
          }}
          onClose={() => setSelected(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}