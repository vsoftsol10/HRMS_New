import { useState } from "react";
import {
  CalendarX2,
  CalendarDays,
  HeartPulse,
  Clock3,
  ShieldCheck,
  Eye,
} from "lucide-react";
import useFetch from "../../hooks/useFetch.js";

import MainLayout from "../../components/Layout/layout";
import Modal from "../../components/Modal/Modal";
import Applyleave from "../../components/Leavemanagement/ApplyLeave";
import RequestPermission from "../../components/Leavemanagement/RequestPermission";
import StatCard from "../../components/StatCard";
import Table from "../../components/Table";
import StatusBadge from "../../components/StatusBadge";
import PageHeader from "../../components/PageHeader";
import employeeLeaveServices from "../../services/employeeLeaveServices.js";
import employeePermissionServices from "../../services/employeePermissionServices.js";

export default function EmployeeLeave() {

  const { data = {}, reload } = useFetch(employeeLeaveServices);
  const { data: permissionData = {}, reload: reloadPermissions } = useFetch(
    employeePermissionServices,
  );


  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const leaveHistory = data.leaveHistory || [];
  const stats = data.stats || {};
  const permissionHistory = permissionData.permissionHistory || [];

  const reloadAll = async () => {
    await Promise.all([reload(), reloadPermissions()]);
  };


  const statCards = [
  {
    title: "Leave Balance",
    value: stats.leaveBalance || 0,
    icon: CalendarX2,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    title: "Casual Leave",
    value: stats.casualLeave || 0,
    icon: CalendarDays,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Sick Leave",
    value: stats.sickLeave || 0,
    icon: HeartPulse,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Pending Requests",
    value: (stats.pendingRequests || 0) + (permissionData.stats?.pendingRequests || 0),
    icon: Clock3,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];


const formattedLeaves = leaveHistory.map((leave) => ({
  id: `leave-${leave.id}`,
  requestType: "Leave",
  leaveType: leave.leave_type,
  date:
    leave.start_date === leave.end_date
      ? leave.start_date
      : `${leave.start_date} - ${leave.end_date}`,
  duration: `${leave.days} Day${leave.days > 1 ? "s" : ""}`,
  reason: leave.reason,
  rejectionReason: leave.rejection_reason,
  status: leave.status,
  appliedAt: leave.applied_at,
}));

const formattedPermissions = permissionHistory.map((permission) => ({
  id: `permission-${permission.id}`,
  requestType: "Permission",
  leaveType: permission.permission_type,
  date: permission.permission_date,
  duration: permission.is_half_day
    ? "Half Day"
    : `${permission.start_time} - ${permission.end_time}`,
  reason: permission.reason,
  rejectionReason: permission.rejection_reason,
  status: permission.status,
  appliedAt: permission.applied_at,
}));

const combinedHistory = [...formattedLeaves, ...formattedPermissions].sort(
  (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
);


  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [showRequestPermission, setShowRequestPermission] = useState(false);


  // -------------------------
  // Table Columns
  // -------------------------

  const columns = [
    {
      key: "requestType",
      label: "REQUEST TYPE",
    },
    {
      key: "leaveType",
      label: "LEAVE TYPE",
    },
    {
      key: "date",
      label: "DATE",
    },
    {
      key: "duration",
      label: "DURATION",
    },
    {
      key: "reason",
      label: "REASON",
    },
    {
      key: "status",
      label: "STATUS",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "action",
      label: "ACTION",
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedLeave(row);
            setShowDetails(true);
          }}
          className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
        >
          <Eye size={18} />
          View Details
        </button>
      ),
    },
  ];


  return (
    <MainLayout title="Leave" icon={ShieldCheck}>
      <div className="space-y-6">
        <PageHeader title="Leave" />
        {/* Stat Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
            />
          ))}
        </div>

        {/* Leave History */}

        <div className="bg-white rounded-xl border border-gray-300">
          <div className="flex justify-between p-5">
            <div>
              <h2 className="text-xl font-semibold">Leave History</h2>

              <p className="text-gray-500">
                All your leave and permission requests.
              </p>
            </div>
            {/* Buttons */}

            <div className="flex gap-4">
              <button
                onClick={() => setShowRequestPermission(true)}
                className="bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-xl"
              >
                Request Permission
              </button>

              <button
                onClick={() => setShowApplyLeave(true)}
                className="bg-yellow-500 text-white px-5 py-3 rounded-xl"
              >
                Apply Leave
              </button>
            </div>
          </div>

          <Table columns={columns} data={combinedHistory} />
        </div>
      </div>

      {/* Apply Leave Modal */}

      {showApplyLeave && (
        <Modal onClose={() => setShowApplyLeave(false)}>
          <Applyleave
            onClose={() => setShowApplyLeave(false)}
            reload={reload}
          />
        </Modal>
      )}

      {/* Request Permission Modal */}

      {showRequestPermission && (
        <Modal onClose={() => setShowRequestPermission(false)}>
          <RequestPermission
            onClose={() => setShowRequestPermission(false)}
            reload={reloadAll}
          />
        </Modal>
      )}
      {showDetails && selectedLeave && (
        <Modal onClose={() => setShowDetails(false)}>
          <div className="w-full max-w-lg p-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedLeave.requestType === "Permission"
                ? "Permission Request Details"
                : "Leave Request Details"}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500">
                  {selectedLeave.requestType === "Permission" ? "Permission Type" : "Leave Type"}
                </p>
                <p className="font-medium text-gray-900">
                  {selectedLeave.leaveType}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {selectedLeave.date}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">
                  {selectedLeave.duration}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Your Reason</p>
                <p className="font-medium text-gray-900">
                  {selectedLeave.reason || "No reason provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>

                <div className="mt-1">
                  <StatusBadge status={selectedLeave.status} />
                </div>
              </div>

              {selectedLeave.status === "Rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-700">
                    HR Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-red-600">
                    {selectedLeave.rejectionReason ||
                      "No rejection reason was provided."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg"
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