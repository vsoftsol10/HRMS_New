import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { renderCertificateDataUrl } from "../../utils/certificateRenderer";

// Read-only look at an issued / draft certificate (eye icon on the list).
export default function CertificatePreviewModal({ certificate, templateUrl, onClose }) {
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    renderCertificateDataUrl({ templateUrl, certificate })
      .then((url) => !cancelled && setImage(url))
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [certificate, templateUrl]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {certificate.certificate_code}
            </h2>
            <p className="text-gray-500">
              {certificate.intern_name} · {certificate.role}
            </p>
          </div>

          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="rounded-2xl bg-slate-100 p-4">
          {error ? (
            <p className="py-10 text-center text-red-600">{error}</p>
          ) : image ? (
            <img src={image} alt="Certificate preview" className="w-full bg-white" />
          ) : (
            <p className="py-10 text-center text-gray-500">Preparing preview...</p>
          )}
        </div>
      </div>
    </div>
  );
}