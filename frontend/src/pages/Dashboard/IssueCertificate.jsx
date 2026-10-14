import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award } from "lucide-react";
import { saveAs } from "file-saver";

import MainLayout from "../../components/Layout/layout";
import { useDialog } from "../../components/Dialogbox/DialogContext";
import CertificateStepper from "../../components/Certificate/CertificateStepper";
import TemplateStep from "../../components/Certificate/TemplateStep";
import DetailsStep from "../../components/Certificate/DetailsStep";
import PreviewStep from "../../components/Certificate/PreviewStep";
import MailSuccessModal from "../../components/Certificate/MailSuccessModal";
import certificateServices from "../../services/certificateServices";
import internServices from "../../services/internServices";
import {
  BUILT_IN_TEMPLATE,
  certificateFileName,
  renderCertificateDataUrl,
  renderCertificatePdf,
} from "../../utils/certificateRenderer";

const SUBTITLES = {
  1: "Start by choosing a certificate template.",
  2: "Select the intern and confirm the certificate details.",
  3: "Review the certificate, then download it or send it to the intern.",
};

const DEFAULT_TYPE = "Internship Completion Certificate";

// yyyy-mm-dd in the user's own timezone (toISOString would use UTC).
const today = () => new Date().toLocaleDateString("en-CA");

const EMPTY_FORM = {
  intern_id: null,
  intern_name: "",
  intern_email: "",
  role: "",
  department: "",
  start_date: "",
  end_date: "",
  certificate_date: today(),
  authorized_person: "",
  organization_name: "",
  certificate_type: DEFAULT_TYPE,
};

export default function IssueCertificate() {
  const navigate = useNavigate();
  const { alert } = useDialog();

  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState({
    key: BUILT_IN_TEMPLATE.key,
    url: BUILT_IN_TEMPLATE.url,
  });

  const [interns, setInterns] = useState([]);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [meta, setMeta] = useState({ certificate_types: [DEFAULT_TYPE] });

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const [record, setRecord] = useState(null); // the saved Draft
  // Result of the last render, tagged with what it was rendered from so a
  // stale picture is never shown for a newer draft.
  const [preview, setPreview] = useState({ key: "", image: "", error: "" });
  const [busy, setBusy] = useState("");
  const [sent, setSent] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [internResult, metaResult, templateResult] = await Promise.allSettled([
        internServices.getAll(),
        certificateServices.getMeta(),
        certificateServices.getTemplates(),
      ]);

      if (cancelled) return;

      if (internResult.status === "fulfilled") {
        setInterns(internResult.value.filter((i) => i.display_status !== "Inactive"));
      } else {
        alert({
          title: "Error",
          message: "Unable to load interns. Please refresh the page.",
          type: "error",
        });
      }
      setLoadingInterns(false);

      if (metaResult.status === "fulfilled") {
        const value = metaResult.value;
        setMeta(value);
        setForm((current) => ({
          ...current,
          authorized_person: current.authorized_person || value.authorized_person || "",
          organization_name: current.organization_name || value.organization_name || "",
        }));
      }

      if (templateResult.status === "fulfilled") setTemplates(templateResult.value);
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewKey = record ? `${record.id}|${record.updated_at}|${selected.url}` : "";
  const image = preview.key === previewKey ? preview.image : "";
  const previewError = preview.key === previewKey ? preview.error : "";

  // Render the preview whenever the preview step is shown for a saved draft.
  useEffect(() => {
    if (step !== 3 || !record) return undefined;

    let cancelled = false;

    renderCertificateDataUrl({ templateUrl: selected.url, certificate: record })
      .then((url) => !cancelled && setPreview({ key: previewKey, image: url, error: "" }))
      .catch(
        (err) =>
          !cancelled && setPreview({ key: previewKey, image: "", error: err.message }),
      );

    return () => {
      cancelled = true;
    };
  }, [step, record, selected.url, previewKey]);

  const goToList = () => navigate("/admin/certificates");

  const validate = () => {
    const next = {};

    if (!form.intern_id) next.intern_id = "Select an intern.";
    else if (!form.role) next.role = "This intern has no designation on their profile.";
    if (!form.certificate_date) next.certificate_date = "Choose the certificate date.";
    if (!form.organization_name.trim()) next.organization_name = "Organization name is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = useMemo(
    () => ({
      intern_id: form.intern_id,
      certificate_type: form.certificate_type,
      template_key: selected.key,
      template_id: selected.key === "custom" ? selected.id : null,
      role: form.role,
      department: form.department,
      start_date: form.start_date,
      end_date: form.end_date,
      certificate_date: form.certificate_date,
      authorized_person: form.authorized_person,
      organization_name: form.organization_name,
    }),
    [form, selected],
  );

  const handleContinueToPreview = async () => {
    if (!validate()) return;

    try {
      setBusy("save");
      const saved = record
        ? await certificateServices.update(record.id, payload)
        : await certificateServices.create(payload);

      setRecord(saved);
      setStep(3);
    } catch (err) {
      await alert({
        title: "Error",
        message: err.response?.data?.message || "Unable to save the certificate.",
        type: "error",
      });
    } finally {
      setBusy("");
    }
  };

  const buildPdf = () =>
    renderCertificatePdf({ templateUrl: selected.url, certificate: record });

  const handleDownload = async () => {
    try {
      setBusy("download");
      const pdf = await buildPdf();

      saveAs(pdf.output("blob"), certificateFileName(record));
      await certificateServices.markIssued(record.id);

      await alert({
        title: "Certificate Issued",
        message: `${record.certificate_code} was downloaded and marked as Issued.`,
        type: "success",
      });
      goToList();
    } catch (err) {
      await alert({
        title: "Download Failed",
        message: err.response?.data?.message || err.message || "Unable to download.",
        type: "error",
      });
    } finally {
      setBusy("");
    }
  };

  const handleSend = async () => {
    try {
      setBusy("send");
      const pdf = await buildPdf();

      const updated = await certificateServices.send(
        record.id,
        pdf.output("blob"),
        certificateFileName(record),
      );

      setSent(updated);
    } catch (err) {
      await alert({
        title: "Send Failed",
        message: err.response?.data?.message || err.message || "Unable to send the email.",
        type: "error",
      });
    } finally {
      setBusy("");
    }
  };

  return (
    <MainLayout title="Certificate" icon={Award}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Issue Certificate</h1>
            <p className="mt-2 text-gray-500">{SUBTITLES[step]}</p>
          </div>

          <button
            type="button"
            onClick={goToList}
            disabled={Boolean(busy)}
            className="h-12 rounded-xl border border-gray-300 bg-white px-6 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <CertificateStepper step={step} />

        {step === 1 && (
          <TemplateStep
            templates={templates}
            setTemplates={setTemplates}
            selected={selected}
            onSelect={setSelected}
            onCancel={goToList}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <DetailsStep
            interns={interns}
            loadingInterns={loadingInterns}
            meta={meta}
            form={form}
            setForm={setForm}
            errors={errors}
            onBack={() => setStep(1)}
            onNext={handleContinueToPreview}
          />
        )}

        {step === 3 && (
          <PreviewStep
            image={image}
            error={previewError}
            busy={busy}
            canSend={Boolean(record?.intern_email)}
            onBack={() => setStep(2)}
            onCancel={goToList}
            onDownload={handleDownload}
            onSend={handleSend}
          />
        )}
      </div>

      {sent && (
        <MailSuccessModal
          internName={sent.intern_name}
          subtitle={sent.role}
          onDone={goToList}
        />
      )}
    </MainLayout>
  );
}