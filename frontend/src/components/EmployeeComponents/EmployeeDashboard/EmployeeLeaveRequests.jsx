import { CalendarX2, Search, Paperclip } from "lucide-react";
import { useMemo, useState } from "react";
import StatusBadge from "../../StatusBadge";
import employeeLeaveServices from "../../../services/employeeLeaveServices";
import { useDialog } from "../../Dialogbox/DialogContext";

export default function EmployeeLeaveRequests({ leaveRequests = [] }) {
  const { alert } = useDialog();
  const [search, setSearch] = useState("");

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((item) =>
      item.leave_type.toLowerCase().includes(search.toLowerCase()),
    );
  }, [leaveRequests, search]);

  // FIX: attachments live in a private storage bucket, so they're opened
  // via a short-lived signed URL fetched on click, not a static link.
  const handleViewAttachment = async (id) => {
    try {
      const url = await employeeLeaveServices.getAttachmentUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open attachment:", error);
      await alert({
        title: "Error",
        message: "Failed to open attachment.",
        type: "error",
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
      {/* Header */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
            <CalendarX2 size={22} className="text-yellow-600" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Recent Leave Requests</h2>

            <p className="text-sm text-gray-500">Your latest applications</p>
          </div>
        </div>

        {/* FIX: the search state/filtering logic already existed, but there
            was no actual input for the user to type into - so the leave
            type search never did anything visible. */}
        <div className="relative w-48">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leave type"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      {/* Table */}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300 text-sm text-gray-700">
              <th className="py-4 text-left font-semibold">LEAVE TYPE</th>

              <th className="py-4 text-left font-semibold">APPLIED DATE</th>

              <th className="py-4 text-left font-semibold">DURATION</th>

              <th className="py-4 text-left font-semibold">STATUS</th>

              <th className="py-4 text-left font-semibold">ATTACHMENT</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeaves.map((item, index) => {
              const startDate = new Date(item.start_date);
              const endDate = new Date(item.end_date);

              const duration =
                Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

              return (
                <tr key={index} className="border-t border-gray-300">
                  <td className="py-5 font-medium">{item.leave_type}</td>

                  <td>
                    {startDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td>
                    {duration} {duration > 1 ? "days" : "day"}
                  </td>

                  <td>
                    <StatusBadge status={item.status} />
                  </td>

                  <td>
                    {item.attachment_url ? (
                      <button
                        type="button"
                        onClick={() => handleViewAttachment(item.id)}
                        className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700 text-sm"
                      >
                        <Paperclip size={14} />
                        View
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!filteredLeaves.length && (
          <p className="text-center py-6 text-gray-500">
            No leave requests found.
          </p>
        )}
      </div>
    </div>
  );
}