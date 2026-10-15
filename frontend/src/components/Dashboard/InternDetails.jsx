import PageLoader from "../PageLoader.jsx";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, Pencil, TriangleAlert } from "lucide-react";

import MainLayout from "../../components/Layout/layout";
import StatusBadge from "../../components/StatusBadge";
import InternDocuments from "../../components/Interns/InternDocuments";
import InternTasks from "../../components/Interns/InternTasks";
import InternStipendHistory from "../../components/Interns/InternStipendHistory";
import InternCoveragePanel from "../../components/Interns/InternCoveragePanel";
import internServices from "../../services/internServices";
import {
  formatDate,
  formatStipend,
  getInitials,
} from "../../utils/internUtils";

const TABS = ["Personal", "Internship", "Documents", "Tasks", "Stipend"];

function Field({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium mt-1 break-words">{value || "-"}</p>
    </div>
  );
}

const endingSoonMessage = (days) => {
  if (days > 1) return `Internship ends in ${days} days.`;
  if (days === 1) return "Internship ends tomorrow.";
  if (days === 0) return "Internship ends today.";

  return "The internship end date has passed.";
};

export default function InternDetails() {
  const { id } = useParams();

  const [intern, setIntern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Personal");

  // Bumped after a document upload/delete so the intern is re-fetched in the
  // background (no loading flash - `loading` only matters for the first load).
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await internServices.getById(id);
        if (cancelled) return;

        setIntern(data);
        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(
          err.response?.status === 404
            ? "Intern not found."
            : err.response?.data?.message || "Unable to load this intern.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  if (loading || error || !intern) {
    return (
      <MainLayout title="Intern" icon={GraduationCap}>
        <div className="space-y-4">
          <Link
            to="/admin/interns"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft size={18} /> Back to Interns
          </Link>

          {error ? <p className="text-red-600">{error}</p> : <PageLoader />}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Intern" icon={GraduationCap}>
      <div className="space-y-6">
        <Link
          to="/admin/interns"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} /> Back to Interns
        </Link>

        <div className="rounded-xl border border-gray-300 bg-white shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="h-16 w-16 shrink-0 rounded-full bg-yellow-100 text-yellow-700 text-xl font-semibold flex items-center justify-center">
            {getInitials(intern.full_name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{intern.full_name}</h1>
              <StatusBadge status={intern.display_status} />
            </div>

            <p className="text-gray-600 mt-1">
              {[intern.designation, intern.department_name, intern.intern_code]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              P.O.C: {intern.mentor_name || "Not assigned"} ·{" "}
              {formatDate(intern.start_date)} — {formatDate(intern.end_date)}
            </p>
          </div>

          {intern.status !== "Converted" && (
            <Link
              to={`/admin/interns/${intern.id}/edit`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 hover:shadow-lg transition"
            >
              <Pencil size={18} />
              Edit
            </Link>
          )}
        </div>

        {intern.display_status === "Ending Soon" && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 flex items-center gap-2 text-yellow-800">
            <TriangleAlert size={18} />
            {endingSoonMessage(intern.days_left)}
          </div>
        )}

        <div
          role="tablist"
          className="flex gap-1 rounded-xl bg-gray-200 p-1 overflow-x-auto"
        >
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition ${
                tab === name
                  ? "bg-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-300 bg-white shadow-sm p-6">
          {tab === "Personal" && (
            <div>
              <h2 className="text-xl font-semibold mb-5">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Intern ID" value={intern.intern_code} />
                <Field label="Full Name" value={intern.full_name} />
                <Field label="Gender" value={intern.gender} />
                <Field
                  label="Date of Birth"
                  value={intern.date_of_birth && formatDate(intern.date_of_birth)}
                />
                <Field label="Phone" value={intern.phone} />
                <Field label="Email" value={intern.email} />
                <div className="md:col-span-3">
                  <Field label="Address" value={intern.address} />
                </div>
              </div>
            </div>
          )}

          {tab === "Internship" && (
            <div>
              <h2 className="text-xl font-semibold mb-5">
                Internship Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Department" value={intern.department_name} />
                <Field
                  label="Internship Position / Role"
                  value={intern.designation}
                />
                <Field
                  label="Employee / P.O.C"
                  value={
                    intern.mentor_name &&
                    `${intern.mentor_name} (${intern.mentor_code})`
                  }
                />
                <Field label="Internship Type" value={intern.internship_type} />
                <Field
                  label="Joining Date"
                  value={formatDate(intern.start_date)}
                />
                <Field label="End Date" value={formatDate(intern.end_date)} />
                <Field
                  label="Stipend"
                  value={formatStipend(intern.monthly_stipend).replace(
                    "/mo",
                    " / month",
                  )}
                />
                <Field
                  label="Internship Fee / Rate"
                  value={
                    intern.internship_fee !== null &&
                    `₹${Number(intern.internship_fee).toLocaleString("en-IN")}`
                  }
                />
                <Field label="Login ID" value={intern.login_id} />
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <InternCoveragePanel intern={intern} />
              </div>
            </div>
          )}

          {tab === "Documents" && (
            <InternDocuments
              internId={intern.id}
              documents={intern.documents}
              onChanged={reload}
            />
          )}

          {tab === "Tasks" && <InternTasks internId={intern.id} />}

          {tab === "Stipend" && <InternStipendHistory intern={intern} />}
        </div>
      </div>
    </MainLayout>
  );
}