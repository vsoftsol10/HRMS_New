import { useState } from "react";
import { getPasswordError } from "../../../utils/passwordRule";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import employeeSettingsServices from "../../../services/employeeSettingsServices";
import { useDialog } from "../../Dialogbox/DialogContext";
import Button from "../../Button";

export default function ChangePassword() {
  const { alert } = useDialog();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({
    current: false,
    password: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!formData.currentPassword) nextErrors.currentPassword = "This field is required";
    if (!formData.newPassword) nextErrors.newPassword = "This field is required";
    else if (getPasswordError(formData.newPassword)) nextErrors.newPassword = getPasswordError(formData.newPassword);
    if (!formData.confirmPassword) nextErrors.confirmPassword = "This field is required";
    else if (formData.confirmPassword !== formData.newPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setLoading(true);
    try {
      await employeeSettingsServices.changePassword(formData);

      await alert({ title: "Password Updated", message: "Password updated successfully.", type: "success" });

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      await alert({ title: "Password Update Failed", message: err?.response?.data?.message || "Failed to update password.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-300 bg-white p-8">
      {/* Header */}

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-yellow-50">
          <KeyRound className="text-yellow-600" />
        </div>

        <div>
          <h2 className="text-2xl font-semibold">Change Password</h2>

          <p className="text-gray-500">Keep your account secure</p>
        </div>
      </div>

      <div className="space-y-6">
        <PasswordField
          label="Current Password"
          value={formData.currentPassword}
          onChange={(e) => {
            setErrors((prev) => ({ ...prev, currentPassword: "" }));
            setFormData({ ...formData, currentPassword: e.target.value });
          }}
          error={errors.currentPassword}
          show={show.current}
          toggle={() =>
            setShow({
              ...show,
              current: !show.current,
            })
          }
        />

        <PasswordField
          label="New Password"
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({
              ...formData,
              newPassword: e.target.value,
            })
          }
          error={errors.newPassword}
          show={show.password}
          toggle={() =>
            setShow({
              ...show,
              password: !show.password,
            })
          }
        />

        <PasswordField
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({
              ...formData,
              confirmPassword: e.target.value,
            })
          }
          error={errors.confirmPassword}
          show={show.confirm}
          toggle={() =>
            setShow({
              ...show,
              confirm: !show.confirm,
            })
          }
        />

        <Button
          onClick={handleSubmit}
          loading={loading}
          loadingText="Updating..."
          className="text-white px-8 py-4 font-semibold"
        >
          Update Password
        </Button>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, toggle, error }) {
  return (
    <div>
      <label className="block mb-2 font-semibold">{label}</label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={`w-full h-14 border ${error ? "border-red-500" : "border-gray-300"} rounded-xl px-4 outline-none focus:ring-2 focus:ring-yellow-400`}
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </div>
  );
}