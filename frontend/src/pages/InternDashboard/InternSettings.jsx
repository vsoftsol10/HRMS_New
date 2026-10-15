import PageLoader from "../../components/PageLoader.jsx";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Award,
  Folder,
  Phone,
  KeyRound,
  FileText,
  Image as ImageIcon,
  Download,
  Upload as UploadIcon,
  Trash2,
  X,
  Camera,
  Loader2,
  Mail,
  Calendar,
  Users,
  MapPin,
  Pencil,
} from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import PageHeader from "../../components/PageHeader";
import SettingsSidebar from "../../components/EmployeeComponents/EmployeeSettings/SettingsSidebar";
import ChangePassword from "../../components/EmployeeComponents/EmployeeSettings/ChangePassword";
import FormInput from "../../components/AddForm/FormInput";
import Button from "../../components/Button";
import Modal from "../../components/Modal/Modal";
import CustomSelect from "../../components/AddForm/Dropdown";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import internPortalServices from "../../services/internPortalServices";
import { formatLocalDate } from "../../utils/dateUtils";
import profileServices, {
  PROFILE_PHOTO_MAX_MB,
  PROFILE_PHOTO_TYPES,
  notifyProfileUpdated,
} from "../../services/profileServices";
import {
  formatDate,
  formatFileSize,
  getInitials,
  DOCUMENT_TYPES,
  DOCUMENT_ACCEPT,
  validateDocumentFile,
} from "../../utils/internUtils";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-medium mt-1">{value || "-"}</p>
    </div>
  );
}

function Card({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description && <p className="text-gray-500 mt-1 mb-6">{description}</p>}
      {!description && <div className="mb-6" />}
      {children}
    </div>
  );
}

function ProfileOverview({ profile }) {
  const { alert, confirm } = useDialog();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // The photo lives on the shared /api/profile endpoint (same one the
  // Employee/HR profile page uses), so no intern-specific backend is needed.
  const loadPhoto = () =>
    profileServices
      .getAll()
      .then((data) => setPhotoUrl(data.profile_image_url || null))
      .catch(() => setPhotoUrl(null));

  useEffect(() => {
    loadPhoto();
  }, []);

  // Close the camera menu when clicking anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [menuOpen]);

  const handlePhotoChosen = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;

    if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
      await alert({ title: "Unsupported file", message: "Please choose a JPG, PNG or WEBP image.", type: "error" });
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_MB * 1024 * 1024) {
      await alert({
        title: "Image too large",
        message: `Please choose an image smaller than ${PROFILE_PHOTO_MAX_MB} MB.`,
        type: "error",
      });
      return;
    }

    try {
      setPhotoBusy(true);
      await profileServices.uploadPhoto(file);
      await loadPhoto();
      notifyProfileUpdated(); // refreshes the header avatar too
    } catch (err) {
      await alert({
        title: "Photo upload failed",
        message: err.response?.data?.message || "Unable to upload your photo. Please try again.",
        type: "error",
      });
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoRemove = async () => {
    setMenuOpen(false);

    const isConfirmed = await confirm({
      title: "Remove profile photo?",
      message: "Your photo will be deleted and your initials will be shown instead.",
    });
    if (!isConfirmed) return;

    try {
      setPhotoBusy(true);
      await profileServices.removePhoto();
      await loadPhoto();
      notifyProfileUpdated();
    } catch (err) {
      await alert({
        title: "Couldn't remove photo",
        message: err.response?.data?.message || "Please try again.",
        type: "error",
      });
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-8">
      <h2 className="text-2xl font-semibold text-gray-900">Profile Overview</h2>
      <p className="text-gray-500 mt-1 mb-6">Your photo and quick profile summary</p>

      <div className="flex items-center gap-8 flex-wrap">
        <div className="relative shrink-0" ref={menuRef}>
          <div className="h-28 w-28 rounded-full border-2 border-emerald-500 p-1">
            <div className="relative h-full w-full rounded-full overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full bg-yellow-400 text-gray-900 text-4xl font-semibold flex items-center justify-center">
                  {getInitials(profile.full_name)}
                </span>
              )}

              {photoBusy && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-gray-700" />
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            disabled={photoBusy}
            aria-label="Change profile photo"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
          >
            <Camera size={16} />
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-full mt-2 z-10 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UploadIcon size={15} />
                {photoUrl ? "Change photo" : "Upload photo"}
              </button>

              {photoUrl && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Remove photo
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={PROFILE_PHOTO_TYPES.join(",")}
            onChange={handlePhotoChosen}
            className="hidden"
          />
        </div>

        <div className="min-w-0">
          <p className="text-3xl font-semibold text-gray-900">{profile.full_name}</p>
          <p className="text-lg text-gray-500 mt-1">{profile.designation}</p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-base text-gray-500">
            <span className="flex items-center gap-1.5">
              <Mail size={16} />
              {profile.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Award size={16} />
              {profile.department_name}
            </span>
            <span className="flex items-center gap-1.5">
              <User size={16} />
              {profile.intern_code}
            </span>
          </div>

          <span className="inline-flex items-center gap-2 mt-4 px-3.5 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-600" />
            {profile.display_status}
          </span>
        </div>
      </div>
    </div>
  );
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <span className="h-12 w-12 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
        <Icon size={20} />
      </span>

      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900 break-words mt-0.5">{value || "-"}</p>
      </div>
    </div>
  );
}

function PersonalInformation({ profile, onSaved }) {
  const { alert } = useDialog();

  const buildForm = () => ({
    full_name: profile.full_name || "",
    date_of_birth: profile.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : "",
    gender: profile.gender || "",
    phone: profile.phone || "",
    email: profile.email || "",
    address: profile.address || "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(buildForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setForm(buildForm());
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrors({});
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone" && (!/^\d*$/.test(value) || value.length > 10)) return;

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Same rules the server applies (and the HR-side intern form uses).
  const validate = () => {
    const next = {};
    const name = form.full_name.trim();

    if (!name) next.full_name = "Full name is required.";
    else if (!/^[A-Za-z][A-Za-z .'-]{1,99}$/.test(name)) next.full_name = "Enter a valid full name.";

    if (!GENDER_OPTIONS.includes(form.gender)) next.gender = "Select a gender.";

    if (!form.date_of_birth) next.date_of_birth = "Enter a valid date of birth.";
    else if (form.date_of_birth > formatLocalDate(new Date()) || form.date_of_birth < "1940-01-01") {
      next.date_of_birth = "Date of birth is not valid.";
    }

    if (!/^\d{10}$/.test(form.phone)) next.phone = "Enter a valid 10-digit phone number.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";

    if (form.address.length > 255) next.address = "Address must be 255 characters or fewer.";

    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);

    try {
      await internPortalServices.updatePersonalInfo({
        ...form,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });

      onSaved();
      notifyProfileUpdated();
      setIsEditing(false);

      await alert({ title: "Saved", message: "Personal information updated successfully.", type: "success" });
    } catch (err) {
      // Show field-level messages from the server when it sends them.
      if (err.response?.data?.errors) setErrors(err.response.data.errors);

      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to save personal information.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
          <p className="text-gray-500 mt-1">Your personal details</p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2.5 text-base font-semibold text-gray-900 hover:bg-yellow-300"
          >
            <Pencil size={16} />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormInput label="Full Name *" name="full_name" value={form.full_name} onChange={handleChange} error={errors.full_name} maxLength={100} />

          <FormInput
            label="Date of Birth *"
            name="date_of_birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            error={errors.date_of_birth}
            min="1940-01-01"
            max={formatLocalDate(new Date())}
          />

          <div>
            <label className="block mb-2 font-medium">Gender *</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={`w-full border rounded-lg ${errors.gender ? "border-red-500" : "border-gray-400"} px-3 py-3 bg-white outline-none shadow-sm focus:ring-2 focus:ring-yellow-400 hover:border-yellow-300`}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
          </div>

          <FormInput label="Phone *" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} maxLength={10} />

          <FormInput label="Email *" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} maxLength={150} />

          <FormInput label="Address" name="address" value={form.address} onChange={handleChange} error={errors.address} required={false} maxLength={255} />

          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" loading={saving} loadingText="Saving...">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={cancelEditing} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <InfoItem icon={User} label="Full Name" value={profile.full_name} />
          <InfoItem icon={Calendar} label="Date of Birth" value={profile.date_of_birth && formatDate(profile.date_of_birth)} />
          <InfoItem icon={Users} label="Gender" value={profile.gender} />
          <InfoItem icon={Phone} label="Phone" value={profile.phone} />
          <InfoItem icon={Mail} label="Email" value={profile.email} />
          <InfoItem icon={MapPin} label="Address" value={profile.address} />
        </div>
      )}
    </div>
  );
}

function InternshipDetails({ profile }) {
  return (
    <Card title="Internship Details" description="Your role and employment information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Intern ID" value={profile.intern_code} />
        <Field label="Department" value={profile.department_name} />
        <Field label="Position" value={profile.designation} />
        <Field label="Monthly Stipend" value={profile.monthly_stipend != null ? `₹${Number(profile.monthly_stipend).toLocaleString("en-IN")}` : "-"} />
        <Field label="Start Date" value={formatDate(profile.start_date)} />
        <Field label="End Date" value={formatDate(profile.end_date)} />
        <Field label="Mentor" value={profile.mentor_name} />
      </div>
    </Card>
  );
}

function EmergencyContact({ profile, onSaved }) {
  const { alert } = useDialog();

  const buildForm = () => ({
    name: profile.emergency_contact_name || "",
    relation: profile.emergency_contact_relation || "",
    phone: profile.emergency_contact_phone || "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(buildForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setForm(buildForm());
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrors({});
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone" && (!/^\d*$/.test(value) || value.length > 10)) return;

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Contact name is required.";
    if (!form.relation.trim()) nextErrors.relation = "Relation is required.";
    if (!/^\d{10}$/.test(form.phone)) nextErrors.phone = "Enter a valid 10-digit phone number.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);

    try {
      await internPortalServices.updateEmergencyContact({
        name: form.name.trim(),
        relation: form.relation.trim(),
        phone: form.phone,
      });

      onSaved();
      setIsEditing(false);

      await alert({ title: "Saved", message: "Emergency contact updated successfully.", type: "success" });
    } catch (err) {
      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to save emergency contact.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    // flex: none -> the card keeps its own height instead of stretching to the sidebar's
    <div className="rounded-2xl border border-gray-300 bg-white p-6" style={{ flex: "none" }}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Emergency Contact</h2>
          <p className="text-sm text-gray-400 mt-0.5">Who to contact in case of emergency</p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-300 cursor-pointer"
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormInput label="Contact Name *" name="name" value={form.name} onChange={handleChange} error={errors.name} maxLength={100} />
          <FormInput label="Relationship *" name="relation" value={form.relation} onChange={handleChange} error={errors.relation} maxLength={100} />
          <FormInput label="Phone *" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} maxLength={10} />

          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" loading={saving} loadingText="Saving...">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={cancelEditing} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          <EmergencyItem icon={User} label="Contact Name" value={profile.emergency_contact_name} />
          <EmergencyItem icon={Users} label="Relationship" value={profile.emergency_contact_relation} />
          <EmergencyItem icon={Phone} label="Phone" value={formatEmergencyPhone(profile.emergency_contact_phone)} />
        </div>
      )}
    </div>
  );
}

// 9876543210 -> +91 98765 43210 (numbers are stored as 10 plain digits)
const formatEmergencyPhone = (phone) => {
  const digits = String(phone || "");
  return /^\d{10}$/.test(digits) ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
};

function EmergencyItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-10 w-10 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
        <Icon size={17} />
      </span>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-base font-semibold text-gray-900 break-words">{value || "-"}</p>
      </div>
    </div>
  );
}

const fileTypeLabel = (mimeType = "") => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/webp") return "WEBP";
  if (mimeType.includes("word")) return "DOC";

  return "FILE";
};

function DocumentIcon({ mimeType }) {
  const isImage = (mimeType || "").startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  const tone = isPdf
    ? "bg-red-100 text-red-500"
    : isImage
      ? "bg-sky-100 text-sky-500"
      : "bg-gray-100 text-gray-500";
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
      <Icon size={18} />
    </span>
  );
}

function Documents() {
  const { alert, confirm } = useDialog();
  const [documents, setDocuments] = useState(null);
  const [busy, setBusy] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const loadDocuments = () => {
    internPortalServices
      .getDocuments()
      .then(setDocuments)
      .catch(() => setDocuments([]));
  };

  useEffect(loadDocuments, []);

  const showError = (err, fallback) =>
    alert({
      title: "Error",
      message: err?.response?.data?.message || fallback,
      type: "error",
    });

  const openUpload = () => {
    setDocType(DOCUMENT_TYPES[0]);
    setFile(null);
    setShowUpload(true);
  };

  const closeUpload = () => {
    if (busy === "upload") return;
    setShowUpload(false);
    setFile(null);
  };

  const handleFileChosen = async (event) => {
    const chosen = event.target.files?.[0];
    // Allow choosing the same file again later.
    event.target.value = "";
    if (!chosen) return;

    const problem = validateDocumentFile(chosen);
    if (problem) {
      setFile(null);
      await alert({ title: "Cannot Upload", message: problem, type: "error" });
      return;
    }

    setFile(chosen);
  };

  const handleUpload = async () => {
    if (!file || !docType) return;

    setBusy("upload");

    try {
      await internPortalServices.uploadDocument(file, docType);
      setShowUpload(false);
      setFile(null);
      loadDocuments();
    } catch (err) {
      await showError(err, "Unable to upload the document.");
    } finally {
      setBusy("");
    }
  };

  const openDocument = async (doc, download) => {
    setBusy(`${download ? "download" : "view"}-${doc.id}`);

    const newTab = download ? null : window.open("", "_blank");

    try {
      const url = await internPortalServices.getDocumentUrl(doc.id, { download });

      if (download) {
        window.location.assign(url);
      } else if (newTab) {
        newTab.opener = null;
        newTab.location.href = url;
      }
    } catch (err) {
      newTab?.close();
      await showError(err, "Unable to open the document.");
    } finally {
      setBusy("");
    }
  };

  const handleDelete = async (doc) => {
    const isConfirmed = await confirm({
      title: "Delete Document",
      message: `Delete "${doc.file_name}"? This cannot be undone.`,
    });

    if (!isConfirmed) return;

    setBusy(`delete-${doc.id}`);

    try {
      await internPortalServices.removeDocument(doc.id);
      loadDocuments();
    } catch (err) {
      await showError(err, "Unable to delete the document.");
    } finally {
      setBusy("");
    }
  };

  // Every type except "Other Documents" keeps a single file - uploading again replaces it.
  const willReplace =
    docType !== "Other Documents" &&
    (documents || []).some((doc) => doc.doc_type === docType);

  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Documents</h2>
          <p className="text-gray-500 mt-1">Keep your internship documents in one place.</p>
        </div>

        <button
          type="button"
          onClick={openUpload}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition cursor-pointer"
        >
          <UploadIcon size={16} />
          Upload Document
        </button>
      </div>

      {documents === null && <PageLoader className="min-h-[30vh]" />}

      {documents && documents.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
          No documents uploaded yet.
        </p>
      )}

      {documents && documents.length > 0 && (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3"
            >
              <DocumentIcon mimeType={doc.mime_type} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    title="View"
                    onClick={() => openDocument(doc, false)}
                    disabled={busy === `view-${doc.id}`}
                    className="truncate text-left font-semibold text-gray-900 hover:underline cursor-pointer disabled:opacity-60"
                  >
                    {doc.file_name}
                  </button>
                  {doc.doc_type && (
                    <span className="hidden sm:inline-block shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {doc.doc_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {fileTypeLabel(doc.mime_type)} • {formatFileSize(doc.file_size)} • Uploaded{" "}
                  {formatDate(doc.created_at)}
                </p>
              </div>

              <button
                type="button"
                title="Download"
                onClick={() => openDocument(doc, true)}
                disabled={busy === `download-${doc.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={15} />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => handleDelete(doc)}
                disabled={busy === `delete-${doc.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showUpload && (
        <Modal onClose={closeUpload}>
          <div className="w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Upload Document</h3>
              <button
                type="button"
                onClick={closeUpload}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <CustomSelect
              label="Document Type"
              options={DOCUMENT_TYPES}
              value={docType}
              onChange={setDocType}
            />

            <div>
              <label className="block mb-2 font-medium text-gray-800">File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="hidden"
                onChange={handleFileChosen}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-400 px-4 py-3 text-left hover:border-amber-400 cursor-pointer"
              >
                <UploadIcon size={18} className="shrink-0 text-gray-500" />
                <span className={`truncate text-sm ${file ? "text-gray-900" : "text-gray-500"}`}>
                  {file ? file.name : "Choose a file"}
                </span>
              </button>
              <p className="mt-1 text-xs text-gray-500">
                PDF, JPG, PNG, WEBP, DOC or DOCX - up to 5 MB.
              </p>
              {willReplace && (
                <p className="mt-2 text-xs text-amber-700">
                  You already have a {docType}. Uploading will replace it.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeUpload}
                disabled={busy === "upload"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file}
                loading={busy === "upload"}
                loadingText="Uploading..."
              >
                Upload
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function InternSettings() {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const loadProfile = () => {
    internPortalServices
      .getProfile()
      .then(setProfile)
      .catch((err) => setError(err.response?.data?.message || "Unable to load your profile."));
  };

  useEffect(loadProfile, []);

  const menuItems = [
    { key: "overview", label: "Profile Overview", icon: User },
    { key: "personal", label: "Personal Information", icon: User },
    { key: "internship", label: "Internship Details", icon: Award },
    { key: "emergency", label: "Emergency Contact", icon: Phone },
    { key: "password", label: "Change Password", icon: KeyRound },
    { key: "documents", label: "Documents", icon: Folder },
  ];

  const renderContent = () => {
    if (error) return <p className="text-red-600">{error}</p>;
    if (!profile) return <PageLoader />;

    switch (activeTab) {
      case "overview":
        return <ProfileOverview profile={profile} />;
      case "personal":
        return <PersonalInformation profile={profile} onSaved={loadProfile} />;
      case "internship":
        return <InternshipDetails profile={profile} />;
      case "emergency":
        return <EmergencyContact profile={profile} onSaved={loadProfile} />;
      case "password":
        return <ChangePassword />;
      case "documents":
        return <Documents />;
      default:
        return null;
    }
  };

  return (
    <MainLayout title="Settings">
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your account preferences." />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 flex flex-col [&>div]:flex-1">
            <SettingsSidebar items={menuItems} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className="xl:col-span-9 flex flex-col [&>div]:flex-1">{renderContent()}</div>
        </div>
      </div>
    </MainLayout>
  );
}