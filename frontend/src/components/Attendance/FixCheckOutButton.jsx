import { useState } from "react";
import { useDialog } from "../Dialogbox/DialogContext";
import attendanceServices from "../../services/attendanceServices";

// HR / Admin action for a day the system closed automatically (or a day with
// no check-out): asks for the real check-out time and saves it. The backend
// then recomputes working hours, status and LOP.
export default function FixCheckOutButton({ attendanceId, who, date, onDone }) {
  const { alert, prompt } = useDialog();
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    const value = await prompt({
      title: "Set actual check-out",
      message: `${who} - ${date}. Enter the real check-out time in 24-hour format (for example 17:30).`,
    });

    const time = String(value ?? "").trim();

    if (!time) return;

    setSaving(true);

    try {
      await attendanceServices.fixCheckOut(attendanceId, time);

      await alert({
        title: "Success",
        message: "Check-out updated.",
        type: "success",
      });

      onDone?.();
    } catch (err) {
      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to update check-out.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className="rounded-lg border border-yellow-400 bg-yellow-50 px-3 py-1 text-[12px] leading-4 font-semibold text-gray-900 hover:bg-yellow-100 disabled:opacity-60 cursor-pointer"
    >
      {saving ? "Saving..." : "Set check-out"}
    </button>
  );
}