import { X, Plus, Pencil } from "lucide-react";

import { useState } from "react";

import useFetch from "../../hooks/useFetch";

import salaryComponentServices from "../../services/salaryCompServces";

import salaryConfigurationServices from "../../services/salaryConfigServices";

import salaryDeductionServices from "../../services/salaryDeductServices";

import salaryComponentMasterServices from "../../services/salaryComponentMasterServices";

import salaryDeductionMasterServices from "../../services/salaryDeductionMasterServices";

import departmentServices from "../../services/departmentServices";

import designationServices from "../../services/designationServices";

import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function SalaryConfigurationDrawer({ open, onClose }) {
  const { alert, prompt } = useDialog();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // FIX (payroll redesign, Step 8b): replaced the old min_salary/
  // max_salary band - which nothing but the legacy generatePayroll used
  // and which none of the current employees' salaries actually fell
  // inside - with a real Department -> Designation -> Basic Salary
  // structure, per the redesign's Department -> Designation -> Salary
  // Structure flow.
  const [salaryConfig, setSalaryConfig] = useState({
    structure_name: "",
    department_id: "",
    designation_id: "",
    basic_salary: "",
    effective_from: "",
    // LOP rule: Auto | FixedPerDay | FixedDivisor (value unused for Auto)
    lop_mode: "Auto",
    lop_value: "",
  });

  const { data: departments = [] } = useFetch(departmentServices);

  const { data: designations = [] } = useFetch(designationServices, {
    department_id: salaryConfig.department_id || undefined,
  });

  const { data: components = [] } = useFetch(salaryComponentMasterServices);

  const { data: deductions = [] } = useFetch(salaryDeductionMasterServices);

  const [salaryComponents, setSalaryComponents] = useState([]);

  const [salaryDeductions, setSalaryDeductions] = useState([]);

  // Build the editable component / deduction rows once the master lists
  // arrive (adjusting state during render instead of in effects).
  const [syncedComponents, setSyncedComponents] = useState(components);
  const [syncedDeductions, setSyncedDeductions] = useState(deductions);

  if (components !== syncedComponents) {
    setSyncedComponents(components);

    if (components.length > 0) {
      setSalaryComponents(
        components.map((item) => ({
          component_master_id: item.id,
          component_name: item.component_name,
          amount: "",
          is_included: false,
          // Components can only be Fixed or a % of Basic - never % of
          // Gross, since Gross is defined as Basic + components and a
          // component reading Gross would be circular (see Step 5's
          // salary_components_calc_base_check constraint).
          calculation_type: "Fixed",
        })),
      );
    }
  }

  if (deductions !== syncedDeductions) {
    setSyncedDeductions(deductions);

    if (deductions.length > 0) {
      setSalaryDeductions(
        deductions.map((item) => ({
          deduction_master_id: item.id,
          deduction_name: item.deduction_name,
          amount: "",
          is_included: false,
          calculation_type: "Fixed",
          calc_base: "Basic",
        })),
      );
    }
  }

  // Reset designation whenever department changes, since designations
  // are department-scoped and a stale selection from a different
  // department should not silently carry over.
  const handleDepartmentChange = (value) => {
    setErrors((prev) => ({ ...prev, department_id: "" }));
    setSalaryConfig((prev) => ({
      ...prev,
      department_id: value,
      designation_id: "",
    }));
  };

  const handleSaveConfiguration = async () => {
    const nextErrors = {};
    if (!salaryConfig.structure_name.trim())
      nextErrors.structure_name = "This field is required";
    if (!salaryConfig.basic_salary) nextErrors.basic_salary = "This field is required";
    else if (Number(salaryConfig.basic_salary) <= 0)
      nextErrors.basic_salary = "Enter a positive number";
    if (!salaryConfig.effective_from) nextErrors.effective_from = "This field is required";

    if (salaryConfig.lop_mode !== "Auto") {
      const lopValue = Number(salaryConfig.lop_value);

      if (!salaryConfig.lop_value || Number.isNaN(lopValue) || lopValue <= 0) {
        nextErrors.lop_value = "Enter a positive number";
      } else if (salaryConfig.lop_mode === "FixedDivisor" && (lopValue < 1 || lopValue > 31)) {
        nextErrors.lop_value = "Divisor must be between 1 and 31";
      } else if (
        salaryConfig.lop_mode === "FixedPerDay" &&
        Number(salaryConfig.basic_salary) > 0 &&
        lopValue > Number(salaryConfig.basic_salary)
      ) {
        nextErrors.lop_value = "Cannot be more than the basic salary";
      }
    }
    salaryComponents.forEach((item, index) => {
      if (!item.is_included) return;
      if (Number(item.amount) <= 0) nextErrors[`component-${index}`] = "Enter a positive number";
      else if (item.calculation_type === "Percentage" && Number(item.amount) > 100) nextErrors[`component-${index}`] = "A percentage cannot be more than 100";
    });
    salaryDeductions.forEach((item, index) => {
      if (!item.is_included) return;
      if (Number(item.amount) <= 0) nextErrors[`deduction-${index}`] = "Enter a positive number";
      else if (item.calculation_type === "Percentage" && Number(item.amount) > 100) nextErrors[`deduction-${index}`] = "A percentage cannot be more than 100";
    });
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setLoading(true);
    try {

      // Component validations
      const invalidComponent = salaryComponents.find(
        (item) => item.is_included && !item.amount,
      );

      if (invalidComponent) {
        await alert({ title: "Amount Required", message: `Please enter ${invalidComponent.calculation_type === "Percentage" ? "a percentage" : "an amount"} for ${invalidComponent.component_name}.`, type: "error" });
        return;
      }

      // Deduction validations
      const invalidDeduction = salaryDeductions.find(
        (item) => item.is_included && !item.amount,
      );

      if (invalidDeduction) {
        await alert({ title: "Amount Required", message: `Please enter ${invalidDeduction.calculation_type === "Percentage" ? "a percentage" : "an amount"} for ${invalidDeduction.deduction_name}.`, type: "error" });
        return;
      }

      // Create salary structure (salary_configurations row) - department
      // and designation are optional (a structure can be a generic
      // fallback with neither set), min_salary/max_salary are simply
      // never sent since they're legacy/optional now.
      const configuration = await salaryConfigurationServices.create({
        structure_name: salaryConfig.structure_name.trim(),
        department_id: salaryConfig.department_id || null,
        designation_id: salaryConfig.designation_id || null,
        basic_salary: salaryConfig.basic_salary,
        effective_from: salaryConfig.effective_from,
        lop_mode: salaryConfig.lop_mode,
        lop_value: salaryConfig.lop_mode === "Auto" ? null : salaryConfig.lop_value,
      });

      const configurationId = configuration.id;

      // FIX: the structure row was created first and its components and
      // deductions saved one by one afterwards, so a failure part-way left
      // a half-built structure behind (it even showed up in Assign Salary).
      // If anything below fails, the structure is deleted again (its
      // components/deductions go with it) and the error is re-thrown.
      try {

      // Save selected salary components
      const selectedComponents = salaryComponents.filter(
        (item) => item.is_included,
      );

      for (const component of selectedComponents) {
        await salaryComponentServices.create({
          salary_configuration_id: configurationId,
          component_name: component.component_name,
          amount: component.amount,
          is_included: true,
          calculation_type: component.calculation_type,
          // Components are always % of Basic when Percentage - never
          // Gross (see constraint note above).
          calc_base: component.calculation_type === "Percentage" ? "Basic" : null,
        });
      }

      // Save selected deductions
      const selectedDeductions = salaryDeductions.filter(
        (item) => item.is_included,
      );

      for (const deduction of selectedDeductions) {
        await salaryDeductionServices.create({
          salary_configuration_id: configurationId,
          deduction_name: deduction.deduction_name,
          amount: deduction.amount,
          is_included: true,
          calculation_type: deduction.calculation_type,
          calc_base: deduction.calculation_type === "Percentage" ? deduction.calc_base : null,
        });
      }

      } catch (saveError) {
        try {
          await salaryConfigurationServices.remove(configurationId);
        } catch (cleanupError) {
          console.log("Could not roll back salary structure:", cleanupError);
        }
        throw saveError;
      }

      await alert({ title: "Salary Structure Saved", message: "Salary structure saved.", type: "success" });
      onClose();
    } catch (error) {
      console.log(error);
      await alert({ title: "Save Failed", message: error?.response?.data?.message || "Something went wrong.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = async () => {
    const name = await prompt({ title: "Add Component", message: "Enter component name" });

    if (!name) return;

    const newComponent = await salaryComponentMasterServices.create({
      component_name: name,
    });

    setSalaryComponents((prev) => [
      ...prev,
      {
        component_master_id: newComponent.id,
        component_name: newComponent.component_name,
        amount: "",
        is_included: false,
        calculation_type: "Fixed",
      },
    ]);
  };

  const handleAddDeduction = async () => {
    const name = await prompt({ title: "Add Deduction", message: "Enter deduction name" });

    if (!name) return;

    const newDeduction = await salaryDeductionMasterServices.create({
      deduction_name: name,
    });

    setSalaryDeductions((prev) => [
      ...prev,
      {
        deduction_master_id: newDeduction.id,
        deduction_name: newDeduction.deduction_name,
        amount: "",
        is_included: false,
        calculation_type: "Fixed",
        calc_base: "Basic",
      },
    ]);
  };

  const handleEditComponent = async (component) => {
    const updatedName = await prompt({ title: "Edit Component", message: "Edit component name", defaultValue: component.component_name });

    if (!updatedName || updatedName === component.component_name) return;

    await salaryComponentMasterServices.update(component.component_master_id, {
      component_name: updatedName,
    });

    setSalaryComponents((prev) =>
      prev.map((item) =>
        item.component_master_id === component.component_master_id
          ? {
              ...item,
              component_name: updatedName,
            }
          : item,
      ),
    );
  };

  const handleEditDeduction = async (deduction) => {
    const updatedName = await prompt({ title: "Edit Deduction", message: "Edit deduction name", defaultValue: deduction.deduction_name });

    if (!updatedName || updatedName === deduction.deduction_name) return;

    await salaryDeductionMasterServices.update(deduction.deduction_master_id, {
      deduction_name: updatedName,
    });

    setSalaryDeductions((prev) =>
      prev.map((item) =>
        item.deduction_master_id === deduction.deduction_master_id
          ? {
              ...item,
              deduction_name: updatedName,
            }
          : item,
      ),
    );
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}

      <div onClick={onClose} className="fixed inset-0 bg-black/20 z-40" />

      {/* Drawer */}

      <div
        className="
        fixed
        top-0
        right-0
        h-screen
        w-full
        sm:w-[560px]
        bg-white
        z-50
        overflow-y-auto
        shadow-2xl
        "
      >
        {/* Header */}

        <div className="p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">Configure Salary Structure</h2>

            <p className="text-sm text-gray-500 mt-1">
              Set up a Department / Designation salary structure with its components and deductions.
            </p>
          </div>

          <button>
            <X size={18} className="text-gray-500" onClick={onClose} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Structure Name */}

          <div>
            <label className="text-sm font-medium">
              Structure Name
              <span className="text-red-500"> *</span>
            </label>

            <input
              type="text"
              value={salaryConfig.structure_name}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, structure_name: "" }));
                setSalaryConfig({ ...salaryConfig, structure_name: e.target.value });
              }}
              placeholder="e.g. Web Developer - Engineering"
              className={`w-full h-11 border ${errors.structure_name ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
            />
            {errors.structure_name && <p className="text-sm text-red-500 mt-1">{errors.structure_name}</p>}
          </div>

          {/* Department + Designation */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Department</label>

              <select
                value={salaryConfig.department_id}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full h-11 border border-gray-400 rounded-md px-3 text-sm outline-none mt-2"
              >
                <option value="">Any department (generic structure)</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Designation</label>

              <select
                value={salaryConfig.designation_id}
                onChange={(e) => {
                  setSalaryConfig({ ...salaryConfig, designation_id: e.target.value });
                }}
                className="w-full h-11 border border-gray-400 rounded-md px-3 text-sm outline-none mt-2"
              >
                <option value="">Any designation</option>
                {designations.map((designation) => (
                  <option key={designation.id} value={designation.id}>
                    {designation.designation_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Basic Salary + Effective From */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Basic Salary
                <span className="text-red-500"> *</span>
              </label>

              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>

                <input
                  type="number"
                  value={salaryConfig.basic_salary}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, basic_salary: "" }));
                    setSalaryConfig({ ...salaryConfig, basic_salary: e.target.value });
                  }}
                  placeholder="45000"
                  className={`w-full h-11 border ${errors.basic_salary ? "border-red-500" : "border-gray-400"} rounded-md pl-8 pr-3 text-sm outline-none`}
                />
              </div>
              {errors.basic_salary && <p className="text-sm text-red-500 mt-1">{errors.basic_salary}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">
                Effective From
                <span className="text-red-500"> *</span>
              </label>

              <div className="relative mt-2">
                <input
                  type="date"
                  value={salaryConfig.effective_from}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, effective_from: "" }));
                    setSalaryConfig({ ...salaryConfig, effective_from: e.target.value });
                  }}
                  className={`
                  w-full
                  h-11
                  border
                  ${errors.effective_from ? "border-red-500" : "border-gray-400"}
                  rounded-md
                  px-3
                  text-sm
                  outline-none
                  `}
                />
              </div>
              {errors.effective_from && <p className="text-sm text-red-500 mt-1">{errors.effective_from}</p>}
            </div>
          </div>

          {/* LOP rule */}

          <div className="border border-gray-400 rounded-lg p-4">
            <h3 className="font-semibold">Loss of Pay (LOP) Rule</h3>

            <p className="text-xs text-gray-500 mt-1">
              How much is deducted for each LOP day (a full day = 1, a half day = 0.5).
            </p>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-sm font-medium">Calculation</label>

                <select
                  value={salaryConfig.lop_mode}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, lop_value: "" }));
                    setSalaryConfig({ ...salaryConfig, lop_mode: e.target.value, lop_value: "" });
                  }}
                  className="w-full h-11 border border-gray-400 rounded-md px-3 text-sm outline-none mt-2"
                >
                  <option value="Auto">Auto - Basic ÷ working days of the month</option>
                  <option value="FixedPerDay">Fixed amount per LOP day</option>
                  <option value="FixedDivisor">Basic ÷ fixed number of days</option>
                </select>
              </div>

              {salaryConfig.lop_mode !== "Auto" && (
                <div>
                  <label className="text-sm font-medium">
                    {salaryConfig.lop_mode === "FixedPerDay" ? "Amount per LOP day" : "Divide Basic by (days)"}
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="number"
                    value={salaryConfig.lop_value}
                    onChange={(e) => {
                      setErrors((prev) => ({ ...prev, lop_value: "" }));
                      setSalaryConfig({ ...salaryConfig, lop_value: e.target.value });
                    }}
                    placeholder={salaryConfig.lop_mode === "FixedPerDay" ? "1000" : "30"}
                    className={`w-full h-11 border ${errors.lop_value ? "border-red-500" : "border-gray-400"} rounded-md px-3 text-sm outline-none mt-2`}
                  />

                  {errors.lop_value && <p className="text-sm text-red-500 mt-1">{errors.lop_value}</p>}
                </div>
              )}
            </div>

            {(() => {
              const basic = Number(salaryConfig.basic_salary);
              const value = Number(salaryConfig.lop_value);
              let perDay = null;

              if (salaryConfig.lop_mode === "FixedPerDay" && value > 0) perDay = value;
              if (salaryConfig.lop_mode === "FixedDivisor" && value > 0 && basic > 0) perDay = basic / value;

              if (salaryConfig.lop_mode === "Auto") {
                return (
                  <p className="text-xs text-gray-500 mt-3">
                    The per-day rate changes every month with that month's working days (weekly offs and holidays excluded).
                  </p>
                );
              }

              return perDay ? (
                <p className="text-xs text-gray-500 mt-3">
                  LOP per day: ₹{perDay.toLocaleString("en-IN", { maximumFractionDigits: 2 })} - a half day deducts ₹
                  {(perDay / 2).toLocaleString("en-IN", { maximumFractionDigits: 2 })}.
                </p>
              ) : null;
            })()}
          </div>

          {/* Components */}

          <div className="border border-gray-400 rounded-lg overflow-hidden">
            <div className="p-4">
              <h3 className="font-semibold">Salary Components</h3>

              <p className="text-xs text-gray-500 mt-1">
                Select components - Fixed amount, or a % of Basic.
              </p>
            </div>

            <div className="bg-gray-50 grid grid-cols-5 px-4 py-2 text-xs font-semibold border-y border-gray-400">
              <p>Component</p>
              <p className="text-center">Include</p>
              <p className="text-center">Type</p>
              <p className="text-center">Amount / %</p>
              <p className="text-center">Action</p>
            </div>

            {salaryComponents.map((item, index) => (
              <div
                key={item.component_master_id ?? index}
                className="grid grid-cols-5 items-center px-4 py-3 border-b border-gray-400 text-sm gap-2"
              >
                <input
                  type="text"
                  placeholder="Component Name"
                  value={item.component_name}
                  disabled
                  className="border border-gray-400 rounded-md px-2 h-9"
                />

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={item.is_included}
                    onChange={(e) => {
                      const updated = [...salaryComponents];
                      updated[index].is_included = e.target.checked;
                      setSalaryComponents(updated);
                    }}
                  />
                </div>

                <select
                  value={item.calculation_type}
                  onChange={(e) => {
                    const updated = [...salaryComponents];
                    updated[index].calculation_type = e.target.value;
                    setSalaryComponents(updated);
                  }}
                  className="border border-gray-400 rounded-md h-9 px-1 text-xs"
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Percentage">% of Basic</option>
                </select>

                <div>
                  <input
                    type="number"
                    placeholder={item.calculation_type === "Percentage" ? "%" : "Amount"}
                    value={item.amount}
                    onChange={(e) => {
                      setErrors((prev) => ({ ...prev, [`component-${index}`]: "" }));
                      const updated = [...salaryComponents];
                      updated[index].amount = e.target.value;
                      setSalaryComponents(updated);
                    }}
                    className={`w-full border ${errors[`component-${index}`] ? "border-red-500" : "border-gray-400"} rounded-md h-9 px-3`}
                  />
                  {errors[`component-${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`component-${index}`]}</p>}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => handleEditComponent(item)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            ))}

            <div className="p-3">
              <button
                onClick={handleAddComponent}
                className="
                w-full
                h-10
                border-2
                border-dashed
                border-yellow-400
                rounded-md
                font-semibold
                text-sm
                text-yellow-500
                flex
                items-center
                justify-center
                gap-2
                "
              >
                <Plus size={14} />
                Add Component
              </button>
            </div>
          </div>

          {/* Deductions */}

          <div className="border border-gray-400 rounded-lg overflow-hidden">
            <div className="p-4">
              <h3 className="font-semibold">Deductions</h3>

              <p className="text-xs text-gray-500 mt-1">
                Select deductions - Fixed amount, or a % of Basic/Gross.
              </p>
            </div>

            <div className="bg-gray-50 grid grid-cols-6 px-4 py-2 text-xs font-semibold border-y border-gray-400">
              <p>Deduction</p>
              <p className="text-center">Include</p>
              <p className="text-center">Type</p>
              <p className="text-center">Base</p>
              <p className="text-center">Amount / %</p>
              <p className="text-center">Action</p>
            </div>

            {salaryDeductions.map((item, index) => (
              <div
                key={item.deduction_master_id ?? index}
                className="grid grid-cols-6 items-center px-4 py-3 border-b border-gray-400 text-sm gap-2"
              >
                <input
                  type="text"
                  disabled
                  placeholder="Deduction Name"
                  value={item.deduction_name}
                  className="border border-gray-400 rounded-md px-2 h-9"
                />

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={item.is_included}
                    onChange={(e) => {
                      const updated = [...salaryDeductions];
                      updated[index].is_included = e.target.checked;
                      setSalaryDeductions(updated);
                    }}
                  />
                </div>

                <select
                  value={item.calculation_type}
                  onChange={(e) => {
                    const updated = [...salaryDeductions];
                    updated[index].calculation_type = e.target.value;
                    setSalaryDeductions(updated);
                  }}
                  className="border border-gray-400 rounded-md h-9 px-1 text-xs"
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Percentage">Percentage</option>
                </select>

                <select
                  value={item.calc_base}
                  disabled={item.calculation_type !== "Percentage"}
                  onChange={(e) => {
                    const updated = [...salaryDeductions];
                    updated[index].calc_base = e.target.value;
                    setSalaryDeductions(updated);
                  }}
                  className="border border-gray-400 rounded-md h-9 px-1 text-xs disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="Basic">Basic</option>
                  <option value="Gross">Gross</option>
                </select>

                <div>
                  <input
                    type="number"
                    placeholder={item.calculation_type === "Percentage" ? "%" : "Amount"}
                    value={item.amount}
                    onChange={(e) => {
                      setErrors((prev) => ({ ...prev, [`deduction-${index}`]: "" }));
                      const updated = [...salaryDeductions];
                      updated[index].amount = e.target.value;
                      setSalaryDeductions(updated);
                    }}
                    className={`w-full border ${errors[`deduction-${index}`] ? "border-red-500" : "border-gray-400"} rounded-md h-9 px-3`}
                  />
                  {errors[`deduction-${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`deduction-${index}`]}</p>}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => handleEditDeduction(item)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            ))}

            <div className="p-3">
              <button
                onClick={handleAddDeduction}
                className="
                w-full
                h-10
                border-2
                border-dashed
                border-yellow-400
                rounded-md
                font-semibold
                text-sm
                text-yellow-500
                flex
                items-center
                justify-center
                gap-2
                "
              >
                <Plus size={14} />
                Add Deduction
              </button>
            </div>
          </div>

          {/* Footer */}

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
              onClick={handleSaveConfiguration}
              loading={loading}
              loadingText="Saving..."
              className="w-44 h-10 font-medium text-sm"
            >
              Save Structure
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}