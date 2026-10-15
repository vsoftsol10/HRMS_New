// import EmployeeAnnouncements from "../EmployeeDashboard/EmployeeAnnouncements";

// // Same announcements list interns and employees both read (backend now
// // allows the Intern role on this endpoint too).
// export default function InternAnnouncements() {
//   return <EmployeeAnnouncements />;
// }

import PageLoader from "../../components/PageLoader.jsx";
import { useState } from "react";
import { Megaphone, User, X } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import Modal from "../../components/Modal/Modal";
import useFetch from "../../hooks/useFetch";
import employeeAnnouncementServices from "../../services/employeeAnnouncementServices";

// "2026-09-08T10:00:00Z" -> "08 Sept 2026"
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const posterName = (item) => item.employees?.first_name || "HR Department";

export default function InternAnnouncements() {
  const { data, loading, error, reload } = useFetch(employeeAnnouncementServices);
  const [selected, setSelected] = useState(null);

  const announcements = Array.isArray(data) ? data : [];

  return (
    <MainLayout title="Announcements">
      <div className="space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with the latest news and updates.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">Unable to load announcements.</p>
            <button
              type="button"
              onClick={reload}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading && announcements.length === 0 && (
          <PageLoader className="min-h-[30vh]" />
        )}

        {!loading && !error && announcements.length === 0 && (
          <p className="text-gray-500">No announcements available.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6"
            >
              <span className="h-9 w-9 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Megaphone size={16} className="text-yellow-500" />
              </span>

              <h2 className="text-base font-bold text-gray-900 mt-5">{item.title}</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between gap-3 mt-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-8 w-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                    <User size={14} className="text-slate-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {posterName(item)}
                    </p>
                    <p className="text-[11px] text-gray-500">{formatDate(item.created_at)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="shrink-0 text-xs font-semibold text-orange-500 hover:text-orange-600 cursor-pointer"
                >
                  Read More
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="w-full max-w-lg space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              {posterName(selected)} · {formatDate(selected.created_at)}
            </p>

            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {selected.description}
            </p>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}