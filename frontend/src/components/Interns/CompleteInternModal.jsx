// import { useState } from "react";
// import { GraduationCap, TriangleAlert } from "lucide-react";

// import OutcomeModalShell, {
//   InfoNotice,
//   cancelButtonClass,
//   formatLongDate,
// } from "./OutcomeModalShell";
// import { useDialog } from "../Dialogbox/DialogContext";
// import internServices from "../../services/internServices";

// function Row({ label, value }) {
//   return (
//     <div className="flex items-center justify-between gap-4 py-1.5">
//       <span className="text-gray-500">{label}:</span>
//       <span className="font-semibold text-gray-900 text-right">{value || "-"}</span>
//     </div>
//   );
// }

// export default function CompleteInternModal({ intern, onClose, onDone }) {
//   const { alert } = useDialog();
//   const [saving, setSaving] = useState(false);

//   const handleComplete = async () => {
//     setSaving(true);

//     try {
//       await internServices.complete(intern.id);
//       onDone();
//     } catch (err) {
//       await alert({
//         title: "Error",
//         message:
//           err.response?.data?.message || "Unable to complete this internship.",
//         type: "error",
//       });
//       setSaving(false);
//     }
//   };

//   return (
//     <OutcomeModalShell
//       icon={GraduationCap}
//       title="Complete Internship"
//       subtitle={intern.full_name}
//       onClose={onClose}
//       busy={saving}
//       footer={
//         <>
//           <button
//             type="button"
//             onClick={onClose}
//             disabled={saving}
//             className={cancelButtonClass}
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={handleComplete}
//             disabled={saving}
//             className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-60"
//           >
//             {saving ? "Completing..." : "Complete Internship"}
//           </button>
//         </>
//       }
//     >
//       <div className="space-y-5">
//         <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
//           <div className="flex items-center gap-2 font-bold text-lg">
//             <TriangleAlert size={20} />
//             Complete this internship?
//           </div>
//           <p className="text-sm leading-relaxed mt-1">
//             The internship will be marked as completed. The intern will no
//             longer appear in Active or Ending Soon counts. All internship
//             history will be preserved.
//           </p>
//         </div>

//         <div>
//           <Row label="Intern" value={intern.full_name} />
//           <Row label="Department" value={intern.department_name} />
//           <Row label="End Date" value={formatLongDate(intern.end_date)} />
//           <Row label="Mentor" value={intern.mentor_name} />
//         </div>

//         <InfoNotice tone="amber">
//           The intern&apos;s login is switched off once the internship is
//           completed. Extending the internship turns it back on.
//         </InfoNotice>
//       </div>
//     </OutcomeModalShell>
//   );
// }

import { useState } from "react";
import { GraduationCap, TriangleAlert } from "lucide-react";

import OutcomeModalShell, { InfoNotice, cancelButtonClass } from "./OutcomeModalShell";
import { formatLongDate } from "../../utils/outcomeFormat";
import { useDialog } from "../Dialogbox/DialogContext";
import internServices from "../../services/internServices";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-900 text-right">{value || "-"}</span>
    </div>
  );
}

export default function CompleteInternModal({ intern, onClose, onDone }) {
  const { alert } = useDialog();
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);

    try {
      await internServices.complete(intern.id);
      onDone();
    } catch (err) {
      await alert({
        title: "Error",
        message:
          err.response?.data?.message || "Unable to complete this internship.",
        type: "error",
      });
      setSaving(false);
    }
  };

  return (
    <OutcomeModalShell
      icon={GraduationCap}
      title="Complete Internship"
      subtitle={intern.full_name}
      onClose={onClose}
      busy={saving}
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
            onClick={handleComplete}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 cursor-pointer disabled:opacity-60"
          >
            {saving ? "Completing..." : "Complete Internship"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
          <div className="flex items-center gap-2 font-bold text-lg">
            <TriangleAlert size={20} />
            Complete this internship?
          </div>
          <p className="text-sm leading-relaxed mt-1">
            The internship will be marked as completed. The intern will no
            longer appear in Active or Ending Soon counts. All internship
            history will be preserved.
          </p>
        </div>

        <div>
          <Row label="Intern" value={intern.full_name} />
          <Row label="Department" value={intern.department_name} />
          <Row label="End Date" value={formatLongDate(intern.end_date)} />
          <Row label="Mentor" value={intern.mentor_name} />
        </div>

        <InfoNotice tone="amber">
          The intern&apos;s login is switched off once the internship is
          completed. Extending the internship turns it back on.
        </InfoNotice>
      </div>
    </OutcomeModalShell>
  );
}