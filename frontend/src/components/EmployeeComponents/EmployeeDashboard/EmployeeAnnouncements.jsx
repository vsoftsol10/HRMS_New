import { Megaphone } from "lucide-react";

export default function EmployeeAnnouncements({ announcements = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
          <Megaphone size={22} className="text-yellow-600" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">Recent Announcements</h2>

          <p className="text-sm text-gray-500">Latest from your company</p>
        </div>
      </div>

      {/* Announcement List */}
      <div className="mt-6 space-y-4">
        {announcements.length > 0 ? (
          announcements.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))
        ) : (
          <p className="text-sm text-gray-500">No announcements available.</p>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement }) {
  const formattedDate = announcement.created_at
    ? new Date(announcement.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  return (
    <div className="rounded-2xl border border-gray-300 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{announcement.title}</h3>

          <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
        </div>
      </div>

      <p className="mt-4 text-gray-700 leading-7">{announcement.description}</p>
    </div>
  );
}
