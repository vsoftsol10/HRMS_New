

import { resolvePayslipData } from "../../utils/payslipData";

export default function PayslipTemplate({ payroll }) {

   if (!payroll) return null;

   const data = resolvePayslipData(payroll);

   const employeeDetailsLeft = [
     {
       label: "Employee Name",
       value: data.employeeName,
     },
     {
       label: "Employee ID",
       value: data.employeeCode,
     },
     {
       label: "Department",
       value: data.department,
     },
     {
       label: "Role / Designation",
       value: data.designation,
     },
   ];

   const employeeDetailsRight = [
     {
       label: "Date of Joining",
       value: data.joiningDate,
     },
     {
       label: "Employment Type",
       value: data.employmentType,
     },
   ];

const earnings = data.earnings;

const deductions = data.deductions;

const totalEarnings = data.totalEarnings;

const totalDeductions = data.totalDeductions;

const netSalary = data.netSalary;

const payrollMonth = new Date(payroll.payroll_month).toLocaleDateString(
  "en-GB",
  {
    month: "long",
    year: "numeric",
  },
);

const payDate = payroll.paid_at
  ? new Date(payroll.paid_at).toLocaleDateString("en-GB")
  : "-";

  return (
    <div className="h-fit bg-[#f8f8f8] p-4">
      <div className="max-w-6xl mx-auto bg-white shadow-lg">
        {/* Top Yellow Line */}
        <div className="h-4 bg-[#f4b400]" />

        <div className="p-8">
          {/* HEADER */}
          <div className="flex justify-between items-start">
            {/* Left */}
            <div className="flex gap-6">
              <h1 className="text-7xl font-bold text-[#f4b400]">vsoft</h1>

              <div className="w-[2px] bg-[#f4b400]" />

              <div>
                <h2 className="text-3xl font-bold uppercase">
                  VSOFT SOLUTIONS PVT. LTD.
                </h2>

                <div className="mt-2 text-xl leading-10 text-gray-700">
                  <p>No.45, 2nd Floor, Embassy TechVillage,</p>

                  <p>Outer Ring Road, Devarabeesanahalli,</p>

                  <p>Bengaluru - 560103, Karnataka, India</p>

                  <p className="mt-2">CIN: U72200KA2010PTC053456</p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div>
              <h1 className="text-6xl font-bold text-[#f4b400]">PAYSLIP</h1>

              <div className="mt-8 space-y-5 text-xl">
                <div className="flex gap-4">
                  <p>Payslip month </p>

                  <span className="font-semibold text-[#f4b400]">{ payrollMonth }</span>
                </div>

                <div className="flex gap-4">
                  <p>Pay Date</p>

                  <span className="font-semibold text-[#f4b400] ml-20">
                    { payDate }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b-2 border-[#f4b400] my-8" />

          {/* EMPLOYEE DETAILS */}

          <div>
            <div className="inline-block bg-[#f4b400] px-6 py-3 rounded-t-xl">
              <h3 className="font-bold text-3xl">EMPLOYEE DETAILS</h3>
            </div>

            <div className="border border-[#f4b400] rounded-r-xl rounded-b-xl p-8">
              <div className="grid grid-cols-2 gap-16 text-xl">
                {/* LEFT */}

                <div className="space-y-8">
                  {employeeDetailsLeft.map((item) => (
                    <div key={item.label} className="flex">
                      <p className="w-52">{item.label}</p>
                      <p>:</p>
                      <p className="ml-8">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* RIGHT */}

                <div className="space-y-8">
                  {employeeDetailsRight.map((item) => (
                    <div key={item.label} className="flex">
                      <p className="w-52">{item.label}</p>
                      <p>:</p>
                      <p className="ml-8">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* EARNINGS + DEDUCTIONS */}

          <div className="grid grid-cols-2 gap-8 mt-10">
            {/* EARNINGS */}

            <div>
              <div className="bg-[#f4b400] p-4 rounded-t-xl">
                <h3 className="text-3xl font-bold">EARNINGS</h3>
              </div>

              <table className="w-full border border-[#f4b400] text-xl">
                <thead>
                  <tr className="bg-[#fffaf0]">
                    <th className="text-left p-4 border">DESCRIPTION</th>

                    <th className="border">AMOUNT (₹)</th>
                  </tr>
                </thead>

                <tbody>
                  {earnings.map((item) => (
                    <tr key={item.item_name}>
                      <td className="p-4 border">{item.item_name}</td>

                      <td className="border text-center">
                        {Number(item.amount).toLocaleString("en-GB")}
                      </td>
                    </tr>
                  ))}

                  <tr className="font-bold bg-[#fffaf0]">
                    <td className="p-4 border">TOTAL EARNINGS</td>
                    <td className="border text-center">
                      {totalEarnings.toLocaleString("en-GB")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DEDUCTIONS */}

            <div>
              <div className="bg-[#f4b400] p-4 rounded-t-xl">
                <h3 className="text-3xl font-bold">DEDUCTIONS</h3>
              </div>

              <table className="w-full border border-[#f4b400] text-xl">
                <thead>
                  <tr className="bg-[#fffaf0]">
                    <th className="text-left p-4 border">DESCRIPTION</th>

                    <th className="border">AMOUNT (₹)</th>
                  </tr>
                </thead>

                <tbody>
                  {deductions.map((item) => (
                    <tr key={item.item_name}>
                      <td className="p-4 border">{item.item_name}</td>

                      <td className="border text-center">
                        {Number(item.amount).toLocaleString("en-GB")}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-[#fffaf0]">
                    <td className="p-4 border">TOTAL DEDUCTIONS</td>
                    <td className="border text-center">
                      {totalDeductions.toLocaleString("en-GB")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* NET SALARY */}

          <div className="mt-10 border border-[#f4b400] rounded-xl p-6 flex justify-between items-center">
            <h2 className="text-3xl font-bold">NET SALARY (₹)</h2>

            <h2 className="text-4xl font-bold">
              {netSalary.toLocaleString("en-GB")}
            </h2>
          </div>

          {/* FOOTER */}

          <div className="mt-10 border rounded-xl p-8 flex justify-between items-center">
            <div>
              <p className="text-xl">This is a system generated payslip.</p>

              <p className="text-xl mt-2">No signature is required.</p>
            </div>

            <div className="border-l h-16" />

            <div>
              <p className="text-xl">
                For any queries, please contact HR/Payroll.
              </p>

              <p className="text-xl font-semibold mt-2">
                hr@vsoft.com | +44 20 1234 5678
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Yellow Strip */}
        <div className="h-8 bg-[#f4b400]" />
      </div>
    </div>
  );
}