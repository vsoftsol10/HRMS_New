import { useState } from "react";
import FormInput from "../AddForm/FormInput";
import holidayServices from "../../services/holidayServices";
import CustomSelect from "../AddForm/Dropdown";
import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function AddHoliday({ holiday, reload, onClose }) {

    const { alert } = useDialog();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    holidayName: holiday?.holiday || "",
    date: holiday ? new Date(holiday.date).toISOString().split("T")[0] : "",
    type: holiday?.type || "",
    description: holiday?.description || "",
  });

  const handleChange = (e) => {
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const nextErrors = {};
  if (!formData.holidayName.trim()) nextErrors.holidayName = "This field is required";
  if (!formData.date) nextErrors.date = "This field is required";
  if (!formData.type) nextErrors.type = "This field is required";
  if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

  setLoading(true);
  try {
    const payload = {
      holiday_name: formData.holidayName,
      holiday_date: formData.date,
      type: formData.type,
      description: formData.description,
    };

    if (holiday) {
      await holidayServices.update(holiday.id, payload);

      await alert({
        title: "Success",
        message: "Holiday updated successfully.",
        type: "success",
      });
    } else {
      await holidayServices.create(payload);

      await alert({
        title: "Success",
        message: "Holiday added successfully.",
        type: "success",
      });
    }

    reload();
    onClose();
  } catch (error) {
    console.error(error);

    await alert({
      title: "Error",
      message: error.response?.data?.message || "Something went wrong.",
      type: "error",
    });
  } finally {
    setLoading(false);
  }
};
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-2 w-full max-w-2xl"
    >
      <h2 className="text-2xl font-bold mb-2">
        {holiday ? "Edit Holiday" : "Add Holiday"}
      </h2>

      <div className="space-y-6">
        <FormInput
          label="Holiday Name"
          name="holidayName"
          placeholder="Republic Day"
          value={formData.holidayName}
          onChange={handleChange}
          error={errors.holidayName}
        />

        <FormInput
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          error={errors.date}
        />

        {/* Holiday Type */}
        <CustomSelect
          label="Type"
          placeholder="Select Type"
          options={["National", "Festival", "Religious", "Company", "Optional"]}
          value={formData.type}
          onChange={(value) => { setErrors((prev) => ({ ...prev, type: "" })); setFormData((prev) => ({ ...prev, type: value })); }}
          error={errors.type}
        />

        {/* Description */}
        <div>
          <label className="block mb-2 font-medium">Description</label>

          <textarea
            name="description"
            rows="4"
            placeholder="Holiday description..."
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 resize-none outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={loading}
          loadingText={holiday ? "Updating..." : "Saving..."}
        >
          {holiday ? "Update Holiday" : "Save Holiday"}
        </Button>
      </div>
    </form>
  );
}