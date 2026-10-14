import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, CalendarDays, Check, X } from "lucide-react";

import CustomSelect from "../AddForm/Dropdown";
import employeeLeaveServices from "../../services/employeeLeaveServices";

const LEAVE_TYPES = ["Casual Leave", "Sick Leave", "Earned Leave"];

// Same rule the backend uses: inclusive calendar days between the two dates.
// Parsed from the yyyy-mm-dd string (UTC) so the browser timezone can't shift it.
function countDays(start, end) {
  if (!start || !end) return null;
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const diff = (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000;
  return diff < 0 ? null : diff + 1;
}

function DateField({ label, value, onChange, min }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  return (
    <div className="w-full">
      <label className="block mb-2 text-sm font-semibold text-slate-600">
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`intern-date w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-11 text-[15px] outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 ${
            value ? "text-slate-900" : "text-slate-400"
          }`}
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={openPicker}
          aria-label={`Pick ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 cursor-pointer"
        >
          <CalendarDays size={18} />
        </button>
      </div>
    </div>
  );
}

export default function InternApplyLeave({ onClose, reload }) {
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const days = countDays(startDate, endDate);
  const rangeInvalid = Boolean(startDate && endDate && days === null);

  const handleStartChange = (value) => {
    setStartDate(value);
    // keep the range valid if the new start is after the current end
    if (endDate && value && endDate < value) setEndDate(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    if (rangeInvalid) {
      setError("To Date cannot be before From Date.");
      return;
    }

    setLoading(true);
    try {
      await employeeLeaveServices.create({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        is_half_day: false,
        reason: reason.trim(),
      });

      await reload();
      onClose();
    } catch (err) {
      console.error("Create leave error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit leave request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* hides Chrome's own calendar icon; the custom icon above replaces it */}
      <style>{`
        .intern-date::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 44px; height: 100%; cursor: pointer; }
      `}</style>

      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-9 py-6">
          <h2 className="text-[28px] font-bold text-slate-900">
            Apply for Leave
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-9 py-7">
          <CustomSelect
            label="Leave Type"
            options={LEAVE_TYPES}
            value={leaveType}
            onChange={setLeaveType}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DateField
              label="From Date"
              value={startDate}
              onChange={handleStartChange}
            />
            <DateField
              label="To Date"
              value={endDate}
              min={startDate}
              onChange={setEndDate}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-600">
              Number of Days
            </p>
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-orange-600">
                <CalendarClock size={22} />
              </span>
              <span className="text-xl font-bold text-slate-900">
                {days === null ? "—" : days} day(s)
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="intern-leave-reason"
              className="block mb-2 text-sm font-semibold text-slate-600"
            >
              Reason
            </label>
            <textarea
              id="intern-leave-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for your leave..."
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {(error || rangeInvalid) && (
            <p className="text-sm text-red-500">
              {error || "To Date cannot be before From Date."}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check size={16} />
              {loading ? "Submitting..." : "Submit Leave"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}