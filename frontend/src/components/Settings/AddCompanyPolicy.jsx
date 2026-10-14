import { useState } from "react";
import FormInput from "../AddForm/FormInput";
import companyPolicyServices from "../../services/companyPolicyServices";
import { useDialog } from "../Dialogbox/DialogContext";
import Button from "../Button";

export default function AddCompanyPolicy({ policy, reload, onClose }) {
  const { alert } = useDialog();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: policy?.title || "",
    description: policy?.description || "",
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
    if (!formData.title.trim()) nextErrors.title = "This field is required";
    if (!formData.description.trim()) nextErrors.description = "This field is required";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
      };

      if (policy) {
        await companyPolicyServices.update(policy.id, payload);

        await alert({
          title: "Success",
          message: "Policy updated successfully.",
          type: "success",
        });
      } else {
        await companyPolicyServices.create(payload);

        await alert({
          title: "Success",
          message: "Policy added successfully.",
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
        {policy ? "Edit Policy" : "Add Policy"}
      </h2>

      <div className="space-y-6">
        <FormInput
          label="Policy Title"
          name="title"
          placeholder="Working Hours"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
        />

        <div>
          <label className="block mb-2 font-medium">Description</label>

          <textarea
            name="description"
            rows="4"
            placeholder="Policy description..."
            value={formData.description}
            onChange={handleChange}
            required
            className={`w-full border ${errors.description ? "border-red-500" : "border-gray-300"} rounded-lg px-3 py-3 resize-none outline-none focus:ring-2 focus:ring-yellow-400`}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
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
          loadingText={policy ? "Updating..." : "Saving..."}
        >
          {policy ? "Update Policy" : "Save Policy"}
        </Button>
      </div>
    </form>
  );
}