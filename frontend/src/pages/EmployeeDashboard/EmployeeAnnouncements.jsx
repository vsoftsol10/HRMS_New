import { Search, LayoutGrid, List } from "lucide-react";
import { useMemo, useState } from "react";

import MainLayout from "../../components/Layout/layout";
import PageHeader from "../../components/PageHeader";
import AnnouncementCard from "../../components/Announcement/AnnouncementCard";
import Table from "../../components/Table";

import useFetch from "../../hooks/useFetch";
import employeeAnnouncementServices from "../../services/employeeAnnouncementServices";
import departmentServices from "../../services/departmentServices";



export default function EmployeeAnnouncements() {
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");

  const { data: announcements = [] } = useFetch(employeeAnnouncementServices);
  const { data: departments = [] } = useFetch(departmentServices);

  const departmentMap = Object.fromEntries(
    departments.map((dept) => [dept.id, dept.department_name]),
  );

const formattedAnnouncements = announcements.map((item) => ({
  ...item,

  date: item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-",

  department: item.department?.includes("All")
    ? "All Departments"
    : item.department?.map((id) => departmentMap[id] || id).join(", "),
}));

  const filteredAnnouncements = useMemo(() => {
    return formattedAnnouncements.filter((item) => {
      const value = search.toLowerCase();

      return (
        item.title?.toLowerCase().includes(value) ||
        item.department?.toLowerCase().includes(value) ||
        item.description?.toLowerCase().includes(value)
      );
    });
  }, [search, formattedAnnouncements]);

  const columns = [
    {
      key: "title",
      label: "TITLE",
    },
    {
      key: "department",
      label: "DEPARTMENT",
    },
    {
      key: "date",
      label: "DATE",
    },
    {
      key: "description",
      label: "DESCRIPTION",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Announcements" />

        <div className="rounded-2xl border border-gray-300 bg-white overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex">
              {/* Search */}
              <div className="relative w-full pr-2">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 rounded-xl border border-gray-300 pl-12 outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* View Toggle */}
              <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setView("list")}
                  className={`p-3 transition ${
                    view === "list" ? "bg-yellow-500 text-white" : "bg-white"
                  }`}
                >
                  <List size={18} />
                </button>

                <button
                  onClick={() => setView("grid")}
                  className={`p-3 transition ${
                    view === "grid" ? "bg-yellow-500 text-white" : "bg-white"
                  }`}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {view === "grid" && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((item) => (
                  <AnnouncementCard key={item.id} item={item} />
                ))
              ) : (
                <p className="text-gray-500 col-span-full">
                  No announcements available.
                </p>
              )}
            </div>
          )}

          {/* List View */}
          {view === "list" && (
            <Table columns={columns} data={filteredAnnouncements} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
