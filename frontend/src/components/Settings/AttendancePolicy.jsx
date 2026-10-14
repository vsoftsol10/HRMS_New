import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import attendancePolicyServices from "../../services/attendancePolicyServices";
import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function AttendancePolicy() {
  const { alert } = useDialog();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [policy, setPolicy] = useState({
    office_start_time: "",
    office_end_time: "",
    grace_period: "",
    half_day_cutoff_time: "",
    working_hours: "",
    weekly_off_days: "",
  });

  const { data, reload } = useFetch(attendancePolicyServices);

  // Copy freshly fetched data into the editable form (adjusting state
  // during render instead of in an effect).
  const [syncedData, setSyncedData] = useState(data);

  if (data !== syncedData) {
    setSyncedData(data);

    if (data) setPolicy(data);
  }

  const handleSave = async () => {
    const nextErrors = {};
    ["office_start_time", "office_end_time", "half_day_cutoff_time", "weekly_off_days"].forEach((name) => { if (!String(policy[name] || "").trim()) nextErrors[name] = "This field is required"; });
    ["grace_period", "working_hours"].forEach((name) => { if (!String(policy[name] || "").trim()) nextErrors[name] = "This field is required"; else if (Number(policy[name]) <= 0) nextErrors[name] = "Enter a positive number"; });
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setLoading(true);
    try {
      console.log(policy);

      await attendancePolicyServices.save(policy);

      await alert({
        title: "Success",
        message: "Attendance policy updated successfully.",
        type: "success",
      });

      reload();
    } catch (error) {
      await alert({
        title: "Error",
        message: error.message,
        type: "error",
      });

      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyChange = (name, value) => {
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setPolicy((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold mb-6">Attendance Policy</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Office Start Time */}
        <div>
          <label className="font-medium">Office Start Time</label>

          <input
            type="time"
            value={policy.office_start_time || ""}
            onChange={(e) => handlePolicyChange("office_start_time", e.target.value)}
            className={`w-full mt-2 px-4 py-3 rounded-xl border ${errors.office_start_time ? "border-red-500" : "border-gray-400"} hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
          />
          {errors.office_start_time && <p className="text-sm text-red-500 mt-1">{errors.office_start_time}</p>}
        </div>

        {/* Office End Time */}
        <div>
          <label className="font-medium">Office End Time</label>

          <input
            type="time"
            value={policy.office_end_time || ""}
            onChange={(e) => handlePolicyChange("office_end_time", e.target.value)}
            className={`w-full mt-2 px-4 py-3 rounded-xl border ${errors.office_end_time ? "border-red-500" : "border-gray-400"} hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
          />
          {errors.office_end_time && <p className="text-sm text-red-500 mt-1">{errors.office_end_time}</p>}
        </div>

        {/* Grace Period */}
        <div>
          <label className="font-medium">Grace Period (minutes)</label>

          <input
            type="number"
            value={policy.grace_period || ""}
            onChange={(e) => handlePolicyChange("grace_period", e.target.value)}
            className={`w-full mt-2 px-4 py-3 rounded-xl border ${errors.grace_period ? "border-red-500" : "border-gray-400"} hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
          />
          {errors.grace_period && <p className="text-sm text-red-500 mt-1">{errors.grace_period}</p>}
        </div>

        {/* Half-Day Cutoff Time */}
        <div>
          <label className="font-medium">Half-Day Cutoff Time</label>

          <input
            type="time"
            value={policy.half_day_cutoff_time || ""}
            onChange={(e) => handlePolicyChange("half_day_cutoff_time", e.target.value)}
            className={`w-full mt-2 px-4 py-3 rounded-xl border ${errors.half_day_cutoff_time ? "border-red-500" : "border-gray-400"} hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
          />
          {errors.half_day_cutoff_time && <p className="text-sm text-red-500 mt-1">{errors.half_day_cutoff_time}</p>}
        </div>

        {/* Working Hours */}
        <div>
          <label className="font-medium">Working Hours per Day</label>

          <input
            type="number"
            step="0.5"
            value={policy.working_hours || ""}
            onChange={(e) => handlePolicyChange("working_hours", e.target.value)}
            className={`w-full mt-2 px-4 py-3 rounded-xl border ${errors.working_hours ? "border-red-500" : "border-gray-400"} hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
          />
          {errors.working_hours && <p className="text-sm text-red-500 mt-1">{errors.working_hours}</p>}
        </div>

        {/* Weekly Off Days */}
        <div>
          <label className="font-medium">Weekly Off Days</label>

          <input
            value={policy.weekly_off_days || ""}
            onChange={(e) => handlePolicyChange("weekly_off_days", e.target.value)}
            placeholder="e.g. Saturday, Sunday"
            className={`w-full mt-2 px-4 py-3 rounded-xl border ${errors.weekly_off_days ? "border-red-500" : "border-gray-400"} hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
          />
          {errors.weekly_off_days && <p className="text-sm text-red-500 mt-1">{errors.weekly_off_days}</p>}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} loading={loading} loadingText="Saving...">
          Save Policy
        </Button>
      </div>
    </div>
  );
}