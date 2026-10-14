import { Check } from "lucide-react";

const CERTIFICATE_STEPS = [
  "Choose Template",
  "Certificate Details",
  "Preview & Send",
];

// step is 1-based. Done = dark check, current = yellow, upcoming = outlined.
export default function CertificateStepper({ step }) {
  return (
    <ol className="flex flex-wrap items-center gap-4">
      {CERTIFICATE_STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < step;
        const current = number === step;

        return (
          <li key={label} className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  done
                    ? "bg-slate-900 text-white"
                    : current
                      ? "bg-yellow-400 text-slate-900"
                      : "border border-gray-300 text-gray-400"
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : number}
              </span>

              <span
                className={`font-medium ${
                  current ? "text-slate-900 font-semibold" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>

            {number < CERTIFICATE_STEPS.length && (
              <span className="hidden h-px w-10 bg-gray-300 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}