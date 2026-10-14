import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useDialog } from "../Dialogbox/DialogContext";

export default function MonthRangePicker({
  fromMonth,
  toMonth,
  onChange,
  placeholder = "Select Month Range",
}) {
  const { alert } = useDialog();
  const [open, setOpen] = useState(false);

  const [tempFromMonth, setTempFromMonth] = useState(fromMonth);
  const [tempToMonth, setTempToMonth] = useState(toMonth);

  const wrapperRef = useRef(null);

  // Re-sync the draft values when the applied range changes (adjusting
  // state during render instead of in an effect).
  const [syncedRange, setSyncedRange] = useState({ fromMonth, toMonth });

  if (syncedRange.fromMonth !== fromMonth || syncedRange.toMonth !== toMonth) {
    setSyncedRange({ fromMonth, toMonth });
    setTempFromMonth(fromMonth);
    setTempToMonth(toMonth);
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
    // From Month cannot be greater than To Month
    if (tempFromMonth && tempToMonth && tempFromMonth > tempToMonth) {
      await alert({ title: "Invalid Month Range", message: "From Month cannot be greater than To Month.", type: "error" });
      return;
    }

    onChange({
      fromMonth: tempFromMonth,
      toMonth: tempToMonth,
    });

    setOpen(false);
  };

  const displayValue =
    fromMonth && toMonth
      ? `${fromMonth} - ${toMonth}`
      : fromMonth
        ? fromMonth
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
              <label className="text-sm font-medium">From Month</label>

              <input
                type="month"
                value={tempFromMonth}
                max={tempToMonth || undefined}
                onChange={(e) => setTempFromMonth(e.target.value)}
                className="
                  w-full mt-1
                  border border-gray-400
                  rounded-lg
                  px-3 py-2
                "
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Month</label>

              <input
                type="month"
                value={tempToMonth}
                min={tempFromMonth || undefined}
                onChange={(e) => setTempToMonth(e.target.value)}
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