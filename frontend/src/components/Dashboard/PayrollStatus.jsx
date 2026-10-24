const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

// payroll_month is always YYYY-MM-01
const formatMonth = (month) => {
  if (!month) return "";

  return new Date(`${month}T00:00:00`).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
};

export default function PayrollStatus({ payroll }) {
  const processed = payroll?.processed || 0;
  const total = payroll?.total || 0;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const monthLabel = formatMonth(payroll?.month);

  return (
    <div className="bg-white rounded-3xl border border-gray-300 p-6">
      <h3 className="font-semibold text-2xl mb-2">Payroll Status</h3>

      <div className="text-4xl font-bold">
        {processed}
        <span className="text-xl text-gray-600">/{total}</span>
      </div>

      <p className="text-gray-600 mt-2">
        {total === 0
          ? "No payroll generated yet"
          : `Processed this cycle${monthLabel ? ` • ${monthLabel}` : ""}`}
      </p>

      <div className="h-3 rounded-full bg-gray-200 mt-4">
        <div
          className="h-3 bg-yellow-500 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-5 mt-8">
        <div className="flex justify-between">
          <span className="text-gray-600">Gross payout</span>
          <b>{formatCurrency(payroll?.gross)}</b>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Deductions</span>
          <b>{formatCurrency(payroll?.deductions)}</b>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Net payout</span>
          <b>{formatCurrency(payroll?.net)}</b>
        </div>
      </div>
    </div>
  );
}