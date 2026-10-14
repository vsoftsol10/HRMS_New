import { BriefcaseBusiness, CircleCheck } from "lucide-react";

// Shown after a certificate was emailed. `internName` / `subtitle` come from
// the sent certificate, e.g. "Mathew" and "UI UX Design".
export default function MailSuccessModal({ internName, subtitle, onDone }) {
  const firstName = String(internName || "The intern").split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="flex items-center gap-4 border-b border-gray-100 px-8 py-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-slate-900">
            <BriefcaseBusiness size={26} />
          </span>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mail Successful</h2>
            <p className="text-gray-500">
              {[internName, subtitle].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center px-8 py-10 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
            <CircleCheck size={40} />
          </span>

          <h3 className="mt-6 text-2xl font-bold text-slate-900">Successful</h3>
          <p className="mt-2 text-gray-500">
            {firstName}&rsquo;s certificate is successfully sent.
          </p>

          <button
            type="button"
            onClick={onDone}
            className="mt-8 h-14 w-48 rounded-xl bg-yellow-400 text-lg font-semibold text-slate-900 hover:bg-yellow-300 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}