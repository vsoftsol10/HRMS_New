import useCrud from "../../hooks/useCrud";
import departmentServices from "../../services/departmentServices";
import employeeServices from "../../services/employeeServices";
import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import useFetch from "../../hooks/useFetch";
import { useState } from "react";
import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function AddDepartment({ department, onClose, onSuccess }) {

  const { alert } = useDialog();

  // Department Head is a dropdown of this department's existing
  // members, instead of free text - avoids typos/names that don't
  // match a real employee. A brand new department has no members yet
  // (it doesn't have an id until it's created), so this naturally has
  // no options until employees are added to it - the field stays
  // optional either way.
  const { data: allEmployees = [] } = useFetch(employeeServices);

  const departmentHeadOptions = department
    ? allEmployees
        .filter((emp) => String(emp.department_id) === String(department.id))
        .map((emp) => ({
          label: `${emp.first_name} (${emp.employee_code})`,
          value: emp.first_name,
        }))
    : [];

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    departmentname: "",
    departmenthead: "",
    description: "",
  });

// Fill the form when a different department is passed in (adjusting state
// during render, the pattern React recommends over a syncing effect).
const [syncedDepartment, setSyncedDepartment] = useState(department);

if (department !== syncedDepartment) {
  setSyncedDepartment(department);

  if (department) {
    setFormData({
      departmentname: department.department_name,
      departmenthead: department.department_head || "",
      description: department.description,
    });
  }
}

  const { create, update, loading } = useCrud(departmentServices);
  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!formData.departmentname.trim()) nextErrors.departmentname = "This field is required";
    if (!formData.description.trim()) nextErrors.description = "This field is required";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      department_name: formData.departmentname,
      department_head: formData.departmenthead,
      description: formData.description,
    };

    try {
      if (department) {
        await update(department.id, payload);

        await alert({
          title: "Success",
          message: "Department updated successfully.",
          type: "success",
        });
      } else {
        await create(payload);

        await alert({
          title: "Success",
          message: "Department added successfully.",
          type: "success",
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);

      await alert({
        title: "Error",
        message: err.response?.data?.message || "Operation failed.",
        type: "error",
      });
    }
  };

  const handleChange = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name, value) => {
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-white p-2 rounded-2xl w-full">
      <h3 className="text-2xl font-bold mb-2">
        {department ? "Edit Department" : "Add Department"}
      </h3>
      <form onSubmit={handleSubmit}>
        <div>
          <div className="grid gap-5">
            <FormInput
              label="Department Name"
              name="departmentname"
              placeholder="e.g Engineering"
              value={formData.departmentname}
              onChange={handleChange}
              error={errors.departmentname}
            />

            <CustomSelect
              label="Department Head"
              name="departmenthead"
              options={departmentHeadOptions}
              value={formData.departmenthead}
              placeholder={
                !department
                  ? "Save the department first, then assign a head"
                  : departmentHeadOptions.length
                    ? "Select"
                    : "No employees in this department yet"
              }
              onChange={(value) => handleSelectChange("departmenthead", value)}
            />

            <FormInput
              label="Description"
              name="description"
              placeholder="What this department does..."
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={loading}
            loadingText={department ? "Updating..." : "Creating..."}
          >
            {department ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}