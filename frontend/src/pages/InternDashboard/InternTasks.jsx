import { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  Download,
  Eye,
  FileText,
  ListChecks,
  Loader,
  Upload,
  X,
} from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import Modal from "../../components/Modal/Modal";
import internPortalServices from "../../services/internPortalServices";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import {
  formatDate,
  formatFileSize,
  validateDocumentFile,
  DOCUMENT_ACCEPT,
} from "../../utils/internUtils";

const TABS = ["All Tasks", "Pending", "In Progress", "Completed", "Submitted"];
// Flow: Pending -> In Progress -> Completed -> (upload project) -> Submitted
const EDITABLE_STATUSES = ["Pending", "In Progress", "Completed", "Changes Requested"];
const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"]; // what the intern can pick
const SUBMIT_STATUSES = ["Completed", "Changes Requested"]; // project can be submitted only now

// pill background / text / dot colour per status (dot-style badge from the design)
const STATUS_STYLE = {
  Pending: { pill: "bg-gray-100 text-gray-700", dot: "bg-blue-500" },
  "In Progress": { pill: "bg-yellow-100 text-gray-800", dot: "bg-orange-500" },
  Submitted: { pill: "bg-gray-100 text-gray-800", dot: "bg-gray-900" },
  "Changes Requested": { pill: "bg-gray-100 text-gray-700", dot: "bg-gray-500" },
  Completed: { pill: "bg-green-50 text-green-700", dot: "bg-green-500" },
};

const actionLabel = (task) => {
  if (task.status === "Pending") return "Start Task";
  if (EDITABLE_STATUSES.includes(task.status)) return "View Task";
  return "View Submission";
};

// "2026-09-20" -> "Sep 20, 2026" (parsed as a local date to avoid UTC day shift)
const formatDueDate = (value) => {
  if (!value) return "-";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function InternTasks() {
  const [tab, setTab] = useState("All Tasks");
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskError, setTaskError] = useState("");

  const loadTasks = async () => {
    setTaskLoading(true);

    try {
      const data = await internPortalServices.getTasks();
      setTaskList(data);
      setTaskError("");
    } catch (err) {
      setTaskError(err.response?.data?.message || "Unable to load tasks.");
    } finally {
      setTaskLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setTaskLoading(true);

      try {
        const data = await internPortalServices.getTasks();
        if (cancelled) return;

        setTaskList(data);
        setTaskError("");
      } catch (err) {
        if (!cancelled) {
          setTaskError(err.response?.data?.message || "Unable to load tasks.");
        }
      } finally {
        if (!cancelled) setTaskLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = {
    "All Tasks": taskList.length,
    Pending: taskList.filter((t) => t.status === "Pending").length,
    "In Progress": taskList.filter((t) => t.status === "In Progress").length,
    Completed: taskList.filter((t) => t.status === "Completed").length,
    Submitted: taskList.filter((t) => t.status === "Submitted").length,
  };

  const filtered =
    tab === "All Tasks" ? taskList : taskList.filter((t) => t.status === tab);

  return (
    <MainLayout title="Tasks">
      <div className="space-y-6">
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            View, work on, and submit your assigned tasks.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          <TopStat icon={ListChecks} iconBg="bg-green-50" iconColor="text-green-600" value={counts["All Tasks"]} label="All Tasks" />
          <TopStat icon={Clock} iconBg="bg-red-50" iconColor="text-red-500" value={counts.Pending} label="Pending" />
          <TopStat icon={Loader} iconBg="bg-orange-50" iconColor="text-orange-500" value={counts["In Progress"]} label="In Progress" />
          <TopStat icon={CheckCheck} iconBg="bg-green-50" iconColor="text-green-600" value={counts.Completed} label="Completed" />
          <TopStat icon={CircleCheck} iconBg="bg-blue-50" iconColor="text-blue-500" value={counts.Submitted} label="Submitted" />
        </div>

        {taskError && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4">
            <p className="text-red-700">{taskError}</p>
            <button
              type="button"
              onClick={loadTasks}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tabs + table */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex w-fit gap-1 rounded-xl bg-gray-100 p-1 mb-5">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                  tab === name
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-gray-200 text-xs font-medium tracking-wide text-gray-500">
                  <th className="py-3 pr-6">TASK TITLE</th>
                  <th className="py-3 pr-6">ASSIGNED BY</th>
                  <th className="py-3 pr-6">DUE DATE</th>
                  <th className="py-3 pr-6">STATUS</th>
                  <th className="py-3 text-right">ACTION</th>
                </tr>
              </thead>

              <tbody>
                {taskLoading && taskList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                )}

                {!taskLoading && !filtered.length && !taskError && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      No tasks here yet.
                    </td>
                  </tr>
                )}

                {filtered.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100">
                    <td className="py-4 pr-6 text-sm font-semibold text-gray-900">
                      {task.title}
                    </td>
                    <td className="py-4 pr-6 text-sm text-gray-600 whitespace-nowrap">
                      {task.assigned_by_name || "-"}
                    </td>
                    <td className="py-4 pr-6 text-sm text-gray-600 whitespace-nowrap">
                      {formatDueDate(task.due_date)}
                    </td>
                    <td className="py-4 pr-6">
                      <TaskStatusPill status={task.status} />
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-orange-500 hover:text-orange-600 cursor-pointer whitespace-nowrap"
                      >
                        {actionLabel(task)}
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onChanged={() => {
            loadTasks();
            setSelectedTask(null);
          }}
          onStatusChange={(id, status) => {
            setTaskList((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
            setSelectedTask((t) => (t && t.id === id ? { ...t, status } : t));
          }}
        />
      )}
    </MainLayout>
  );
}

function TopStat({ icon: Icon, iconBg, iconColor, value, label }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <span className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon size={17} className={iconColor} />
      </span>
      <p className="text-3xl font-bold text-gray-900 mt-4">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function TaskStatusPill({ status }) {
  const style = STATUS_STYLE[status] || { pill: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

function TaskModal({ task, onClose, onChanged, onStatusChange }) {
  const { alert } = useDialog();
  const fileInputRef = useRef(null);

  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [busy, setBusy] = useState(false);

  const editable = EDITABLE_STATUSES.includes(task.status);
  const canSubmit = SUBMIT_STATUSES.includes(task.status);
  // "Changes Requested" is set by the mentor - show it, but don't offer it as a choice.
  const statusOptions = STATUS_OPTIONS.includes(task.status)
    ? STATUS_OPTIONS
    : [task.status, ...STATUS_OPTIONS];

  const chooseFile = (chosen) => {
    if (!chosen) return;

    const problem = validateDocumentFile(chosen);
    if (problem) {
      setFileError(problem);
      return;
    }

    setFileError("");
    setFile(chosen);
  };

  const handleStatusChange = async (nextStatus) => {
    if (nextStatus === task.status) return;

    setBusy(true);
    try {
      await internPortalServices.updateTaskStatus(task.id, nextStatus);
      onStatusChange(task.id, nextStatus);
    } catch (err) {
      await alert({ title: "Error", message: err.response?.data?.message || "Unable to update the task status.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setFileError("Attach a file before submitting.");
      return;
    }

    setBusy(true);
    try {
      await internPortalServices.submitTask(task.id, { file, comment });
      await alert({ title: "Task Submitted", message: `"${task.title}" was submitted successfully.`, type: "success" });
      onChanged();
    } catch (err) {
      await alert({ title: "Error", message: err.response?.data?.message || "Unable to submit the task.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const viewSubmission = async (download) => {
    const newTab = download ? null : window.open("", "_blank");

    try {
      const url = await internPortalServices.getSubmissionUrl(task.id, { download });

      if (download) window.location.assign(url);
      else if (newTab) {
        newTab.opener = null;
        newTab.location.href = url;
      }
    } catch (err) {
      newTab?.close();
      await alert({ title: "Error", message: err.response?.data?.message || "Unable to open the submission.", type: "error" });
    }
  };

  return (
    <Modal onClose={busy ? undefined : onClose}>
      <div className="w-full space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold">Today Task</h2>
          <button type="button" onClick={onClose} disabled={busy} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="rounded-xl border border-gray-300 p-4">
          <p className="text-sm text-gray-500">Description</p>
          <p className="mt-1 whitespace-pre-line">{task.title}{task.description ? `. ${task.description}` : ""}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-300 p-4">
            <p className="text-sm text-gray-500">Assigned By</p>
            <p className="font-medium mt-1">{task.assigned_by_name || "-"}</p>
          </div>
          <div className="rounded-xl border border-gray-300 p-4">
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium mt-1">{formatDate(task.due_date)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-300 p-4 inline-block">
          <p className="text-sm text-gray-500 mb-1">Status</p>

          {editable ? (
            <div className="relative inline-block">
              <select
                value={task.status}
                disabled={busy}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="appearance-none rounded-full border border-gray-900 bg-white pl-3 pr-8 py-1 text-xs font-medium cursor-pointer outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option} disabled={!STATUS_OPTIONS.includes(option)}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <TaskStatusPill status={task.status} />
          )}
        </div>

        {!editable && task.submission_file_name && (
          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-semibold mb-3">Your Submission</h3>
            <div className="flex items-center gap-3 rounded-xl border border-gray-300 p-3">
              <FileText className="shrink-0 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.submission_file_name}</p>
                {task.submission_comment && <p className="text-sm text-gray-500">{task.submission_comment}</p>}
                <p className="text-xs text-gray-400">Submitted {formatDate(task.submitted_at)}</p>
              </div>
              <button type="button" title="View" onClick={() => viewSubmission(false)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Eye size={18} />
              </button>
              <button type="button" title="Download" onClick={() => viewSubmission(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
                <Download size={18} />
              </button>
            </div>
          </div>
        )}

        {editable && !canSubmit && (
          <p className="border-t border-gray-200 pt-5 text-sm text-gray-500">
            Set the status to <span className="font-medium text-gray-700">Completed</span> when you finish the task, then submit your project here.
          </p>
        )}

        {canSubmit && (
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="font-semibold">Submit Work</h3>

            <div>
              <label className="block mb-2 font-medium">Upload Work</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="hidden"
                onChange={(e) => chooseFile(e.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 text-gray-500 hover:border-yellow-400 cursor-pointer"
              >
                <Upload size={18} />
                {file ? file.name : "Click to upload a file"}
              </button>

              {file && <p className="text-sm text-gray-500 mt-1">{formatFileSize(file.size)}</p>}
              {fileError && <p className="text-sm text-red-500 mt-1">{fileError}</p>}
            </div>

            <div>
              <label className="block mb-2 font-medium">Comment</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a short comment about your submission"
                className="w-full border border-gray-400 rounded-lg px-3 py-3 outline-none shadow-sm focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-5 py-3 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 cursor-pointer disabled:opacity-50"
              >
                {busy ? "Submitting..." : "Submit Task"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}