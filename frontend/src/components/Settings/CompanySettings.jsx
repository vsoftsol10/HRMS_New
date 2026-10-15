import { useState } from "react";
import { Upload, Image, Building2, BriefcaseBusiness, Trash2 } from "lucide-react";
import { useDialog } from "../Dialogbox/DialogContext";
import FormInput from "../AddForm/FormInput";

import useFetch from "../../hooks/useFetch";
import companySettingsServices from "../../services/companySettingsServices";
import Button from "../Button";

export default function CompanySettings() {

  const { alert } = useDialog();

  const { data, reload } = useFetch(companySettingsServices);
  console.log(data);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

const handleSave = async () => {
  const nextErrors = {};
  if (!company.company_name.trim()) nextErrors.company_name = "This field is required";
  if (!company.company_email.trim()) nextErrors.company_email = "This field is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.company_email)) nextErrors.company_email = "Enter a valid email address";
  if (company.phone_number && !/^\d{10}$/.test(company.phone_number)) nextErrors.phone_number = "Enter a valid 10-digit phone number";
  if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

  setLoading(true);
  try {
    // eslint-disable-next-line no-unused-vars -- `id` is stripped on purpose
    const { id, ...companyData } = company;

    await companySettingsServices.save(companyData);

    reload();
    setIsEditing(false);

    await alert({
      title: "Success",
      message: "Company settings have been updated successfully.",
      type: "success",
    });
  } catch (error) {
    await alert({
      title: "Error",
      message:
        error.response?.data?.message || "Failed to update company settings.",
      type: "error",
    });

    console.log(error);
  } finally {
    setLoading(false);
  }
};

  const initialCompany = {
    company_name: "",
    company_email: "",
    phone_number: "",
    gst_number: "",
    company_address: "",
    company_logo: "",
  };

  const [company, setCompany] = useState(initialCompany);
  const [errors, setErrors] = useState({});

  // Copy freshly fetched data into the editable form (adjusting state
  // during render instead of in an effect).
  const [syncedData, setSyncedData] = useState(data);

  if (data !== syncedData) {
    setSyncedData(data);

    if (data) {
      setCompany({
        ...initialCompany,
        ...data,
      });
    }
  }
  const [logo, setLogo] = useState(null);

  const handleCancel = () => {
    setCompany({ ...initialCompany, ...(data || {}) });
    setErrors({});
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setCompany({
      ...company,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const preview = URL.createObjectURL(file);

    setLogo(preview);

    setCompany((prev) => ({
      ...prev,
      company_logo: preview,
    }));

    // Clear the input so the same file can be picked again after removing it
    e.target.value = "";
  };

  const handleLogoRemove = () => {
    if (logo && logo.startsWith("blob:")) {
      URL.revokeObjectURL(logo);
    }

    setLogo(null);

    setCompany((prev) => ({
      ...prev,
      company_logo: "",
    }));
  };
  return (
    <div className="bg-gray-100 min-h-screen p-2">
      <div className="grid grid-cols-12 gap-5">
        {/* LEFT LOGO CARD */}
        <div className="col-span-4 bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <Image size={20} className="text-yellow-500" />

            <h2 className="text-xl font-semibold">Company Logo</h2>
          </div>

          <div
            className="
            h-52 border border-dashed rounded-xl
            flex flex-col items-center justify-center
            text-gray-400 mb-5
            "
          >
            {logo ? (
              <img
                src={logo}
                alt="Company Logo"
                className="h-full w-full object-contain rounded-xl"
              />
            ) : (
              <>
                <Image size={40} />

                <p className="mt-3">No logo uploaded</p>
              </>
            )}
          </div>

          {isEditing && (
          <label
            className="
            w-full flex items-center justify-center gap-3
            border border-gray-400 rounded-xl py-3
            cursor-pointer
            hover:bg-gray-300
            "
          >
            <Upload size={18} />

            <span className="font-semibold">Upload Logo</span>

            <input
              type="file"
              hidden
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoUpload}
            />
          </label>
          )}

          {isEditing && logo && (
            <button
              type="button"
              onClick={handleLogoRemove}
              className="
              w-full flex items-center justify-center gap-3 mt-3
              border border-red-300 text-red-600 rounded-xl py-3
              cursor-pointer
              hover:bg-red-50
              "
            >
              <Trash2 size={18} />

              <span className="font-semibold">Remove Logo</span>
            </button>
          )}

          <p className="text-sm text-gray-500 mt-4">
            PNG, JPG or SVG. Recommended 400×400px.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-8 space-y-5">
          {/* BASIC INFORMATION */}

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <Building2 size={20} className="text-yellow-500" />

              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <FormInput
                  label="Company Name *"
                  name="company_name"
                  value={company.company_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  error={errors.company_name}
                />
              </div>

              <FormInput
                label="Company Email *"
                name="company_email"
                value={company.company_email}
                onChange={handleChange}
                disabled={!isEditing}
                error={errors.company_email}
              />

              <FormInput
                label="Phone Number"
                name="phone_number"
                value={company.phone_number}
                onChange={handleChange}
                disabled={!isEditing}
                error={errors.phone_number}
              />
            </div>
          </div>

          {/* BUSINESS INFORMATION */}

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <BriefcaseBusiness size={20} className="text-yellow-500" />

              <h2 className="text-xl font-semibold">Business Information</h2>
            </div>

            <div className="space-y-5">
              <FormInput
                label="GST Number"
                name="gst_number"
                value={company.gst_number}
                onChange={handleChange}
                disabled={!isEditing}
              />

              <div>
                <label className="block font-medium mb-2">
                  Company Address
                </label>

                <textarea
                  name="company_address"
                  value={company.company_address}
                  onChange={handleChange}
                  rows={3}
                  disabled={!isEditing}
                  readOnly={!isEditing}
                  className="
                  w-full border border-gray-400 rounded-xl p-4 hover:border-yellow-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-yellow-400
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  "
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  loading={loading}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}