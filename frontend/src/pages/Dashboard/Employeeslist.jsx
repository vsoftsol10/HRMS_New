import { useState } from "react";
import { Users, Plus, Download } from "lucide-react";

import useFetch from "../../hooks/useFetch";
import useCrud from "../../hooks/useCrud";
import employeeServices from "../../services/employeeServices";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal/Modal";
import Table from "../../components/Table";
import AddEmployee from "../../components/EmployeeList/Addemployee";
import StatusBadge from "../../components/StatusBadge";
import MainLayout from "../../components/Layout/layout";
import Filters from "../../components/Filter/Filter";
import departmentServices from "../../services/departmentServices";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import { saveAs } from "file-saver";

export default function EmployeesPage() {
  // const { getById } = useCrud(employeeServices);

  const { data: departments = [] } = useFetch(departmentServices);

  const departmentOptions = departments.map((department) => ({
    label: department.department_name,
    value: department.id,
  }));

  const [open, setOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    status: "",
  });

  // Fetch employees
const { data: employees = [], reload } = useFetch(employeeServices, {
  status: filters.status,
});

  // Export employee
const handleExport = async () => {
  const isConfirmed = await confirm({
    title: "Export Employees",
    message:
      "The export will include only the employees that match the currently applied filters. Do you want to continue?",
  });

  if (!isConfirmed) return;

  const exportData = filteredEmployees.map((emp) => ({
    "Employee ID": emp.employee_code,
    Name: emp.name,
    Department: emp.department,
    Designation: emp.designation,
    Email: emp.email,
    Phone: emp.phone,
    Salary: emp.salary,
    Status: emp.status,
  }));

  // exceljs replaces the unmaintained, vulnerable "xlsx" package; it is
  // loaded only when someone actually exports.
  const { default: ExcelJS } = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Employees");

  const columns = Object.keys(exportData[0] ?? {
    "Employee ID": "", Name: "", Department: "", Designation: "",
    Email: "", Phone: "", Salary: "", Status: "",
  });

  worksheet.columns = columns.map((key) => ({
    header: key,
    key,
    width: Math.max(key.length + 4, 16),
  }));
  worksheet.getRow(1).font = { bold: true };
  worksheet.addRows(exportData);

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "Employees.xlsx",
  );
};


  // CRUD operations
  const { update } = useCrud(employeeServices);

  const handleEdit = (id) => {
    const employee = employees.find((emp) => emp.id === id);

    setSelectedEmployee(employee);
    setOpen(true);
  };

  const { confirm, alert } = useDialog();

  const handleStatusChange = async (id, currentStatus, newStatus) => {
    const isConfirmed = await confirm({
      title: "Update Status",
      message: `Do you want to change the employee status to ${newStatus}?`,
    });

    if (!isConfirmed) return;

    try {
      await update(id, {
        status: newStatus,
      });

      await alert({
        title: "Success",
        message: `Employee is now ${newStatus}.`,
        type: "success",
      });

      reload();
    } catch (err) {
      await alert({
        title: "Error",
        message:
          err.response?.data?.message || "Unable to update employee status.",
        type: "error",
      });
    }
  };

  // Format data for table
  const employeeData = employees
    .map((emp) => ({
      id: emp.id,
      employee_code: emp.employee_code,
      name: emp.first_name,
      department: emp.departments?.department_name || "-",
      department_id: emp.department_id,
      designation: emp.designation,
      email: emp.personal_email,
      phone: emp.phone,
      salary: emp.monthly_salary,
      status: emp.status,
    }))
    .sort((a, b) => {
      const statusOrder = {
        Active: 1,
        "On Leave": 2,
        Inactive: 3,
      };

      return statusOrder[a.status] - statusOrder[b.status];
    });

  // Filters
const filteredEmployees = employeeData.filter((emp) => {
  const search = filters.search.toLowerCase();

  const matchesSearch =
    emp.employee_code.toLowerCase().includes(search) ||
    emp.name.toLowerCase().startsWith(search) ||
    emp.email.toLowerCase().startsWith(search) ||
    emp.department.toLowerCase().startsWith(search) ||
    emp.designation.toLowerCase().startsWith(search);

  const matchesDepartment =
    !filters.department || emp.department_id === filters.department;

  return matchesSearch && matchesDepartment;
});

  const columns = [
    { key: "employee_code", label: "Employee ID" },
    { key: "name", label: "Name" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "salary", label: "Salary" },
    {
      key: "status",
      label: "Status",
      render: (value, row) => (
        <button
          disabled={value === "On Leave"}
          onClick={() =>
            handleStatusChange(
              row.id,
              value,
              value === "Inactive" ? "Active" : "Inactive",
            )
          }
          className={
            value === "On Leave" ? "cursor-not-allowed" : "cursor-pointer"
          }
        >
          <StatusBadge status={value.replaceAll(" ", "")} />
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleEdit(row.id)}
            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-400 cursor-pointer"
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Employees" icon={Users}>
      <div className="space-y-6">
        <PageHeader
          title="Employees"
          description="Manage all employees across departments."
          actions={[
            {
              label: "Export",
              icon: Download,
              variant: "secondary",
              onClick: handleExport,
            },
            {
              label: "Add Employee",
              icon: Plus,
              onClick: () => {
                setSelectedEmployee(null);
                setOpen(true);
              },
            },
          ]}
        />

        <div className="rounded-xl border border-gray-300 bg-white shadow-sm">
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
                options: ["Active", "On Leave", "Inactive"],
              },
            ]}
          />

          <Table columns={columns} data={filteredEmployees} />
        </div>

        {open && (
          <Modal size="max-w-6xl" onClose={() => setOpen(false)}>
            <AddEmployee
              employee={selectedEmployee}
              onClose={() => {
                setOpen(false);
                setSelectedEmployee(null);
              }}
              onSuccess={reload}
            />
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}