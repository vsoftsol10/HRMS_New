// import { useState } from "react";
// import { Wallet, Eye, Download } from "lucide-react";
// import { pdf } from "@react-pdf/renderer";
// import { saveAs } from "file-saver";

// import MainLayout from "../../components/Layout/layout";
// import PageHeader from "../../components/PageHeader";
// import Table from "../../components/Table";
// import Filters from "../../components/Filter/Filter";
// import StatusBadge from "../../components/StatusBadge";
// import PayslipTemplate from "../../components/Payroll/PayslipTemplate";
// import PayslipPDF from "../../components/Payroll/PayslipPDF";

// import useFetch from "../../hooks/useFetch";
// import employeePayrollServices from "../../services/employeePayrollServices";
// import { useDialog } from "../../components/Dialogbox/DialogContext";

// export default function EmployeePayroll() {
//   const { alert } = useDialog();
//   const { data: payroll = [] } = useFetch(employeePayrollServices);

//   const [showPayslip, setShowPayslip] = useState(false);
//   const [selectedPayroll, setSelectedPayroll] = useState(null);
//   const [downloadingId, setDownloadingId] = useState(null);

//   const [filters, setFilters] = useState({
//     status: "",
//     fromDate: "",
//     toDate: "",
//   });

//   const payrollData = payroll.map((item) => ({
//     id: item.id,

//     month: new Date(item.payroll_month).toLocaleDateString("en-GB", {
//       month: "long",
//       year: "numeric",
//     }),

//     grossSalary: `₹${Number(item.gross_salary).toLocaleString()}`,

//     deductions: `₹${Number(item.deductions).toLocaleString()}`,

//     netSalary: `₹${Number(item.net_salary).toLocaleString()}`,

//     status: item.status,

//     payroll: item,
//   }));

//   const filteredPayroll = payrollData.filter((item) => {
//     const matchesStatus = !filters.status || item.status === filters.status;

//     const matchesFromDate =
//       !filters.fromDate ||
//       new Date(item.payroll.payroll_month) >= new Date(filters.fromDate);

//     const matchesToDate =
//       !filters.toDate ||
//       new Date(item.payroll.payroll_month) <= new Date(filters.toDate);

//     return matchesStatus && matchesFromDate && matchesToDate;
//   });

//   // ----------------------------------
//   // Download Individual Payslip
//   // ----------------------------------

//   const handleExportPayslip = async (payroll) => {
//     try {
//       setDownloadingId(payroll.id);

//       const blob = await pdf(<PayslipPDF payroll={payroll} />).toBlob();

//       const month = new Date(payroll.payroll_month).toLocaleDateString(
//         "en-GB",
//         {
//           month: "long",
//           year: "numeric",
//         },
//       );

//       const safeMonth = month.replace(/\s+/g, "-");

//       saveAs(blob, `Payslip-${safeMonth}.pdf`);
//     } catch (error) {
//       console.error("Failed to download payslip:", error);

//       await alert({ title: "Download Failed", message: "Failed to download payslip.", type: "error" });
//     } finally {
//       setDownloadingId(null);
//     }
//   };

//   const columns = [
//     {
//       key: "month",
//       label: "MONTH",
//     },

//     {
//       key: "grossSalary",
//       label: "GROSS SALARY",
//     },

//     {
//       key: "deductions",
//       label: "DEDUCTIONS",
//     },

//     {
//       key: "netSalary",
//       label: "NET SALARY",
//     },

//     {
//       key: "status",
//       label: "STATUS",

//       render: (value) => <StatusBadge status={value} />,
//     },

//     {
//       key: "actions",
//       label: "ACTIONS",

//       render: (_, row) => (
//         <div className="flex items-center gap-4">
//           {/* View Payslip */}
//           <button
//             type="button"
//             title="View Payslip"
//             onClick={() => {
//               setSelectedPayroll(row.payroll);
//               setShowPayslip(true);
//             }}
//             className="text-gray-600 hover:text-blue-500"
//           >
//             <Eye size={18} />
//           </button>

//           {/* Download Payslip */}
//           <button
//             type="button"
//             title="Download Payslip"
//             disabled={downloadingId === row.payroll.id}
//             onClick={() => handleExportPayslip(row.payroll)}
//             className="text-gray-600 hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {downloadingId === row.payroll.id ? (
//               <span className="text-xs">...</span>
//             ) : (
//               <Download size={18} />
//             )}
//           </button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <MainLayout title="Payroll" icon={Wallet}>
//       <div className="space-y-6">
//         <PageHeader
//           title="Payroll"
//           description="View your salary history and payslips."
//         />

//         <div className="bg-white rounded-xl border border-gray-300 overflow-visible">
//           <Filters
//             filters={filters}
//             setFilters={setFilters}
//             selects={[
//               {
//                 key: "status",
//                 placeholder: "All Statuses",
//                 options: ["Paid", "Pending", "Processing"],
//               },
//             ]}
//             showMonthRange
//           />

//           <Table columns={columns} data={filteredPayroll} />
//         </div>
//       </div>

//       {/* -------------------------------- */}
//       {/* Payslip Preview */}
//       {/* -------------------------------- */}

//       {showPayslip && selectedPayroll && (
//         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6">
//           <div className="bg-white rounded-xl w-full max-w-[50vw] max-h-[90vh] h-[90vh] p-4 flex flex-col">
//             <button
//               onClick={() => {
//                 setShowPayslip(false);
//                 setSelectedPayroll(null);
//               }}
//               className="mb-4 bg-red-500 text-white px-4 py-2 rounded self-end"
//             >
//               Close
//             </button>

//             <div className="flex-1 overflow-auto">
//               <div className="flex justify-center">
//                 <div className="origin-top scale-90" style={{ zoom: 0.55 }}>
//                   <PayslipTemplate payroll={selectedPayroll} />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </MainLayout>
//   );
// }

import { useState } from "react";
import { Wallet, Eye, Download, BarChart3 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";

import MainLayout from "../../components/Layout/layout";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Filters from "../../components/Filter/Filter";
import StatusBadge from "../../components/StatusBadge";
import PayslipTemplate from "../../components/Payroll/PayslipTemplate";
import PayslipPDF from "../../components/Payroll/PayslipPDF";
import SixMonthSummaryDrawer from "../../components/Payroll/SixMonthSummaryDrawer";

import useFetch from "../../hooks/useFetch";
import employeePayrollServices from "../../services/employeePayrollServices";
import { useDialog } from "../../components/Dialogbox/DialogContext";

export default function EmployeePayroll() {
  const { alert } = useDialog();
  const { data: payroll = [] } = useFetch(employeePayrollServices);

  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handleViewSixMonthSummary = async () => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryData(null);

    try {
      setSummaryData(await employeePayrollServices.getSixMonthSummary());
    } catch (error) {
      console.log(error);
      setSummaryOpen(false);
      await alert({
        title: "Could not load summary",
        message: error?.response?.data?.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const [filters, setFilters] = useState({
    status: "",
    fromDate: "",
    toDate: "",
  });

  const payrollData = payroll.map((item) => ({
    id: item.id,

    month: new Date(item.payroll_month).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    }),

    grossSalary: `₹${Number(item.gross_salary).toLocaleString()}`,

    deductions: `₹${Number(item.deductions).toLocaleString()}`,

    netSalary: `₹${Number(item.net_salary).toLocaleString()}`,

    status: item.status,

    payroll: item,
  }));

  const filteredPayroll = payrollData.filter((item) => {
    const matchesStatus = !filters.status || item.status === filters.status;

    const matchesFromDate =
      !filters.fromDate ||
      new Date(item.payroll.payroll_month) >= new Date(filters.fromDate);

    const matchesToDate =
      !filters.toDate ||
      new Date(item.payroll.payroll_month) <= new Date(filters.toDate);

    return matchesStatus && matchesFromDate && matchesToDate;
  });

  // ----------------------------------
  // Download Individual Payslip
  // ----------------------------------

  const handleExportPayslip = async (payroll) => {
    try {
      setDownloadingId(payroll.id);

      const blob = await pdf(<PayslipPDF payroll={payroll} />).toBlob();

      const month = new Date(payroll.payroll_month).toLocaleDateString(
        "en-GB",
        {
          month: "long",
          year: "numeric",
        },
      );

      const safeMonth = month.replace(/\s+/g, "-");

      saveAs(blob, `Payslip-${safeMonth}.pdf`);
    } catch (error) {
      console.error("Failed to download payslip:", error);

      await alert({ title: "Download Failed", message: "Failed to download payslip.", type: "error" });
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      key: "month",
      label: "MONTH",
    },

    {
      key: "grossSalary",
      label: "GROSS SALARY",
    },

    {
      key: "deductions",
      label: "DEDUCTIONS",
    },

    {
      key: "netSalary",
      label: "NET SALARY",
    },

    {
      key: "status",
      label: "STATUS",

      render: (value) => <StatusBadge status={value} />,
    },

    {
      key: "actions",
      label: "ACTIONS",

      render: (_, row) => (
        <div className="flex items-center gap-4">
          {/* View Payslip */}
          <button
            type="button"
            title="View Payslip"
            onClick={() => {
              setSelectedPayroll(row.payroll);
              setShowPayslip(true);
            }}
            className="text-gray-600 hover:text-blue-500"
          >
            <Eye size={18} />
          </button>

          {/* Download Payslip */}
          <button
            type="button"
            title="Download Payslip"
            disabled={downloadingId === row.payroll.id}
            onClick={() => handleExportPayslip(row.payroll)}
            className="text-gray-600 hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingId === row.payroll.id ? (
              <span className="text-xs">...</span>
            ) : (
              <Download size={18} />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Payroll" icon={Wallet}>
      <div className="space-y-6">
        <PageHeader
          title="Payroll"
          description="View your salary history and payslips."
          actions={[
            {
              label: "6-Month Summary",
              icon: BarChart3,
              variant: "secondary",
              onClick: handleViewSixMonthSummary,
            },
          ]}
        />

        <div className="bg-white rounded-xl border border-gray-300 overflow-visible">
          <Filters
            filters={filters}
            setFilters={setFilters}
            selects={[
              {
                key: "status",
                placeholder: "All Statuses",
                options: ["Finalized", "Paid"],
              },
            ]}
            showMonthRange
          />

          <Table columns={columns} data={filteredPayroll} />
        </div>
      </div>

      {/* -------------------------------- */}
      {/* Payslip Preview */}
      {/* -------------------------------- */}

      {showPayslip && selectedPayroll && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-xl w-full max-w-full lg:max-w-[50vw] h-[90vh] p-4 flex flex-col">
            <button
              onClick={() => {
                setShowPayslip(false);
                setSelectedPayroll(null);
              }}
              className="mb-4 bg-red-500 text-white px-4 py-2 rounded self-end"
            >
              Close
            </button>

            <div className="flex-1 overflow-auto">
              <div className="flex justify-center">
                <div className="origin-top scale-90" style={{ zoom: 0.55 }}>
                  <PayslipTemplate payroll={selectedPayroll} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SixMonthSummaryDrawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        summary={summaryData}
        loading={summaryLoading}
      />
    </MainLayout>
  );
}