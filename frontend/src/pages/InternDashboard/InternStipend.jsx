// import { useEffect, useState } from "react";
// import { Eye, X } from "lucide-react";

// import MainLayout from "../../components/Layout/layout";
// import PageHeader from "../../components/PageHeader";
// import Table from "../../components/Table";
// import StatusBadge from "../../components/StatusBadge";
// import Modal from "../../components/Modal/Modal";
// import internPortalServices from "../../services/internPortalServices";
// import { formatDate } from "../../utils/internUtils";

// export default function InternStipend() {
//   const [stipends, setStipends] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [selected, setSelected] = useState(null);

//   useEffect(() => {
//     let cancelled = false;

//     internPortalServices
//       .getStipends()
//       .then((data) => {
//         if (!cancelled) setStipends(data);
//       })
//       .catch((err) => {
//         if (!cancelled) setError(err.response?.data?.message || "Unable to load stipend history.");
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const columns = [
//     { key: "month_label", label: "MONTH" },
//     { key: "amount", label: "PAYABLE AMOUNT", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
//     { key: "paid_date", label: "PAID DATE", render: (v) => (v ? formatDate(v) : "—") },
//     { key: "status", label: "STATUS", render: (v) => <StatusBadge status={v} /> },
//     {
//       key: "action",
//       label: "ACTION",
//       render: (_, row) => (
//         <button
//           type="button"
//           onClick={() => setSelected(row)}
//           className="flex items-center gap-2 text-yellow-700 hover:underline cursor-pointer"
//         >
//           <Eye size={16} />
//           View Slip
//         </button>
//       ),
//     },
//   ];

//   return (
//     <MainLayout title="Stipend">
//       <div className="space-y-6">
//         <PageHeader title="Stipend" description="View your stipend details and payment history." />

//         {error && <p className="text-red-600">{error}</p>}

//         <div className="bg-white rounded-xl border border-gray-300">
//           <Table columns={columns} data={stipends} />

//           {!loading && !stipends.length && !error && (
//             <p className="px-5 pb-6 text-center text-gray-500">No stipend records yet.</p>
//           )}
//         </div>
//       </div>

//       {selected && (
//         <Modal onClose={() => setSelected(null)}>
//           <div className="w-full max-w-md space-y-5">
//             <div className="flex items-start justify-between">
//               <div>
//                 <h2 className="text-xl font-bold">Stipend Slip</h2>
//                 <p className="text-gray-500">{selected.month_label}</p>
//               </div>
//               <button type="button" onClick={() => setSelected(null)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-gray-500">Stipend Month</p>
//                 <p className="font-medium">{selected.month_label}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Monthly Stipend</p>
//                 <p className="font-medium">₹{Number(selected.amount).toLocaleString("en-IN")}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Payment Date</p>
//                 <p className="font-medium">{selected.paid_date ? formatDate(selected.paid_date) : "—"}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Payment Status</p>
//                 <StatusBadge status={selected.status} />
//               </div>
//               {selected.reference && (
//                 <div className="col-span-2">
//                   <p className="text-sm text-gray-500">Reference</p>
//                   <p className="font-medium">{selected.reference}</p>
//                 </div>
//               )}
//             </div>

//             <button
//               type="button"
//               onClick={() => setSelected(null)}
//               className="w-full px-5 py-3 rounded-xl border border-gray-400 hover:bg-gray-100 cursor-pointer"
//             >
//               Close
//             </button>
//           </div>
//         </Modal>
//       )}
//     </MainLayout>
//   );
// }

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import Modal from "../../components/Modal/Modal";
import internPortalServices from "../../services/internPortalServices";
import { formatDate } from "../../utils/internUtils";

const STATUS_STYLE = {
  Paid: "bg-emerald-50 text-emerald-600",
  Pending: "bg-orange-50 text-orange-500",
};

const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

export default function InternStipend() {
  const [stipends, setStipends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    internPortalServices
      .getStipends()
      .then((data) => {
        // API returns most recent first; the design lists oldest first.
        if (!cancelled) setStipends(Array.isArray(data) ? [...data].reverse() : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load stipend history.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MainLayout title="Stipend">
      <div className="space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stipend</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your stipend details and payment history.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Stipend table */}
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-medium tracking-wide text-gray-500">
                  <th className="py-3 pr-6">MONTH</th>
                  <th className="py-3 pr-6">PAYABLE AMOUNT</th>
                  <th className="py-3 pr-6">PAID DATE</th>
                  <th className="py-3 pr-6">STATUS</th>
                  <th className="py-3 text-right">ACTION</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && !stipends.length && !error && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      No stipend records yet.
                    </td>
                  </tr>
                )}

                {stipends.map((row) => (
                  <tr key={row.month}>
                    <td className="py-3 pr-6 text-sm text-gray-900 whitespace-nowrap">
                      {row.month_label}
                    </td>
                    <td className="py-3 pr-6 text-sm text-gray-900">
                      {formatAmount(row.amount)}
                    </td>
                    <td className="py-3 pr-6 text-sm text-gray-900 whitespace-nowrap">
                      {row.paid_date ? formatDate(row.paid_date) : "—"}
                    </td>
                    <td className="py-3 pr-6">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 cursor-pointer"
                      >
                        <Eye size={13} />
                        View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="w-full max-w-md space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Stipend Slip</h2>
                <p className="text-gray-500">{selected.month_label}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Stipend Month</p>
                <p className="font-medium text-gray-900">{selected.month_label}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Stipend</p>
                <p className="font-medium text-gray-900">{formatAmount(selected.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Date</p>
                <p className="font-medium text-gray-900">
                  {selected.paid_date ? formatDate(selected.paid_date) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                <StatusPill status={selected.status} />
              </div>

              {selected.reference && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-medium text-gray-900">{selected.reference}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ${
        STATUS_STYLE[status] || STATUS_STYLE.Pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}