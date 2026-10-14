import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

import Modal from "../Modal/Modal";
import FormInput from "../AddForm/FormInput";
import Button from "../Button";
import { useDialog } from "../Dialogbox/DialogContext";
import employeeInternServices from "../../services/employeeInternServices";
import { formatLocalDate } from "../../utils/dateUtils";

const textareaClass =
  "w-full border border-gray-400 rounded-lg px-3 py-3 outline-none shadow-sm focus:ring-2 focus:ring-yellow-400 hover:border-yellow-300";

// Employee portal: create a task for one or more of the employee's interns
// (one task row is created per selected intern).
//   interns:    [{ id, full_name }]  - the interns the employee may assign to
//   initialIds: ids ticked when the modal opens
export default function AssignTaskModal({
  interns,
  initialIds = [],
  onClose,
  onAssigned,
}) {
  const { alert } = useDialog();
  const today = formatLocalDate(new Date());

  const [form, setForm] = useState({ title: "", description: "", due_date: "" });
  const [selected, setSelected] = useState(initialIds);
  const [listOpen, setListOpen] = useState(initialIds.length === 0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleIntern = (id) => {
    setErrors((prev) => ({ ...prev, intern_ids: "" }));
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const allSelected = interns.length > 0 && selected.length === interns.length;

  const toggleAll = () => {
    setErrors((prev) => ({ ...prev, intern_ids: "" }));
    setSelected(allSelected ? [] : interns.map((intern) => intern.id));
  };

  const summary = () => {
    if (selected.length === 0) return "Select interns";
    if (selected.length === 1) {
      return interns.find((intern) => intern.id === selected[0])?.full_name;
    }

    return `${selected.length} interns selected`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Task title is required.";
    if (!form.due_date) nextErrors.due_date = "Due date is required.";
    else if (form.due_date < today) {
      nextErrors.due_date = "Due date cannot be in the past.";
    }
    if (selected.length === 0) {
      nextErrors.intern_ids = "Select at least one intern.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);

    try {
      const result = await employeeInternServices.assignTasks({
        title: form.title.trim(),
        description: form.description.trim(),
        due_date: form.due_date,
        intern_ids: selected,
      });

      await alert({
        title: "Task Assigned",
        message: `"${form.title.trim()}" was assigned to ${result.created} intern${
          result.created === 1 ? "" : "s"
        }.`,
        type: "success",
      });

      onAssigned?.();
      onClose();
    } catch (err) {
      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to assign the task.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit} noValidate className="w-full space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Assign task</h2>
            <p className="text-gray-500">Create a task for one or more interns.</p>
          </div>

          <button
            type="button"
            title="Close"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <FormInput
          label="Title *"
          name="title"
          placeholder="e.g., Create Attendance Screen"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          maxLength={150}
        />

        <div>
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            name="description"
            rows={4}
            maxLength={2000}
            placeholder="Describe the task..."
            value={form.description}
            onChange={handleChange}
            className={textareaClass}
          />
        </div>

        <FormInput
          label="Due date *"
          name="due_date"
          type="date"
          value={form.due_date}
          onChange={handleChange}
          error={errors.due_date}
          min={today}
        />

        <div>
          <label className="block mb-2 font-medium">Assign to *</label>

          <button
            type="button"
            aria-expanded={listOpen}
            onClick={() => setListOpen((open) => !open)}
            className={`w-full flex items-center justify-between rounded-lg border px-3 py-3 shadow-sm bg-white cursor-pointer hover:border-yellow-300 ${
              errors.intern_ids ? "border-red-500" : "border-gray-400"
            }`}
          >
            <span className={selected.length ? "" : "text-gray-400"}>
              {summary()}
            </span>
            <ChevronDown size={18} className="text-gray-500" />
          </button>

          {listOpen && (
            <ul className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-sm divide-y divide-gray-100">
              {interns.length > 1 && (
                <li>
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 font-medium">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-yellow-500"
                    />
                    Select all
                  </label>
                </li>
              )}

              {interns.map((intern) => (
                <li key={intern.id}>
                  <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selected.includes(intern.id)}
                      onChange={() => toggleIntern(intern.id)}
                      className="h-4 w-4 accent-yellow-500"
                    />
                    {intern.full_name}
                  </label>
                </li>
              ))}
            </ul>
          )}

          {errors.intern_ids && (
            <p className="text-sm text-red-500 mt-1">{errors.intern_ids}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>

          <Button type="submit" loading={saving} loadingText="Assigning...">
            + Assign task
          </Button>
        </div>
      </form>
    </Modal>
  );
}