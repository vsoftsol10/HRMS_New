import { X } from "lucide-react";

// Shared frame for the Internship Outcome dialogs (Convert / Complete /
// Extend): icon tile + title + subtitle, close button, body, footer.
export default function OutcomeModalShell({
  icon: Icon,
  iconClassName = "bg-gray-100 text-gray-900",
  title,
  subtitle,
  onClose,
  busy = false,
  maxWidth = "max-w-xl",
  children,
  footer,
}) {
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[92vh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-200">
          <div
            className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${iconClassName}`}
          >
            <Icon size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-500 truncate">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer disabled:opacity-40"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Blue "Complete this internship?" style notice used by all the dialogs.
export function InfoNotice({ title, children, tone = "blue" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      {title && <p className="font-bold text-lg">{title}</p>}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export const cancelButtonClass =
  "px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 cursor-pointer disabled:opacity-50";