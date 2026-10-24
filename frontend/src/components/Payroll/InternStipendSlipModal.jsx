// import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// // Helvetica (the built-in PDF font) has no rupee glyph, so amounts use "Rs."
// const formatAmount = (value) => `Rs. ${Number(value).toLocaleString("en-IN")}`;

// const styles = StyleSheet.create({
//   page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#111827" },
//   strip: { height: 8, backgroundColor: "#f4b400", marginBottom: 24 },
//   company: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#f4b400" },
//   title: { fontSize: 12, marginTop: 2, color: "#6b7280" },
//   banner: {
//     marginTop: 18,
//     padding: 14,
//     borderRadius: 6,
//     backgroundColor: "#fff3cd",
//   },
//   bannerTitle: { fontSize: 14, fontFamily: "Helvetica-Bold" },
//   bannerSub: { fontSize: 10, color: "#6b7280", marginTop: 2 },
//   grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 20 },
//   cell: { width: "50%", marginBottom: 16, paddingRight: 12 },
//   label: { fontSize: 9, color: "#6b7280", marginBottom: 3 },
//   value: { fontSize: 12, fontFamily: "Helvetica-Bold" },
//   footer: {
//     position: "absolute",
//     left: 36,
//     right: 36,
//     bottom: 28,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: "#e5e7eb",
//     fontSize: 9,
//     color: "#9ca3af",
//     textAlign: "center",
//   },
// });

// function Cell({ label, value }) {
//   return (
//     <View style={styles.cell}>
//       <Text style={styles.label}>{label}</Text>
//       <Text style={styles.value}>{value}</Text>
//     </View>
//   );
// }

// export default function InternStipendSlipPDF({ row }) {
//   return (
//     <Document title={`Stipend Slip - ${row.month_label}`}>
//       <Page size="A4" style={styles.page}>
//         <View style={styles.strip} />

//         <Text style={styles.company}>Vsoft Solution</Text>
//         <Text style={styles.title}>Stipend Slip - {row.month_label}</Text>

//         <View style={styles.banner}>
//           <Text style={styles.bannerTitle}>Intern Stipend Slip</Text>
//           <Text style={styles.bannerSub}>Vsoft Solution</Text>
//         </View>

//         <View style={styles.grid}>
//           <Cell label="Intern Name" value={row.intern_name || "-"} />
//           <Cell label="Intern ID" value={row.intern_code || "-"} />
//           <Cell label="Department" value={row.department_name || "-"} />
//           <Cell label="Position" value={row.designation || "-"} />
//           <Cell label="Stipend Month" value={row.month_label} />
//           <Cell label="Monthly Stipend" value={formatAmount(row.amount)} />
//           <Cell
//             label="Payment Date"
//             value={row.paid_date ? String(row.paid_date).slice(0, 10) : "-"}
//           />
//           <Cell label="Payment Status" value={row.status} />
//           {row.reference ? <Cell label="Reference" value={row.reference} /> : null}
//         </View>

//         <Text style={styles.footer}>
//           This is a system-generated stipend slip and does not require a signature.
//         </Text>
//       </Page>
//     </Document>
//   );
// }

import { useState } from "react";
import { saveAs } from "file-saver";
import { Building2, Download, X } from "lucide-react";

import internStipendServices from "../../services/internStipendServices";

const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

// The Payroll tab's monthly rows only carry `month` ("2026-10-01"), the
// per-intern history rows also carry `month_label` - derive it when missing.
const getMonthLabel = (row) => {
  if (row.month_label) return row.month_label;
  const [year, month] = String(row.month).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const todayLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
};

function SlipField({ label, children }) {
  return (
    <div>
      <p className="text-[13px] leading-5 text-slate-500">{label}</p>
      <div className="mt-0.5 text-[15px] leading-6 font-semibold text-gray-900">
        {children}
      </div>
    </div>
  );
}

// Opened from HR -> intern -> Stipend tab and Payroll -> Intern Stipend.
//   Pending row -> payment date + reference form with "Mark as Paid"
//   Paid row    -> read-only slip with "Download Slip"
export default function InternStipendSlipModal({ row, onClose, onPaid }) {
  const isPaid = row.status === "Paid";
  const monthLabel = getMonthLabel(row);

  const [paidDate, setPaidDate] = useState(todayLocal());
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (!saving) onClose();
  };

  const handleMarkPaid = async () => {
    if (!paidDate) {
      setError("Select the payment date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await internStipendServices.markPaid(row.intern_id, {
        month: String(row.month).slice(0, 10),
        paid_date: paidDate,
        reference: reference.trim(),
      });
      await onPaid();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Unable to mark this stipend as paid.",
      );
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError("");

    try {
      // Loaded on demand so the PDF library isn't part of the page bundle.
      const [{ pdf }, { default: InternStipendSlipPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./InternStipendSlipPDF"),
      ]);

      const blob = await pdf(
        <InternStipendSlipPDF row={{ ...row, month_label: monthLabel }} />,
      ).toBlob();
      saveAs(blob, `Stipend-Slip-${monthLabel.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error(err);
      setError("Unable to generate the slip. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Stipend Slip"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[545px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] leading-7 font-bold text-gray-900">
              {isPaid ? "Stipend Slip" : "Mark Stipend as Paid"}
            </h2>
            <p className="mt-0.5 text-[14px] leading-5 text-slate-500">
              {monthLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={saving}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer disabled:opacity-50"
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
            <p className="text-[14px] leading-5 font-bold text-[#F5A800]">
              Vsoft Solution
            </p>
            <p className="text-[13px] leading-5 text-[#F5A800]">
              Intern Stipend Slip
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <SlipField label="Intern Name">{row.intern_name || "-"}</SlipField>
          <SlipField label="Intern ID">{row.intern_code || "-"}</SlipField>
          <SlipField label="Department">{row.department_name || "-"}</SlipField>
          <SlipField label="Stipend Month">{monthLabel}</SlipField>
          <SlipField label="Monthly Stipend">{formatAmount(row.amount)}</SlipField>
          <SlipField label="Payment Status">
            <span
              className={`mt-0.5 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] leading-4 font-semibold ${
                isPaid
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-orange-50 text-orange-500"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {row.status}
            </span>
          </SlipField>

          {isPaid && (
            <>
              <SlipField label="Payment Date">
                {row.paid_date ? String(row.paid_date).slice(0, 10) : "-"}
              </SlipField>
              <SlipField label="Reference">{row.reference || "-"}</SlipField>
            </>
          )}
        </div>

        {/* Payment form (pending months only) */}
        {!isPaid && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="stipend-paid-date"
                className="block mb-2 text-[14px] font-medium text-gray-800"
              >
                Payment Date *
              </label>
              <input
                id="stipend-paid-date"
                type="date"
                value={paidDate}
                max={todayLocal()}
                onChange={(event) => {
                  setPaidDate(event.target.value);
                  setError("");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#FFB800]"
              />
            </div>

            <div>
              <label
                htmlFor="stipend-reference"
                className="block mb-2 text-[14px] font-medium text-gray-800"
              >
                Reference (optional)
              </label>
              <input
                id="stipend-reference"
                type="text"
                value={reference}
                placeholder="UPI / transaction ID"
                onChange={(event) => setReference(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#FFB800]"
              />
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-[13px] leading-5 text-red-500">{error}</p>}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-[15px] font-bold text-gray-900 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            {isPaid ? "Close" : "Cancel"}
          </button>

          {isPaid ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFB800] text-[15px] font-bold text-white hover:bg-[#F2AE00] disabled:opacity-50 cursor-pointer"
            >
              <Download size={16} />
              {downloading ? "Preparing..." : "Download Slip"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-[#FFB800] text-[15px] font-bold text-white hover:bg-[#F2AE00] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Mark as Paid"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}