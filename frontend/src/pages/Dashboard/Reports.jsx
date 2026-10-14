
import PageHeader from "../../components/PageHeader";

import ReportFilters from "../../components/Reports/ReportFilters";
import ReportCard from "../../components/Reports/ReportCard";

import MainLayout from "../../components/Layout/layout";

import { Users, CalendarDays, Wallet, ClipboardList, FileText } from "lucide-react";

const reports = [
  {
    title: "Employee Report",
    description:
      "Complete employee directory with personal and employment details.",
    icon: Users,
  },
  {
    title: "Attendance Report",
    description: "Daily, weekly and monthly attendance with hours worked.",
    icon: CalendarDays,
  },
  {
    title: "Leave Report",
    description: "Leave balance, requests and approvals across the team.",
    icon: ClipboardList,
  },
  {
    title: "Payroll Report",
    description: "Salary disbursement summary with deductions and net pay.",
    icon: Wallet,
  },
];

export default function Reports() {
  return (
    <MainLayout title="Reports" icon={FileText}>

        <div className="space-y-6">
          <PageHeader
            title="Reports"
            description="Generate and export reports across modules."
          />

          <ReportFilters />

          <div className="grid md:grid-cols-2 gap-6 ">
            {reports.map((report) => (
              <ReportCard key={report.title} report={report} />
            ))} 
          </div>
        </div>
        </MainLayout>
  );
}