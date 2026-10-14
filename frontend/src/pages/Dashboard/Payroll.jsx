import StatCard from "../../components/StatCard";
import Table from "../../components/Table";

import StatusBadge from "../../components/StatusBadge";

import MainLayout from "../../components/Layout/layout";

import PageHeader from "../../components/PageHeader";

import { useState, useEffect } from "react";

import useFetch from "../../hooks/useFetch";
import payrollServices from "../../services/payrollServices";
import Filters from "../../components/Filter/Filter";
import departmentServices from "../../services/departmentServices";

import SalaryConfigurationDrawer from "../../components/Payroll/SalaryConfigurationDrawer";
import AssignSalaryDrawer from "../../components/Payroll/AssignSalaryDrawer";
import SixMonthSummaryDrawer from "../../components/Payroll/SixMonthSummaryDrawer";

import payrollRunServices from "../../services/payrollRunServices";

import PayslipTemplate from "../../components/Payroll/PayslipTemplate";

import { pdf } from "@react-pdf/renderer";
import PayslipPDF from "../../components/Payroll/PayslipPDF";


import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generatePayslipPDF } from "../../utils/exportPayslipPdf";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import { formatLocalDate } from "../../utils/dateUtils";
import InternStipendTab from "../../components/Payroll/InternStipendTab";



import {
  Wallet,
  Play,
  TrendingUp,
  WalletCards,
  TrendingDown,
  CalendarClock,
  Eye,
  Download,
  Plus,
  UserCog,
  BarChart3,
  Trash2,
} from "lucide-react";


export default function Payroll() {
const { alert, confirm, prompt } = useDialog();
const [activeTab, setActiveTab] = useState("employee");


const [filters, setFilters] = useState({
  search: "",
  department: "",
  status: "",
  fromMonth: "",
  toMonth: "",
});

  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryEmployeeName, setSummaryEmployeeName] = useState("");

  const handleViewSixMonthSummary = async (payroll) => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryData(null);
    setSummaryEmployeeName(payroll.employees?.first_name || "");

    try {
      const data = await payrollServices.getSixMonthSummary(payroll.employee_id);
      setSummaryData(data);
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

  // Lifecycle: Draft -> Review -> Finalized -> Paid (payroll redesign,
  // Step 6/8d). Each action only makes sense from one specific prior
  // status - the backend already enforces this, this just calls the
  // right endpoint per row and refreshes.
  const handleLifecycleAction = async (payroll, action) => {
    const actionMap = {
      review: { fn: payrollServices.review, verb: "moved to Review" },
      finalize: { fn: payrollServices.finalize, verb: "Finalized" },
      pay: { fn: payrollServices.markAsPaid, verb: "marked Paid" },
    };

    const { fn, verb } = actionMap[action];

    setActionLoadingId(payroll.id);

    try {
      const result = await fn(payroll.id);

      // Finalize recalculates from current attendance / salary before it
      // freezes the figures - tell the admin when that moved the net salary
      // and repeat the data-quality warnings.
      let extra = "";
      const recalculation = result?.recalculation;

      if (recalculation?.changed) {
        extra += ` Net salary was recalculated from ₹${Number(recalculation.previousNetSalary).toLocaleString("en-IN")} to ₹${Number(recalculation.newNetSalary).toLocaleString("en-IN")} using the latest attendance and salary data.`;
      }

      if (recalculation?.warnings?.length) {
        extra += ` Please check: ${recalculation.warnings.join("; ")}.`;
      }

      await alert({
        title: "Payroll Updated",
        message: `Payroll ${verb}.${extra}`,
        type: "success",
      });
      await refreshPayroll();
    } catch (error) {
      console.log(error);
      await alert({
        title: "Action Failed",
        message: error?.response?.data?.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };


  const [loading, setLoading] = useState(false);

  // Default the prompt to the PREVIOUS month - payroll can only be run once
  // a month has ended (the server enforces this too).
  const getPreviousMonth = () => {
    const now = new Date();
    return formatLocalDate(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    ).slice(0, 7);
  };

  const handleRunPayroll = async () => {
    const entered = await prompt({
      title: "Run Payroll",
      message:
        "Which month do you want to process? Enter it as YYYY-MM. Only months that have already ended can be processed.",
      defaultValue: getPreviousMonth(),
    });

    // Cancelled
    if (entered === null) return;

    const month = String(entered).trim();

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      await alert({
        title: "Invalid Month",
        message: "Please enter the month as YYYY-MM, for example 2026-09.",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      const result = await payrollRunServices.generatePayroll({
        payroll_month: `${month}-01`,
      });

      // Show the month that was just generated (the list defaults to the
      // current month, where nothing exists yet).
      setFilters((previous) => ({
        ...previous,
        fromMonth: month,
        toMonth: month,
      }));
      setPayroll(await payrollServices.getByRange(month, month));
      loadLatestRun();

      const warnings = result?.warnings || [];

      await alert({
        title: "Payroll Draft Generated",
        message:
          "Payroll draft generated - review and finalize each employee's payroll from the table below." +
          (warnings.length
            ? " Please check: " +
              warnings
                .map((item) => `${item.employee}: ${item.notes.join("; ")}`)
                .join(" | ")
            : ""),
        type: "success",
      });
    } catch (error) {
      console.log(error);

      await alert({ title: "Payroll Generation Failed", message: error?.response?.data?.message || "Failed to generate payroll.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Draft / Review rows can be deleted (and regenerated); Finalized and Paid
  // rows are locked on the server.
  const handleDeletePayroll = async (payrollRow) => {
    const ok = await confirm({
      title: "Delete Payroll",
      message: `Delete ${payrollRow.employees?.first_name || "this"} payroll draft? You can run payroll again to regenerate it.`,
    });

    if (!ok) return;

    setActionLoadingId(payrollRow.id);

    try {
      await payrollServices.remove(payrollRow.id);
      await refreshPayroll();
    } catch (error) {
      console.log(error);
      await alert({
        title: "Delete Failed",
        message: error?.response?.data?.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const [openConfiguration, setOpenConfiguration] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);

  const { data: departments = [] } = useFetch(departmentServices);
  const departmentOptions = departments.map(
    (department) => department.department_name,
  );

const [payroll, setPayroll] = useState([]);

const fetchCurrentPayroll = async () => {
  try {
    const data = await payrollServices.getAll();

    setPayroll(data);
  } catch (error) {
    console.log(error);
  }
};

// FIX: the month filter sets filters.fromMonth / filters.toMonth (a
// "YYYY-MM" range), but this page was reading a filters.month key that is
// never set - so choosing a month did nothing and only the current month
// could ever be viewed. This single effect also replaces the two effects
// that both fetched on first load.
const fetchPayrollByRange = async () => {
  try {
    const data = await payrollServices.getByRange(
      filters.fromMonth || filters.toMonth,
      filters.toMonth || filters.fromMonth,
    );

    setPayroll(data);
  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  if (filters.fromMonth || filters.toMonth) {
    fetchPayrollByRange();
  } else {
    fetchCurrentPayroll();
  }
  // The fetch helpers are re-created every render; the month range is the only real trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters.fromMonth, filters.toMonth]);

// Re-load the list for whatever month(s) are currently being viewed.
const refreshPayroll = async () => {
  if (filters.fromMonth || filters.toMonth) {
    await fetchPayrollByRange();
  } else {
    await fetchCurrentPayroll();
  }
};

const payrollData = payroll.map((item) => ({
  id: item.id,
  employee: item.employees.employee_code
    ? `${item.employees.first_name} (${item.employees.employee_code})`
    : item.employees.first_name,
  department: item.employees?.departments?.department_name || "-",
  grossSalary: Number(item.gross_salary).toLocaleString(),
  deductions: Number(item.deductions).toLocaleString(),
  netSalary: Number(item.net_salary).toLocaleString(),
  status: item.status,

  payroll: item, // important
}));




  const filteredPayroll = payrollData.filter((item) => {
    const search = filters.search.toLowerCase();

    const matchesSearch = item.employee.toLowerCase().includes(search);

    const matchesDepartment =
      !filters.department || item.department === filters.department;

    const matchesStatus = !filters.status || item.status === filters.status;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // FIX: the cards summed every loaded row, ignoring the search /
  // department / status filters applied to the table right below them.
  const totalGross = filteredPayroll.reduce(
    (sum, item) => sum + Number(item.payroll.gross_salary),
    0,
  );

  const totalNet = filteredPayroll.reduce(
    (sum, item) => sum + Number(item.payroll.net_salary),
    0,
  );

  const totalDeduction = filteredPayroll.reduce(
    (sum, item) => sum + Number(item.payroll.deductions),
    0,
  );

  // FIX: "Next Payroll" used to show the month of the first row on screen,
  // which is not a next anything. It is now the month after the most recent
  // generated run (or the previous month when nothing has been run yet).
  const [latestRunMonth, setLatestRunMonth] = useState(null);

  const loadLatestRun = async () => {
    try {
      const runs = await payrollRunServices.getAll();

      const months = (runs || [])
        .filter((run) => run.status !== "Failed")
        .map((run) => String(run.payroll_month).slice(0, 7))
        .sort();

      setLatestRunMonth(months.length ? months[months.length - 1] : null);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadLatestRun();
  }, []);

  const formatMonthLabel = (yearMonth) => {
    const [y, m] = yearMonth.split("-").map(Number);

    return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const nextPayroll = (() => {
    if (!latestRunMonth) return formatMonthLabel(getPreviousMonth());

    const [y, m] = latestRunMonth.split("-").map(Number);

    return formatMonthLabel(
      formatLocalDate(new Date(y, m, 1)).slice(0, 7),
    );
  })();

const handleExportPayroll = async () => {
  const zip = new JSZip();

  for (const item of filteredPayroll) {
    const payroll = item.payroll;

    const pdfBlob = await generatePayslipPDF(payroll);

    // FIX: files were named by first name only, so two employees with the
    // same first name overwrote each other inside the zip.
    zip.file(
      `${payroll.employees.first_name}-${payroll.employees.employee_code || payroll.employee_id}.pdf`,
      pdfBlob,
    );
  }

  const content = await zip.generateAsync({
    type: "blob",
  });

  saveAs(content, "Payroll.zip");
};

  const columns = [
    {
      key: "employee",
      label: "Employee",
    },
    {
      key: "department",
      label: "Department",
    },
    {
      key: "grossSalary",
      label: "Gross Salary",
    },
    {
      key: "deductions",
      label: "Deductions",
      render: (value) => <span className="text-red-500">{value}</span>,
    },
    {
      key: "netSalary",
      label: "Net Salary",
      render: (value) => <span className="font-semibold">{value}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-4">
          <Eye
            size={18}
            className="cursor-pointer hover:text-blue-500"
            onClick={() => {
              setSelectedPayroll(row.payroll);
              setShowPayslip(true);
            }}
          />

          <Download
            size={18}
            className="cursor-pointer hover:text-green-500"
            onClick={() => handleExportPayslip(row.payroll)}
          />

          <BarChart3
            size={18}
            className="cursor-pointer hover:text-purple-500"
            title="6-month summary"
            onClick={() => handleViewSixMonthSummary(row.payroll)}
          />

          {(row.status === "Draft" || row.status === "Review") && (
            <Trash2
              size={18}
              className="cursor-pointer hover:text-red-500"
              title="Delete draft"
              onClick={() => handleDeletePayroll(row.payroll)}
            />
          )}

          {row.status === "Draft" && (
            <button
              disabled={actionLoadingId === row.id}
              onClick={() => handleLifecycleAction(row.payroll, "review")}
              className="text-xs font-medium px-3 py-1 rounded-md border border-gray-400 hover:bg-gray-50 disabled:opacity-50"
            >
              Move to Review
            </button>
          )}

          {row.status === "Review" && (
            <button
              disabled={actionLoadingId === row.id}
              onClick={() => handleLifecycleAction(row.payroll, "finalize")}
              className="text-xs font-medium px-3 py-1 rounded-md border border-blue-400 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              Finalize
            </button>
          )}

          {row.status === "Finalized" && (
            <button
              disabled={actionLoadingId === row.id}
              onClick={() => handleLifecycleAction(row.payroll, "pay")}
              className="text-xs font-medium px-3 py-1 rounded-md border border-green-400 text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              Mark Paid
            </button>
          )}
        </div>
      ),
    },
  ];


  
const handleExportPayslip = async (payroll) => {
  const blob = await pdf(<PayslipPDF payroll={payroll} />).toBlob();

  saveAs(
    blob,
    `${payroll.employees.first_name}-${payroll.employees.employee_code || payroll.employee_id}.pdf`,
  );
};

  
  const employeeActions = [
            {
              label: "Export",
              icon: Download,
              variant: "secondary",
              onClick: handleExportPayroll,
            },
            {
              label: "Run Payroll",
              icon: Play,
              onClick: handleRunPayroll,
              disabled: loading,
            },
            {
              label: "Assign Salary",
              icon: UserCog,
              onClick: () => setOpenAssign(true),
            },
            {
              label: "Add Salary Configuration",
              icon: Plus,
              onClick: () => setOpenConfiguration(true),
            },
          ];

  // Intern Stipend tab: single header action (see note in the hand-off message).
  const internActions = [
    {
      label: "Add Configuration",
      icon: Plus,
      onClick: () => setOpenConfiguration(true),
    },
  ];

  return (
    <MainLayout title="Payroll" icon={Wallet}>
      <div className="space-y-6">
        <PageHeader
          title="Payroll"
          description="Process salaries and generate payslips for any completed month."
          actions={activeTab === "intern" ? internActions : employeeActions}
        />

        <div className="flex gap-6 overflow-x-auto border-b border-gray-200">
          {[
            { key: "employee", label: "Employee Payroll" },
            { key: "intern", label: "Intern Stipend" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px pb-2.5 text-sm font-medium border-b-2 transition cursor-pointer ${
                activeTab === tab.key
                  ? "border-yellow-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "employee" && (
        <>
        <div className="grid grid-cols-4 gap-6 my-6">
          <StatCard
            title="Gross Salary"
            value={`₹${totalGross.toLocaleString()}`}
            icon={TrendingUp}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />

          <StatCard
            title="Net Salary"
            value={`₹${totalNet.toLocaleString()}`}
            icon={WalletCards}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-700"
          />

          <StatCard
            title="Deductions"
            value={`₹${totalDeduction.toLocaleString()}`}
            icon={TrendingDown}
            iconBg="bg-red-100"
            iconColor="text-red-600"
          />

          <StatCard
            title="Next Payroll"
            value={nextPayroll}
            icon={CalendarClock}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-300">
          <Filters
            filters={filters}
            setFilters={setFilters}
            searchPlaceholder="Search employee..."
            selects={[
              {
                key: "department",
                placeholder: "All Departments",
                options: departmentOptions,
              },
              {
                key: "status",
                placeholder: "All Statuses",
                // FIX (payroll redesign, Step 8d): this used to offer only
                // ["Paid", "Pending"], neither of which the payroll lifecycle
                // actually uses - status is now Draft/Review/Finalized/Paid.
                options: ["Draft", "Review", "Finalized", "Paid"],
              },
            ]}
            showMonthRange
          />
          <Table columns={columns} data={filteredPayroll} />
        </div>
        </>
        )}

        {activeTab === "intern" && (
          <InternStipendTab departmentOptions={departmentOptions} />
        )}
      </div>
      <SalaryConfigurationDrawer
        open={openConfiguration}
        onClose={() => setOpenConfiguration(false)}
      />

      <AssignSalaryDrawer
        open={openAssign}
        onClose={() => setOpenAssign(false)}
      />

      <SixMonthSummaryDrawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        summary={summaryData}
        loading={summaryLoading}
        employeeName={summaryEmployeeName}
      />

      {showPayslip && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-xl w-full max-w-full lg:max-w-[50vw] h-[90vh] p-4 flex flex-col">
            <button
              onClick={() => setShowPayslip(false)}
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
    </MainLayout>
  );
}