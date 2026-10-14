import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  Check,
  CircleCheck,
  Hash,
  IndianRupee,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import OutcomeModalShell, { InfoNotice, cancelButtonClass } from "./OutcomeModalShell";
import { formatLongDate, formatRupees } from "../../utils/outcomeFormat";
import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import useFetch from "../../hooks/useFetch";
import departmentServices from "../../services/departmentServices";
import employeeServices from "../../services/employeeServices";
import internServices from "../../services/internServices";
import { formatLocalDate } from "../../utils/dateUtils";

const EMPLOYEE_TYPES = ["Full-Time", "Part-Time", "Contract"];
const EMPLOYMENT_STATUSES = ["Active", "Inactive"];

const yellowButton =
  "px-6 py-2.5 rounded-xl bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

function ReviewField({ label, value, inline = false }) {
  return inline ? (
    <p className="text-gray-500">
      {label}: <span className="font-bold text-gray-900">{value || "-"}</span>
    </p>
  ) : (
    <div>
      <p className="text-sm text-gray-500">{label}:</p>
      <p className="font-bold text-gray-900 break-words">{value || "-"}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-sm font-extrabold tracking-wide uppercase text-gray-900 mb-3">
      {children}
    </h3>
  );
}

export default function ConvertInternModal({ intern, onClose, onDone }) {
  const { data: departments = [] } = useFetch(departmentServices);
  const { data: allEmployees = [] } = useFetch(employeeServices);

  const [step, setStep] = useState("form"); // form | review | success
  const [form, setForm] = useState({
    employee_code: "",
    department_id: intern.department_id ? String(intern.department_id) : "",
    designation: "",
    employment_type: "Full-Time",
    joining_date: formatLocalDate(new Date()),
    reporting_employee_id: "",
    annual_salary: "",
    status: "Active",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [codeLoading, setCodeLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const set = (name, value) => {
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // State is only set after the request resolves, so this is safe to start
  // from an effect (codeLoading begins as true).
  const fetchCode = async () => {
    try {
      const defaults = await internServices.getConvertDefaults(intern.id);
      set("employee_code", defaults.employee_code);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Unable to generate an Employee ID.",
      );
    } finally {
      setCodeLoading(false);
    }
  };

  // The "regenerate" button.
  const loadCode = () => {
    setCodeLoading(true);
    return fetchCode();
  };

  useEffect(() => {
    // State is only set inside the promise callbacks (codeLoading starts true).
    internServices
      .getConvertDefaults(intern.id)
      .then((defaults) => set("employee_code", defaults.employee_code))
      .catch((err) =>
        setSubmitError(
          err.response?.data?.message || "Unable to generate an Employee ID.",
        ),
      )
      .finally(() => setCodeLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        label: department.department_name,
        value: String(department.id),
      })),
    [departments],
  );

  const managerOptions = useMemo(
    () =>
      allEmployees
        .filter(
          (employee) =>
            employee.id !== intern.employee_id && employee.role !== "Intern",
        )
        .map((employee) => ({
          label: `${employee.first_name} (${employee.employee_code})`,
          value: String(employee.id),
        })),
    [allEmployees, intern.employee_id],
  );

  const departmentName =
    departmentOptions.find((option) => option.value === form.department_id)
      ?.label || intern.department_name;

  const managerName = managerOptions
    .find((option) => option.value === form.reporting_employee_id)
    ?.label.replace(/\s*\(.*\)$/, "");

  const validate = () => {
    const next = {};

    if (!/^[A-Za-z]+\d+$/.test(form.employee_code.trim())) {
      next.employee_code = "Enter a valid Employee ID.";
    }
    if (!form.department_id) next.department_id = "Select a department.";
    if (!form.designation.trim()) next.designation = "Designation is required.";
    if (!form.joining_date) next.joining_date = "Select the joining date.";
    else if (form.joining_date < String(intern.start_date).slice(0, 10)) {
      next.joining_date = "Cannot be before the internship start date.";
    }
    if (!form.reporting_employee_id) {
      next.reporting_employee_id = "Select a reporting employee.";
    }
    if (!(Number(form.annual_salary) > 0)) {
      next.annual_salary = "Enter a salary greater than 0.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReview = () => {
    if (validate()) setStep("review");
  };

  const handleConfirm = async () => {
    setSaving(true);
    setSubmitError("");

    try {
      const data = await internServices.convert(intern.id, {
        ...form,
        employee_code: form.employee_code.trim(),
        designation: form.designation.trim(),
        annual_salary: Number(form.annual_salary),
      });

      setResult(data);
      setStep("success");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;

      if (apiErrors && Object.keys(apiErrors).length) {
        setErrors(apiErrors);
        setStep("form");
      }

      setSubmitError(
        err.response?.data?.message || "Unable to convert this intern.",
      );
      if (!apiErrors) setStep("review");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------- success ---------------------------- */

  if (step === "success") {
    return (
      <OutcomeModalShell
        icon={Briefcase}
        iconClassName="bg-yellow-400 text-gray-900"
        title="Convert to Employee"
        subtitle={`${intern.full_name} · ${departmentName || "-"}`}
        onClose={onDone}
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center">
            <CircleCheck size={48} className="text-emerald-500" />
          </div>

          <h3 className="text-2xl font-bold mt-5">Conversion Successful</h3>
          <p className="text-gray-500 mt-2">
            {intern.full_name} is now an employee. Payroll starts from{" "}
            {formatLongDate(result?.joining_date || form.joining_date)}.
          </p>

          <p className="text-gray-500 mt-2 text-sm">
            New login ID:{" "}
            <span className="font-semibold text-gray-900">
              {result?.employee_code}
            </span>
          </p>

          {result && !result.emailSent && (
            <div className="mt-4 w-full text-left">
              <InfoNotice tone="amber" title="Login email not sent">
                {result.emailError || "The email could not be sent."} Share
                these login details manually - ID{" "}
                <b>{result.employee_code}</b>, password{" "}
                <b>{result.password}</b>.
              </InfoNotice>
            </div>
          )}

          <button
            type="button"
            onClick={onDone}
            className="mt-6 px-14 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </OutcomeModalShell>
    );
  }

  /* ---------------------------- review ---------------------------- */

  if (step === "review") {
    return (
      <OutcomeModalShell
        icon={Briefcase}
        iconClassName="bg-yellow-400 text-gray-900"
        title="Convert to Employee"
        subtitle={`${intern.full_name} · ${departmentName || "-"}`}
        onClose={onClose}
        busy={saving}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setStep("form")}
              disabled={saving}
              className={cancelButtonClass}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className={yellowButton}
            >
              {saving ? "Converting..." : "Confirm & Convert"}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {submitError && <InfoNotice tone="red">{submitError}</InfoNotice>}

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
            <div className="flex items-center gap-2 font-bold text-lg">
              <TriangleAlert size={20} />
              Please review before conversion
            </div>
            <p className="text-sm leading-relaxed mt-1">
              This will create an employee record, move the intern to HR →
              Employees, mark the internship as converted, stop the intern
              stipend, and start payroll from the joining date.
            </p>
          </div>

          <div>
            <SectionTitle>Reused from intern</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <ReviewField label="Name" value={intern.full_name} />
              <ReviewField label="Email" value={intern.email} />
              <ReviewField label="Phone" value={intern.phone} />
              <ReviewField label="Department" value={departmentName} />
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <SectionTitle>New employee details</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <ReviewField inline label="Employee ID" value={form.employee_code} />
              <ReviewField inline label="Designation" value={form.designation} />
              <ReviewField inline label="Type" value={form.employment_type} />
              <ReviewField
                inline
                label="Joining"
                value={formatLongDate(form.joining_date)}
              />
              <ReviewField inline label="Reporting to" value={managerName} />
              <ReviewField
                inline
                label="Salary"
                value={`${formatRupees(form.annual_salary)}/yr`}
              />
              <ReviewField inline label="Status" value={form.status} />
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <SectionTitle>Post-conversion actions</SectionTitle>
            <ul className="space-y-3">
              {[
                "Internship marked as Converted",
                "Intern stipend stopped",
                `Payroll starts from ${formatLongDate(form.joining_date)}`,
                "All internship documents, tasks, submissions & certificates preserved",
              ].map((text) => (
                <li key={text} className="flex items-center gap-3 text-gray-700">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check size={14} className="text-emerald-600" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </OutcomeModalShell>
    );
  }

  /* ----------------------------- form ----------------------------- */

  return (
    <OutcomeModalShell
      icon={Briefcase}
      iconClassName="bg-yellow-400 text-gray-900"
      title="Convert to Employee"
      subtitle={`${intern.full_name} · ${departmentName || "-"}`}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={cancelButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReview}
            className="px-6 py-2.5 rounded-xl bg-yellow-200 text-amber-800 font-semibold hover:bg-yellow-300 cursor-pointer"
          >
            Review &amp; Confirm
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {submitError && <InfoNotice tone="red">{submitError}</InfoNotice>}

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
          <p>
            Reusing intern details: <b>{intern.full_name}</b>
            {intern.email && `, ${intern.email}`}
            {intern.phone && `, ${intern.phone}`}
          </p>
          <p className="text-sm mt-1">
            Only employee-specific fields are required below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="relative">
              <FormInput
                label="Employee ID *"
                name="employee_code"
                icon={Hash}
                value={form.employee_code}
                error={errors.employee_code}
                placeholder={codeLoading ? "Generating..." : "VSEMP01"}
                onChange={(event) => set("employee_code", event.target.value)}
              />
              <button
                type="button"
                onClick={loadCode}
                disabled={codeLoading}
                title="Generate a new Employee ID"
                aria-label="Generate a new Employee ID"
                className="absolute right-3 top-[3.05rem] -translate-y-1/2 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={codeLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          <CustomSelect
            label="Department *"
            options={departmentOptions}
            value={form.department_id}
            error={errors.department_id}
            placeholder="Select"
            onChange={(value) => set("department_id", value)}
          />

          <FormInput
            label="Designation *"
            name="designation"
            icon={Briefcase}
            placeholder="e.g. Software Engineer"
            value={form.designation}
            error={errors.designation}
            onChange={(event) => set("designation", event.target.value)}
          />

          <CustomSelect
            label="Employee Type *"
            options={EMPLOYEE_TYPES}
            value={form.employment_type}
            placeholder="Select"
            onChange={(value) => set("employment_type", value)}
          />

          <FormInput
            label="Joining Date *"
            name="joining_date"
            type="date"
            icon={CalendarDays}
            min={String(intern.start_date).slice(0, 10)}
            value={form.joining_date}
            error={errors.joining_date}
            onChange={(event) => set("joining_date", event.target.value)}
          />

          <CustomSelect
            label="Reporting Employee / POC *"
            options={managerOptions}
            value={form.reporting_employee_id}
            error={errors.reporting_employee_id}
            placeholder="Select reporting employee"
            onChange={(value) => set("reporting_employee_id", value)}
          />

          <FormInput
            label="Salary (₹/year) *"
            name="annual_salary"
            type="number"
            icon={IndianRupee}
            min={1}
            placeholder="0"
            value={form.annual_salary}
            error={errors.annual_salary}
            onChange={(event) => set("annual_salary", event.target.value)}
          />

          <CustomSelect
            label="Employment Status"
            options={EMPLOYMENT_STATUSES}
            value={form.status}
            placeholder="Select"
            onChange={(value) => set("status", value)}
          />
        </div>
      </div>
    </OutcomeModalShell>
  );
}