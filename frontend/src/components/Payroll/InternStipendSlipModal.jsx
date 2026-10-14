import { useState } from "react";
import { X } from "lucide-react";

import Modal from "../Modal/Modal";
import { useDialog } from "../Dialogbox/DialogContext";
import internStipendServices from "../../services/internStipendServices";
import { formatDate } from "../../utils/internUtils";

const formatAmount = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const formatMonth = (isoDate) => {
  const [year, month] = String(isoDate).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const STATUS_STYLE = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-900">{children}</div>
    </div>
  );
}

export default function InternStipendSlipModal({ row, onClose, onPaid }) {
  const { alert } = useDialog();
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMarkPaid = async () => {
    setSaving(true);

    try {
      await internStipendServices.markPaid(row.intern_id, {
        month: row.month,
        reference: reference.trim(),
      });

      await onPaid();
    } catch (error) {
      console.log(error);
      await alert({
        title: "Could not mark as paid",
        message: error?.response?.data?.message || "Something went wrong.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Stipend Payslip
            </h2>
            <p className="text-sm text-gray-500">{formatMonth(row.month)}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Intern Name">{row.intern_name || "-"}</Field>
          <Field label="Intern ID">{row.intern_code || "-"}</Field>
          <Field label="Department">{row.department_name || "-"}</Field>
          <Field label="Internship Period">
            {formatDate(row.start_date)} - {formatDate(row.end_date)}
          </Field>
          <Field label="Stipend Month">{formatMonth(row.month)}</Field>
          <Field label="Stipend Amount">{formatAmount(row.amount)}</Field>
          <Field label="Payment Status">
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                STATUS_STYLE[row.status] || STATUS_STYLE.Pending
              }`}
            >
              {row.status}
            </span>
          </Field>
          <Field label="Payment Date">
            {row.paid_date ? formatDate(row.paid_date) : "—"}
          </Field>

          {row.reference && (
            <div className="col-span-2">
              <Field label="Reference">{row.reference}</Field>
            </div>
          )}
        </div>

        {row.status === "Pending" && (
          <div className="space-y-2 border-t border-gray-200 pt-4">
            <label className="text-xs text-gray-500" htmlFor="stipend-reference">
              Payment reference (optional)
            </label>
            <input
              id="stipend-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI / bank transaction ID"
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-yellow-400"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 cursor-pointer"
          >
            Close
          </button>

          {row.status === "Pending" && (
            <button
              type="button"
              disabled={saving}
              onClick={handleMarkPaid}
              className="flex-1 h-10 rounded-lg bg-yellow-400 text-sm font-medium hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Saving..." : "Mark as Paid"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}