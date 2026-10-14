import { useRef, useState } from "react";
import { Download, Eye, FileText, Trash2, Upload } from "lucide-react";

import internServices from "../../services/internServices";
import { useDialog } from "../Dialogbox/DialogContext";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPES,
  formatDate,
  formatFileSize,
  validateDocumentFile,
} from "../../utils/internUtils";

const fileTypeLabel = (mimeType = "") => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  if (mimeType === "image/webp") return "WEBP";
  if (mimeType.includes("word")) return "DOC";

  return "FILE";
};

const iconButton =
  "p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

export default function InternDocuments({ internId, documents, onChanged }) {
  const { confirm, alert } = useDialog();
  const fileInputRef = useRef(null);
  const uploadTypeRef = useRef(null);

  // Which action is running right now (disables that button only).
  const [busy, setBusy] = useState("");

  const showError = (err, fallback) =>
    alert({
      title: "Error",
      message: err?.response?.data?.message || fallback,
      type: "error",
    });

  const startUpload = (docType) => {
    uploadTypeRef.current = docType;
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (event) => {
    const file = event.target.files?.[0];
    // Allow choosing the same file again later.
    event.target.value = "";

    const docType = uploadTypeRef.current;
    if (!file || !docType) return;

    const problem = validateDocumentFile(file);
    if (problem) {
      await alert({ title: "Cannot Upload", message: problem, type: "error" });
      return;
    }

    setBusy(`upload-${docType}`);

    try {
      await internServices.uploadDocument(internId, file, docType);
      await onChanged();
    } catch (err) {
      await showError(err, "Unable to upload the document.");
    } finally {
      setBusy("");
    }
  };

  // The bucket is private, so each open / download asks the backend for a
  // fresh short-lived signed URL.
  const handleView = async (doc) => {
    setBusy(`view-${doc.id}`);

    // Opened synchronously (inside the click) so pop-up blockers allow it;
    // the address is filled in once the signed URL arrives.
    const newTab = window.open("", "_blank");

    try {
      const url = await internServices.getDocumentUrl(internId, doc.id);

      if (newTab) {
        newTab.opener = null;
        newTab.location.href = url;
      } else if (!window.open(url, "_blank")) {
        await alert({
          title: "Pop-up Blocked",
          message: "Allow pop-ups for this site to view documents.",
          type: "info",
        });
      }
    } catch (err) {
      newTab?.close();
      await showError(err, "Unable to open the document.");
    } finally {
      setBusy("");
    }
  };

  const handleDownload = async (doc) => {
    setBusy(`download-${doc.id}`);

    try {
      // The signed URL carries a download header, so the page stays put.
      const url = await internServices.getDocumentUrl(internId, doc.id, {
        download: true,
      });

      window.location.assign(url);
    } catch (err) {
      await showError(err, "Unable to download the document.");
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
      await onChanged();
    } catch (err) {
      await showError(err, "Unable to delete the document.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={handleFileChosen}
      />

      <h2 className="text-xl font-semibold mb-4">Documents</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const files = documents.filter((doc) => doc.doc_type === docType);
          const uploading = busy === `upload-${docType}`;

          return (
            <div
              key={docType}
              className="rounded-xl border border-gray-300 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{docType}</h3>
                  {files.length === 0 && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => startUpload(docType)}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={14} />
                  {uploading
                    ? "Uploading..."
                    : files.length && docType !== "Other Documents"
                      ? "Replace"
                      : "Upload"}
                </button>
              </div>

              {files.length === 0 ? (
                <p className="text-sm text-gray-500">Not uploaded</p>
              ) : (
                <ul className="space-y-2">
                  {files.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 p-2"
                    >
                      <FileText className="shrink-0 text-gray-500" size={20} />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {fileTypeLabel(doc.mime_type)} •{" "}
                          {formatFileSize(doc.file_size)} • Uploaded{" "}
                          {formatDate(doc.created_at)}
                        </p>
                      </div>

                      <button
                        type="button"
                        title="View"
                        onClick={() => handleView(doc)}
                        disabled={busy === `view-${doc.id}`}
                        className={iconButton}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        title="Download"
                        onClick={() => handleDownload(doc)}
                        disabled={busy === `download-${doc.id}`}
                        className={iconButton}
                      >
                        <Download size={18} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => handleDelete(doc)}
                        disabled={busy === `delete-${doc.id}`}
                        className={`${iconButton} text-red-500 hover:bg-red-50`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}