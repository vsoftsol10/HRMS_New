import { useState } from "react";
import { CalendarDays, IndianRupee, TriangleAlert } from "lucide-react";

import OutcomeModalShell, { cancelButtonClass } from "./OutcomeModalShell";
import { formatLongDate } from "../../utils/outcomeFormat";
import FormInput from "../AddForm/FormInput";
import { useDialog } from "../Dialogbox/DialogContext";
import internServices from "../../services/internServices";

// "2026-09-30" -> day after, as YYYY-MM-DD (UTC maths: no DST surprises)
const dayAfter = (value) => {
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
};

const monthStartOf = (value) => `${String(value).slice(0, 7)}-01`;

const nextMonthStart = (monthStart) => {
  const [y, m] = monthStart.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

const monthOptionLabel = (monthStart) => {
  const [y, m] = monthStart.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

export default function ExtendInternModal({ intern, onClose, onDone }) {
  const { alert } = useDialog();

  const [newEndDate, setNewEndDate] = useState("");
  const [stipend, setStipend] = useState(String(intern.monthly_stipend ?? ""));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const minDate = dayAfter(intern.end_date);

  // Free (Rs.0) internship that becomes paid on extension: HR picks the month
  // the stipend starts, so the earlier free months stay Rs.0. Defaults to the
  // month after the current end date.
  const [stipendStartChoice, setStipendStartChoice] = useState("");
  const isFreeToPaid =
    Number(intern.monthly_stipend) === 0 &&
    stipend !== "" &&
    Number(stipend) > 0;

  const oldEndMonth = monthStartOf(intern.end_date);
  const defaultStipendStart = nextMonthStart(oldEndMonth);
  const lastStartOption = newEndDate
    ? monthStartOf(newEndDate)
    : defaultStipendStart;

  const stipendStartOptions = [];
  for (
    let month = oldEndMonth;
    month <= lastStartOption;
    month = nextMonthStart(month)
  ) {
    stipendStartOptions.push(month);
  }

  const stipendStart = stipendStartOptions.includes(stipendStartChoice)
    ? stipendStartChoice
    : stipendStartOptions.includes(defaultStipendStart)
      ? defaultStipendStart
      : stipendStartOptions[stipendStartOptions.length - 1];

  const validate = () => {
    const next = {};

    if (!newEndDate) next.new_end_date = "Select the new end date.";
    else if (newEndDate < minDate) {
      next.new_end_date = "New end date must be after the current end date.";
    }

    if (stipend === "" || Number.isNaN(Number(stipend)) || Number(stipend) < 0) {
      next.monthly_stipend = "Enter a valid stipend amount.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleExtend = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      await internServices.extend(intern.id, {
        new_end_date: newEndDate,
        monthly_stipend: Number(stipend),
        ...(isFreeToPaid ? { stipend_start_month: stipendStart } : {}),
      });
      onDone();
    } catch (err) {
      await alert({
        title: "Error",
        message:
          err.response?.data?.message || "Unable to extend this internship.",
        type: "error",
      });
      setSaving(false);
    }
  };

  return (
    <OutcomeModalShell
      icon={CalendarDays}
      iconClassName="bg-blue-50 text-blue-600"
      title="Extend Internship"
      subtitle={intern.full_name}
      onClose={onClose}
      busy={saving}
      maxWidth="max-w-lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={cancelButtonClass}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExtend}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 cursor-pointer disabled:opacity-60"
          >
            {saving ? "Extending..." : "Extend Internship"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
          <div className="flex items-center gap-2 font-bold text-lg">
            <TriangleAlert size={20} />
            Extend this internship?
          </div>
          <p className="text-sm leading-relaxed mt-1">
            The intern&apos;s end date will be updated and status set back to
            Active. The intern will reappear in Active counts.
          </p>
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-800">
            Current End Date
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-gray-900">
            <CalendarDays size={18} className="text-gray-500" />
            {formatLongDate(intern.end_date)}
          </div>
        </div>

        <FormInput
          label="New End Date *"
          name="new_end_date"
          type="date"
          icon={CalendarDays}
          min={minDate}
          value={newEndDate}
          error={errors.new_end_date}
          onChange={(event) => {
            setNewEndDate(event.target.value);
            setErrors((prev) => ({ ...prev, new_end_date: "" }));
          }}
        />

        <FormInput
          label="Stipend *"
          name="monthly_stipend"
          type="number"
          icon={IndianRupee}
          min={0}
          value={stipend}
          error={errors.monthly_stipend}
          onChange={(event) => {
            setStipend(event.target.value);
            setErrors((prev) => ({ ...prev, monthly_stipend: "" }));
          }}
        />

        {isFreeToPaid && (
          <div>
            <label className="block mb-2 font-medium">
              Stipend Starts From *
            </label>
            <select
              value={stipendStart}
              onChange={(event) => setStipendStartChoice(event.target.value)}
              className="w-full border border-gray-400 rounded-lg px-3 py-3 outline-none shadow-sm bg-white focus:ring-2 focus:ring-yellow-400 hover:border-yellow-300 cursor-pointer"
            >
              {stipendStartOptions.map((month) => (
                <option key={month} value={month}>
                  {monthOptionLabel(month)}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Months before this stay free (₹0); the stipend is payable from
              this month onward.
            </p>
          </div>
        )}
      </div>
    </OutcomeModalShell>
  );
}