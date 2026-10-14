// import { useState } from "react";
// import { CalendarCheck2, CalendarPlus, CalendarX2, CheckCircle2, Clock } from "lucide-react";

// import MainLayout from "../../components/Layout/layout";
// import Modal from "../../components/Modal/Modal";
// import InternApplyLeave from "../../components/interns/InternApplyLeave";
// import useFetch from "../../hooks/useFetch";
// import employeeLeaveServices from "../../services/employeeLeaveServices";

// const STATUS_STYLE = {
//   Approved: "bg-emerald-50 text-emerald-600",
//   Pending: "bg-orange-50 text-orange-500",
//   Rejected: "bg-red-50 text-red-500",
// };

// // "2026-09-09T05:12:00.000Z" -> "2026-09-09"
// const dateOnly = (value) => (value ? String(value).slice(0, 10) : "-");

// export default function InternLeave() {
//   const { data, loading, error, reload } = useFetch(employeeLeaveServices);
//   const [showApplyLeave, setShowApplyLeave] = useState(false);
//   const [selectedLeave, setSelectedLeave] = useState(null);

//   const leaveHistory = Array.isArray(data?.leaveHistory) ? data.leaveHistory : [];

//   const approved = leaveHistory.filter((l) => l.status === "Approved");
//   const daysTaken = approved.reduce((sum, l) => sum + Number(l.days || 0), 0);
//   const pending = leaveHistory.filter((l) => l.status === "Pending").length;
//   const rejected = leaveHistory.filter((l) => l.status === "Rejected").length;

//   return (
//     <MainLayout title="Leave">
//       <div className="space-y-6">
//         {/* Heading */}
//         <div className="flex items-start justify-between gap-4 flex-wrap">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Leave</h1>
//             <p className="text-sm text-gray-500 mt-1">
//               Manage your leave requests and balance.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={() => setShowApplyLeave(true)}
//             className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 transition cursor-pointer"
//           >
//             <CalendarPlus size={15} />
//             Apply Leave
//           </button>
//         </div>

//         {error && (
//           <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
//             <p className="text-red-700">Unable to load your leave requests.</p>
//             <button
//               type="button"
//               onClick={reload}
//               className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
//             >
//               Retry
//             </button>
//           </div>
//         )}

//         {/* Stat cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
//           <TopStat icon={CalendarCheck2} iconBg="bg-green-50" iconColor="text-green-600" value={daysTaken} label="Leave Taken" />
//           <TopStat icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-500" value={pending} label="Pending Request" />
//           <TopStat icon={CalendarX2} iconBg="bg-red-50" iconColor="text-red-500" value={rejected} label="Rejected Leaves" />
//           <TopStat icon={CheckCircle2} iconBg="bg-blue-50" iconColor="text-blue-500" value={approved.length} label="Approved Leaves" />
//         </div>

//         {/* Leave table */}
//         <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left">
//               <thead className="bg-gray-50 border-b border-gray-200">
//                 <tr className="text-xs font-medium tracking-wide text-gray-500">
//                   <th className="px-6 py-4">LEAVE TYPE</th>
//                   <th className="px-6 py-4">FROM</th>
//                   <th className="px-6 py-4">TO</th>
//                   <th className="px-6 py-4">DAYS</th>
//                   <th className="px-6 py-4">REASON</th>
//                   <th className="px-6 py-4">STATUS</th>
//                   <th className="px-6 py-4">APPLIED DATE</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading && leaveHistory.length === 0 && (
//                   <tr>
//                     <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
//                       Loading...
//                     </td>
//                   </tr>
//                 )}

//                 {!loading && leaveHistory.length === 0 && (
//                   <tr>
//                     <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
//                       No leave requests yet.
//                     </td>
//                   </tr>
//                 )}

//                 {leaveHistory.map((leave) => (
//                   <tr
//                     key={leave.id}
//                     tabIndex={0}
//                     title="View details"
//                     onClick={() => setSelectedLeave(leave)}
//                     onKeyDown={(e) => e.key === "Enter" && setSelectedLeave(leave)}
//                     className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer outline-none focus-visible:bg-gray-50"
//                   >
//                     <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
//                       {leave.leave_type}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
//                       {dateOnly(leave.start_date)}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
//                       {dateOnly(leave.end_date)}
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600">{Number(leave.days)}</td>
//                     <td className="px-6 py-4 text-sm text-gray-600">{leave.reason}</td>
//                     <td className="px-6 py-4">
//                       <span
//                         className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
//                           STATUS_STYLE[leave.status] || STATUS_STYLE.Pending
//                         }`}
//                       >
//                         {leave.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
//                       {dateOnly(leave.applied_at)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {showApplyLeave && (
//         <InternApplyLeave onClose={() => setShowApplyLeave(false)} reload={reload} />
//       )}

//       {selectedLeave && (
//         <Modal onClose={() => setSelectedLeave(null)}>
//           <div className="w-full max-w-lg space-y-4">
//             <h2 className="text-xl font-semibold text-gray-900">Leave Request Details</h2>

//             <div>
//               <p className="text-sm text-gray-500">Leave Type</p>
//               <p className="font-medium text-gray-900">{selectedLeave.leave_type}</p>
//             </div>

//             <div>
//               <p className="text-sm text-gray-500">Date</p>
//               <p className="font-medium text-gray-900">
//                 {dateOnly(selectedLeave.start_date) === dateOnly(selectedLeave.end_date)
//                   ? dateOnly(selectedLeave.start_date)
//                   : `${dateOnly(selectedLeave.start_date)} to ${dateOnly(selectedLeave.end_date)}`}
//                 {" · "}
//                 {Number(selectedLeave.days)} {Number(selectedLeave.days) === 1 ? "day" : "days"}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-gray-500">Reason</p>
//               <p className="font-medium text-gray-900">
//                 {selectedLeave.reason || "No reason provided"}
//               </p>
//             </div>

//             <div>
//               <p className="text-sm text-gray-500 mb-1">Status</p>
//               <span
//                 className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
//                   STATUS_STYLE[selectedLeave.status] || STATUS_STYLE.Pending
//                 }`}
//               >
//                 {selectedLeave.status}
//               </span>
//             </div>

//             {selectedLeave.status === "Rejected" && (
//               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                 <p className="text-sm font-semibold text-red-700">HR Rejection Reason</p>
//                 <p className="mt-1 text-sm text-red-600">
//                   {selectedLeave.rejection_reason || "No rejection reason was provided."}
//                 </p>
//               </div>
//             )}

//             <div className="flex justify-end">
//               <button
//                 type="button"
//                 onClick={() => setSelectedLeave(null)}
//                 className="px-5 py-2 bg-gray-900 text-white rounded-lg cursor-pointer"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </Modal>
//       )}
//     </MainLayout>
//   );
// }

// function TopStat({ icon: Icon, iconBg, iconColor, value, label }) {
//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-5">
//       <span className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
//         <Icon size={17} className={iconColor} />
//       </span>
//       <p className="text-3xl font-bold text-gray-900 mt-4">{value}</p>
//       <p className="text-sm text-gray-500 mt-1">{label}</p>
//     </div>
//   );
// }

import { useState } from "react";
import { CalendarCheck2, CalendarPlus, CalendarX2, CheckCircle2, Clock } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import Modal from "../../components/Modal/Modal";
import InternApplyLeave from "../../components/Interns/InternApplyLeave";
import useFetch from "../../hooks/useFetch";
import employeeLeaveServices from "../../services/employeeLeaveServices";

const STATUS_STYLE = {
  Approved: "bg-emerald-50 text-emerald-600",
  Pending: "bg-orange-50 text-orange-500",
  Rejected: "bg-red-50 text-red-500",
};

// "2026-09-09T05:12:00.000Z" -> "2026-09-09"
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "-");

export default function InternLeave() {
  const { data, loading, error, reload } = useFetch(employeeLeaveServices);
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const leaveHistory = Array.isArray(data?.leaveHistory) ? data.leaveHistory : [];

  const approved = leaveHistory.filter((l) => l.status === "Approved");
  const daysTaken = approved.reduce((sum, l) => sum + Number(l.days || 0), 0);
  const pending = leaveHistory.filter((l) => l.status === "Pending").length;
  const rejected = leaveHistory.filter((l) => l.status === "Rejected").length;

  return (
    <MainLayout title="Leave">
      <div className="space-y-6">
        {/* Heading */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your leave requests and balance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowApplyLeave(true)}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 transition cursor-pointer"
          >
            <CalendarPlus size={15} />
            Apply Leave
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">Unable to load your leave requests.</p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <TopStat icon={CalendarCheck2} iconBg="bg-green-50" iconColor="text-green-600" value={daysTaken} label="Leave Taken" />
          <TopStat icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-500" value={pending} label="Pending Request" />
          <TopStat icon={CalendarX2} iconBg="bg-red-50" iconColor="text-red-500" value={rejected} label="Rejected Leaves" />
          <TopStat icon={CheckCircle2} iconBg="bg-blue-50" iconColor="text-blue-500" value={approved.length} label="Approved Leaves" />
        </div>

        {/* Leave table */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-medium tracking-wide text-gray-500">
                  <th className="px-6 py-4">LEAVE TYPE</th>
                  <th className="px-6 py-4">FROM</th>
                  <th className="px-6 py-4">TO</th>
                  <th className="px-6 py-4">DAYS</th>
                  <th className="px-6 py-4">REASON</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4">APPLIED DATE</th>
                </tr>
              </thead>

              <tbody>
                {loading && leaveHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && leaveHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                      No leave requests yet.
                    </td>
                  </tr>
                )}

                {leaveHistory.map((leave) => (
                  <tr
                    key={leave.id}
                    tabIndex={0}
                    title="View details"
                    onClick={() => setSelectedLeave(leave)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedLeave(leave)}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer outline-none focus-visible:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {leave.leave_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {dateOnly(leave.start_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {dateOnly(leave.end_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{Number(leave.days)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{leave.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          STATUS_STYLE[leave.status] || STATUS_STYLE.Pending
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {dateOnly(leave.applied_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showApplyLeave && (
        <InternApplyLeave onClose={() => setShowApplyLeave(false)} reload={reload} />
      )}

      {selectedLeave && (
        <Modal onClose={() => setSelectedLeave(null)}>
          <div className="w-full max-w-lg space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Leave Request Details</h2>

            <div>
              <p className="text-sm text-gray-500">Leave Type</p>
              <p className="font-medium text-gray-900">{selectedLeave.leave_type}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">
                {dateOnly(selectedLeave.start_date) === dateOnly(selectedLeave.end_date)
                  ? dateOnly(selectedLeave.start_date)
                  : `${dateOnly(selectedLeave.start_date)} to ${dateOnly(selectedLeave.end_date)}`}
                {" · "}
                {Number(selectedLeave.days)} {Number(selectedLeave.days) === 1 ? "day" : "days"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Reason</p>
              <p className="font-medium text-gray-900">
                {selectedLeave.reason || "No reason provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_STYLE[selectedLeave.status] || STATUS_STYLE.Pending
                }`}
              >
                {selectedLeave.status}
              </span>
            </div>

            {selectedLeave.status === "Rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-700">HR Rejection Reason</p>
                <p className="mt-1 text-sm text-red-600">
                  {selectedLeave.rejection_reason || "No rejection reason was provided."}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

function TopStat({ icon: Icon, iconBg, iconColor, value, label }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <span className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon size={17} className={iconColor} />
      </span>
      <p className="text-3xl font-bold text-gray-900 mt-4">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}