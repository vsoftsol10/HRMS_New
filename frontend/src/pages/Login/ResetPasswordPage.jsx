import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ResetPassword } from "../../services/authServices";
import { LockKeyhole, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import Button from "../../components/Button";
import { getPasswordError } from "../../utils/passwordRule";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nextErrors = {};
    if (!newPassword) nextErrors.newPassword = "This field is required";
    else if (getPasswordError(newPassword)) nextErrors.newPassword = getPasswordError(newPassword);
    if (!confirmPassword) nextErrors.confirmPassword = "This field is required";
    else if (newPassword !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (Object.keys(nextErrors).length) { setFieldErrors(nextErrors); return; }

    try {
      setLoading(true);

      await ResetPassword(token, newPassword, confirmPassword);

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* LEFT PANEL - same brand panel as LoginPage for visual consistency */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-yellow-300/20 blur-3xl"></div>
          <div className="absolute -top-32 left-1/2 w-[400px] h-[400px] rounded-full border border-yellow-200"></div>
          <div className="absolute -top-32 left-1/3 w-[350px] h-[350px] rounded-full border border-yellow-200"></div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4 mt-2">
            <h1 className="text-4xl font-bold">
              <span className="text-yellow-500">V</span>Soft
            </h1>
          </div>

          <h2 className="text-2xl font-bold leading-tight">
            Set a <span className="text-yellow-500">New Password</span>
          </h2>

          <p className="text-gray-500 mt-4 max-w-lg text-lg">
            Choose a strong new password for your HRMS account.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 justify-center items-center p-8">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              <span className="text-yellow-500">V</span>Soft
            </h1>

            <h2 className="mt-6 text-4xl font-bold">Reset Password</h2>

            <p className="mt-3 text-gray-500">
              {success
                ? "Your password has been updated."
                : "Enter your new password below"}
            </p>
          </div>

          {!token ? (
            <div className="mt-10 flex flex-col items-center gap-4 text-center">
              <p className="text-red-500">
                This reset link is invalid or incomplete. Please request a
                new one.
              </p>

              <button
                onClick={() => navigate("/forgot-password")}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition duration-200"
              >
                Request New Link
              </button>
            </div>
          ) : success ? (
            <div className="mt-10 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-green-50">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>

              <p className="text-gray-600">
                You can now sign in with your new password.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition duration-200"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block mb-2 font-medium text-gray-700"
                >
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setFieldErrors((prev) => ({ ...prev, newPassword: "" })); setNewPassword(e.target.value); }}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    className={`w-full border ${fieldErrors.newPassword ? "border-red-500" : "border-gray-300"} rounded-xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.newPassword && <p className="text-sm text-red-500 mt-1">{fieldErrors.newPassword}</p>}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 font-medium text-gray-700"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setFieldErrors((prev) => ({ ...prev, confirmPassword: "" })); setConfirmPassword(e.target.value); }}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    className={`w-full border ${fieldErrors.newPassword ? "border-red-500" : "border-gray-300"} rounded-xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400`}
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-sm text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                loading={loading}
                loadingText="Updating..."
                className="w-full text-white py-3 font-semibold"
              >
                Reset Password
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}