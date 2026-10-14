export default function PayrollStatus() {
  return (
    <div className="bg-white rounded-3xl border border-gray-300 p-6">
      <h3 className="font-semibold text-2xl mb-2">Payroll Status</h3>

      <div className="text-4xl font-bold">
        10<span className="text-xl text-gray-600">/12</span>
      </div>

      <p className="text-gray-600 mt-2">Processed this cycle</p>

      <div className="h-3 rounded-full bg-gray-200 mt-4">
        <div className="h-3 w-[85%] bg-yellow-500 rounded-full" />
      </div>

      <div className="space-y-5 mt-8">
        <div className="flex justify-between">
          <span className="text-gray-600">Gross payout</span>
          <b>₹6,84,000</b>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Deductions</span>
          <b>₹82,080</b>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Net payout</span>
          <b>₹6,01,920</b>
        </div>
      </div>
    </div>
  );
}
