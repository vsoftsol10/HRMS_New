// import { X } from "lucide-react";

// import { useState, useEffect } from "react";

// import useFetch from "../../hooks/useFetch";

// import employeeServices from "../../services/employeeServices";
// import salaryConfigurationServices from "../../services/salaryConfigServices";
// import employeeSalaryAssignmentServices from "../../services/employeeSalaryAssignmentServices";

// import { useDialog } from "../Dialogbox/DialogContext";
// import Button from "../Button";

// export default function AssignSalaryDrawer({ open, onClose }) {
//   const { alert } = useDialog();

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);

//   const [form, setForm] = useState({
//     employee_id: "",
//     salary_configuration_id: "",
//     override_basic_salary: "",
//     effective_from: "",
//   });

//   // Result of the "active assignment" lookup, tagged with the employee it
//   // belongs to so a stale answer is never shown for another employee.
//   const [fetchedAssignment, setFetchedAssignment] = useState({
//     employeeId: "",
//     assignment: null,
//   });

//   const { data: employees = [] } = useFetch(employeeServices);

//   const { data: configurations = [] } = useFetch(salaryConfigurationServices);

//   // Only real Salary Structures (Step 3+) are assignable - the old
//   // min/max band row(s) from before the redesign have no structure_name
//   // and are not something HR should be able to pick here.
//   const structures = configurations.filter((item) => item.structure_name);

//   useEffect(() => {
//     const employeeId = form.employee_id;

//     if (!employeeId) return undefined;

//     let cancelled = false;

//     employeeSalaryAssignmentServices
//       .getActive(employeeId)
//       .then((assignment) => {
//         if (!cancelled) setFetchedAssignment({ employeeId, assignment });
//       })
//       .catch(() => {
//         if (!cancelled) setFetchedAssignment({ employeeId, assignment: null });
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [form.employee_id]);

//   const lookupDone = fetchedAssignment.employeeId === form.employee_id;
//   const currentAssignment =
//     form.employee_id && lookupDone ? fetchedAssignment.assignment : null;
//   const loadingCurrent = Boolean(form.employee_id) && !lookupDone;

//   const resetForm = () => {
//     setForm({
//       employee_id: "",
//       salary_configuration_id: "",
//       override_basic_salary: "",
//       effective_from: "",
//     });
//     setErrors({});
//   };

//   const handleSave = async () => {
//     const nextErrors = {};

//     if (!form.employee_id) nextErrors.employee_id = "This field is required";
//     if (!form.salary_configuration_id)
//       nextErrors.salary_configuration_id = "This field is required";
//     if (!form.effective_from)
//       nextErrors.effective_from = "This field is required";

//     if (
//       currentAssignment &&
//       form.effective_from &&
//       new Date(form.effective_from) <=
//         new Date(currentAssignment.effective_from)
//     ) {
//       nextErrors.effective_from = `Must be after the current assignment's start date (${currentAssignment.effective_from})`;
//     }

//     if (Object.keys(nextErrors).length) {
//       setErrors(nextErrors);
//       return;
//     }

//     setLoading(true);

//     try {
//       await employeeSalaryAssignmentServices.create({
//         employee_id: form.employee_id,
//         salary_configuration_id: form.salary_configuration_id,
//         override_basic_salary: form.override_basic_salary || null,
//         effective_from: form.effective_from,
//       });

//       await alert({
//         title: "Salary Assigned",
//         message: "Salary structure assigned successfully.",
//         type: "success",
//       });

//       resetForm();
//       onClose();
//     } catch (error) {
//       console.log(error);
//       await alert({
//         title: "Assignment Failed",
//         message: error?.response?.data?.message || "Something went wrong.",
//         type: "error",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!open) return null;

//   const selectedStructure = structures.find(
//     (item) => String(item.id) === String(form.salary_configuration_id),
//   );

//   return (
//     <>
//       <div onClick={onClose} className="fixed inset-0 bg-black/20 z-40" />

//       <div className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white z-50 overflow-y-auto shadow-2xl">
//         <div className="p-6 flex justify-between items-start">
//           <div>
//             <h2 className="text-xl font-semibold">Assign Salary Structure</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               Assign an employee to a salary structure, with an optional
//               Basic override.
//             </p>
//           </div>

//           <button>
//             <X size={18} className="text-gray-500" onClick={onClose} />
//           </button>
//         </div>

//         <div className="px-6 pb-6 space-y-5">
//           <div>
//             <label className="text-sm font-medium">
//               Employee
//               <span className="text-red-500"> *</span>
//             </label>

//             <select
//               value={form.employee_id}
//               onChange={(e) => {
//                 setErrors((prev) => ({ ...prev, employee_id: "" }));
//                 setForm({ ...form, employee_id: e.target.value });
//               }}
//               className={`w-full h-11 border ${errors.employee_id ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
//             >
//               <option value="">Select employee</option>
//               {employees.map((employee) => (
//                 <option key={employee.id} value={employee.id}>
//                   {employee.first_name} ({employee.employee_code})
//                 </option>
//               ))}
//             </select>
//             {errors.employee_id && (
//               <p className="text-sm text-red-500 mt-1">{errors.employee_id}</p>
//             )}
//           </div>

//           {loadingCurrent && (
//             <p className="text-xs text-gray-500">Checking current assignment...</p>
//           )}

//           {!loadingCurrent && currentAssignment && (
//             <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
//               Currently on{" "}
//               <span className="font-semibold">
//                 {currentAssignment.salary_configurations?.structure_name}
//               </span>{" "}
//               since {currentAssignment.effective_from}
//               {currentAssignment.override_basic_salary && (
//                 <> (Basic override: ₹{Number(currentAssignment.override_basic_salary).toLocaleString()})</>
//               )}
//               . Assigning a new structure below will end this one the day
//               before the new effective date.
//             </div>
//           )}

//           {!loadingCurrent && form.employee_id && !currentAssignment && (
//             <div className="bg-gray-50 border border-gray-300 rounded-md p-3 text-xs text-gray-600">
//               No active salary structure yet - this employee's payroll
//               currently falls back to their legacy Monthly Salary field.
//             </div>
//           )}

//           <div>
//             <label className="text-sm font-medium">
//               Salary Structure
//               <span className="text-red-500"> *</span>
//             </label>

//             <select
//               value={form.salary_configuration_id}
//               onChange={(e) => {
//                 setErrors((prev) => ({ ...prev, salary_configuration_id: "" }));
//                 setForm({ ...form, salary_configuration_id: e.target.value });
//               }}
//               className={`w-full h-11 border ${errors.salary_configuration_id ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
//             >
//               <option value="">Select structure</option>
//               {structures.map((structure) => (
//                 <option key={structure.id} value={structure.id}>
//                   {structure.structure_name} (Basic ₹
//                   {Number(structure.basic_salary).toLocaleString()})
//                 </option>
//               ))}
//             </select>
//             {errors.salary_configuration_id && (
//               <p className="text-sm text-red-500 mt-1">
//                 {errors.salary_configuration_id}
//               </p>
//             )}
//           </div>

//           <div>
//             <label className="text-sm font-medium">
//               Basic Override (optional)
//             </label>

//             <div className="relative mt-2">
//               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
//                 ₹
//               </span>

//               <input
//                 type="number"
//                 value={form.override_basic_salary}
//                 onChange={(e) =>
//                   setForm({ ...form, override_basic_salary: e.target.value })
//                 }
//                 placeholder={
//                   selectedStructure
//                     ? `Default: ${Number(selectedStructure.basic_salary).toLocaleString()}`
//                     : "Leave blank to use the structure's default"
//                 }
//                 className="w-full h-11 border border-gray-400 rounded-md pl-8 pr-3 text-sm outline-none"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="text-sm font-medium">
//               Effective From
//               <span className="text-red-500"> *</span>
//             </label>

//             <input
//               type="date"
//               value={form.effective_from}
//               onChange={(e) => {
//                 setErrors((prev) => ({ ...prev, effective_from: "" }));
//                 setForm({ ...form, effective_from: e.target.value });
//               }}
//               className={`w-full h-11 border ${errors.effective_from ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
//             />
//             {errors.effective_from && (
//               <p className="text-sm text-red-500 mt-1">{errors.effective_from}</p>
//             )}
//           </div>

//           <div className="flex justify-end gap-3 pt-2">
//             <Button
//               onClick={onClose}
//               variant="secondary"
//               disabled={loading}
//               className="w-28 h-10 border-gray-400 text-sm"
//             >
//               Cancel
//             </Button>

//             <Button
//               onClick={handleSave}
//               loading={loading}
//               loadingText="Assigning..."
//               className="w-44 h-10 font-medium text-sm"
//             >
//               Assign
//             </Button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

import { X } from "lucide-react";

import { useState, useEffect } from "react";

import useFetch from "../../hooks/useFetch";

import employeeServices from "../../services/employeeServices";
import salaryConfigurationServices from "../../services/salaryConfigServices";
import employeeSalaryAssignmentServices from "../../services/employeeSalaryAssignmentServices";

import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

const toNumber = (value) =>
  value === null || value === undefined || value === ""
    ? null
    : Number(value);

export default function AssignSalaryDrawer({ open, onClose }) {
  const { alert } = useDialog();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employee_id: "",
    salary_configuration_id: "",
    effective_from: "",
  });

  // null = HR has not typed in the Basic Override field, so it shows the
  // auto-filled value (see autoValue below). Once HR types, their text wins.
  const [overrideEdit, setOverrideEdit] = useState(null);

  // Result of the "active assignment" + history lookup, tagged with the
  // employee it belongs to so a stale answer is never shown for another
  // employee.
  const [fetchedAssignment, setFetchedAssignment] = useState({
    employeeId: "",
    assignment: null,
    history: [],
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

    Promise.all([
      employeeSalaryAssignmentServices
        .getActive(employeeId)
        .catch(() => null),
      employeeSalaryAssignmentServices
        .getHistory(employeeId)
        .catch(() => []),
    ]).then(([assignment, history]) => {
      if (!cancelled)
        setFetchedAssignment({
          employeeId,
          assignment,
          history: Array.isArray(history) ? history : [],
        });
    });

    return () => {
      cancelled = true;
    };
  }, [form.employee_id]);

  const lookupDone = fetchedAssignment.employeeId === form.employee_id;
  const currentAssignment =
    form.employee_id && lookupDone ? fetchedAssignment.assignment : null;
  const loadingCurrent = Boolean(form.employee_id) && !lookupDone;

  // Structures this employee was on earlier and that have already ended
  // (effective_to is set) are not offered again. The structure the employee
  // is on right now stays in the list, so HR can still re-assign it with a
  // different Basic override.
  const endedStructureIds = new Set(
    (lookupDone ? fetchedAssignment.history : [])
      .filter((row) => row.effective_to)
      .map((row) => String(row.salary_configuration_id)),
  );
  const activeStructureId = currentAssignment
    ? String(currentAssignment.salary_configuration_id)
    : null;

  const assignableStructures = structures.filter(
    (item) =>
      !endedStructureIds.has(String(item.id)) ||
      String(item.id) === activeStructureId,
  );

  const selectedEmployee = employees.find(
    (item) => String(item.id) === String(form.employee_id),
  );

  const selectedStructure = structures.find(
    (item) => String(item.id) === String(form.salary_configuration_id),
  );

  // The employee's current basic: the active assignment's override (or its
  // structure's basic); with no assignment, the legacy Monthly Salary that
  // payroll falls back to.
  let currentBasic = null;
  if (form.employee_id && !loadingCurrent) {
    currentBasic = currentAssignment
      ? (toNumber(currentAssignment.override_basic_salary) ??
        toNumber(currentAssignment.salary_configurations?.basic_salary))
      : toNumber(selectedEmployee?.monthly_salary);
  }

  // Once a structure is picked the field shows that structure's basic, so a
  // stale basic from the previous structure can never silently win over the
  // new structure's basic.
  const autoBasic = selectedStructure
    ? toNumber(selectedStructure.basic_salary)
    : currentBasic;

  let autoValue = "";
  if (autoBasic !== null && !Number.isNaN(autoBasic)) {
    autoValue = String(autoBasic);
  }

  const overrideValue = overrideEdit !== null ? overrideEdit : autoValue;

  const resetForm = () => {
    setForm({
      employee_id: "",
      salary_configuration_id: "",
      effective_from: "",
    });
    setOverrideEdit(null);
    setErrors({});
  };

  const handleSave = async () => {
    const nextErrors = {};

    if (!form.employee_id) nextErrors.employee_id = "This field is required";
    if (!form.salary_configuration_id)
      nextErrors.salary_configuration_id = "This field is required";
    if (!form.effective_from)
      nextErrors.effective_from = "This field is required";

    const overrideNumber = toNumber(overrideValue);

    if (
      overrideValue !== "" &&
      (Number.isNaN(overrideNumber) || overrideNumber <= 0)
    ) {
      nextErrors.override_basic_salary = "Enter a positive number";
    }

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

    // An override equal to the structure's own basic is not an override -
    // save it as null so the structure's basic stays the source of truth.
    const sameAsStructure =
      selectedStructure &&
      overrideNumber === toNumber(selectedStructure.basic_salary);

    setLoading(true);

    try {
      await employeeSalaryAssignmentServices.create({
        employee_id: form.employee_id,
        salary_configuration_id: form.salary_configuration_id,
        override_basic_salary:
          overrideValue === "" || sameAsStructure ? null : overrideValue,
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
                setErrors((prev) => ({
                  ...prev,
                  employee_id: "",
                  salary_configuration_id: "",
                  override_basic_salary: "",
                }));
                // A different employee has a different structure history, so
                // the previous structure pick and any typed override are
                // dropped and the override auto-fills again.
                setOverrideEdit(null);
                setForm({
                  ...form,
                  employee_id: e.target.value,
                  salary_configuration_id: "",
                });
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
                setErrors((prev) => ({
                  ...prev,
                  salary_configuration_id: "",
                  override_basic_salary: "",
                }));
                // Picking a structure re-fills the override with that
                // structure's basic.
                setOverrideEdit(null);
                setForm({ ...form, salary_configuration_id: e.target.value });
              }}
              className={`w-full h-11 border ${errors.salary_configuration_id ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
            >
              <option value="">Select structure</option>
              {assignableStructures.map((structure) => (
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
                value={overrideValue}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, override_basic_salary: "" }));
                  setOverrideEdit(e.target.value);
                }}
                placeholder={
                  selectedStructure
                    ? `Default: ${Number(selectedStructure.basic_salary).toLocaleString()}`
                    : "Leave blank to use the structure's default"
                }
                className={`w-full h-11 border ${errors.override_basic_salary ? "border-red-500" : "border-gray-400"} rounded-md pl-8 pr-3 text-sm outline-none`}
              />
            </div>
            {errors.override_basic_salary ? (
              <p className="text-sm text-red-500 mt-1">
                {errors.override_basic_salary}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled with the employee's current basic. Picking a
                structure fills that structure's basic - change it only to
                override.
              </p>
            )}
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