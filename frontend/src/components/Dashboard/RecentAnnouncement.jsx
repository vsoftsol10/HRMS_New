import { useNavigate } from "react-router-dom";

export default function RecentAnnouncements({ announcements = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-300 rounded-3xl p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-semibold">Recent Announcements</h2>

        <button
          className="font-medium"
          onClick={() => navigate("/admin/announcements")}
        >
          View all
        </button>
      </div>

      <div className="space-y-6">
        {announcements.length > 0 ? (
          announcements.map((item) => (
            <div key={item.id} className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-xl">{item.title}</h3>

              <p className="text-gray-500 mt-1">{item.description}</p>

              <p className="text-gray-400 mt-2 text-sm">
                {item.employees?.first_name || "Unknown"} •{" "}
                {new Date(item.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-6">
            No recent announcements.
          </p>
        )}
      </div>
    </div>
  );
}
