import PageLoader from "../PageLoader.jsx";
import { useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Upload as UploadIcon,
  Trash2,
  X,
} from "lucide-react";

import Modal from "../Modal/Modal";
import Button from "../Button";
import CustomSelect from "../AddForm/Dropdown";
import { useDialog } from "../Dialogbox/DialogContext";
import internServices from "../../services/internServices";
import {
  formatDate,
  formatFileSize,
  DOCUMENT_TYPES,
  DOCUMENT_ACCEPT,
  validateDocumentFile,
} from "../../utils/internUtils";

// HR -> intern detail -> Documents tab.
// `documents` is the list that comes with the intern (GET /interns/:id);
// after an upload / delete `onChanged` makes the page re-fetch the intern.
// (This file used to contain a copy of InternCoveragePanel by mistake, which
// crashed the Documents tab - it reads `intern.status` and no `intern` prop
// is passed here.)

const OTHER_DOCUMENTS = "Other Documents";

const fileTypeLabel = (mimeType = "") => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/webp") return "WEBP";
  if ((mimeType || "").includes("word")) return "DOC";

  return "FILE";
};

function DocumentIcon({ mimeType }) {
  const isImage = (mimeType || "").startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  const tone = isPdf
    ? "bg-red-100 text-red-500"
    : isImage
      ? "bg-sky-100 text-sky-500"
      : "bg-gray-100 text-gray-500";
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
      <Icon size={18} />
    </span>
  );
}

export default function InternDocuments({ internId, documents, onChanged }) {
  const { alert, confirm } = useDialog();

  const [busy, setBusy] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const list = Array.isArray(documents) ? documents : [];

  const showError = (err, fallback) =>
    alert({
      title: "Error",
      message: err?.response?.data?.message || fallback,
      type: "error",
    });

  const openUpload = () => {
    setDocType(DOCUMENT_TYPES[0]);
    setFile(null);
    setShowUpload(true);
  };

  const closeUpload = () => {
    if (busy === "upload") return;
    setShowUpload(false);
    setFile(null);
  };

  const handleFileChosen = async (event) => {
    const chosen = event.target.files?.[0];
    // Allow choosing the same file again later.
    event.target.value = "";
    if (!chosen) return;

    const problem = validateDocumentFile(chosen);
    if (problem) {
      setFile(null);
      await alert({ title: "Cannot Upload", message: problem, type: "error" });
      return;
    }

    setFile(chosen);
  };

  const handleUpload = async () => {
    if (!file || !docType) return;

    setBusy("upload");

    try {
      await internServices.uploadDocument(internId, file, docType);
      setShowUpload(false);
      setFile(null);
      onChanged?.();
    } catch (err) {
      await showError(err, "Unable to upload the document.");
    } finally {
      setBusy("");
    }
  };

  const openDocument = async (doc, download) => {
    setBusy(`${download ? "download" : "view"}-${doc.id}`);

    // Opened synchronously so the browser does not treat it as a popup.
    const newTab = download ? null : window.open("", "_blank");

    try {
      const url = await internServices.getDocumentUrl(internId, doc.id, { download });

      if (download) {
        window.location.assign(url);
      } else if (newTab) {
        newTab.opener = null;
        newTab.location.href = url;
      }
    } catch (err) {
      newTab?.close();
      await showError(err, "Unable to open the document.");
    } finally {
      setBusy("");
    }
  };

  const handleDelete = async (doc) => {
    const isConfirmed = await confirm({
      title: "Delete Document",
      message: `Delete "${doc.file_name}"? This cannot be undone.`,
    });

    if (!isConfirmed) return;

    setBusy(`delete-${doc.id}`);

    try {
      await internServices.removeDocument(internId, doc.id);
      onChanged?.();
    } catch (err) {
      await showError(err, "Unable to delete the document.");
    } finally {
      setBusy("");
    }
  };

  // Every type except "Other Documents" keeps a single file - uploading again replaces it.
  const willReplace =
    docType !== OTHER_DOCUMENTS && list.some((doc) => doc.doc_type === docType);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-xl font-semibold">Documents</h2>
          <p className="text-gray-500 mt-1">
            Documents uploaded for this intern (by HR or by the intern).
          </p>
        </div>

        <button
          type="button"
          onClick={openUpload}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 font-medium hover:bg-yellow-300 cursor-pointer"
        >
          <UploadIcon size={16} />
          Upload Document
        </button>
      </div>

      {documents === undefined && <PageLoader className="min-h-[30vh]" />}

      {documents !== undefined && list.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
          No documents uploaded yet.
        </p>
      )}

      {list.length > 0 && (
        <ul className="space-y-3">
          {list.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-4 rounded-xl border border-gray-300 p-4"
            >
              <DocumentIcon mimeType={doc.mime_type} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    title="View"
                    onClick={() => openDocument(doc, false)}
                    disabled={busy === `view-${doc.id}`}
                    className="truncate text-left font-semibold text-gray-900 hover:underline cursor-pointer disabled:opacity-60"
                  >
                    {doc.file_name}
                  </button>
                  {doc.doc_type && (
                    <span className="hidden sm:inline-block shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {doc.doc_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {fileTypeLabel(doc.mime_type)} • {formatFileSize(doc.file_size)} • Uploaded{" "}
                  {formatDate(doc.created_at)}
                </p>
              </div>

              <button
                type="button"
                title="Download"
                onClick={() => openDocument(doc, true)}
                disabled={busy === `download-${doc.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={15} />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => handleDelete(doc)}
                disabled={busy === `delete-${doc.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showUpload && (
        <Modal onClose={closeUpload}>
          <div className="w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Upload Document</h3>
              <button
                type="button"
                onClick={closeUpload}
                aria-label="Close"
                className="text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <CustomSelect
              label="Document Type"
              options={DOCUMENT_TYPES}
              value={docType}
              onChange={setDocType}
            />

            <div>
              <label className="block mb-2 font-medium text-gray-800">File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="hidden"
                onChange={handleFileChosen}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-400 px-4 py-3 text-left hover:border-amber-400 cursor-pointer"
              >
                <UploadIcon size={18} className="shrink-0 text-gray-500" />
                <span className={`truncate text-sm ${file ? "text-gray-900" : "text-gray-500"}`}>
                  {file ? file.name : "Choose a file"}
                </span>
              </button>
              <p className="mt-1 text-xs text-gray-500">
                PDF, JPG, PNG, WEBP, DOC or DOCX - up to 5 MB.
              </p>
              {willReplace && (
                <p className="mt-2 text-xs text-amber-700">
                  This intern already has a {docType}. Uploading will replace it.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeUpload}
                disabled={busy === "upload"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file}
                loading={busy === "upload"}
                loadingText="Uploading..."
              >
                Upload
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}