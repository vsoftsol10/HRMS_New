export default function StatusBadge({ status }) {
  const styles = {
    Paid: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    // Payroll lifecycle (payroll redesign): Draft -> Review -> Finalized -> Paid
    Draft: "bg-gray-100 text-gray-700",
    Review: "bg-yellow-100 text-yellow-700",
    Finalized: "bg-blue-100 text-blue-700",
    Rejected: "bg-red-100 text-red-600",
    Present: "bg-green-100 text-green-700",
    Absent: "bg-red-100 text-red-600",
    Late: "bg-orange-100 text-orange-700",
    OnLeave: "bg-blue-100 text-blue-700",
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-gray-100 text-gray-700",
    Approved: "bg-green-100 text-green-700",
    Probation: "bg-yellow-100 text-yellow-700",
    HalfDay: "bg-yellow-100 text-yellow-700",
    // Interns module
    "Ending Soon": "bg-orange-100 text-orange-700",
    Converted: "bg-blue-100 text-blue-700",
    Completed: "bg-cyan-100 text-cyan-700",
    // Intern task statuses
    "In Progress": "bg-blue-100 text-blue-700",
    Submitted: "bg-purple-100 text-purple-700",
    "Changes Requested": "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`px-4 py-1 rounded-full text-sm font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}