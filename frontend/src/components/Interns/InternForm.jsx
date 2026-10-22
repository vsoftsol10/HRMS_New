import PageLoader from "../PageLoader.jsx";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Upload, X } from "lucide-react";

import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import Button from "../Button";
import useFetch from "../../hooks/useFetch";
import useCrud from "../../hooks/useCrud";
import internServices from "../../services/internServices";
import departmentServices from "../../services/departmentServices";
import employeeServices from "../../services/employeeServices";
import { useDialog } from "../Dialogbox/DialogContext";
import { formatLocalDate } from "../../utils/dateUtils";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPES,
  MAX_DOCUMENTS_PER_UPLOAD,
  formatFileSize,
  validateDocumentFile,
} from "../../utils/internUtils";

const NO_MENTOR = "__none__";
const OTHER_DOCUMENTS = "Other Documents";

const initialForm = {
  full_name: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  email: "",
  address: "",
  department_id: "",
  internship_fee: "",
  designation: "",
  internship_type: "Full-Time",
  start_date: "",
  end_date: "",
  // 0 = free (unpaid) internship: no Stipend module in the intern portal until
  // this is raised above 0 (Free -> Paid).
  monthly_stipend: "0",
  mentor_employee_id: "",
  status: "Active",
};

// Same rules as the backend (validateInternPayload) so most mistakes are
// caught before a request is sent; the backend still re-checks everything.
const validate = (form) => {
  const errors = {};

  const fullName = form.full_name.trim();
  if (!fullName) errors.full_name = "Full name is required.";
  else if (!/^[A-Za-z][A-Za-z .'-]{1,99}$/.test(fullName)) {
    errors.full_name = "Enter a valid full name.";
  }

  if (!form.gender) errors.gender = "Select a gender.";
  if (!form.date_of_birth) errors.date_of_birth = "Date of birth is required.";

  if (!/^\d{10}$/.test(form.phone)) {
    errors.phone = "Enter a valid 10-digit phone number.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.department_id) errors.department_id = "Select a department.";
  if (!form.designation.trim()) {
    errors.designation = "Designation / track is required.";
  }
  if (!form.internship_type) {
    errors.internship_type = "Select an internship type.";
  }

  if (!form.start_date) errors.start_date = "Joining date is required.";
  if (!form.end_date) errors.end_date = "End date is required.";
  else if (form.start_date && form.end_date < form.start_date) {
    errors.end_date = "End date cannot be before the joining date.";
  }

  if (form.monthly_stipend === "" || Number(form.monthly_stipend) < 0) {
    errors.monthly_stipend = "Enter the monthly stipend.";
  }

  if (form.internship_fee !== "" && Number(form.internship_fee) < 0) {
    errors.internship_fee = "Internship fee must be 0 or more.";
  }

  return errors;
};

// Best-effort default so HR doesn't have to pick the type for obvious names.
const guessDocumentType = (fileName) => {
  const name = fileName.toLowerCase();

  if (/aadhaar|aadhar/.test(name)) return "Aadhaar Card";
  if (/10th|tenth|sslc/.test(name)) return "10th Certificate";
  if (/12th|twelfth|hsc/.test(name)) return "12th Certificate";
  if (/degree|college|marksheet/.test(name)) return "Degree / College Certificate";
  if (/resume|\bcv\b/.test(name)) return "Resume";

  return OTHER_DOCUMENTS;
};

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-300 bg-white shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

const grid = "grid grid-cols-1 md:grid-cols-2 gap-5";

export default function InternForm({ internId }) {
  const isEdit = Boolean(internId);

  const navigate = useNavigate();
  const { alert } = useDialog();
  const fileInputRef = useRef(null);
  const documentKey = useRef(0);

  const { create, update, loading: saving } = useCrud(internServices);

  const { data: departments = [] } = useFetch(departmentServices);
  const { data: employees = [] } = useFetch(employeeServices);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [codes, setCodes] = useState({ intern_code: "", login_id: "" });
  const [documents, setDocuments] = useState([]);
  const [documentError, setDocumentError] = useState("");
  const [loadingIntern, setLoadingIntern] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lockedStatus, setLockedStatus] = useState("");

  const today = formatLocalDate(new Date());

  const departmentOptions = departments.map((department) => ({
    label: department.department_name,
    value: department.id,
  }));

  const mentorOptions = [
    { label: "No mentor", value: NO_MENTOR },
    ...employees.map((employee) => ({
      label: `${employee.first_name} (${employee.employee_code})`,
      value: employee.id,
    })),
  ];

  // Add: fetch the next Intern ID / Login ID. Edit: load the intern.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingIntern(true);
      setLoadError("");

      try {
        if (isEdit) {
          const intern = await internServices.getById(internId);
          if (cancelled) return;

          if (intern.status === "Converted") {
            setLoadError(
              "This intern has been converted to an employee. Edit them from Employees instead.",
            );
            return;
          }

          setCodes({ intern_code: intern.intern_code, login_id: intern.login_id });
          setLockedStatus(
            ["Completed", "Converted"].includes(intern.status)
              ? intern.status
              : "",
          );
          setForm({
            full_name: intern.full_name || "",
            gender: intern.gender || "",
            date_of_birth: intern.date_of_birth || "",
            phone: intern.phone || "",
            email: intern.email || "",
            address: intern.address || "",
            department_id: intern.department_id || "",
            internship_fee:
              intern.internship_fee === null ? "" : String(intern.internship_fee),
            designation: intern.designation || "",
            internship_type: intern.internship_type || "Full-Time",
            start_date: intern.start_date || "",
            end_date: intern.end_date || "",
            monthly_stipend: String(intern.monthly_stipend ?? ""),
            mentor_employee_id: intern.mentor_employee_id || "",
            status: intern.status,
          });
        } else {
          const next = await internServices.getNextCodes();
          if (!cancelled) setCodes(next);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err.response?.data?.message ||
              "Unable to load the form. Please go back and try again.",
          );
        }
      } finally {
        if (!cancelled) setLoadingIntern(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [internId, isEdit]);

  const clearError = (name) => setErrors((prev) => ({ ...prev, [name]: "" }));

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone" && (!/^\d*$/.test(value) || value.length > 10)) return;

    if (
      (name === "monthly_stipend" || name === "internship_fee") &&
      !/^\d*\.?\d{0,2}$/.test(value)
    ) {
      return;
    }

    clearError(name);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name, value) => {
    clearError(name);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ------------------------------ documents ----------------------------- */

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    if (documents.length + files.length > MAX_DOCUMENTS_PER_UPLOAD) {
      setDocumentError(
        `You can attach at most ${MAX_DOCUMENTS_PER_UPLOAD} documents here.`,
      );
      return;
    }

    for (const file of files) {
      const problem = validateDocumentFile(file);
      if (problem) {
        setDocumentError(problem);
        return;
      }
    }

    setDocumentError("");
    setDocuments((prev) => [
      ...prev,
      ...files.map((file) => ({
        key: ++documentKey.current,
        file,
        doc_type: guessDocumentType(file.name),
      })),
    ]);
  };

  const changeDocumentType = (key, docType) => {
    setDocumentError("");
    setDocuments((prev) =>
      prev.map((doc) => (doc.key === key ? { ...doc, doc_type: docType } : doc)),
    );
  };

  const removeDocument = (key) => {
    setDocumentError("");
    setDocuments((prev) => prev.filter((doc) => doc.key !== key));
  };

  /* ------------------------------- submit ------------------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate(form);

    // Every type except "Other Documents" keeps a single file.
    const singleTypes = documents
      .map((doc) => doc.doc_type)
      .filter((type) => type !== OTHER_DOCUMENTS);
    const hasDuplicateType = singleTypes.length !== new Set(singleTypes).size;

    if (hasDuplicateType) {
      setDocumentError(
        'Only one file can be kept per document type. Choose "Other Documents" for extra files.',
      );
    }

    if (Object.keys(nextErrors).length || hasDuplicateType) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      designation: form.designation.trim(),
      address: form.address.trim(),
      mentor_employee_id: form.mentor_employee_id || "",
    };

    try {
      if (isEdit) {
        await update(internId, payload);

        await alert({
          title: "Success",
          message: "Intern updated successfully.",
          type: "success",
        });

        navigate(`/admin/interns/${internId}`);
        return;
      }

      const result = await create({ ...payload, documents });

      const notes = [];

      if (result.emailSent) {
        notes.push(
          `Login credentials have been emailed to ${payload.email}.`,
        );
      } else {
        // The backend only returns the password when the email could not be
        // delivered, so HR can hand it over securely.
        notes.push(
          `The login email could not be sent (${result.emailError || "unknown error"}). Share these details with the intern securely: Login ID ${result.login_id}, temporary password ${result.temporaryPassword}.`,
        );
      }

      if (result.documentErrors?.length) {
        notes.push(
          `These documents could not be uploaded: ${result.documentErrors.join(", ")}. Add them again from the Documents tab.`,
        );
      }

      await alert({
        title: result.emailSent && !result.documentErrors?.length
          ? "Intern Created Successfully"
          : "Intern Created",
        message: `${payload.full_name} was added as ${result.intern_code}. ${notes.join(" ")}`,
        type: result.emailSent && !result.documentErrors?.length ? "success" : "info",
      });

      navigate("/admin/interns");
    } catch (err) {
      const data = err.response?.data;

      if (data?.errors) setErrors((prev) => ({ ...prev, ...data.errors }));

      await alert({
        title: "Error",
        message: data?.message || "Something went wrong.",
        type: "error",
      });
    }
  };

  /* -------------------------------- render ------------------------------ */

  if (loadingIntern) {
    return <PageLoader />;
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-gray-300 bg-white p-6 space-y-4">
        <p className="text-red-600">{loadError}</p>
        <Link
          to="/admin/interns"
          className="inline-flex items-center gap-2 text-gray-700 underline"
        >
          <ArrowLeft size={16} /> Back to Interns List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <Link
          to={isEdit ? `/admin/interns/${internId}` : "/admin/interns"}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} />
          {isEdit ? "Back to Intern" : "Back to Interns List"}
        </Link>

        <h1 className="text-3xl font-bold mt-3">
          {isEdit ? "Edit Intern" : "Add New Intern"}
        </h1>
        <p className="text-gray-500 mt-2">
          {isEdit
            ? "Update the intern's details."
            : "Fill in the details to register a new intern in the system."}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Section title="Personal Information">
          <div className={grid}>
            <FormInput
              label="Intern ID"
              name="intern_code"
              value={codes.intern_code}
              onChange={() => {}}
              disabled
            />
            <FormInput
              label="Full Name *"
              name="full_name"
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={handleChange}
              error={errors.full_name}
              maxLength={100}
            />
            <CustomSelect
              label="Gender *"
              options={["Male", "Female", "Other"]}
              value={form.gender}
              placeholder="Select Gender"
              error={errors.gender}
              onChange={(value) => handleSelect("gender", value)}
            />
            <FormInput
              label="Date of Birth *"
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleChange}
              error={errors.date_of_birth}
              max={today}
            />
            <FormInput
              label="Phone Number *"
              name="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
              maxLength={10}
            />
            <FormInput
              label="Email Address *"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <div className="md:col-span-2">
              <FormInput
                label="Residential Address"
                name="address"
                placeholder="Street, City, State, ZIP Code"
                value={form.address}
                onChange={handleChange}
                required={false}
              />
            </div>
          </div>
        </Section>

        <Section title="Internship Details">
          <div className={grid}>
            <CustomSelect
              label="Department *"
              options={departmentOptions}
              value={form.department_id}
              placeholder="Select Department"
              error={errors.department_id}
              onChange={(value) => handleSelect("department_id", value)}
            />
            <FormInput
              label="Internship Fee / Rate (Optional)"
              name="internship_fee"
              type="text"
              placeholder="e.g. 5000"
              value={form.internship_fee}
              onChange={handleChange}
              error={errors.internship_fee}
              required={false}
            />
            <FormInput
              label="Designation / Track *"
              name="designation"
              placeholder="e.g. Frontend Engineer Intern"
              value={form.designation}
              onChange={handleChange}
              error={errors.designation}
            />
            <CustomSelect
              label="Internship Type *"
              options={["Full-Time", "Part-Time"]}
              value={form.internship_type}
              placeholder="Select type"
              error={errors.internship_type}
              onChange={(value) => handleSelect("internship_type", value)}
            />
            <FormInput
              label="Joining Date *"
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              error={errors.start_date}
            />
            <FormInput
              label="End Date *"
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={handleChange}
              error={errors.end_date}
              min={form.start_date || undefined}
            />
            <FormInput
              label="Monthly Stipend (₹) *"
              name="monthly_stipend"
              type="text"
              placeholder="0 = free internship, e.g. 15000"
              value={form.monthly_stipend}
              onChange={handleChange}
              error={errors.monthly_stipend}
            />
            <CustomSelect
              label="Supervisor / Mentor"
              options={mentorOptions}
              value={form.mentor_employee_id}
              placeholder="Select Mentor"
              onChange={(value) =>
                handleSelect(
                  "mentor_employee_id",
                  value === NO_MENTOR ? "" : value,
                )
              }
            />
          </div>
        </Section>

        <Section title="Account Details">
          <div className={grid}>
            <FormInput
              label="Login ID"
              name="login_id"
              value={codes.login_id}
              onChange={() => {}}
              disabled
            />
            {isEdit ? (
              <FormInput
                label="Role"
                name="role"
                value="Intern"
                onChange={() => {}}
                disabled
              />
            ) : (
              <FormInput
                label="Temporary Password"
                name="temporary_password"
                value="Generated automatically and emailed"
                onChange={() => {}}
                disabled
              />
            )}
            {!isEdit && (
              <FormInput
                label="Role"
                name="role"
                value="Intern"
                onChange={() => {}}
                disabled
              />
            )}
            {lockedStatus ? (
              <FormInput
                label="Status"
                name="status"
                value={lockedStatus}
                onChange={() => {}}
                disabled
              />
            ) : (
              <CustomSelect
                label="Status *"
                options={["Active", "Inactive"]}
                value={form.status}
                placeholder="Select status"
                onChange={(value) => handleSelect("status", value)}
              />
            )}
          </div>
        </Section>

        {!isEdit && (
          <Section title="Documents & Attachments">
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-gray-500">
                Upload signed contract, resume, and ID proof. Max 5 MB each.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-400 bg-yellow-50 hover:bg-yellow-100 cursor-pointer"
              >
                <Upload size={16} />
                Upload Document
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={DOCUMENT_ACCEPT}
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                // Allow choosing the same file again after removing it.
                event.target.value = "";
              }}
            />

            {documents.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  addFiles(event.dataTransfer.files);
                }}
                className="border-2 border-dashed border-gray-300 rounded-xl py-10 text-center cursor-pointer hover:border-yellow-400"
              >
                <FileText className="mx-auto text-gray-400" />
                <p className="font-semibold mt-2">No files uploaded yet</p>
                <p className="text-sm text-gray-500">
                  Drag and drop files here, or click to browse (PDF, JPG, PNG,
                  WEBP, DOC, DOCX)
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li
                    key={doc.key}
                    className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-gray-300 p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="shrink-0 text-gray-500" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(doc.file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-72">
                      <CustomSelect
                        options={DOCUMENT_TYPES}
                        value={doc.doc_type}
                        placeholder="Document type"
                        onChange={(value) => changeDocumentType(doc.key, value)}
                      />
                    </div>

                    <button
                      type="button"
                      title="Remove file"
                      onClick={() => removeDocument(doc.key)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer self-end md:self-auto"
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {documentError && (
              <p className="text-sm text-red-500 mt-3">{documentError}</p>
            )}
          </Section>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              navigate(isEdit ? `/admin/interns/${internId}` : "/admin/interns")
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={saving}
            loadingText={isEdit ? "Saving..." : "Creating..."}
          >
            {isEdit ? "Save Changes" : "Create Intern"}
          </Button>
        </div>
      </form>
    </div>
  );
}