import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useDialog } from "../Dialogbox/DialogContext";

export default function DateRangePicker({
  fromDate,
  toDate,
  onChange,
  placeholder = "Select Date Range",
}) {
  const { alert } = useDialog();
  const [open, setOpen] = useState(false);

  const [tempFromDate, setTempFromDate] = useState(fromDate);
  const [tempToDate, setTempToDate] = useState(toDate);

  const wrapperRef = useRef(null);

  // Re-sync the draft values when the applied range changes (adjusting
  // state during render instead of in an effect).
  const [syncedRange, setSyncedRange] = useState({ fromDate, toDate });

  if (syncedRange.fromDate !== fromDate || syncedRange.toDate !== toDate) {
    setSyncedRange({ fromDate, toDate });
    setTempFromDate(fromDate);
    setTempToDate(toDate);
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const handleApply = async () => {
  // Check if both dates are selected
  if (tempFromDate && tempToDate) {
    // Check if fromDate > toDate
    if (new Date(tempFromDate) > new Date(tempToDate)) {
      await alert({ title: "Invalid Date Range", message: "From Date cannot be greater than To Date.", type: "error" });
      return;
    }
  }

  // Validate year length (YYYY)
  const isValidYear = (date) => {
    if (!date) return true;
    const year = date.split("-")[0];
    return year.length === 4;
  };

  if (!isValidYear(tempFromDate) || !isValidYear(tempToDate)) {
    await alert({ title: "Invalid Year", message: "Year must contain exactly 4 digits.", type: "error" });
    return;
  }

  onChange({
    fromDate: tempFromDate,
    toDate: tempToDate,
  });

  setOpen(false);
};

  const displayValue =
    fromDate && toDate
      ? `${fromDate} - ${toDate}`
      : fromDate
        ? fromDate
        : placeholder;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-52 h-12
          border border-gray-400
          rounded-lg
          px-4
          flex items-center justify-between
          bg-white
        "
      >
        <span className="text-sm text-gray-700 truncate">{displayValue}</span>

        <Calendar size={18} />
      </button>

      {open && (
        <div
          className="
            absolute top-full right-0 mt-2
            w-52
            bg-white
            border border-gray-400
            rounded-xl
            shadow-lg
            p-4
            z-50
          "
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">From Date</label>

              <input
                type= "date"
                value={tempFromDate}
                max={tempToDate || undefined}
                onChange={(e) => setTempFromDate(e.target.value)}
                className="
                  w-full mt-1
                  border border-gray-400
                  rounded-lg
                  px-3 py-2
                "
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>

              <input
                type="date"
                value={tempToDate}
                min={tempFromDate || undefined}
                onChange={(e) => setTempToDate(e.target.value)}
                className="
                  w-full mt-1
                  border border-gray-400
                  rounded-lg
                  px-3 py-2
                "
              />
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="
                w-full
                rounded-lg
                bg-yellow-400
                py-2
                font-medium
                hover:bg-yellow-500
              "
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}