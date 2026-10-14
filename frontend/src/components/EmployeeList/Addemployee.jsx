import { useState, useEffect } from "react";
import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import useCrud from "../../hooks/useCrud";
import Button from "../Button";
import employeeServices from "../../services/employeeServices";
import departmentServices from "../../services/departmentServices";
import useFetch from "../../hooks/useFetch";
import { useDialog } from "../Dialogbox/DialogContext";
import { formatLocalDate } from "../../utils/dateUtils";

const initialForm = {
  employee_code: "",
  first_name: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  personal_email: "",
  address: "",
  department_id: "",
  designation: "",
  reporting_manager: "",
  joining_date: "",
  employment_type: "",
  role: "",
 monthly_salary: "",
};

export default function AddEmployee({ employee, onClose, onSuccess }) {
  const { alert } = useDialog();

  const maxDOB = new Date();
  maxDOB.setFullYear(maxDOB.getFullYear() - 18);

  // FIX: toISOString() is UTC - use the local calendar date instead.
  const maxDate = formatLocalDate(maxDOB);

  const { data: departments = [] } = useFetch(departmentServices);
  const departmentOptions = departments.map((department) => ({
    label: department.department_name,
    value: department.id,
  }));

  // Needed so we can offer existing department members as reporting
  // manager options when the department has no head set yet.
  const { data: allEmployees = [] } = useFetch(employeeServices);

  const handleSelectChange = (name, value) => {
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState(initialForm);

  // Reporting Manager is a dropdown driven by the selected department:
  // - if the department has a head, that's the only option (auto-filled)
  // - otherwise, fall back to the names of employees already in that
  //   department, so admin can pick one of them as the manager
  // - a brand new department with no head and no members yet simply
  //   has no options - this field stays optional in that case
  const selectedDepartment = departments.find(
    (department) => String(department.id) === String(formData.department_id),
  );

  const departmentHeadName = selectedDepartment?.department_head?.trim() || "";

  const departmentMemberOptions = formData.department_id
    ? allEmployees
        .filter(
          (emp) =>
            String(emp.department_id) === String(formData.department_id) &&
            emp.id !== employee?.id, // an employee can't report to themself
        )
        .map((emp) => ({
          label: `${emp.first_name} (${emp.employee_code})`,
          value: emp.first_name,
        }))
    : [];

  const reportingManagerOptions = departmentHeadName
    ? [departmentHeadName]
    : departmentMemberOptions;

  const handleDepartmentChange = (value) => {
    const department = departments.find(
      (dept) => String(dept.id) === String(value),
    );

    const headName = department?.department_head?.trim() || "";

    setErrors((prev) => ({ ...prev, department_id: "" }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  setFormData((prev) => ({
      ...prev,
      department_id: value,
      // Auto-fill only when the new department has a head; otherwise
      // clear it so the admin picks a member manually (or leaves it
      // blank if there's nobody in the department yet).
      reporting_manager: headName,
    }));
  };

useEffect(() => {
  const loadData = async () => {
    if (employee) {
      setFormData({
        employee_code: employee.employee_code || "",
        first_name: employee.first_name || "",
        gender: employee.gender || "",
        date_of_birth: employee.date_of_birth || "",
        phone: employee.phone || "",
        personal_email: employee.personal_email || "",
        address: employee.address || "",
        department_id: employee.department_id || "",
        designation: employee.designation || "",
        reporting_manager: employee.reporting_manager || "",
        joining_date: employee.joining_date || "",
        employment_type: employee.employment_type || "",
        role: employee.role || "",
       monthly_salary: employee.monthly_salary || "",
      });
    } else {
      const data = await employeeServices.getNextEmployeeCode();

      setFormData({
        ...initialForm,
        employee_code: data.employee_code,
      });
    }
  };

  loadData();
}, [employee]);

  const { create, update, loading } = useCrud(employeeServices);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    ["employee_code", "first_name", "gender", "date_of_birth", "phone", "personal_email", "address", "department_id", "designation", "joining_date", "employment_type", "role", "monthly_salary"].forEach((name) => { if (!String(formData[name] || "").trim()) nextErrors[name] = "This field is required"; });
    if (formData.employee_code && /\s/.test(formData.employee_code)) nextErrors.employee_code = "Employee code cannot contain spaces";
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) nextErrors.phone = "Enter a valid 10-digit phone number";
    if (formData.personal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personal_email)) nextErrors.personal_email = "Enter a valid email address";
    if (formData.monthly_salary && Number(formData.monthly_salary) <= 0) nextErrors.monthly_salary = "Enter a positive number";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    const payload = {
      ...formData,
      department_id:
        formData.department_id === "" ? null : Number(formData.department_id),
      monthly_salary: formData.monthly_salary === "" ? null : formData.monthly_salary,
      date_of_birth: formData.date_of_birth === "" ? null : formData.date_of_birth,
      joining_date: formData.joining_date === "" ? null : formData.joining_date,
    };

    try {
      if (employee) {
        await update(employee.id, payload);

        await alert({
          title: "Success",
          message: "Employee updated successfully.",
          type: "success",
        });
      } else {
        const created = await create(payload);

        // FIX: login credentials are already emailed to the employee's
        // verified email address by the backend on creation, so showing
        // the temporary password here too was an unnecessary exposure -
        // anyone glancing at the admin's screen could read it. Just
        // confirm the action instead.
        if (created?.emailSent === false) {
          // The password is only ever delivered by email (it is no longer
          // returned by the API), so tell HR when that email didn't go out.
          await alert({
            title: "Employee Created - Email Not Sent",
            message: `The employee was added, but the login email could not be sent (${created.emailError || "unknown reason"}). Ask them to use "Forgot password" on the login page.`,
            type: "info",
          });
        } else {
          await alert({
            title: "Employee Created Successfully",
            message: "The employee has been added. Their login credentials have been sent to their registered email.",
            type: "success",
          });
        }
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.log(err);

      await alert({
        title: "Error",
        message: err.response?.data?.message || "Something went wrong.",
        type: "error",
      });
    }
  };


const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "phone") {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 10) return;
  }

  if (name === "monthly_salary") {
    if (!/^\d*$/.test(value)) return;
  }

  setErrors((prev) => ({ ...prev, [name]: "" }));
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  // return (
  //   <div className="bg-white p-2 rounded-2xl w-full">
  //     <h3 className="text-2xl font-bold mb-2">
  //       {employee ? "Edit Employee" : "Add Employee"}
  //     </h3>
  //     <h2 className="text-xl font-semibold mb-2">Personal Information</h2>

  //     <form onSubmit={handleSubmit}>
  //       <div>
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  //           <FormInput
  //             label="Employee Code"
  //             name="employee_code"
  //             placeholder="EMP-1001"
  //             value={formData.employee_code}
  //             disabled={true}
  //             onChange={handleChange}
  //             pattern="^EMP-[0-9]{4}$"
  //           />

  //           <FormInput
  //             label="Full Name"
  //             name="first_name"
  //             placeholder="John Doe"
  //             value={formData.first_name}
  //             onChange={handleChange}
  //             pattern="^[A-Za-z ]+$"
  //           />

  //           <CustomSelect
  //             label="Gender"
  //             name="gender"
  //             options={["Male", "Female", "Other"]}
  //             value={formData.gender}
  //             placeholder="Select"
  //             onChange={(value) => handleSelectChange("gender", value)}
  //           />

  //           <FormInput
  //             label="Date of Birth"
  //             name="date_of_birth"
  //             type="date"
  //             value={formData.date_of_birth}
  //             onChange={handleChange}
  //             max={maxDate}
  //           />

  //           <FormInput
  //             label="Phone Number"
  //             name="phone"
  //             type="tel"
  //             value={formData.phone}
  //             onChange={handleChange}
  //             pattern="^[6-9][0-9]{9}$"
  //             maxLength={10}
  //           />

  //           <FormInput
  //             label="Email"
  //             name="personal_email"
  //             type="email"
  //             value={formData.personal_email}
  //             onChange={handleChange}
  //             // pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$"
  //           />
  //         </div>

  //         <FormInput
  //           label="Address"
  //           name="address"
  //           value={formData.address}
  //           onChange={handleChange}
  //         />

  //         <h2 className="w-full text-xl font-semibold mb-2 mt-2">
  //           Employment Information
  //         </h2>

  //         <div className="grid grid-cols-2 gap-5">
  //           <CustomSelect
  //             label="Department"
  //             name="department_id"
  //             options={departmentOptions}
  //             value={formData.department_id}
  //             placeholder="Select"
  //             onChange={(value) => handleSelectChange("department_id", value)}
  //           />
  //           <FormInput
  //             label="Designation"
  //             name="designation"
  //             value={formData.designation}
  //             onChange={handleChange}
  //             pattern="^[A-Za-z ]+$"
  //           />
  //           <FormInput
  //             label="Reporting Manager"
  //             name="reporting_manager"
  //             value={formData.reporting_manager}
  //             onChange={handleChange}
  //             pattern="^[A-Za-z ]+$"
  //           />
  //           <FormInput
  //             label="Joining Date"
  //             name="joining_date"
  //             type="date"
  //             value={formData.joining_date}
  //             onChange={handleChange}
  //           />
  //         </div>

  //         <div className="grid grid-cols-2 gap-5">
  //           <CustomSelect
  //             label="Employment Type"
  //             name="employment_type"
  //             options={["Full-Time", "Part-Time", "Contract", "Intern"]}
  //             value={formData.employment_type}
  //             placeholder="Select"
  //             onChange={(value) => handleSelectChange("employment_type", value)}
  //           />
  //           <CustomSelect
  //             label="Role"
  //             name="role"
  //             options={["HR", "Admin", "Employee"]}
  //             value={formData.role}
  //             placeholder="Select"
  //             onChange={(value) => handleSelectChange("role", value)}
  //           />
  //         </div>
  //       </div>

  //       <div className="flex justify-end gap-3 -mx-6 -mb-6 mt-8 px-6 py-4 sticky bottom-0 z-10 bg-white border-t border-gray-200 rounded-b-2xl shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
  //         <button
  //           type="button"
  //           onClick={onClose}
  //           className="bg-gray-100 border border-gray-300 px-5 py-2 rounded-lg hover:bg-red-100"
  //         >
  //           Cancel
  //         </button>

  //         <button
  //           type="submit"
  //           className="bg-yellow-500 text-white px-5 py-2 rounded-lg"
  //         >
  //           {employee ? "Update" : "Save"}
  //         </button>
  //       </div>
  //     </form>
  //   </div>
  // );

return (
  <div className="bg-white rounded-2xl w-full flex flex-col max-h-[80vh]">
    {/* Scrollable content */}
    <div className="overflow-y-auto px-4 pt-4">
      <h3 className="text-2xl font-bold mb-2">
        {employee ? "Edit Employee" : "Add Employee"}
      </h3>
      <h2 className="text-xl font-semibold mb-2">Personal Information</h2>

      <form onSubmit={handleSubmit} id="employee-form">
        <div>
          <div className="grid grid-cols-2 gap-5">
            <FormInput
              label="Employee Code"
              name="employee_code"
              placeholder="EMP-1001"
              value={formData.employee_code}
              disabled={true}
              onChange={handleChange}
              pattern="^EMP-[0-9]{4}$"
            />

            <FormInput
              label="Full Name"
              name="first_name"
              placeholder="John Doe"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              pattern="^[A-Za-z ]+$"
            />

            <CustomSelect
              label="Gender"
              name="gender"
              options={["Male", "Female", "Other"]}
              value={formData.gender}
              error={errors.gender}
              placeholder="Select"
              onChange={(value) => handleSelectChange("gender", value)}
            />

            <FormInput
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              error={errors.date_of_birth}
              max={maxDate}
            />

            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              pattern="^[6-9][0-9]{9}$"
              maxLength={10}
            />

            <FormInput
              label="Email"
              name="personal_email"
              type="email"
              value={formData.personal_email}
              onChange={handleChange}
              error={errors.personal_email}
            />
          </div>

          <FormInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />

          <h2 className="w-full text-xl font-semibold mb-2 mt-2">
            Employment Information
          </h2>

          <div className="grid grid-cols-2 gap-5">
            <CustomSelect
              label="Department"
              name="department_id"
              options={departmentOptions}
              value={formData.department_id}
              error={errors.department_id}
              placeholder="Select"
              onChange={handleDepartmentChange}
            />
            <FormInput
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              error={errors.designation}
              pattern="^[A-Za-z ]+$"
            />
            <FormInput
              label="Monthly_salary"
              name="monthly_salary"
              type="number"
              value={formData.monthly_salary}
              onChange={handleChange}
              error={errors.monthly_salary}
              placeholder="50000"
            />
            <CustomSelect
              label="Reporting Manager"
              name="reporting_manager"
              options={reportingManagerOptions}
              value={formData.reporting_manager}
              placeholder={
                !formData.department_id
                  ? "Select department first"
                  : reportingManagerOptions.length
                    ? "Select"
                    : "No head or members in this department yet"
              }
              onChange={(value) =>
                handleSelectChange("reporting_manager", value)
              }
            />
            <FormInput
              label="Joining Date"
              name="joining_date"
              type="date"
              value={formData.joining_date}
              onChange={handleChange}
              error={errors.joining_date}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            <CustomSelect
              label="Employment Type"
              name="employment_type"
              options={["Full-Time", "Part-Time", "Contract", "Intern"]}
              value={formData.employment_type}
              error={errors.employment_type}
              placeholder="Select"
              onChange={(value) => handleSelectChange("employment_type", value)}
            />
            <CustomSelect
              label="Role"
              name="role"
              options={["HR", "Admin", "Employee"]}
              value={formData.role}
              error={errors.role}
              placeholder="Select"
              onChange={(value) => handleSelectChange("role", value)}
            />
          </div>
        </div>
      </form>
    </div>

    {/* Fixed footer — outside the scroll area, always docked */}
    <div className="shrink-0 flex justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-white rounded-b-2xl">
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
        form="employee-form"
        loading={loading}
        loadingText={employee ? "Updating..." : "Saving..."}
      >
        {employee ? "Update" : "Save"}
      </Button>
    </div>
  </div>
);
}