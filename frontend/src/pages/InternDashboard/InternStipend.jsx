// import { useEffect, useState } from "react";
// import { Building2, Download, Eye, X } from "lucide-react";
// import { saveAs } from "file-saver";

// import MainLayout from "../../components/Layout/layout";
// import internPortalServices from "../../services/internPortalServices";
// import { formatDate } from "../../utils/internUtils";

// const STATUS_STYLE = {
//   Paid: "bg-emerald-50 text-emerald-600",
//   Pending: "bg-orange-50 text-orange-500",
// };

// const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

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
//         // API returns most recent first; the design lists oldest first.
//         if (!cancelled) setStipends(Array.isArray(data) ? [...data].reverse() : []);
//       })
//       .catch((err) => {
//         if (!cancelled) {
//           setError(err.response?.data?.message || "Unable to load stipend history.");
//         }
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   return (
//     <MainLayout title="Stipend">
//       <div className="space-y-6">
//         {/* Heading */}
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Stipend</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             View your stipend details and payment history.
//           </p>
//         </div>

//         {error && (
//           <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
//             {error}
//           </div>
//         )}

//         {/* Stipend table */}
//         <div className="rounded-xl border border-gray-200 bg-white px-8 py-6">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="text-xs font-medium tracking-wide text-gray-500">
//                   <th className="py-3 pr-6">MONTH</th>
//                   <th className="py-3 pr-6">PAYABLE AMOUNT</th>
//                   <th className="py-3 pr-6">PAID DATE</th>
//                   <th className="py-3 pr-6">STATUS</th>
//                   <th className="py-3 text-right">ACTION</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading && (
//                   <tr>
//                     <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
//                       Loading...
//                     </td>
//                   </tr>
//                 )}

//                 {!loading && !stipends.length && !error && (
//                   <tr>
//                     <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
//                       No stipend records yet.
//                     </td>
//                   </tr>
//                 )}

//                 {stipends.map((row) => (
//                   <tr key={row.month}>
//                     <td className="py-3 pr-6 text-sm text-gray-900 whitespace-nowrap">
//                       {row.month_label}
//                     </td>
//                     <td className="py-3 pr-6 text-sm text-gray-900">
//                       {formatAmount(row.amount)}
//                     </td>
//                     <td className="py-3 pr-6 text-sm text-gray-900 whitespace-nowrap">
//                       {row.paid_date ? formatDate(row.paid_date) : "—"}
//                     </td>
//                     <td className="py-3 pr-6">
//                       <StatusPill status={row.status} />
//                     </td>
//                     <td className="py-3 text-right">
//                       <button
//                         type="button"
//                         onClick={() => setSelected(row)}
//                         className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 cursor-pointer"
//                       >
//                         <Eye size={13} />
//                         View Slip
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {selected && (
//         <StipendSlipModal row={selected} onClose={() => setSelected(null)} />
//       )}
//     </MainLayout>
//   );
// }

// function StatusPill({ status }) {
//   return (
//     <span
//       className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ${
//         STATUS_STYLE[status] || STATUS_STYLE.Pending
//       }`}
//     >
//       <span className="h-1.5 w-1.5 rounded-full bg-current" />
//       {status}
//     </span>
//   );
// }

// function SlipField({ label, children }) {
//   return (
//     <div>
//       <p className="text-[13px] leading-5 text-slate-500">{label}</p>
//       <div className="mt-1 text-[15px] leading-6 font-bold text-gray-900">{children}</div>
//     </div>
//   );
// }

// // NOTE: text-[..px] sizes on purpose - .intern-portal in index.css bumps
// // text-xs / text-sm one step up, which would break this layout.
// function StipendSlipModal({ row, onClose }) {
//   const [downloading, setDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState("");

//   const isPaid = row.status === "Paid";

//   const handleDownload = async () => {
//     setDownloading(true);
//     setDownloadError("");

//     try {
//       // Loaded on demand so the PDF library isn't part of the page bundle.
//       const [{ pdf }, { default: InternStipendSlipPDF }] = await Promise.all([
//         import("@react-pdf/renderer"),
//         import("../../components/Payroll/InternStipendSlipPDF"),
//       ]);

//       const blob = await pdf(<InternStipendSlipPDF row={row} />).toBlob();
//       saveAs(blob, `Stipend-Slip-${row.month_label.replace(/\s+/g, "-")}.pdf`);
//     } catch (err) {
//       console.error(err);
//       setDownloadError("Unable to generate the slip. Please try again.");
//     } finally {
//       setDownloading(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6"
//       onClick={onClose}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className="w-full max-w-[545px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-xl"
//       >
//         {/* Header */}
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <h2 className="text-[22px] leading-7 font-bold text-gray-900">Stipend Slip</h2>
//             <p className="mt-0.5 text-[14px] leading-5 text-slate-500">{row.month_label}</p>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             aria-label="Close"
//             className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
//           >
//             <X size={16} />
//           </button>
//         </div>

//         {/* Company banner */}
//         <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#FFF0C2] px-4 py-4">
//           <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#F5A800]">
//             <Building2 size={20} />
//           </span>
//           <div>
//             <p className="text-[14px] leading-5 font-bold text-[#F5A800]">Vsoft Solution</p>
//             <p className="text-[13px] leading-5 text-[#F5A800]">Intern Stipend Slip</p>
//           </div>
//         </div>

//         {/* Details */}
//         <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
//           <SlipField label="Intern Name">{row.intern_name || "-"}</SlipField>
//           <SlipField label="Intern ID">{row.intern_code || "-"}</SlipField>
//           <SlipField label="Department">{row.department_name || "-"}</SlipField>
//           <SlipField label="Position">{row.designation || "-"}</SlipField>
//           <SlipField label="Stipend Month">{row.month_label}</SlipField>
//           <SlipField label="Monthly Stipend">{formatAmount(row.amount)}</SlipField>
//           <SlipField label="Payment Date">
//             {row.paid_date ? String(row.paid_date).slice(0, 10) : "—"}
//           </SlipField>
//           <SlipField label="Payment Status">
//             <span
//               className={`mt-0.5 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] leading-4 font-semibold ${
//                 isPaid ? "bg-emerald-100 text-emerald-600" : "bg-orange-50 text-orange-500"
//               }`}
//             >
//               <span className="h-1.5 w-1.5 rounded-full bg-current" />
//               {row.status}
//             </span>
//           </SlipField>

//           {row.reference && (
//             <div className="sm:col-span-2">
//               <SlipField label="Reference">{row.reference}</SlipField>
//             </div>
//           )}
//         </div>

//         {downloadError && (
//           <p className="mt-4 text-[13px] leading-5 text-red-500">{downloadError}</p>
//         )}

//         {/* Actions */}
//         <div className="mt-6 flex gap-3">
//           <button
//             type="button"
//             onClick={onClose}
//             className="flex-1 h-12 rounded-xl border border-slate-200 text-[15px] font-bold text-gray-900 hover:bg-slate-50 cursor-pointer"
//           >
//             Close
//           </button>

//           <button
//             type="button"
//             onClick={handleDownload}
//             disabled={!isPaid || downloading}
//             title={isPaid ? undefined : "Available once the stipend is paid"}
//             className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFB800] text-[15px] font-bold text-white hover:bg-[#F2AE00] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
//           >
//             <Download size={16} />
//             {downloading ? "Preparing..." : "Download Slip"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Building2, Download, Eye, X } from "lucide-react";
import { saveAs } from "file-saver";

import MainLayout from "../../components/Layout/layout";
import internPortalServices from "../../services/internPortalServices";
import { formatDate } from "../../utils/internUtils";

const STATUS_STYLE = {
  Paid: "bg-emerald-50 text-emerald-600",
  Pending: "bg-orange-50 text-orange-500",
  Free: "bg-gray-100 text-gray-600",
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
                      {row.status === "Free" ? (
                        <span className="text-xs text-gray-400">No stipend</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 cursor-pointer"
                        >
                          <Eye size={13} />
                          View Slip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <StipendSlipModal row={selected} onClose={() => setSelected(null)} />
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

function SlipField({ label, children }) {
  return (
    <div>
      <p className="text-[13px] leading-5 text-slate-500">{label}</p>
      <div className="mt-1 text-[15px] leading-6 font-bold text-gray-900">{children}</div>
    </div>
  );
}

// NOTE: text-[..px] sizes on purpose - .intern-portal in index.css bumps
// text-xs / text-sm one step up, which would break this layout.
function StipendSlipModal({ row, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const isPaid = row.status === "Paid";

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");

    try {
      // Loaded on demand so the PDF library isn't part of the page bundle.
      const [{ pdf }, { default: InternStipendSlipPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../../components/Payroll/InternStipendSlipPDF"),
      ]);

      const blob = await pdf(<InternStipendSlipPDF row={row} />).toBlob();
      saveAs(blob, `Stipend-Slip-${row.month_label.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error(err);
      setDownloadError("Unable to generate the slip. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[545px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] leading-7 font-bold text-gray-900">Stipend Slip</h2>
            <p className="mt-0.5 text-[14px] leading-5 text-slate-500">{row.month_label}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Company banner */}
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#FFF0C2] px-4 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#F5A800]">
            <Building2 size={20} />
          </span>
          <div>
            <p className="text-[14px] leading-5 font-bold text-[#F5A800]">Vsoft Solution</p>
            <p className="text-[13px] leading-5 text-[#F5A800]">Intern Stipend Slip</p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <SlipField label="Intern Name">{row.intern_name || "-"}</SlipField>
          <SlipField label="Intern ID">{row.intern_code || "-"}</SlipField>
          <SlipField label="Department">{row.department_name || "-"}</SlipField>
          <SlipField label="Position">{row.designation || "-"}</SlipField>
          <SlipField label="Stipend Month">{row.month_label}</SlipField>
          <SlipField label="Monthly Stipend">{formatAmount(row.amount)}</SlipField>
          <SlipField label="Payment Date">
            {row.paid_date ? String(row.paid_date).slice(0, 10) : "—"}
          </SlipField>
          <SlipField label="Payment Status">
            <span
              className={`mt-0.5 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] leading-4 font-semibold ${
                isPaid ? "bg-emerald-100 text-emerald-600" : "bg-orange-50 text-orange-500"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {row.status}
            </span>
          </SlipField>

          {row.reference && (
            <div className="sm:col-span-2">
              <SlipField label="Reference">{row.reference}</SlipField>
            </div>
          )}
        </div>

        {downloadError && (
          <p className="mt-4 text-[13px] leading-5 text-red-500">{downloadError}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-[15px] font-bold text-gray-900 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!isPaid || downloading}
            title={isPaid ? undefined : "Available once the stipend is paid"}
            className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFB800] text-[15px] font-bold text-white hover:bg-[#F2AE00] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download size={16} />
            {downloading ? "Preparing..." : "Download Slip"}
          </button>
        </div>
      </div>
    </div>
  );
}