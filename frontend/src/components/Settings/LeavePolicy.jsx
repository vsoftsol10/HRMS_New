import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import leavePolicyServices from "../../services/leavePolicyServices";
import FormInput from "../AddForm/FormInput";
import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function LeavePolicy() {

  const { alert } = useDialog();

    const [policy, setPolicy] = useState({
      casual_leave: "",
      sick_leave: "",
      earned_leave: "",
    });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { data, reload } = useFetch(leavePolicyServices);

// Copy freshly fetched data into the editable form (adjusting state during
// render instead of in an effect).
const [syncedData, setSyncedData] = useState(data);

if (data !== syncedData) {
  setSyncedData(data);

  if (data) {
    setPolicy((prev) => ({
      ...prev,
      ...data,
    }));
  }
}



const handleSave = async () => {
  const nextErrors = {};
  ["casual_leave", "sick_leave", "earned_leave"].forEach((name) => {
    if (!String(policy[name] ?? "").trim()) nextErrors[name] = "This field is required";
    else if (!/^\d+$/.test(String(policy[name]).trim())) nextErrors[name] = "Enter a whole number";
    else if (Number(policy[name]) < 0) nextErrors[name] = "Cannot be negative";
  });
  if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

  setLoading(true);
  try {
    await leavePolicyServices.save(policy);

    await alert({
      title: "Success",
      message: "Leave Policy Updated Successfully.",
      type: "success",
    });

    reload();
  } catch (error) {
    console.log(error);

    await alert({
      title: "Error",
      message:
        error.response?.data?.message || "Failed to update leave policy.",
      type: "error",
    });
  } finally {
    setLoading(false);
  }
};

const handleChange = (e) => {
  setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  setPolicy({
    ...policy,
    [e.target.name]: e.target.value,
  });
};

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold mb-6">Leave Policy</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <FormInput
          label="Casual Leave (per year)"
          name="casual_leave"
          value={policy.casual_leave}
          onChange={handleChange}
          error={errors.casual_leave}
        />

        <FormInput
          label="Sick Leave (per year)"
          name="sick_leave"
          value={policy.sick_leave}
          onChange={handleChange}
          error={errors.sick_leave}
        />

        <FormInput
          label="Earned Leave (per year)"
          name="earned_leave"
          value={policy.earned_leave}
          onChange={handleChange}
          error={errors.earned_leave}
        />

      </div>

      <div className="flex justify-end ">
        <Button onClick={handleSave} loading={loading} loadingText="Saving...">
          Save Policy
        </Button>
      </div>
    </div>
  );
}