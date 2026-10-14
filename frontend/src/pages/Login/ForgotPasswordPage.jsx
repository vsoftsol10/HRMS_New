import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ForgotPassword } from "../../services/authServices";
import { BadgeCheck, MailCheck, ArrowLeft } from "lucide-react";
import Button from "../../components/Button";

export default function ForgotPasswordPage() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const nextErrors = {};
    if (!employeeCode) nextErrors.employeeCode = "This field is required";
    else if (/\s/.test(employeeCode)) nextErrors.employeeCode = "Employee code cannot contain spaces";
    if (Object.keys(nextErrors).length) { setFieldErrors(nextErrors); return; }

    try {
      setLoading(true);

      await ForgotPassword(employeeCode);

      // Backend always returns the same generic message whether or not the
      // employee code exists, so the UI just shows the "check your email"
      // state - it never reveals which employee codes are valid.
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
            Account <span className="text-yellow-500">Recovery</span>
          </h2>

          <p className="text-gray-500 mt-4 max-w-lg text-lg">
            Enter your employee code and we'll send a password reset link to
            your registered email address.
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

            <h2 className="mt-6 text-4xl font-bold">Forgot Password?</h2>

            <p className="mt-3 text-gray-500">
              {submitted
                ? "Check your email for the reset link."
                : "Enter your employee code to reset your password"}
            </p>
          </div>

          {submitted ? (
            <div className="mt-10 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-yellow-50">
                <MailCheck className="w-10 h-10 text-yellow-500" />
              </div>

              <p className="text-gray-600">
                If an account with this employee code exists, a password
                reset link has been sent to the registered email. The link
                is valid for 1 hour.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition duration-200"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
              <div>
                <label
                  htmlFor="employeeCode"
                  className="block mb-2 font-medium text-gray-700"
                >
                  Employee Code
                </label>

                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <input
                    id="employeeCode"
                    type="text"
                    value={employeeCode}
                    onChange={(e) => { setFieldErrors((prev) => ({ ...prev, employeeCode: "" })); setEmployeeCode(e.target.value.toUpperCase()); }}
                    placeholder="Enter Employee Code"
                    required
                    className={`w-full border ${fieldErrors.employeeCode ? "border-red-500" : "border-gray-300"} rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400`}
                  />
                </div>
              </div>
              {fieldErrors.employeeCode && <p className="text-sm text-red-500 mt-1">{fieldErrors.employeeCode}</p>}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                loading={loading}
                loadingText="Sending..."
                className="w-full text-white py-3 font-semibold"
              >
                Send Reset Link
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