import { useState } from "react";
import { PartyPopper, Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Modal from "../../components/Modal/Modal";
import HolidayCalendar from "../../components/Holidays/HolidayCalendar";
import AddHoliday from "../../components/Holidays/AddHolidays";
import useFetch from "../../hooks/useFetch";
import holidayServices from "../../services/holidayServices";

import MainLayout from "../../components/Layout/layout";

import ActionMenu from "../../components/ActionMenu";

import { useDialog } from "../../components/Dialogbox/DialogContext";

export default function Holidays({ isEmployee = false }) {
  const { alert, confirm } = useDialog();

  const [view, setView] = useState("list");
  const [open, setOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

const columns = [
  {
    key: "holiday",
    label: "Holiday",
  },
  {
    key: "displayDate",
    label: "Date",
  },
  {
    key: "type",
    label: "Type",
    render: (value) => (
      <span className="px-3 py-1 rounded-full bg-yellow-100 text-sm">
        {value}
      </span>
    ),
  },
  {
    key: "description",
    label: "Description",
  },

  ...(!isEmployee
    ? [
        {
          key: "actions",
          label: "Actions",
          render: (_, row) => (
            <ActionMenu
              onEdit={() => {
                setSelectedHoliday(row);
                setOpen(true);
              }}
              onDelete={() => handleDelete(row.id)}
            />
          ),
        },
      ]
    : []),
];

  const { data: holidays = [], reload } = useFetch(holidayServices);

  const holidayData = holidays.map((item) => ({
    id: item.id,
    holiday: item.holiday_name,
    date: item.holiday_date, // raw value for editing
    displayDate: new Date(item.holiday_date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    type: item.type,
    description: item.description || "-",
  }));

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Delete Holiday",
      message: "Are you sure you want to delete this holiday?",
    });

    if (!confirmed) return;

    try {
      await holidayServices.remove(id);

      await alert({
        title: "Success",
        message: "Holiday deleted successfully.",
        type: "success",
      });

      reload();
    } catch {
      await alert({
        title: "Error",
        message: "Failed to delete holiday.",
        type: "error",
      });
    }
  };

  return (
    <MainLayout title="Holidays" icon={PartyPopper}>
      <div className="space-y-6">
        <PageHeader
          title="Holidays"
          description="Manage your organization's holiday calendar for the year."
          actions={
            !isEmployee
              ? [
                  {
                    label: "Add Holiday",
                    icon: Plus,
                    onClick: () => {
                      setSelectedHoliday(null);
                      setOpen(true);
                    },
                  },
                ]
              : []
          }
        />

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setView("list")}
            className={`px-6 py-2 rounded-lg transition ${
              view === "list" ? "bg-white shadow font-medium" : "text-gray-500"
            }`}
          >
            List View
          </button>

          <button
            onClick={() => setView("calendar")}
            className={`px-6 py-2 rounded-lg transition ${
              view === "calendar"
                ? "bg-white shadow font-medium"
                : "text-gray-500"
            }`}
          >
            Calendar View
          </button>
        </div>

        {/* Content */}

        {view === "list" ? (
          <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
            <Table columns={columns} data={holidayData} />
          </div>
        ) : (
          <div>
            <HolidayCalendar holidays={holidays} />
          </div>
        )}

        {/* Modal */}
        {!isEmployee && open && (
          <Modal onClose={() => setOpen(false)}>
            <AddHoliday
              holiday={selectedHoliday}
              onClose={() => {
                setSelectedHoliday(null);
                setOpen(false);
              }}
              reload={reload}
            />
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}