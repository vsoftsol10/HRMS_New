import { Megaphone } from "lucide-react";

export default function AnnouncementCard({ item }) {
  return (
    <div className="rounded-2xl border border-gray-300 shadow-lg p-6">
      <div className="flex justify-between items-start">
        <div className="p-3 rounded-xl bg-yellow-50">
          <Megaphone className="text-yellow-600" />
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-6">{item.title}</h3>

      <p className="text-gray-500 mt-2">
        {item.date} • {item.department}
      </p>

      <p className="mt-4 text-gray-700 leading-8">{item.description}</p>
    </div>
  );
}
