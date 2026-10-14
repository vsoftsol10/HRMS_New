// import { useEffect, useState } from "react";
// import { Plus, X } from "lucide-react";

// import employeeInternServices from "../../services/employeeInternServices";
// import { formatDate, formatShortDate, getInitials } from "../../utils/internUtils";

// // Type scale (Inter): page heading 24/32 600, section heading 18/24 600,
// // card title 15-16/24 600, body 14/20 400, table text 13-14/20, caption 12/16.
// const FONT = "[font-family:Inter,ui-sans-serif,system-ui,sans-serif]";

// const PILL_STYLES = {
//   Active: { pill: "border-[#00bb80] bg-[#e7fef6] text-[#007c56]", dot: "bg-[#00bb80]" },
//   "Ending Soon": { pill: "border-orange-300 bg-orange-50 text-orange-700", dot: "bg-orange-500" },
//   "Temp Coverage": { pill: "border-orange-300 bg-orange-50 text-orange-700", dot: "bg-orange-500" },
//   Completed: { pill: "border-cyan-300 bg-cyan-50 text-cyan-700", dot: "bg-cyan-500" },
//   Converted: { pill: "border-blue-300 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
//   "In Progress": { pill: "border-[#ffd24d] bg-[#fff8e1] text-[#e6a800]", dot: "bg-[#ffbc00]" },
//   Pending: { pill: "border-[#d5deea] bg-[#f3f6fa] text-[#475d78]", dot: "bg-[#475d78]" },
//   Inactive: { pill: "border-gray-300 bg-gray-50 text-gray-600", dot: "bg-gray-400" },
// };

// function Pill({ status }) {
//   const style = PILL_STYLES[status] || PILL_STYLES.Inactive;

//   return (
//     <span
//       className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-0.5 text-[13px] font-semibold leading-5 ${style.pill}`}
//     >
//       <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
//       {status}
//     </span>
//   );
// }

// // Employee portal: one intern's basics + their tasks.
// // `refreshKey` is bumped by the parent after a task is assigned so the list
// // updates without closing the modal.
// export default function ViewInternModal({
//   internId,
//   refreshKey = 0,
//   onClose,
//   onAssign,
// }) {
//   const [intern, setIntern] = useState(null);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let cancelled = false;

//     const load = async () => {
//       try {
//         const data = await employeeInternServices.getById(internId);
//         if (cancelled) return;

//         setIntern(data);
//         setError("");
//       } catch (err) {
//         if (cancelled) return;

//         setError(err.response?.data?.message || "Unable to load this intern.");
//       }
//     };

//     load();

//     return () => {
//       cancelled = true;
//     };
//   }, [internId, refreshKey]);

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
//       onClick={onClose}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className={`${FONT} max-h-[90vh] w-full max-w-[808px] overflow-y-auto rounded-2xl bg-white shadow-xl`}
//       >
//         {/* Header */}
//         <div className="flex items-start justify-between gap-4 border-b border-[#e1e8f0] px-7 py-6">
//           <div>
//             <h2 className="text-lg font-semibold leading-6 text-[#0d1828]">
//               {intern ? intern.full_name : "Intern"}
//             </h2>
//             {intern && (
//               <p className="text-sm leading-5 text-[#5b7089]">{intern.designation}</p>
//             )}
//           </div>

//           <button
//             type="button"
//             title="Close"
//             onClick={onClose}
//             className="rounded-full p-1 text-[#5b7089] hover:bg-slate-100 cursor-pointer"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <div className="space-y-6 px-7 py-6">
//           {error && <p className="text-sm text-red-600">{error}</p>}
//           {!error && !intern && <p className="text-sm text-[#5b7089]">Loading...</p>}

//           {intern && (
//             <>
//               {/* Profile */}
//               <div className="flex items-center gap-5">
//                 <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#3d546b] text-base font-semibold text-white">
//                   {getInitials(intern.full_name)}
//                 </span>

//                 <div className="min-w-0">
//                   <h3 className="text-2xl font-semibold leading-8 text-[#0d1828]">
//                     {intern.full_name}
//                   </h3>
//                   <p className="text-sm leading-5 text-[#5b7089]">{intern.designation}</p>
//                   <div className="mt-1 flex flex-wrap items-center gap-3">
//                     <Pill status={intern.display_status} />
//                     <span className="text-[13px] leading-5 text-[#7d8fa6]">
//                       Dept: {intern.department_name || "-"}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Primary employee */}
//               <div className="rounded-xl border border-[#e1e8f0] bg-[#f5f8fc] px-5 py-3.5">
//                 <p className="text-[13px] leading-5 text-[#5b7089]">Primary Employee</p>
//                 <p className="text-[15px] font-semibold leading-6 text-[#39526d]">
//                   {intern.primary_employee_name || "-"}
//                 </p>

//                 {intern.via_coverage && (
//                   <p className="mt-1 text-xs leading-4 text-orange-600">
//                     You are covering this intern until {formatDate(intern.coverage_end)}.
//                   </p>
//                 )}
//               </div>

//               {/* Tasks header */}
//               <div className="flex items-center justify-between">
//                 <h3 className="text-base font-semibold leading-6 text-[#0d1828]">
//                   Tasks ({intern.tasks.length})
//                 </h3>

//                 <button
//                   type="button"
//                   onClick={() => onAssign(intern.id)}
//                   className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-[#ffbc00] px-5 text-sm font-medium leading-5 text-[#0d1828] hover:bg-[#ffc61a] cursor-pointer"
//                 >
//                   <Plus size={18} />
//                   Assign Task
//                 </button>
//               </div>

//               {/* Tasks */}
//               {intern.tasks.length === 0 ? (
//                 <p className="py-4 text-center text-sm text-[#5b7089]">
//                   No tasks have been assigned yet.
//                 </p>
//               ) : (
//                 <ul className="space-y-2.5">
//                   {intern.tasks.map((task) => (
//                     <li
//                       key={task.id}
//                       className="rounded-xl border border-[#e1e8f0] px-5 py-4"
//                     >
//                       <div className="flex items-start justify-between gap-3">
//                         <p className="text-base font-semibold leading-6 text-[#0d1828]">
//                           {task.title}
//                         </p>
//                         <Pill status={task.status} />
//                       </div>

//                       {task.description && (
//                         <p className="mt-1 whitespace-pre-line text-sm leading-5 text-[#5b7089]">
//                           {task.description}
//                         </p>
//                       )}

//                       <p className="mt-1.5 flex flex-wrap gap-x-6 text-[13px] leading-5 text-[#5b7089]">
//                         <span>
//                           Assigned By:{" "}
//                           <span className="ml-3 font-semibold text-[#39526d]">
//                             {task.assigned_by_name || "-"}
//                           </span>
//                         </span>
//                         <span>
//                           Due:{" "}
//                           {task.created_at
//                             ? `${formatShortDate(task.created_at)} – ${formatShortDate(task.due_date)}`
//                             : formatDate(task.due_date)}
//                         </span>
//                       </p>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import employeeInternServices from "../../services/employeeInternServices";
import { formatDate, formatShortDate, getInitials } from "../../utils/internUtils";

// Type scale (Inter): page heading 24/32 600, section heading 18/24 600,
// card title 15-16/24 600, body 14/20 400, table text 13-14/20, caption 12/16.
const FONT = "[font-family:Inter,ui-sans-serif,system-ui,sans-serif]";

const PILL_STYLES = {
  Active: { pill: "border-[#00bb80] bg-[#e7fef6] text-[#007c56]", dot: "bg-[#00bb80]" },
  "Ending Soon": { pill: "border-orange-300 bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  "Temp Coverage": { pill: "border-orange-300 bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  Completed: { pill: "border-cyan-300 bg-cyan-50 text-cyan-700", dot: "bg-cyan-500" },
  Converted: { pill: "border-blue-300 bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  "In Progress": { pill: "border-[#ffd24d] bg-[#fff8e1] text-[#e6a800]", dot: "bg-[#ffbc00]" },
  Pending: { pill: "border-[#d5deea] bg-[#f3f6fa] text-[#475d78]", dot: "bg-[#475d78]" },
  Inactive: { pill: "border-gray-300 bg-gray-50 text-gray-600", dot: "bg-gray-400" },
};

function Pill({ status }) {
  const style = PILL_STYLES[status] || PILL_STYLES.Inactive;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-0.5 text-[13px] font-semibold leading-5 ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

// Employee portal: one intern's basics + their tasks.
// `refreshKey` is bumped by the parent after a task is assigned so the list
// updates without closing the modal.
export default function ViewInternModal({
  internId,
  refreshKey = 0,
  onClose,
  onAssign,
}) {
  const [intern, setIntern] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await employeeInternServices.getById(internId);
        if (cancelled) return;

        setIntern(data);
        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(err.response?.data?.message || "Unable to load this intern.");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [internId, refreshKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${FONT} max-h-[90vh] w-full max-w-[808px] overflow-y-auto rounded-2xl bg-white shadow-xl`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e1e8f0] px-7 py-6">
          <div>
            <h2 className="text-lg font-semibold leading-6 text-[#0d1828]">
              {intern ? intern.full_name : "Intern"}
            </h2>
            {intern && (
              <p className="text-sm leading-5 text-[#5b7089]">{intern.designation}</p>
            )}
          </div>

          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="rounded-full p-1 text-[#5b7089] hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-7 py-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && !intern && <p className="text-sm text-[#5b7089]">Loading...</p>}

          {intern && (
            <>
              {/* Profile */}
              <div className="flex items-center gap-5">
                <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#3d546b] text-base font-semibold text-white">
                  {getInitials(intern.full_name)}
                </span>

                <div className="min-w-0">
                  <h3 className="text-2xl font-semibold leading-8 text-[#0d1828]">
                    {intern.full_name}
                  </h3>
                  <p className="text-sm leading-5 text-[#5b7089]">{intern.designation}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Pill status={intern.display_status} />
                    <span className="text-[13px] leading-5 text-[#7d8fa6]">
                      Dept: {intern.department_name || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary employee */}
              <div className="rounded-xl border border-[#e1e8f0] bg-[#f5f8fc] px-5 py-3.5">
                <p className="text-[13px] leading-5 text-[#5b7089]">Primary Employee</p>
                <p className="text-[15px] font-semibold leading-6 text-[#39526d]">
                  {intern.primary_employee_name || "-"}
                </p>

                {intern.via_coverage && (
                  <p className="mt-1 text-xs leading-4 text-orange-600">
                    You are covering this intern until {formatDate(intern.coverage_end)}.
                  </p>
                )}
              </div>

              {/* Tasks header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold leading-6 text-[#0d1828]">
                  Tasks ({intern.tasks.length})
                </h3>

                <button
                  type="button"
                  onClick={() => onAssign(intern.id)}
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-[#ffbc00] px-5 text-sm font-medium leading-5 text-[#0d1828] hover:bg-[#ffc61a] cursor-pointer"
                >
                  <Plus size={18} />
                  Assign Task
                </button>
              </div>

              {/* Tasks */}
              {intern.tasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#5b7089]">
                  No tasks have been assigned yet.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {intern.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-xl border border-[#e1e8f0] px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-base font-semibold leading-6 text-[#0d1828]">
                          {task.title}
                        </p>
                        <Pill status={task.status} />
                      </div>

                      {task.description && (
                        <p className="mt-1 whitespace-pre-line text-sm leading-5 text-[#5b7089]">
                          {task.description}
                        </p>
                      )}

                      <p className="mt-1.5 flex flex-wrap gap-x-6 text-[13px] leading-5 text-[#5b7089]">
                        <span>
                          Assigned By:{" "}
                          <span className="ml-3 font-semibold text-[#39526d]">
                            {task.assigned_by_name || "-"}
                          </span>
                        </span>
                        <span>
                          Due:{" "}
                          {task.created_at
                            ? `${formatShortDate(task.created_at)} – ${formatShortDate(task.due_date)}`
                            : formatDate(task.due_date)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}