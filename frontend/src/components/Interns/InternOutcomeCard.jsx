import {
  Briefcase,
  CalendarDays,
  ClipboardList,
  Clock,
  GraduationCap,
  X,
} from "lucide-react";

const remainingLabel = (days) => {
  if (days === null || days === undefined) return "";
  if (days > 1) return `${days} days remaining`;
  if (days === 1) return "1 day remaining";
  if (days === 0) return "Ends today";
  if (days === -1) return "Ended 1 day ago";

  return `Ended ${Math.abs(days)} days ago`;
};

function OutcomeRow({ icon: Icon, tile, title, text, buttonLabel, buttonClass, onClick }) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 border-t border-gray-200">
      <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${tile}`}>
        <Icon size={24} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-gray-900">{title}</p>
        <p className="text-gray-500">{text}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`shrink-0 min-w-28 px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition ${buttonClass}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// "Internship Outcome" card: what HR can do when an internship is wrapping up.
// An Active intern gets all three; a Completed one can only be extended.
export default function InternOutcomeCard({
  intern,
  onClose,
  onConvert,
  onComplete,
  onExtend,
}) {
  const isActive = intern.status === "Active";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Internship Outcome"
        onClick={(event) => event.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <ClipboardList size={24} className="text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900 flex-1">
            Internship Outcome
          </h2>

          {isActive && intern.days_left !== null && (
            <span
              className={`inline-flex items-center gap-2 font-semibold ${
                intern.days_left < 0 ? "text-red-600" : "text-yellow-500"
              }`}
            >
              <Clock size={18} />
              {remainingLabel(intern.days_left)}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {isActive && (
          <OutcomeRow
            icon={Briefcase}
            tile="bg-yellow-100 text-yellow-500"
            title="Convert to Employee"
            text="Hire this intern as a full-time employee with payroll"
            buttonLabel="Convert"
            buttonClass="bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
            onClick={onConvert}
          />
        )}

        {isActive && (
          <OutcomeRow
            icon={GraduationCap}
            tile="bg-gray-50 text-slate-500"
            title="Complete Internship"
            text="Mark the internship as completed and preserve all records"
            buttonLabel="Complete"
            buttonClass="bg-gray-900 text-white hover:bg-gray-700"
            onClick={onComplete}
          />
        )}

        <OutcomeRow
          icon={CalendarDays}
          tile="bg-blue-50 text-blue-600"
          title="Extend Internship"
          text="Push back the end date and keep the intern active"
          buttonLabel="Extend"
          buttonClass="bg-blue-600 text-white hover:bg-blue-500"
          onClick={onExtend}
        />
      </div>
    </div>
  );
}