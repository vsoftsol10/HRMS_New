  import { useState } from "react";
  import { Megaphone, Plus } from "lucide-react";

  import PageHeader from "../../components/PageHeader";
  import Modal from "../../components/Modal/Modal";
  import AddAnnouncement from "../../components/Announcement/AddAnnouncement";
  import MainLayout from "../../components/Layout/layout";

  import useFetch from "../../hooks/useFetch";
  import announcementServices from "../../services/announcementServices";
  import Table from "../../components/Table";
  import ActionMenu from "../../components/ActionMenu";
  import Filters from "../../components/Filter/Filter";
  import departmentServices from "../../services/departmentServices";
  import { useDialog } from "../../components/Dialogbox/DialogContext";

  export default function Announcements() {
    const { confirm } = useDialog();

    const { data: departments = [] } = useFetch(departmentServices);

    const { data: announcements = [], reload } = useFetch(announcementServices);

 const departmentOptions = [
   ...departments.map((dept) => ({
     label: dept.department_name,
     value: dept.id,
   })),
 ];

  const departmentMap = Object.fromEntries(
    departments.map((dept) => [dept.id, dept.department_name]),
  );

const announcementData = announcements.map((item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  author: item.employees?.first_name,
  department: item.department || [],
  status: item.status || "Published",
  date: item.created_at,
}));

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    status: "",
  });

  const filteredAnnouncements = announcementData.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(filters.search.toLowerCase());

  const matchesDepartment =
    !filters.department || item.department.includes(filters.department);

    const matchesStatus = !filters.status || item.status === filters.status;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

    const [open, setOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    const columns = [
      {
        key: "title",
        label: "Title",
      },
      {
        key: "description",
        label: "Description",
        render: (value) =>
          value.length > 40 ? `${value.slice(0, 40)}...` : value,
      },
      {
        key: "author",
        label: "Posted By",
      },
      {
        key: "department",
        label: "Department",
        render: (value) => {
          if (!Array.isArray(value)) return "";

          // Announcement belongs to every department
          if (value.length === departments.length) {
            return "All Departments";
          }

          return value.map((id) => departmentMap[id] || id).join(", ");
        },
      },
      {
        key: "date",
        label: "Published Date",
        render: (value) => new Date(value).toLocaleDateString(),
      },
      {
        key: "status",
        label: "Status",
        render: (value) => (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium
          ${
            value === "Published"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
          >
            {value}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <ActionMenu
            announcement={row}
            onEdit={() => {
              setSelectedAnnouncement(row);
              setOpen(true);
            }}
            onDelete={() => handleDelete(row.id)}
          />
        ),
      },
    ];

    const handleDelete = async (id) => {
      if (!(await confirm({ title: "Delete Announcement", message: "Delete this announcement?" }))) return;

      await announcementServices.remove(id);
      reload();
    };

    return (
      <MainLayout title="Announcements" icon={Megaphone}>
        <div className="space-y-6">
          <PageHeader
            title="Announcements"
            description="Share important updates with the whole organization."
            actions={[
              {
                label: "Add Announcement",
                icon: Plus,
                onClick: () => {
                  setSelectedAnnouncement(null);
                  setOpen(true);
                },
              },
            ]}
          />
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <Filters
              filters={filters}
              setFilters={setFilters}
              searchPlaceholder="Search by title..."
              selects={[
                {
                  key: "department",
                  placeholder: "All Departments",
                  options: departmentOptions,
                },
                {
                  key: "status",
                  placeholder: "All Status",
                  options: ["Published", "Draft"],
                },
              ]}
            />
            <Table columns={columns} data={filteredAnnouncements} />
          </div>
        </div>

        {open && (
          <Modal
            onClose={() => {
              setOpen(false);
              setSelectedAnnouncement(null);
            }}
          >
            <AddAnnouncement
              announcement={selectedAnnouncement}
              reload={reload}
              onClose={() => {
                setOpen(false);
                setSelectedAnnouncement(null);
              }}
            />
          </Modal>
        )}
      </MainLayout>
    );
  }