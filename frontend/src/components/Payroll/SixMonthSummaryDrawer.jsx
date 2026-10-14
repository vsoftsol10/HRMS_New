import { X } from "lucide-react";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatMonth = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

/**
 * Presentational only - the parent fetches the summary (HR: by employee
 * id, employee: their own) and passes it in. Only Finalized/Paid months
 * are ever included by the backend, so nothing shown here can still
 * change under someone's feet.
 */
export default function SixMonthSummaryDrawer({
  open,
  onClose,
  summary,
  loading,
  employeeName,
}) {
  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/20 z-40" />

      <div className="fixed top-0 right-0 h-screen w-full sm:w-[520px] bg-white z-50 overflow-y-auto shadow-2xl">
        <div className="p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">6-Month Summary</h2>
            <p className="text-sm text-gray-500 mt-1">
              {employeeName ? `${employeeName} - ` : ""}last 6 finalized
              payroll months
            </p>
          </div>

          <button>
            <X size={18} className="text-gray-500" onClick={onClose} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {loading && (
            <p className="text-sm text-gray-500">Loading summary...</p>
          )}

          {!loading && summary && summary.monthsIncluded === 0 && (
            <div className="bg-gray-50 border border-gray-300 rounded-md p-4 text-sm text-gray-600">
              No finalized payroll months yet - a payroll only appears here
              once it has been Finalized.
            </div>
          )}

          {!loading && summary && summary.monthsIncluded > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-300 rounded-md p-3">
                  <p className="text-xs text-gray-500">Total Gross</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(summary.totals.grossSalary)}
                  </p>
                </div>

                <div className="border border-gray-300 rounded-md p-3">
                  <p className="text-xs text-gray-500">Total Net</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(summary.totals.netSalary)}
                  </p>
                </div>

                <div className="border border-gray-300 rounded-md p-3">
                  <p className="text-xs text-gray-500">Total Deductions</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(summary.totals.deductions)}
                  </p>
                </div>

                <div className="border border-gray-300 rounded-md p-3">
                  <p className="text-xs text-gray-500">Average Net / Month</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(summary.averageNetSalary)}
                  </p>
                </div>
              </div>

              <div className="border border-gray-300 rounded-md overflow-hidden">
                <div className="bg-gray-50 grid grid-cols-5 px-4 py-2 text-xs font-semibold border-b border-gray-300">
                  <p>Month</p>
                  <p className="text-right">Gross</p>
                  <p className="text-right">Deductions</p>
                  <p className="text-right">Net</p>
                  <p className="text-right">LOP Days</p>
                </div>

                {summary.months.map((month) => (
                  <div
                    key={month.payrollMonth}
                    className="grid grid-cols-5 px-4 py-3 text-sm border-b border-gray-200 last:border-b-0"
                  >
                    <p>{formatMonth(month.payrollMonth)}</p>
                    <p className="text-right">{formatCurrency(month.grossSalary)}</p>
                    <p className="text-right">{formatCurrency(month.deductions)}</p>
                    <p className="text-right">{formatCurrency(month.netSalary)}</p>
                    <p className="text-right">{month.lopDays}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500">
                Only Finalized and Paid months are included - Draft and
                Review payroll never appear in this summary. Showing{" "}
                {summary.monthsIncluded} of up to 6 months.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}