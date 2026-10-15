import PageLoader from "../PageLoader.jsx";
import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import Modal from "../Modal/Modal";
import Button from "../Button";
import FormInput from "../AddForm/FormInput";
import CustomSelect from "../AddForm/Dropdown";
import StatusBadge from "../StatusBadge";
import useFetch from "../../hooks/useFetch";
import internServices from "../../services/internServices";
import employeeServices from "../../services/employeeServices";
import { useDialog } from "../Dialogbox/DialogContext";
import { formatLocalDate } from "../../utils/dateUtils";
import { formatDate } from "../../utils/internUtils";

// HR -> intern detail -> Internship tab: temporary mentor coverage.
// HR picks the covering employee and the dates manually; during that window
// the covering employee sees the intern under "Temporary Coverage" in the
// Employee portal and can assign tasks.
export default function InternCoveragePanel({ intern }) {
  const { confirm, alert } = useDialog();

  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = () => setReloadKey((key) => key + 1);

  const canAssign = intern.status === "Active" && Boolean(intern.mentor_employee_id);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await internServices.getCoverage(intern.id);
        if (cancelled) return;

        setRows(data);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load coverage.");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [intern.id, reloadKey]);

  const handleRemove = async (row) => {
    const isConfirmed = await confirm({
      title: "Remove Coverage",
      message: `Remove ${row.covering_name}'s coverage (${formatDate(row.start_date)} — ${formatDate(row.end_date)})?`,
    });

    if (!isConfirmed) return;

    try {
      await internServices.removeCoverage(intern.id, row.id);
      reload();
    } catch (err) {
      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to remove coverage.",
        type: "error",
      });
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Temporary Coverage</h2>
          <p className="text-gray-500 mt-1">
            While the mentor is away, HR can assign another employee to look
            after this intern for a date range.
          </p>
        </div>

        {canAssign && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 font-medium hover:bg-yellow-300 cursor-pointer"
          >
            <Plus size={16} />
            Assign Coverage
          </button>
        )}
      </div>

      {!canAssign && (
        <p className="mb-4 text-sm text-gray-500">
          {intern.status !== "Active"
            ? "Coverage can only be set for active interns."
            : "Assign a mentor to this intern (Edit) to enable temporary coverage."}
        </p>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {!error && rows === null && <PageLoader className="min-h-[30vh]" />}

      {rows && rows.length === 0 && (
        <p className="py-4 text-gray-500">No temporary coverage set.</p>
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-300 p-4"
            >
              <div>
                <p className="font-semibold">
                  {row.covering_name || "Former employee"}
                  {row.covering_code && (
                    <span className="ml-2 font-normal text-gray-500">
                      ({row.covering_code})
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(row.start_date)} — {formatDate(row.end_date)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={row.status} />
                <button
                  type="button"
                  title="Remove coverage"
                  onClick={() => handleRemove(row)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <AssignCoverageModal
          intern={intern}
          onClose={() => setModalOpen(false)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function AssignCoverageModal({ intern, onClose, onSaved }) {
  const { alert } = useDialog();
  const { data: employees = [] } = useFetch(employeeServices);

  const today = formatLocalDate(new Date());

  const [form, setForm] = useState({
    covering_employee_id: "",
    start_date: "",
    end_date: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Anyone except the mentor (the mentor is the one being covered).
  const options = employees
    .filter((employee) => employee.id !== intern.mentor_employee_id)
    .map((employee) => ({
      label: `${employee.first_name} (${employee.employee_code})`,
      value: employee.id,
    }));

  const setField = (name, value) => {
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.covering_employee_id) {
      nextErrors.covering_employee_id = "Select the covering employee.";
    }
    if (!form.start_date) nextErrors.start_date = "Start date is required.";
    if (!form.end_date) nextErrors.end_date = "End date is required.";
    else if (form.start_date && form.end_date < form.start_date) {
      nextErrors.end_date = "End date cannot be before the start date.";
    } else if (form.end_date < today) {
      nextErrors.end_date = "Coverage must end today or later.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);

    try {
      await internServices.addCoverage(intern.id, form);
      onSaved();
      onClose();
    } catch (err) {
      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to save coverage.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit} noValidate className="w-full space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Assign Coverage</h2>
            <p className="text-gray-500">
              {intern.full_name} · mentor {intern.mentor_name}
            </p>
          </div>

          <button
            type="button"
            title="Close"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <CustomSelect
          label="Covering Employee *"
          options={options}
          value={form.covering_employee_id}
          placeholder="Select employee"
          error={errors.covering_employee_id}
          onChange={(value) => setField("covering_employee_id", value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormInput
            label="From *"
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={(event) => setField("start_date", event.target.value)}
            error={errors.start_date}
          />
          <FormInput
            label="To *"
            name="end_date"
            type="date"
            value={form.end_date}
            onChange={(event) => setField("end_date", event.target.value)}
            error={errors.end_date}
            min={form.start_date || today}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} loadingText="Saving...">
            Assign Coverage
          </Button>
        </div>
      </form>
    </Modal>
  );
}