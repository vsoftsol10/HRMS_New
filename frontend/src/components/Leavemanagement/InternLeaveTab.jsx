import { useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  FileText,
  Paperclip,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

import internAttendanceAdminServices from "../../services/internAttendanceAdminServices";
import { formatLocalDate } from "../../utils/dateUtils";

const PAGE_SIZE = 10;
const PRESENT_LIKE = ["Present", "Late", "Half Day"];

const STATUS_STYLE = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
};

// "Casual Leave" -> "Casual"
const shortType = (type = "") => type.replace(/\s*Leave$/i, "") || type || "-";

const dateRange = (row) =>
  row.from === row.to ? row.from : `${row.from} → ${row.to}`;

function SummaryCard({ label, value, icon: Icon, tile }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${tile}`}
      >
        <Icon size={22} />
      </div>

      <div>
        <p className="text-[12px] leading-4 font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="text-[24px] leading-8 font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex gap-4 py-2">
      <span className="w-32 shrink-0 text-[14px] leading-5 text-gray-500">
        {label}
      </span>
      <span className="text-[14px] leading-5 font-medium text-gray-900 break-words">
        {children || "-"}
      </span>
    </div>
  );
}

// Leave requests of interns (Leave Management -> Interns tab).
//   rows:          leave rows already shaped by the page (see toLeaveRow)
//   onApprove/onReject(row):   the page's existing approve / reject flows
//   onViewAttachment(row):     opens the signed attachment URL
export default function InternLeaveTab({
  rows,
  onApprove,
  onReject,
  onViewAttachment,
}) {
  const [summary, setSummary] = useState({ working_days: 0, rows: [] });
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  // The four cards are this month's intern attendance (same numbers as
  // Attendance -> Interns for the current month).
  useEffect(() => {
    let cancelled = false;
    const month = formatLocalDate(new Date()).slice(0, 7);

    internAttendanceAdminServices
      .getByMonth(month)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch(() => {
        if (!cancelled) setSummary({ working_days: 0, rows: [] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const count = (statuses) =>
    summary.rows.filter((row) => statuses.includes(row.status)).length;

  const cards = [
    { label: "Working Days", value: summary.working_days, icon: CalendarDays, tile: "bg-blue-50 text-blue-600" },
    { label: "Present", value: count(PRESENT_LIKE), icon: UserCheck, tile: "bg-green-50 text-green-600" },
    { label: "Absent", value: count(["Absent"]), icon: UserX, tile: "bg-red-50 text-red-500" },
    { label: "Leave", value: count(["Leave"]), icon: FileText, tile: "bg-sky-50 text-sky-600" },
  ];

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const headCell =
    "px-4 py-3 text-left text-[12px] leading-4 font-semibold text-gray-500";
  const cell = "px-4 py-3 text-[14px] leading-5 text-gray-700";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-50/70 border-b border-gray-200">
            <tr>
              <th className={headCell}>Interns</th>
              <th className={headCell}>Leave Type</th>
              <th className={headCell}>Date Range</th>
              <th className={headCell}>Days</th>
              <th className={headCell}>Status</th>
              <th className={`${headCell} text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-gray-500">
                  No intern leave requests yet.
                </td>
              </tr>
            )}

            {pageRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className={`${cell} font-semibold text-gray-900`}>
                  {row.employee}
                </td>
                <td className={cell}>{shortType(row.type)}</td>
                <td className={cell}>{dateRange(row)}</td>
                <td className={cell}>{row.days}</td>
                <td className={cell}>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[12px] leading-4 font-semibold ${
                      STATUS_STYLE[row.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className={cell}>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setViewing(row)}
                      className="inline-flex items-center gap-1.5 text-[14px] leading-5 font-medium text-gray-900 hover:text-yellow-600 cursor-pointer"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    {row.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove(row)}
                          className="rounded-lg bg-yellow-400 px-4 py-1.5 text-[14px] leading-5 font-semibold text-gray-900 hover:bg-yellow-300 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(row)}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-[14px] leading-5 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-[14px] leading-5 text-gray-600">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}-
              {Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(safePage + 1)}
                disabled={safePage === pageCount}
                className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave request"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-[18px] leading-6 font-semibold text-gray-900">
                  Leave Request
                </h2>
                <p className="text-[12px] leading-4 text-gray-500">
                  {viewing.employee}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setViewing(null)}
                className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="divide-y divide-gray-100 px-6 py-3">
              <DetailRow label="Leave Type">{viewing.type}</DetailRow>
              <DetailRow label="Date Range">{dateRange(viewing)}</DetailRow>
              <DetailRow label="Days">{viewing.days}</DetailRow>
              <DetailRow label="Status">{viewing.status}</DetailRow>
              <DetailRow label="Reason">{viewing.reason}</DetailRow>
              {viewing.status === "Rejected" && (
                <DetailRow label="Rejection Reason">
                  {viewing.rejectionReason}
                </DetailRow>
              )}
              {viewing.attachmentUrl && (
                <DetailRow label="Attachment">
                  <button
                    type="button"
                    onClick={() => onViewAttachment(viewing)}
                    className="inline-flex items-center gap-1.5 text-yellow-700 hover:text-yellow-800 cursor-pointer"
                  >
                    <Paperclip size={16} />
                    View attachment
                  </button>
                </DetailRow>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg border border-gray-300 px-5 py-2 text-[14px] leading-5 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}