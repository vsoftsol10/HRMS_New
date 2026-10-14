import { useNavigate } from "react-router-dom";

export default function RecentLeaveRequests({ requests }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-300 rounded-3xl">
      <div className="p-6 flex justify-between">
        <h2 className="text-2xl font-semibold">Recent Leave Requests</h2>

        <button
          className="font-medium"
          onClick={() => navigate("/admin/leavemanagement")}
        >
          View all
        </button>
      </div>

      {requests.length === 0 ? (
        <p className="p-6 text-gray-500 text-center">
          No recent leave requests
        </p>
      ) : (
        requests.map((item, index) => {
          const days =
            Math.ceil(
              (new Date(item.end_date) - new Date(item.start_date)) /
                (1000 * 60 * 60 * 24),
            ) + 1;

          return (
            <div
              key={index}
              className="flex justify-between items-center p-6 border-t border-gray-200"
            >
              <div>
                <h3 className="font-medium text-xl">
                  {item.employees.first_name}
                </h3>

                <p className="text-gray-500">
                  {item.leave_type} • {days} day{days > 1 ? "s" : ""}
                </p>
              </div>

              <span
                className={`px-4 py-1 rounded-full text-sm ${
                  item.status === "Approved"
                    ? "bg-green-100 text-green-600"
                    : item.status === "Rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-orange-100 text-orange-700"
                }`}
              >
                {item.status}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}