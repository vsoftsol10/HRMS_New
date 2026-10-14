import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import { useState } from "react";
import { Paperclip, X } from "lucide-react";
import employeeLeaveServices from "../../services/employeeLeaveServices";
import Button from "../Button";
import { useDialog } from "../Dialogbox/DialogContext";


export default function Applyleave({ onClose, reload }) {
  const { alert } = useDialog();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leavetype: "",
    startdate: "",
    enddate: "",
    description: "",
    halfDay: false,
  });

  // FIX: the attachment input was commented out and never wired to any
  // state - kept separate from formData since a File object shouldn't
  // go through the same text-input handleChange path.
  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, matches backend limit
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    setAttachmentError("");

    if (!file) {
      setAttachment(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAttachmentError("Only JPG, PNG, WEBP, or PDF files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAttachmentError("File must be under 5MB.");
      e.target.value = "";
      return;
    }

    setAttachment(file);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !formData.leavetype ||
    !formData.startdate ||
    (!formData.halfDay && !formData.enddate) ||
    !formData.description
  ) {
    await alert({
      title: "Missing Details",
      message: "Please fill all required fields.",
      type: "error",
    });
    return;
  }

  const payload = {
    leave_type: formData.leavetype,
    start_date: formData.startdate,
    end_date: formData.halfDay ? formData.startdate : formData.enddate,
    is_half_day: formData.halfDay,
    reason: formData.description,
    attachment: attachment || undefined,
  };

  setLoading(true);
  try {
    await employeeLeaveServices.create(payload);

    // Refresh leave history and stats
    await reload();

    // Close modal
    onClose();
  } catch (error) {
    console.error("Create leave error:", error);

    await alert({
      title: "Error",
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit leave request.",
      type: "error",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="bg-white p-2 rounded-2xl w-full">
      <h3 className="text-2xl font-bold mb-2">Apply Leave</h3>

      <div className="grid gap-5">
        <CustomSelect
          label="Leave Type"
          options={["Casual Leave", "Sick Leave", "Earned Leave"]}
          value={formData.leavetype}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              leavetype: value,
            }))
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Start Date"
            type="date"
            name="startdate"
            value={formData.startdate}
            onChange={handleChange}
          />

          {!formData.halfDay && (
            <FormInput
              label="End Date"
              type="date"
              name="enddate"
              value={formData.enddate}
              onChange={handleChange}
            />
          )}
        </div>

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
          />

          <label htmlFor="halfDay">Apply for Half Day Leave</label>
        </div>

        <FormInput
          label="Reason"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Briefly describe the reason..."
        />

        <div>
          <label className="block font-medium mb-2">
            Attachment <span className="text-gray-500">(optional)</span>
          </label>

          {attachment ? (
            <div className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-300">
              <span className="flex items-center gap-2 text-sm text-gray-700 truncate">
                <Paperclip size={16} />
                {attachment.name}
              </span>

              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <input
              type="file"
              name="attachment"
              accept="image/*,application/pdf"
              onChange={handleAttachmentChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-400
                 hover:border-yellow-300 focus:outline-none
                 focus:ring-2 focus:ring-yellow-400"
            />
          )}

          {attachmentError && (
            <p className="mt-1 text-sm text-red-500">{attachmentError}</p>
          )}

          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG, WEBP, or PDF — up to 5MB.
          </p>
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

        <Button type="submit" loading={loading} loadingText="Creating...">
          Create
        </Button>
      </div>
    </form>
  );
}