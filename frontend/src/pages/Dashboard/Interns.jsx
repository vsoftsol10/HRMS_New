import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  Clock,
  UserCheck,
  CircleCheck,
  Pencil,
  Trash2,
} from "lucide-react";

import useFetch from "../../hooks/useFetch";
import useCrud from "../../hooks/useCrud";
import internServices from "../../services/internServices";
import departmentServices from "../../services/departmentServices";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Table from "../../components/Table";
import StatusBadge from "../../components/StatusBadge";
import Filters from "../../components/Filter/Filter";
import MainLayout from "../../components/Layout/layout";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import {
  daysLeftLabel,
  formatDate,
  formatStipend,
  getInitials,
} from "../../utils/internUtils";

const STATUS_OPTIONS = [
  "Active",
  "Ending Soon",
  "Completed",
  "Converted",
  "Inactive",
];
const TYPE_OPTIONS = ["Full-Time", "Part-Time"];

export default function Interns() {
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();

  const {
    data: interns = [],
    loading,
    error,
    reload,
  } = useFetch(internServices);

  const { data: departments = [] } = useFetch(departmentServices);
  const { remove } = useCrud(internServices);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    status: "",
    type: "",
  });

  const departmentOptions = departments.map((department) => ({
    label: department.department_name,
    value: department.id,
  }));

  // Removed (Inactive) interns are hidden unless that status is picked,
  // the same way the Employees page hides inactive staff.
  const currentInterns = useMemo(
    () => interns.filter((intern) => intern.display_status !== "Inactive"),
    [interns],
  );

  const stats = useMemo(
    () => ({
      total: currentInterns.length,
      endingSoon: currentInterns.filter((i) => i.display_status === "Ending Soon")
        .length,
      active: currentInterns.filter((i) => i.display_status === "Active").length,
      completed: currentInterns.filter((i) => i.display_status === "Completed")
        .length,
    }),
    [currentInterns],
  );

  const filteredInterns = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return interns.filter((intern) => {
      if (filters.status) {
        if (intern.display_status !== filters.status) return false;
      } else if (intern.display_status === "Inactive") {
        return false;
      }

      if (
        filters.department &&
        String(intern.department_id) !== String(filters.department)
      ) {
        return false;
      }

      if (filters.type && intern.internship_type !== filters.type) return false;

      if (!search) return true;

      return [
        intern.full_name,
        intern.intern_code,
        intern.login_id,
        intern.email,
        intern.department_name,
        intern.mentor_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [interns, filters]);

  const handleRemove = async (intern) => {
    const isConfirmed = await confirm({
      title: "Remove Intern",
      message: `Remove ${intern.full_name}? Their login will be blocked. All internship records are kept.`,
    });

    if (!isConfirmed) return;

    try {
      await remove(intern.id);

      await alert({
        title: "Success",
        message: "Intern removed successfully.",
        type: "success",
      });

      reload();
    } catch (err) {
      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to remove intern.",
        type: "error",
      });
    }
  };

  const columns = [
    { key: "intern_code", label: "Intern ID" },
    {
      key: "full_name",
      label: "Intern",
      render: (value, row) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/interns/${row.id}`)}
          className="flex items-center gap-3 text-left cursor-pointer"
        >
          <span className="h-10 w-10 shrink-0 rounded-full bg-yellow-100 text-yellow-700 font-semibold flex items-center justify-center">
            {getInitials(value)}
          </span>
          <span>
            <span className="block font-semibold hover:underline">{value}</span>
            <span className="block text-sm text-gray-500">{row.email}</span>
          </span>
        </button>
      ),
    },
    {
      key: "department_name",
      label: "Department",
      render: (value) => value || "-",
    },
    {
      key: "mentor_name",
      label: "Mentor",
      render: (value) => value || "-",
    },
    {
      key: "duration",
      label: "Duration",
      render: (_, row) => (
        <div>
          <p>
            {formatDate(row.start_date)} — {formatDate(row.end_date)}
          </p>
          {row.display_status === "Ending Soon" && (
            <p className="text-sm font-medium text-orange-600">
              {daysLeftLabel(row.days_left)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "monthly_stipend",
      label: "Stipend",
      render: (value) => formatStipend(value),
    },
    {
      key: "display_status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Edit intern"
            onClick={() => navigate(`/admin/interns/${row.id}/edit`)}
            disabled={row.status === "Converted"}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Pencil size={18} />
          </button>

          <button
            type="button"
            title={
              row.status === "Active"
                ? "Remove intern"
                : "Only active interns can be removed"
            }
            onClick={() => handleRemove(row)}
            disabled={row.status !== "Active"}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Interns" icon={GraduationCap}>
      <div className="space-y-6">
        <PageHeader
          title="Interns"
          description="Manage and monitor all interns."
          actions={[
            {
              label: "Add Intern",
              icon: Plus,
              onClick: () => navigate("/admin/interns/new"),
            },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Interns"
            value={stats.total}
            icon={GraduationCap}
            iconBg="bg-gray-100"
          />
          <StatCard
            title="Ending Soon"
            value={stats.endingSoon}
            icon={Clock}
            iconBg="bg-yellow-100"
          />
          <StatCard
            title="Active Interns"
            value={stats.active}
            icon={UserCheck}
            iconBg="bg-green-100"
          />
          <StatCard
            title="Completed Internships"
            value={stats.completed}
            icon={CircleCheck}
            iconBg="bg-cyan-100"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">
              Unable to load interns. Please check your connection and try
              again.
            </p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="rounded-xl border border-gray-300 bg-white shadow-sm">
          <Filters
            filters={filters}
            setFilters={setFilters}
            searchPlaceholder="Search by name, intern ID..."
            selects={[
              {
                key: "department",
                placeholder: "All Departments",
                options: departmentOptions,
              },
              {
                key: "status",
                placeholder: "All Status",
                options: STATUS_OPTIONS,
              },
              {
                key: "type",
                placeholder: "All Types",
                options: TYPE_OPTIONS,
              },
            ]}
          />

          <Table columns={columns} data={filteredInterns} />

          {!filteredInterns.length && !error && (
            <p className="px-5 pb-6 text-center text-gray-500">
              {loading
                ? "Loading interns..."
                : interns.length
                  ? "No interns match the current filters."
                  : "No interns yet. Use Add Intern to register the first one."}
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}