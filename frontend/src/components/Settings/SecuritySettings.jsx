import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDialog } from "../Dialogbox/DialogContext";
import securityServices from "../../services/securityServices";
import Button from "../Button";
import { getPasswordError } from "../../utils/passwordRule";

export default function SecuritySettings() {

  const { alert } = useDialog();
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleChange = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

const handleUpdatePassword = async () => {
  const nextErrors = {};
  if (!passwords.current) nextErrors.current = "This field is required";
  if (!passwords.new) nextErrors.new = "This field is required";
  else if (getPasswordError(passwords.new)) nextErrors.new = getPasswordError(passwords.new);
  if (!passwords.confirm) nextErrors.confirm = "This field is required";
  else if (passwords.new !== passwords.confirm) nextErrors.confirm = "Passwords do not match";
  if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

  setLoading(true);
  try {
   await securityServices.changePassword({
     currentPassword: passwords.current,
     newPassword: passwords.new,
     confirmPassword: passwords.confirm,
   });

    await alert({
      title: "Success",
      message: "Password updated successfully.",
      type: "success",
    });

    setPasswords({
      current: "",
      new: "",
      confirm: "",
    });
  } catch (error) {
      console.log("FULL ERROR:", error);
      console.log("SERVER RESPONSE:", error.response?.data);
    await alert({
      title: "Error",
      message: error.response?.data?.message || "Failed to update password.",
      type: "error",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
      <h2 className="text-2xl font-semibold mb-10">Change Password</h2>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="relative">
          <label className="font-medium">Current Password</label>

          <input
            name="current"
            value={passwords.current}
            onChange={handleChange}
            type={showPassword.current ? "text" : "password"}
            className={`
      w-full mt-2 px-4 py-3 pr-12
      rounded-xl border ${errors.current ? "border-red-500" : "border-gray-400"}
      hover:border-yellow-300
      focus:outline-none
      focus:ring-2
      focus:ring-yellow-400
    `}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((prev) => ({
                ...prev,
                current: !prev.current,
              }))
            }
            className="absolute right-4 top-[50px] text-gray-500"
          >
            {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {errors.current && <p className="text-sm text-red-500 mt-1">{errors.current}</p>}
        </div>

        <div className="relative">
          <label className="font-medium">New Password</label>

          <input
            name="new"
            value={passwords.new}
            onChange={handleChange}
            type={showPassword.new ? "text" : "password"}
            className={`w-full mt-2 px-4 py-3 pr-12 rounded-xl border ${errors.new ? "border-red-500" : "border-gray-400"}`}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((prev) => ({
                ...prev,
                new: !prev.new,
              }))
            }
            className="absolute right-4 top-[50px] text-gray-500"
          >
            {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {errors.new && <p className="text-sm text-red-500 mt-1">{errors.new}</p>}
        </div>
        <div className="relative">
          <label className="font-medium">Confirm Password</label>

          <input
            name="confirm"
            value={passwords.confirm}
            onChange={handleChange}
            type={showPassword.confirm ? "text" : "password"}
            className={`w-full mt-2 px-4 py-3 pr-12 rounded-xl border ${errors.confirm ? "border-red-500" : "border-gray-400"}`}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((prev) => ({
                ...prev,
                confirm: !prev.confirm,
              }))
            }
            className="absolute right-4 top-[50px] text-gray-500"
          >
            {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {errors.confirm && <p className="text-sm text-red-500 mt-1">{errors.confirm}</p>}
        </div>
      </div>

      <div className="flex justify-end mt-10">
        <Button
          onClick={handleUpdatePassword}
          loading={loading}
          loadingText="Updating..."
        >
          Update Password
        </Button>
      </div>
    </div>
  );
}