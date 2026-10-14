import { X } from "lucide-react";

import { useState, useEffect } from "react";

import useFetch from "../../hooks/useFetch";

import employeeServices from "../../services/employeeServices";
import salaryConfigurationServices from "../../services/salaryConfigServices";
import employeeSalaryAssignmentServices from "../../services/employeeSalaryAssignmentServices";

import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function AssignSalaryDrawer({ open, onClose }) {
  const { alert } = useDialog();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employee_id: "",
    salary_configuration_id: "",
    override_basic_salary: "",
    effective_from: "",
  });

  // Result of the "active assignment" lookup, tagged with the employee it
  // belongs to so a stale answer is never shown for another employee.
  const [fetchedAssignment, setFetchedAssignment] = useState({
    employeeId: "",
    assignment: null,
  });

  const { data: employees = [] } = useFetch(employeeServices);

  const { data: configurations = [] } = useFetch(salaryConfigurationServices);

  // Only real Salary Structures (Step 3+) are assignable - the old
  // min/max band row(s) from before the redesign have no structure_name
  // and are not something HR should be able to pick here.
  const structures = configurations.filter((item) => item.structure_name);

  useEffect(() => {
    const employeeId = form.employee_id;

    if (!employeeId) return undefined;

    let cancelled = false;

    employeeSalaryAssignmentServices
      .getActive(employeeId)
      .then((assignment) => {
        if (!cancelled) setFetchedAssignment({ employeeId, assignment });
      })
      .catch(() => {
        if (!cancelled) setFetchedAssignment({ employeeId, assignment: null });
      });

    return () => {
      cancelled = true;
    };
  }, [form.employee_id]);

  const lookupDone = fetchedAssignment.employeeId === form.employee_id;
  const currentAssignment =
    form.employee_id && lookupDone ? fetchedAssignment.assignment : null;
  const loadingCurrent = Boolean(form.employee_id) && !lookupDone;

  const resetForm = () => {
    setForm({
      employee_id: "",
      salary_configuration_id: "",
      override_basic_salary: "",
      effective_from: "",
    });
    setErrors({});
  };

  const handleSave = async () => {
    const nextErrors = {};

    if (!form.employee_id) nextErrors.employee_id = "This field is required";
    if (!form.salary_configuration_id)
      nextErrors.salary_configuration_id = "This field is required";
    if (!form.effective_from)
      nextErrors.effective_from = "This field is required";

    if (
      currentAssignment &&
      form.effective_from &&
      new Date(form.effective_from) <=
        new Date(currentAssignment.effective_from)
    ) {
      nextErrors.effective_from = `Must be after the current assignment's start date (${currentAssignment.effective_from})`;
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      await employeeSalaryAssignmentServices.create({
        employee_id: form.employee_id,
        salary_configuration_id: form.salary_configuration_id,
        override_basic_salary: form.override_basic_salary || null,
        effective_from: form.effective_from,
      });

      await alert({
        title: "Salary Assigned",
        message: "Salary structure assigned successfully.",
        type: "success",
      });

      resetForm();
      onClose();
    } catch (error) {
      console.log(error);
      await alert({
        title: "Assignment Failed",
        message: error?.response?.data?.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const selectedStructure = structures.find(
    (item) => String(item.id) === String(form.salary_configuration_id),
  );

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/20 z-40" />

      <div className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white z-50 overflow-y-auto shadow-2xl">
        <div className="p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">Assign Salary Structure</h2>
            <p className="text-sm text-gray-500 mt-1">
              Assign an employee to a salary structure, with an optional
              Basic override.
            </p>
          </div>

          <button>
            <X size={18} className="text-gray-500" onClick={onClose} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <label className="text-sm font-medium">
              Employee
              <span className="text-red-500"> *</span>
            </label>

            <select
              value={form.employee_id}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, employee_id: "" }));
                setForm({ ...form, employee_id: e.target.value });
              }}
              className={`w-full h-11 border ${errors.employee_id ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} ({employee.employee_code})
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="text-sm text-red-500 mt-1">{errors.employee_id}</p>
            )}
          </div>

          {loadingCurrent && (
            <p className="text-xs text-gray-500">Checking current assignment...</p>
          )}

          {!loadingCurrent && currentAssignment && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
              Currently on{" "}
              <span className="font-semibold">
                {currentAssignment.salary_configurations?.structure_name}
              </span>{" "}
              since {currentAssignment.effective_from}
              {currentAssignment.override_basic_salary && (
                <> (Basic override: ₹{Number(currentAssignment.override_basic_salary).toLocaleString()})</>
              )}
              . Assigning a new structure below will end this one the day
              before the new effective date.
            </div>
          )}

          {!loadingCurrent && form.employee_id && !currentAssignment && (
            <div className="bg-gray-50 border border-gray-300 rounded-md p-3 text-xs text-gray-600">
              No active salary structure yet - this employee's payroll
              currently falls back to their legacy Monthly Salary field.
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              Salary Structure
              <span className="text-red-500"> *</span>
            </label>

            <select
              value={form.salary_configuration_id}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, salary_configuration_id: "" }));
                setForm({ ...form, salary_configuration_id: e.target.value });
              }}
              className={`w-full h-11 border ${errors.salary_configuration_id ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
            >
              <option value="">Select structure</option>
              {structures.map((structure) => (
                <option key={structure.id} value={structure.id}>
                  {structure.structure_name} (Basic ₹
                  {Number(structure.basic_salary).toLocaleString()})
                </option>
              ))}
            </select>
            {errors.salary_configuration_id && (
              <p className="text-sm text-red-500 mt-1">
                {errors.salary_configuration_id}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Basic Override (optional)
            </label>

            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                ₹
              </span>

              <input
                type="number"
                value={form.override_basic_salary}
                onChange={(e) =>
                  setForm({ ...form, override_basic_salary: e.target.value })
                }
                placeholder={
                  selectedStructure
                    ? `Default: ${Number(selectedStructure.basic_salary).toLocaleString()}`
                    : "Leave blank to use the structure's default"
                }
                className="w-full h-11 border border-gray-400 rounded-md pl-8 pr-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Effective From
              <span className="text-red-500"> *</span>
            </label>

            <input
              type="date"
              value={form.effective_from}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, effective_from: "" }));
                setForm({ ...form, effective_from: e.target.value });
              }}
              className={`w-full h-11 border ${errors.effective_from ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
            />
            {errors.effective_from && (
              <p className="text-sm text-red-500 mt-1">{errors.effective_from}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={loading}
              className="w-28 h-10 border-gray-400 text-sm"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              loading={loading}
              loadingText="Assigning..."
              className="w-44 h-10 font-medium text-sm"
            >
              Assign
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}