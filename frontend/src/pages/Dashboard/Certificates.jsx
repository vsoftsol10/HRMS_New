import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Calendar, Download, Eye, Mail, Plus, Search, X } from "lucide-react";
import { saveAs } from "file-saver";

import useFetch from "../../hooks/useFetch";
import certificateServices from "../../services/certificateServices";
import MainLayout from "../../components/Layout/layout";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import CustomSelect from "../../components/AddForm/Dropdown";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import CertificateStatusBadge from "../../components/Certificate/CertificateStatusBadge";
import CertificatePreviewModal from "../../components/Certificate/CertificatePreviewModal";
import MailSuccessModal from "../../components/Certificate/MailSuccessModal";
import {
  certificateFileName,
  renderCertificatePdf,
} from "../../utils/certificateRenderer";
import { formatDate } from "../../utils/internUtils";

const STATUS_OPTIONS = ["Draft", "Issued", "Sent"];
const TYPE_OPTIONS = ["Internship Completion Certificate"];

const EMPTY_FILTERS = { search: "", type: "", status: "", date: "" };

export default function Certificates() {
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();

  const { data: certificates = [], loading, error, reload } = useFetch(certificateServices);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null); // { certificate, templateUrl }
  const [sent, setSent] = useState(null); // certificate that was just emailed

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return certificates.filter((certificate) => {
      if (filters.type && certificate.certificate_type !== filters.type) return false;
      if (filters.status && certificate.status !== filters.status) return false;
      if (filters.date && String(certificate.certificate_date).slice(0, 10) !== filters.date) {
        return false;
      }

      if (!search) return true;

      return [certificate.intern_name, certificate.intern_email, certificate.certificate_code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [certificates, filters]);

  const hasFilters = Object.values(filters).some(Boolean);

  const showError = (title, err, fallback) =>
    alert({
      title,
      message: err.response?.data?.message || err.message || fallback,
      type: "error",
    });

  // Download / Send / View need the full record (it carries the signed URL of
  // an uploaded template), the list rows do not.
  const loadFull = (row) => certificateServices.getById(row.id);

  const handleView = async (row) => {
    try {
      setBusyId(row.id);
      const certificate = await loadFull(row);
      setPreview({ certificate, templateUrl: certificate.template_url });
    } catch (err) {
      await showError("Error", err, "Unable to open the certificate.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (row) => {
    try {
      setBusyId(row.id);
      const certificate = await loadFull(row);
      const pdf = await renderCertificatePdf({
        templateUrl: certificate.template_url,
        certificate,
      });

      saveAs(pdf.output("blob"), certificateFileName(certificate));
      await certificateServices.markIssued(row.id);
      reload();
    } catch (err) {
      await showError("Download Failed", err, "Unable to download the certificate.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSend = async (row) => {
    if (!row.intern_email) {
      await alert({
        title: "No Email",
        message: `${row.intern_name} has no email address on file.`,
        type: "error",
      });
      return;
    }

    const isConfirmed = await confirm({
      title: row.status === "Sent" ? "Send Again" : "Send Certificate",
      message: `Email ${row.certificate_code} to ${row.intern_name} (${row.intern_email})?`,
    });

    if (!isConfirmed) return;

    try {
      setBusyId(row.id);
      const certificate = await loadFull(row);
      const pdf = await renderCertificatePdf({
        templateUrl: certificate.template_url,
        certificate,
      });

      await certificateServices.send(
        row.id,
        pdf.output("blob"),
        certificateFileName(certificate),
      );

      setSent(certificate);
      reload();
    } catch (err) {
      await showError("Send Failed", err, "Unable to send the certificate.");
    } finally {
      setBusyId(null);
    }
  };

  const iconButton =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-slate-800 hover:bg-gray-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const columns = [
    {
      key: "certificate_code",
      label: "Certificate ID",
      render: (value) => <span className="font-semibold">{value}</span>,
    },
    {
      key: "intern_name",
      label: "Intern Name",
      render: (value, row) => (
        <span>
          <span className="block font-semibold">{value}</span>
          <span className="block text-sm text-gray-500">{row.intern_email || "-"}</span>
        </span>
      ),
    },
    { key: "role", label: "Role" },
    { key: "department", label: "Department", render: (value) => value || "-" },
    {
      key: "certificate_date",
      label: "Issued Date",
      render: (value) => formatDate(value),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <CertificateStatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="View certificate"
            disabled={busyId === row.id}
            onClick={() => handleView(row)}
            className={iconButton}
          >
            <Eye size={18} />
          </button>

          <button
            type="button"
            title="Download PDF"
            disabled={busyId === row.id}
            onClick={() => handleDownload(row)}
            className={iconButton}
          >
            <Download size={18} />
          </button>

          <button
            type="button"
            title={row.status === "Sent" ? "Send again" : "Send by email"}
            disabled={busyId === row.id}
            onClick={() => handleSend(row)}
            className={iconButton}
          >
            <Mail size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Certificate" icon={Award}>
      <div className="space-y-6">
        <PageHeader
          title="Certificate"
          description="Issue, track and manage internship completion certificates."
          actions={[
            {
              label: "Issue Certificate",
              icon: Plus,
              onClick: () => navigate("/admin/certificates/new"),
            },
          ]}
        />

        <div className="flex flex-wrap items-end gap-4">
          <label className="relative min-w-64 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search intern name..."
              className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 outline-none focus:border-yellow-400"
            />
          </label>

          <div className="w-64">
            <CustomSelect
              value={filters.type}
              placeholder="All certificate types"
              options={TYPE_OPTIONS}
              onChange={(value) => setFilters({ ...filters, type: value })}
            />
          </div>

          <div className="w-52">
            <CustomSelect
              value={filters.status}
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              onChange={(value) => setFilters({ ...filters, status: value })}
            />
          </div>

          <label className="relative w-52">
            <Calendar
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 text-gray-700 outline-none focus:border-yellow-400"
            />
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="flex h-12 items-center gap-1.5 rounded-xl px-3 text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-300 bg-red-50 p-4">
            <p className="text-red-700">Unable to load certificates. Please try again.</p>
            <button
              type="button"
              onClick={reload}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 hover:bg-red-100 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="rounded-xl border border-gray-300 bg-white shadow-sm">
          <Table columns={columns} data={filtered} />

          {!filtered.length && !error && (
            <p className="px-5 pb-6 text-center text-gray-500">
              {loading
                ? "Loading certificates..."
                : hasFilters
                  ? "No certificates match your filters."
                  : "No certificates issued yet. Click Issue Certificate to create one."}
            </p>
          )}
        </div>
      </div>

      {preview && (
        <CertificatePreviewModal
          certificate={preview.certificate}
          templateUrl={preview.templateUrl}
          onClose={() => setPreview(null)}
        />
      )}

      {sent && (
        <MailSuccessModal
          internName={sent.intern_name}
          subtitle={sent.role}
          onDone={() => setSent(null)}
        />
      )}
    </MainLayout>
  );
}