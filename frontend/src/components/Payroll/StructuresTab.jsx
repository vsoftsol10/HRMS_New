import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import Table from "../Table";
import SalaryConfigurationDrawer from "./SalaryConfigurationDrawer";
import { useDialog } from "../Dialogbox/DialogContext";

import useFetch from "../../hooks/useFetch";
import salaryConfigurationServices from "../../services/salaryConfigServices";
import departmentServices from "../../services/departmentServices";
import designationServices from "../../services/designationServices";

// Payroll > Structures tab: lists every salary structure with who uses it and
// lets HR / Admin edit or delete one. Creating a structure still happens from
// the "Add Salary Configuration" header button (the parent page re-mounts this
// tab afterwards so the list refreshes).

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const lopLabel = (structure) => {
  if (structure.lop_mode === "FixedPerDay")
    return `${formatMoney(structure.lop_value)} per LOP day`;
  if (structure.lop_mode === "FixedDivisor")
    return `Basic ÷ ${Number(structure.lop_value)} days`;
  return "Auto (working days)";
};

// Defined at module level so useFetch gets a stable service reference
// (an inline object would change every render and refetch forever).
const usageService = {
  getAll: () => salaryConfigurationServices.getUsageSummary(),
};

export default function StructuresTab() {
  const { alert, confirm } = useDialog();

  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const {
    data: structures = [],
    loading,
    error,
    reload,
  } = useFetch(salaryConfigurationServices);

  const { data: usageByStructure = {}, reload: reloadUsage } = useFetch(usageService);

  const { data: departments = [] } = useFetch(departmentServices);
  const { data: designations = [] } = useFetch(designationServices);

  const departmentName = (id) =>
    departments.find((item) => item.id === id)?.department_name;
  const designationName = (id) =>
    designations.find((item) => item.id === id)?.designation_name;

  const refresh = () => {
    reload();
    reloadUsage();
  };

  const handleDelete = async (structure) => {
    const label = structure.structure_name || `structure #${structure.id}`;

    const ok = await confirm({
      title: "Delete Salary Structure",
      message: `Delete "${label}"? This cannot be undone.`,
    });

    if (!ok) return;

    setDeletingId(structure.id);

    try {
      await salaryConfigurationServices.remove(structure.id);
      refresh();
    } catch (err) {
      console.log(err);
      await alert({
        title: "Delete Failed",
        message: err?.response?.data?.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const rows = structures.map((structure) => {
    const isLegacy = !structure.structure_name;

    return {
      id: structure.id,
      structure,
      isLegacy,
      name: isLegacy
        ? `Legacy band ${formatMoney(structure.min_salary)} - ${formatMoney(structure.max_salary)}`
        : structure.structure_name,
      department: structure.department_id
        ? departmentName(structure.department_id) || "-"
        : "Any department",
      designation: structure.designation_id
        ? designationName(structure.designation_id) || "-"
        : "Any designation",
      basic: isLegacy ? "-" : formatMoney(structure.basic_salary),
      lop: isLegacy ? "-" : lopLabel(structure),
      effectiveFrom: structure.effective_from
        ? String(structure.effective_from).slice(0, 10)
        : "-",
      employees: usageByStructure[structure.id] || 0,
    };
  });

  const columns = [
    {
      key: "name",
      label: "Structure",
      render: (value, row) => (
        <span className={row.isLegacy ? "text-gray-500" : "font-semibold"}>
          {value}
        </span>
      ),
    },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "basic", label: "Basic Salary" },
    { key: "lop", label: "LOP Rule" },
    { key: "effectiveFrom", label: "Effective From" },
    {
      key: "employees",
      label: "Employees",
      render: (value) => `${value} assigned`,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-4">
          {!row.isLegacy && (
            <Pencil
              size={18}
              className="cursor-pointer hover:text-blue-500"
              title="Edit structure"
              onClick={() => setEditing(row.structure)}
            />
          )}

          <Trash2
            size={18}
            className={`cursor-pointer hover:text-red-500 ${
              deletingId === row.id ? "opacity-40 pointer-events-none" : ""
            }`}
            title="Delete structure"
            onClick={() => handleDelete(row.structure)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-300">
      {error ? (
        <p className="p-6 text-sm text-red-500">
          Could not load salary structures.
        </p>
      ) : loading && !structures.length ? (
        <p className="p-6 text-sm text-gray-500">Loading structures...</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-sm text-gray-500">
          No salary structures yet. Use "Add Salary Configuration" to create one.
        </p>
      ) : (
        <Table columns={columns} data={rows} />
      )}

      {editing && (
        <SalaryConfigurationDrawer
          key={editing.id}
          open
          structure={editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}