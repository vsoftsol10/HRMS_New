import { useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Check,
  X,
  TreePalm,
  Paperclip,
} from "lucide-react";

import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Table from "../../components/Table";
import StatusBadge from "../../components/StatusBadge";
import MainLayout from "../../components/Layout/layout";
import Filters from "../../components/Filter/Filter";
import useFetch from "../../hooks/useFetch";
import leaveServices from "../../services/leaveServices";
import permissionServices from "../../services/permissionServices";
import useCrud from "../../hooks/useCrud";
import Modal from "../../components/Modal/Modal";
import { useDialog } from "../../components/Dialogbox/DialogContext.jsx";
import InternLeaveTab from "../../components/Leavemanagement/InternLeaveTab";
import { formatLocalDate } from "../../utils/dateUtils";

export default function LeaveManagement() {
  const { alert, confirm } = useDialog();

  const [activeTab, setActiveTab] = useState("leave"); // "leave" | "permission"
  const [audience, setAudience] = useState("Employees"); // "Employees" | "Interns"

  const { update: updateLeave } = useCrud(leaveServices);
  const { update: updatePermission } = useCrud(permissionServices);

  const { data = {}, reload: reloadLeaves } = useFetch(leaveServices);
  const { data: permissionData = {}, reload: reloadPermissions } =
    useFetch(permissionServices);

  const userRole = localStorage.getItem("hr_role");

  const isHR = userRole === "HR";

  // Interns have their own tab: split the one list by role.
  const allLeaves = data.leaves || [];
  const isInternLeave = (leave) =>
    (leave.employee_role || leave.employees?.role) === "Intern";
  const leaves = allLeaves.filter((leave) => !isInternLeave(leave));
  const internLeaves = allLeaves.filter(isInternLeave);

  // Employees-tab cards are counted from the employee rows only.
  const todayKey = formatLocalDate(new Date());
  const stats = {
    pendingRequests: leaves.filter((l) => l.status === "Pending").length,
    approved: leaves.filter((l) => l.status === "Approved").length,
    rejected: leaves.filter((l) => l.status === "Rejected").length,
    onLeaveToday: leaves.filter(
      (l) =>
        l.status === "Approved" &&
        String(l.start_date).slice(0, 10) <= todayKey &&
        String(l.end_date).slice(0, 10) >= todayKey,
    ).length,
  };

  const permissions = permissionData.permissions || [];
  const permissionStats = permissionData.stats || {};

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectTarget, setRejectTarget] = useState("leave"); // which tab the reject modal is for
  const [viewingLeave, setViewingLeave] = useState(null); // row shown in the View modal


  /*
   * Approve leave or permission request.
   */
  const handleApprove = async (request, kind) => {
    if (request.isHRRequest && isHR) {
      await alert({
        title: "Access Denied",
        message: `This ${kind} request belongs to the HR department. Only Admin can approve or reject HR ${kind} requests.`,
        type: "error",
      });
      return;
    }

    const confirmed = await confirm({
      title: kind === "leave" ? "Approve Leave Request" : "Approve Permission Request",
      message: `Are you sure you want to approve ${request.employee}'s ${kind} request?`,
    });

    if (!confirmed) return;

    try {
      const update = kind === "leave" ? updateLeave : updatePermission;

      await update(request.id, {
        status: "Approved",
        rejection_reason: null,
      });

      await alert({
        title: "Success",
        message: `${kind === "leave" ? "Leave" : "Permission"} request approved successfully.`,
        type: "success",
      });

      kind === "leave" ? reloadLeaves() : reloadPermissions();
    } catch (err) {
      console.error(`Failed to approve ${kind} status:`, err);

      await alert({
        title: "Error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          `Failed to approve ${kind} request.`,
        type: "error",
      });
    }
  };

  /*
   * Open rejection modal for either leave or permission.
   */
  const openRejectModal = async (request, kind) => {
    if (request.isHRRequest && isHR) {
      await alert({
        title: "Access Denied",
        message: `This ${kind} request belongs to the HR department. Only Admin can approve or reject HR ${kind} requests.`,
        type: "error",
      });
      return;
    }

    setSelectedLeave(request);
    setRejectTarget(kind);
    setRejectReason("");
    setShowRejectModal(true);
  };

  /*
   * Reject leave or permission request.
   */
  const handleReject = async () => {
    if (!selectedLeave) return;

    if (!rejectReason.trim()) {
      await alert({
        title: "Rejection Reason Required",
        message: "Please provide a rejection reason.",
        type: "error",
      });
      return;
    }

    const kind = rejectTarget;

    const confirmed = await confirm({
      title: kind === "leave" ? "Reject Leave Request" : "Reject Permission Request",
      message: `Are you sure you want to reject ${selectedLeave.employee}'s ${kind} request?`,
    });

    if (!confirmed) return;

    try {
      const update = kind === "leave" ? updateLeave : updatePermission;

      await update(selectedLeave.id, {
        status: "Rejected",
        rejection_reason: rejectReason.trim(),
      });

      setShowRejectModal(false);
      setSelectedLeave(null);
      setRejectReason("");

      await alert({
        title: "Success",
        message: `${kind === "leave" ? "Leave" : "Permission"} request rejected successfully.`,
        type: "success",
      });

      kind === "leave" ? reloadLeaves() : reloadPermissions();
    } catch (err) {
      console.error(`Failed to reject ${kind}:`, err);

      await alert({
        title: "Error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          `Failed to reject ${kind} request.`,
        type: "error",
      });
    }
  };

  /*
   * View attachment (private storage bucket - opened via a short-lived
   * signed URL fetched on click).
   */
  const handleViewAttachment = async (id) => {
    try {
      const url = await leaveServices.getAttachmentUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open attachment:", err);
      await alert({
        title: "Error",
        message: "Failed to open attachment.",
        type: "error",
      });
    }
  };

  const toLeaveRow = (item) => ({
    id: item.id,
    request_id: item.request_id,

    employee: item.employee_name || item.employees?.first_name || "-",

    department:
      item.department_name ||
      item.employees?.departments?.department_name ||
      "-",

    employeeRole: item.employee_role || item.employees?.role || "",

    isHRRequest: item.isHRRequest || false,

    type: item.leave_type,
    from: item.start_date,
    to: item.end_date,
    days: item.days,
    reason: item.reason,
    rejectionReason: item.rejection_reason,
    status: item.status,
    attachmentUrl: item.attachment_url,
  });

  const leaveData = leaves.map(toLeaveRow);
  const internLeaveData = internLeaves.map(toLeaveRow);

  const permissionTableData = permissions.map((item) => ({
    id: item.id,

    employee: item.employee_name || item.employees?.first_name || "-",

    department:
      item.department_name ||
      item.employees?.departments?.department_name ||
      "-",

    employeeRole: item.employee_role || item.employees?.role || "",

    isHRRequest: item.isHRRequest || false,

    type: item.permission_type,
    date: item.permission_date,
    time:
      item.start_time && item.end_time
        ? `${item.start_time} - ${item.end_time}`
        : "-",
    reason: item.reason,
    rejectionReason: item.rejection_reason,
    status: item.status,
  }));

  const statCards =
    activeTab === "leave"
      ? [
          {
            title: "Pending Requests",
            value: stats.pendingRequests || 0,
            icon: ClipboardList,
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
          },
          {
            title: "Approved",
            value: stats.approved || 0,
            icon: CheckCircle2,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            title: "Rejected",
            value: stats.rejected || 0,
            icon: XCircle,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
          },
          {
            title: "On Leave Today",
            value: stats.onLeaveToday || 0,
            icon: Users,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
          },
        ]
      : [
          {
            title: "Pending Requests",
            value: permissionStats.pendingRequests || 0,
            icon: ClipboardList,
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
          },
          {
            title: "Approved",
            value: permissionStats.approved || 0,
            icon: CheckCircle2,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
          },
          {
            title: "Rejected",
            value: permissionStats.rejected || 0,
            icon: XCircle,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
          },
        ];

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
  });

  const leaveColumns = [
    { key: "employee", label: "Employee" },
    { key: "department", label: "Department" },
    { key: "type", label: "Type" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
    { key: "days", label: "Days" },
    { key: "reason", label: "Reason" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setViewingLeave(row)}
            title="View details"
            className="cursor-pointer hover:text-blue-500"
          >
            <Eye size={18} />
          </button>

          {row.attachmentUrl && (
            <button
              type="button"
              onClick={() => handleViewAttachment(row.id)}
              title="View attachment"
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Paperclip size={18} />
            </button>
          )}

          {row.status === "Pending" && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(row, "leave")}
                className={`${
                  row.isHRRequest && isHR
                    ? "text-gray-400"
                    : "text-green-600 hover:text-green-700"
                }`}
                title={
                  row.isHRRequest && isHR
                    ? "Only Admin can approve HR requests"
                    : "Approve"
                }
              >
                <Check size={18} />
              </button>

              <button
                type="button"
                onClick={() => openRejectModal(row, "leave")}
                className={`${
                  row.isHRRequest && isHR
                    ? "text-gray-400"
                    : "text-red-600 hover:text-red-700"
                }`}
                title={
                  row.isHRRequest && isHR
                    ? "Only Admin can reject HR requests"
                    : "Reject"
                }
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const permissionColumns = [
    { key: "employee", label: "Employee" },
    { key: "department", label: "Department" },
    { key: "type", label: "Type" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "reason", label: "Reason" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-4">
          {row.status === "Pending" && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(row, "permission")}
                className={`${
                  row.isHRRequest && isHR
                    ? "text-gray-400"
                    : "text-green-600 hover:text-green-700"
                }`}
                title={
                  row.isHRRequest && isHR
                    ? "Only Admin can approve HR requests"
                    : "Approve"
                }
              >
                <Check size={18} />
              </button>

              <button
                type="button"
                onClick={() => openRejectModal(row, "permission")}
                className={`${
                  row.isHRRequest && isHR
                    ? "text-gray-400"
                    : "text-red-600 hover:text-red-700"
                }`}
                title={
                  row.isHRRequest && isHR
                    ? "Only Admin can reject HR requests"
                    : "Reject"
                }
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filteredLeaves = leaveData.filter((leave) => {
    const search = filters.search.toLowerCase();

    const matchesSearch =
      String(leave.id).toLowerCase().includes(search) ||
      leave.employee.toLowerCase().includes(search);

    const matchesType = !filters.type || leave.type === filters.type;

    const matchesStatus = !filters.status || leave.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredPermissions = permissionTableData.filter((item) => {
    const search = filters.search.toLowerCase();

    const matchesSearch =
      String(item.id).toLowerCase().includes(search) ||
      item.employee.toLowerCase().includes(search);

    const matchesType = !filters.type || item.type === filters.type;

    const matchesStatus = !filters.status || item.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <MainLayout title="Leave Management" icon={TreePalm}>
      <div className="space-y-6">
        <PageHeader
          title="Leave Management"
          description={
            audience === "Interns"
              ? "Review, approve or reject intern leave requests."
              : "Review leave and permission requests and approve in one click."
          }
        />

        <div role="tablist" className="flex gap-6 border-b border-gray-200">
          {["Employees", "Interns"].map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={audience === name}
              onClick={() => setAudience(name)}
              className={`-mb-px border-b-2 px-1 pb-2 text-[14px] leading-5 font-medium cursor-pointer transition ${
                audience === name
                  ? "border-yellow-400 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {audience === "Interns" && (
          <InternLeaveTab
            rows={internLeaveData}
            onApprove={(row) => handleApprove(row, "leave")}
            onReject={(row) => openRejectModal(row, "leave")}
            onViewAttachment={(row) => handleViewAttachment(row.id)}
          />
        )}

        {audience === "Employees" && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((item) => (
            <StatCard
              key={item.title}
              title={item.title}
              value={item.value}
              icon={item.icon}
              iconBg={item.iconBg}
              iconColor={item.iconColor}
            />
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-300">
          <div className="flex gap-2 px-4 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("leave")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "leave"
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Leave Requests
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("permission")}
              className={`px-4 py-2 rounded-lg text-sm font-medium relative ${
                activeTab === "permission"
                  ? "bg-yellow-400 text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Permission Requests
              {(permissionStats.pendingRequests || 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {permissionStats.pendingRequests}
                </span>
              )}
            </button>
          </div>

          <Filters
            filters={filters}
            setFilters={setFilters}
            searchPlaceholder="Search employee..."
            selects={
              activeTab === "leave"
                ? [
                    {
                      key: "type",
                      placeholder: "All Leave Types",
                      options: ["Casual Leave", "Sick Leave", "Earned Leave"],
                    },
                    {
                      key: "status",
                      placeholder: "All Statuses",
                      options: ["Pending", "Approved", "Rejected"],
                    },
                  ]
                : [
                    {
                      key: "type",
                      placeholder: "All Permission Types",
                      options: [
                        "Half Day",
                        "Late Arrival",
                        "Early Leave",
                        "Medical",
                        "Personal",
                      ],
                    },
                    {
                      key: "status",
                      placeholder: "All Statuses",
                      options: ["Pending", "Approved", "Rejected"],
                    },
                  ]
            }
          />

          {activeTab === "leave" ? (
            <Table columns={leaveColumns} data={filteredLeaves} />
          ) : (
            <Table columns={permissionColumns} data={filteredPermissions} />
          )}
        </div>
        </>
        )}
      </div>

      {/* View Leave Details Modal */}
      {viewingLeave && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setViewingLeave(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave request details"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-[18px] leading-6 font-semibold text-gray-900">
                  Leave Request
                </h2>
                <p className="text-[12px] leading-4 text-gray-500">
                  {viewingLeave.employee}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setViewingLeave(null)}
                className="p-1 text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="divide-y divide-gray-100 px-6 py-3">
              {[
                ["Employee", viewingLeave.employee],
                ["Department", viewingLeave.department],
                ["Leave Type", viewingLeave.type],
                [
                  "Date Range",
                  viewingLeave.from === viewingLeave.to
                    ? viewingLeave.from
                    : `${viewingLeave.from} → ${viewingLeave.to}`,
                ],
                ["Days", viewingLeave.days],
                ["Reason", viewingLeave.reason],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 py-2">
                  <span className="w-32 shrink-0 text-[14px] leading-5 text-gray-500">
                    {label}
                  </span>
                  <span className="text-[14px] leading-5 font-medium text-gray-900 break-words">
                    {value ?? "-"}
                  </span>
                </div>
              ))}

              <div className="flex gap-4 py-2">
                <span className="w-32 shrink-0 text-[14px] leading-5 text-gray-500">
                  Status
                </span>
                <StatusBadge status={viewingLeave.status} />
              </div>

              {viewingLeave.status === "Rejected" && (
                <div className="flex gap-4 py-2">
                  <span className="w-32 shrink-0 text-[14px] leading-5 text-gray-500">
                    Rejection Reason
                  </span>
                  <span className="text-[14px] leading-5 font-medium text-gray-900 break-words">
                    {viewingLeave.rejectionReason || "-"}
                  </span>
                </div>
              )}

              {viewingLeave.attachmentUrl && (
                <div className="flex gap-4 py-2">
                  <span className="w-32 shrink-0 text-[14px] leading-5 text-gray-500">
                    Attachment
                  </span>
                  <button
                    type="button"
                    onClick={() => handleViewAttachment(viewingLeave.id)}
                    className="inline-flex items-center gap-1.5 text-[14px] leading-5 font-medium text-yellow-700 hover:text-yellow-800 cursor-pointer"
                  >
                    <Paperclip size={16} />
                    View attachment
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              {viewingLeave.status === "Pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const row = viewingLeave;
                      setViewingLeave(null);
                      openRejectModal(row, "leave");
                    }}
                    className="rounded-lg border border-gray-300 px-5 py-2 text-[14px] leading-5 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const row = viewingLeave;
                      setViewingLeave(null);
                      handleApprove(row, "leave");
                    }}
                    className="rounded-lg bg-yellow-400 px-5 py-2 text-[14px] leading-5 font-semibold text-gray-900 hover:bg-yellow-300 cursor-pointer"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setViewingLeave(null)}
                className="rounded-lg border border-gray-300 px-5 py-2 text-[14px] leading-5 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal - shared by Leave and Permission tabs */}
      {showRejectModal && (
        <Modal
          onClose={() => {
            setShowRejectModal(false);
            setSelectedLeave(null);
            setRejectReason("");
          }}
        >
          <div className="w-full max-w-md p-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {rejectTarget === "leave"
                ? "Reject Leave Request"
                : "Reject Permission Request"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Please provide a reason for rejecting this {rejectTarget} request.
            </p>

            {selectedLeave && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Employee</p>

                <p className="font-medium text-gray-900">
                  {selectedLeave.employee}
                </p>
              </div>
            )}

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full mt-4 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-400"
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedLeave(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {rejectTarget === "leave" ? "Reject Leave" : "Reject Permission"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}