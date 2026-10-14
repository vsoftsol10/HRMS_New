import { useEffect, useState } from "react";

import StatusBadge from "../StatusBadge";
import internServices from "../../services/internServices";
import { formatDate } from "../../utils/internUtils";

// HR -> intern detail -> Tasks tab. Read-only: mentors create the tasks from
// the Employee portal.
export default function InternTasks({ internId }) {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await internServices.getTasks(internId);
        if (!cancelled) setTasks(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load tasks.");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [internId]);

  return (
    <div>
      <h2 className="text-xl font-semibold">Tasks assigned by Employee / P.O.C</h2>
      <p className="text-gray-500 mt-1 mb-5">
        Tasks are assigned by the intern&apos;s Employee / P.O.C.
      </p>

      {error && <p className="text-red-600">{error}</p>}
      {!error && tasks === null && <p className="text-gray-500">Loading...</p>}

      {tasks && tasks.length === 0 && (
        <p className="py-8 text-center text-gray-500">
          No tasks have been assigned to this intern yet.
        </p>
      )}

      {tasks && tasks.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-300">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Task Name</th>
                <th className="px-4 py-3 font-medium">Assigned By</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 max-w-md">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{task.assigned_by_name || "-"}</td>
                  <td className="px-4 py-3">{formatDate(task.due_date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}