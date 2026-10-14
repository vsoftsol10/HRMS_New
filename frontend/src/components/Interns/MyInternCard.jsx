// import { Plus } from "lucide-react";
 
// import { formatShortDate, getInitials } from "../../utils/internUtils";
 
// // Design system: Inter. Card title 15/24 600, table text 13/20, body 14/20,
// // caption 12/16. Colours below are taken from the approved card design.
// const FONT = "[font-family:Inter,ui-sans-serif,system-ui,sans-serif]";
 
// // Solid "bullseye" icon used on View Intern (ring + filled dot).
// function ViewIcon() {
//   return (
//     <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
//       <circle cx="6" cy="6" r="5.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
//       <circle cx="6" cy="6" r="3.1" fill="currentColor" />
//     </svg>
//   );
// }
 
// // Status pill used only on this card (outlined pill + dot). The shared
// // StatusBadge is left alone because many other pages depend on its look.
// const PILL_STYLES = {
//   Active: {
//     pill: "border-[#00bb80] bg-[#e7fef6] text-[#007c56]",
//     dot: "bg-[#00bb80]",
//   },
//   "Ending Soon": {
//     pill: "border-orange-300 bg-orange-50 text-orange-700",
//     dot: "bg-orange-500",
//   },
//   "Temp Coverage": {
//     pill: "border-[#ffb020] bg-[#fff8e6] text-[#c25e00]",
//     dot: "bg-[#ff8a00]",
//   },
//   Completed: {
//     pill: "border-cyan-300 bg-cyan-50 text-cyan-700",
//     dot: "bg-cyan-500",
//   },
//   Converted: {
//     pill: "border-blue-300 bg-blue-50 text-blue-700",
//     dot: "bg-blue-500",
//   },
//   Inactive: {
//     pill: "border-gray-300 bg-gray-50 text-gray-600",
//     dot: "bg-gray-400",
//   },
// };
 
// function StatusPill({ status }) {
//   const style = PILL_STYLES[status] || PILL_STYLES.Inactive;
 
//   return (
//     <span
//       className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-[11px] py-1 text-[13px] font-semibold leading-4 ${style.pill}`}
//     >
//       <span className={`h-2 w-2 rounded-full ${style.dot}`} />
//       {status}
//     </span>
//   );
// }
 
// // "Label: Value" on one line, value in bold.
// function Row({ label, children }) {
//   return (
//     <p className="text-[13px] leading-5 text-[#39526d]">
//       {label}: <span className="font-semibold">{children}</span>
//     </p>
//   );
// }
 
// // One intern in the Employee portal -> My Intern.
// // variant "coverage" = an intern looked after temporarily for someone else.
// export default function MyInternCard({
//   intern,
//   variant = "mine",
//   onView,
//   onAssign,
// }) {
//   const isCoverage = variant === "coverage";
 
//   return (
//     <div
//       className={`${FONT} flex h-full flex-col rounded-[14px] border p-[21px] pb-[31px] ${
//         isCoverage
//           ? "border-[#ffb020] bg-[#fffdf6]"
//           : "border-[#e1e8f0] bg-white"
//       }`}
//     >
//       <div className="flex items-center justify-between gap-3">
//         <div className="flex min-w-0 items-center gap-3.5">
//           <span
//             className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
//               isCoverage ? "bg-[#ff9a00]" : "bg-[#3d546b]"
//             }`}
//           >
//             {getInitials(intern.full_name)}
//           </span>
 
//           <div className="min-w-0">
//             <p className="truncate text-[15px] font-semibold leading-6 text-[#0d1828]">
//               {intern.full_name}
//             </p>
//             <p className="relative -top-px truncate text-[13px] leading-5 text-[#39526d]">
//               {intern.designation}
//             </p>
//           </div>
//         </div>
 
//         <StatusPill status={isCoverage ? "Temp Coverage" : intern.display_status} />
//       </div>
 
//       <div className="mt-3.5 space-y-[3px]">
//         {!isCoverage && (
//           <>
//             <Row label="Department">{intern.department_name || "-"}</Row>
//             <Row label="Active Tasks">{intern.active_tasks}</Row>
//           </>
//         )}
//         <Row label="Primary Employee">{intern.primary_employee_name || "-"}</Row>
 
//         {isCoverage && intern.primary_on_leave && (
//           <Row label="Status">
//             <span className="text-red-600">
//               {intern.primary_employee_name} is on leave
//             </span>
//           </Row>
//         )}
 
//         {isCoverage && (
//           <Row label="Coverage">
//             {formatShortDate(intern.coverage_start)} –{" "}
//             {formatShortDate(intern.coverage_end)}
//           </Row>
//         )}
//       </div>
 
//       <div className="mt-auto grid grid-cols-2 gap-3 pt-3.5">
//         <button
//           type="button"
//           onClick={() => onView(intern.id)}
//           className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#c9d7e7] bg-white px-3 text-sm font-semibold leading-5 text-[#0d1828] hover:bg-slate-50 cursor-pointer"
//         >
//           <ViewIcon />
//           View Intern
//         </button>
 
//         <button
//           type="button"
//           onClick={() => onAssign(intern.id)}
//           className="flex h-10 items-center justify-center gap-0.5 rounded-[10px] bg-[#ffbc00] px-3 text-sm font-semibold leading-5 text-[#0d1828] hover:bg-[#ffc61a] cursor-pointer"
//         >
//           <Plus size={16} />
//           Assign Task
//         </button>
//       </div>
//     </div>
//   );
// }

import { Plus } from "lucide-react";

import { formatShortDate, getInitials } from "../../utils/internUtils";

// Design system: Inter. Card title 15/24 600, table text 13/20, body 14/20,
// caption 12/16. Colours below are taken from the approved card design.
const FONT = "[font-family:Inter,ui-sans-serif,system-ui,sans-serif]";

// Solid "bullseye" icon used on View Intern (ring + filled dot).
function ViewIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6" cy="6" r="3.1" fill="currentColor" />
    </svg>
  );
}

// Status pill used only on this card (outlined pill + dot). The shared
// StatusBadge is left alone because many other pages depend on its look.
const PILL_STYLES = {
  Active: {
    pill: "border-[#00bb80] bg-[#e7fef6] text-[#007c56]",
    dot: "bg-[#00bb80]",
  },
  "Ending Soon": {
    pill: "border-orange-300 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  "Temp Coverage": {
    pill: "border-[#ffb020] bg-[#fff8e6] text-[#c25e00]",
    dot: "bg-[#ff8a00]",
  },
  Completed: {
    pill: "border-cyan-300 bg-cyan-50 text-cyan-700",
    dot: "bg-cyan-500",
  },
  Converted: {
    pill: "border-blue-300 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  Inactive: {
    pill: "border-gray-300 bg-gray-50 text-gray-600",
    dot: "bg-gray-400",
  },
};

function StatusPill({ status }) {
  const style = PILL_STYLES[status] || PILL_STYLES.Inactive;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-[11px] py-1 text-[13px] font-semibold leading-4 ${style.pill}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

// "Label: Value" on one line, value in bold.
function Row({ label, children }) {
  return (
    <p className="text-[13px] leading-5 text-[#39526d]">
      {label}: <span className="font-semibold">{children}</span>
    </p>
  );
}

// One intern in the Employee portal -> My Intern.
// variant "coverage" = an intern looked after temporarily for someone else.
export default function MyInternCard({
  intern,
  variant = "mine",
  onView,
  onAssign,
}) {
  const isCoverage = variant === "coverage";

  return (
    <div
      className={`${FONT} flex h-full flex-col rounded-[14px] border p-[21px] pb-[31px] ${
        isCoverage
          ? "border-[#ffb020] bg-[#fffdf6]"
          : "border-[#e1e8f0] bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
              isCoverage ? "bg-[#ff9a00]" : "bg-[#3d546b]"
            }`}
          >
            {getInitials(intern.full_name)}
          </span>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-6 text-[#0d1828]">
              {intern.full_name}
            </p>
            <p className="relative -top-px truncate text-[13px] leading-5 text-[#39526d]">
              {intern.designation}
            </p>
          </div>
        </div>

        <StatusPill status={isCoverage ? "Temp Coverage" : intern.display_status} />
      </div>

      <div className="mt-3.5 space-y-[3px]">
        {!isCoverage && (
          <>
            <Row label="Department">{intern.department_name || "-"}</Row>
            <Row label="Active Tasks">{intern.active_tasks}</Row>
          </>
        )}
        <Row label="Primary Employee">{intern.primary_employee_name || "-"}</Row>

        {isCoverage && intern.primary_on_leave && (
          <Row label="Status">
            <span className="text-red-600">
              {intern.primary_employee_name} is on leave
            </span>
          </Row>
        )}

        {isCoverage && (
          <Row label="Coverage">
            {formatShortDate(intern.coverage_start)} –{" "}
            {formatShortDate(intern.coverage_end)}
          </Row>
        )}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 pt-3.5">
        <button
          type="button"
          onClick={() => onView(intern.id)}
          className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#c9d7e7] bg-white px-3 text-sm font-semibold leading-5 text-[#0d1828] hover:bg-slate-50 cursor-pointer"
        >
          <ViewIcon />
          View Intern
        </button>

        <button
          type="button"
          onClick={() => onAssign(intern.id)}
          className="flex h-10 items-center justify-center gap-0.5 rounded-[10px] bg-[#ffbc00] px-3 text-sm font-semibold leading-5 text-[#0d1828] hover:bg-[#ffc61a] cursor-pointer"
        >
          <Plus size={16} />
          Assign Task
        </button>
      </div>
    </div>
  );
}