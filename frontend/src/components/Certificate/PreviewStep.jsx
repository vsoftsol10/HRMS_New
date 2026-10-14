import { Download, Mail } from "lucide-react";

// Step 3 - the rendered certificate plus Download / Send.
export default function PreviewStep({
  image,
  error,
  busy, // "" | "download" | "send"
  canSend,
  onBack,
  onCancel,
  onDownload,
  onSend,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-200/70 p-6 md:p-8">
        <div className="bg-white p-4 md:p-8">
          {error ? (
            <p className="py-20 text-center text-red-600">{error}</p>
          ) : image ? (
            <img src={image} alt="Certificate preview" className="mx-auto w-full" />
          ) : (
            <p className="py-20 text-center text-gray-500">Preparing preview...</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={Boolean(busy)}
            className="h-12 rounded-xl border border-gray-300 bg-white px-6 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={Boolean(busy)}
            className="h-12 rounded-xl border border-gray-300 bg-white px-6 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDownload}
            disabled={Boolean(busy) || !image}
            className="flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {busy === "download" ? "Downloading..." : "Download"}
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={Boolean(busy) || !image || !canSend}
            title={canSend ? "" : "This intern has no email address on file"}
            className="flex h-12 items-center gap-2 rounded-xl bg-yellow-400 px-6 font-semibold text-slate-900 hover:bg-yellow-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail size={18} />
            {busy === "send" ? "Sending..." : "Send via Gmail"}
          </button>
        </div>
      </div>
    </div>
  );
}