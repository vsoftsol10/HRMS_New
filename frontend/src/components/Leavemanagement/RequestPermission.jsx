import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import { useState } from "react";
import employeePermissionServices from "../../services/employeePermissionServices";
import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function RequestPermission({ onClose, reload }) {
  const { alert } = useDialog();

 const [errors, setErrors] = useState({});
 const [submitting, setSubmitting] = useState(false);

 const [formData, setFormData] = useState({
   permissionType: "",
   date: "",
   startTime: "",
   endTime: "",
   reason: "",
   attachment: "",
   halfDay: false,
 });

  const handleChange = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!formData.permissionType) nextErrors.permissionType = "This field is required";
    if (!formData.date) nextErrors.date = "This field is required";
    if (!formData.halfDay && !formData.startTime) nextErrors.startTime = "This field is required";
    if (!formData.halfDay && !formData.endTime) nextErrors.endTime = "This field is required";
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) nextErrors.endTime = "End time must be after start time";
    if (!formData.reason.trim()) nextErrors.reason = "This field is required";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    const payload = {
      permission_type: formData.permissionType,
      permission_date: formData.date,
      start_time: formData.halfDay ? null : formData.startTime,
      end_time: formData.halfDay ? null : formData.endTime,
      is_half_day: formData.halfDay,
      reason: formData.reason,
    };

    setSubmitting(true);

    try {
      await employeePermissionServices.create(payload);

      if (reload) await reload();

      onClose();
    } catch (error) {
      console.error("Create permission request error:", error);

      await alert({
        title: "Permission Request Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to submit permission request.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold mb-5">Request Permission</h3>

      <div className="grid gap-5">
        <CustomSelect
          label="Permission Type"
          options={["Half Day", "Late Arrival", "Early Leave", "Medical", "Personal"]}
          value={formData.permissionType}
          onChange={(value) => { setErrors((prev) => ({ ...prev, permissionType: "" })); setFormData({ ...formData, permissionType: value }); }}
          error={errors.permissionType}
        />

        <FormInput
          label="Date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          error={errors.date}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="halfDay"
            checked={formData.halfDay}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                halfDay: e.target.checked,
              }))
            }
            className="h-4 w-4 cursor-pointer"
          />

          <label
            htmlFor="halfDay"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Request Half Day
          </label>
        </div>

        {!formData.halfDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Start Time"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              error={errors.startTime}
            />

            <FormInput
              label="End Time"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              error={errors.endTime}
            />
          </div>
        )}

        <FormInput
          label="Reason"
          name="reason"
          placeholder="Briefly describe the reason..."
          value={formData.reason}
          onChange={handleChange}
          error={errors.reason}
        />

        <FormInput
          label="Attachment (optional)"
          name="attachment"
          placeholder="Upload supporting document"
          value={formData.attachment}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end gap-3 mt-8 ">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          loading={submitting}
          loadingText="Submitting..."
        >
          Submit
        </Button>
      </div>
    </div>
  );
}