import { useRef, useState } from "react";
import { Check, Pencil, Trash2, Upload } from "lucide-react";

import certificateServices from "../../services/certificateServices";
import { BUILT_IN_TEMPLATE } from "../../utils/certificateRenderer";
import { useDialog } from "../Dialogbox/DialogContext";

// Step 1 - pick the built-in template or upload one (PNG / JPG).
// `selected` is { key, id?, url } and is owned by the wizard page.
export default function TemplateStep({
  templates,
  setTemplates,
  selected,
  onSelect,
  onCancel,
  onNext,
}) {
  const { alert, confirm, prompt } = useDialog();
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      await alert({
        title: "Unsupported File",
        message: "Please upload the template as a PNG or JPG image.",
        type: "error",
      });
      return;
    }

    try {
      setUploading(true);
      const template = await certificateServices.uploadTemplate(file);

      setTemplates((current) => [template, ...current]);
      onSelect({ key: "custom", id: template.id, url: template.url });
    } catch (err) {
      await alert({
        title: "Upload Failed",
        message: err.response?.data?.message || "Unable to upload the template.",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async (card) => {
    const input = await prompt({
      title: "Rename Template",
      message: "Enter a new name for this template.",
      defaultValue: card.name,
    });
    if (input === null) return;

    const name = input.trim();
    if (!name || name === card.name) return;

    try {
      setBusyId(card.id);
      const updated = await certificateServices.updateTemplate(card.id, name);

      setTemplates((current) =>
        current.map((template) =>
          template.id === card.id ? { ...template, name: updated.name, url: updated.url } : template,
        ),
      );

      if (selected.key === "custom" && selected.id === card.id) {
        onSelect({ key: "custom", id: card.id, url: updated.url });
      }
    } catch (err) {
      await alert({
        title: "Rename Failed",
        message: err.response?.data?.message || "Unable to rename the template.",
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (card) => {
    const ok = await confirm({
      title: "Delete Template",
      message: `Delete "${card.name}"? Certificates already issued are not affected.`,
    });
    if (!ok) return;

    try {
      setBusyId(card.id);
      await certificateServices.deleteTemplate(card.id);

      setTemplates((current) => current.filter((template) => template.id !== card.id));

      // The deleted template can't stay selected - fall back to the built-in one.
      if (selected.key === "custom" && selected.id === card.id) {
        onSelect({ key: BUILT_IN_TEMPLATE.key, url: BUILT_IN_TEMPLATE.url });
      }
    } catch (err) {
      await alert({
        title: "Delete Failed",
        message: err.response?.data?.message || "Unable to delete the template.",
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const cards = [
    { ...BUILT_IN_TEMPLATE, id: null, selection: { key: BUILT_IN_TEMPLATE.key, url: BUILT_IN_TEMPLATE.url } },
    ...templates.map((template) => ({
      key: "custom",
      id: template.id,
      name: template.name,
      description: "Uploaded template",
      url: template.url,
      selection: { key: "custom", id: template.id, url: template.url },
    })),
  ];

  const isSelected = (card) =>
    card.key === "custom"
      ? selected.key === "custom" && selected.id === card.id
      : selected.key === card.key;

  return (
    <div className="rounded-2xl border border-gray-300 bg-white">
      <div className="border-b border-gray-200 px-8 py-6">
        <h2 className="text-xl font-bold text-slate-900">Certificate Template</h2>
        <p className="text-gray-500">
          Pick a design for the Internship Completion Certificate. Details are filled in
          on the next step.
        </p>
      </div>

      <div className="flex flex-wrap gap-6 px-8 py-8">
        {cards.map((card) => (
          <div
            key={`${card.key}-${card.id ?? "built-in"}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(card.selection)}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(card.selection);
              }
            }}
            className={`group w-full max-w-md rounded-2xl border bg-white p-4 text-left cursor-pointer ${
              isSelected(card)
                ? "border-yellow-400 ring-2 ring-yellow-200"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="relative">
              <img
                src={card.url}
                alt={`${card.name} template`}
                className="aspect-[1.42] w-full rounded-lg border border-gray-200 object-cover"
              />

              {/* Uploaded templates only - the built-in design is a fixed file. */}
              {card.id !== null && (
                <div className="absolute right-0 top-0 flex gap-1 rounded-bl-xl rounded-tr-lg bg-yellow-400 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    title="Rename template"
                    aria-label={`Rename ${card.name}`}
                    disabled={busyId === card.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRename(card);
                    }}
                    className="rounded p-1 text-slate-800 hover:bg-yellow-300 cursor-pointer disabled:opacity-50"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    title="Delete template"
                    aria-label={`Delete ${card.name}`}
                    disabled={busyId === card.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(card);
                    }}
                    className="rounded p-1 text-red-600 hover:bg-yellow-300 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isSelected(card)
                    ? "bg-yellow-400 text-slate-900"
                    : "border border-gray-300 text-transparent"
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </span>

              <span>
                <span className="block font-semibold text-slate-900">{card.name}</span>
                <span className="block text-sm text-gray-500">{card.description}</span>
              </span>
            </div>
          </div>
        ))}

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className="flex min-h-72 w-full max-w-md flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:border-yellow-400 cursor-pointer disabled:opacity-60"
        >
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-800">
            <Upload size={20} />
          </span>
          <span className="font-semibold text-slate-900">
            {uploading ? "Uploading..." : "Upload Template"}
          </span>
          <span className="text-sm text-gray-400">PNG or JPG</span>
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 px-8 py-6">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl border border-gray-300 bg-white px-6 font-medium hover:bg-gray-100 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onNext}
          className="h-12 rounded-xl bg-yellow-400 px-6 font-semibold text-slate-900 hover:bg-yellow-300 cursor-pointer"
        >
          Continue to Details
        </button>
      </div>
    </div>
  );
}