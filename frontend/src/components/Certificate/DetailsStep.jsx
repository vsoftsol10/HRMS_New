import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Check, Search } from "lucide-react";

import { formatDate } from "../../utils/internUtils";

function AutoFilled({ label, value, error }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="font-semibold text-slate-900">{label}</label>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          Auto-filled
        </span>
      </div>
      <input
        readOnly
        value={value}
        className="h-14 w-full rounded-xl border border-gray-200 bg-slate-50 px-4 text-slate-800 outline-none"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-2 block font-semibold text-slate-900">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-slate-800 outline-none focus:border-yellow-400";

// Step 2 - pick an intern (their internship info fills in by itself) and
// confirm the certificate details.
export default function DetailsStep({
  interns,
  loadingInterns,
  meta,
  form,
  setForm,
  errors,
  onBack,
  onNext,
}) {
  const [query, setQuery] = useState(form.intern_name || "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const matches = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search || search === String(form.intern_name || "").toLowerCase()) {
      return interns.slice(0, 50);
    }

    return interns
      .filter((intern) =>
        [intern.full_name, intern.intern_code, intern.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search)),
      )
      .slice(0, 50);
  }, [interns, query, form.intern_name]);

  const pickIntern = (intern) => {
    setQuery(intern.full_name);
    setOpen(false);
    setForm((current) => ({
      ...current,
      intern_id: intern.id,
      intern_name: intern.full_name,
      intern_email: intern.email,
      role: intern.designation || "",
      department: intern.department_name || "",
      start_date: String(intern.start_date).slice(0, 10),
      end_date: String(intern.end_date).slice(0, 10),
    }));
  };

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="rounded-2xl border border-gray-300 bg-white px-8 py-8">
      <h2 className="text-xl font-bold text-slate-900">Intern &amp; Certificate Details</h2>
      <p className="mb-6 text-gray-500">
        Internship information is pulled automatically from the intern&apos;s profile.
      </p>

      <div className="space-y-6">
        <Field label="Select Intern" error={errors.intern_id}>
          <div ref={boxRef} className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              placeholder={loadingInterns ? "Loading interns..." : "Search intern by name or ID"}
              className={`${inputClass} pl-11`}
            />

            {open && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {matches.length === 0 && (
                  <li className="px-4 py-3 text-gray-500">No interns found.</li>
                )}

                {matches.map((intern) => (
                  <li key={intern.id}>
                    <button
                      type="button"
                      onClick={() => pickIntern(intern)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-yellow-50 cursor-pointer"
                    >
                      <span>
                        <span className="block font-medium text-slate-900">
                          {intern.full_name}
                        </span>
                        <span className="block text-sm text-gray-500">
                          {intern.intern_code} · {intern.designation || "No designation"}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-gray-400">
                        {formatDate(intern.end_date)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <AutoFilled
            label="Internship Position / Role"
            value={form.role}
            error={errors.role}
          />
          <AutoFilled label="Department" value={form.department} />
          <AutoFilled
            label="Internship Start Date"
            value={form.start_date ? formatDate(form.start_date) : ""}
            error={errors.start_date}
          />
          <AutoFilled
            label="Internship End Date"
            value={form.end_date ? formatDate(form.end_date) : ""}
            error={errors.end_date}
          />

          <Field label="Certificate Date" error={errors.certificate_date}>
            <div className="relative">
              <input
                type="date"
                value={form.certificate_date}
                onChange={set("certificate_date")}
                className={inputClass}
              />
              <Calendar
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </Field>

          <Field label="HR / Authorized Person" error={errors.authorized_person}>
            <input
              value={form.authorized_person}
              onChange={set("authorized_person")}
              placeholder={meta.authorized_person}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Organization Name" error={errors.organization_name}>
          <input
            value={form.organization_name}
            onChange={set("organization_name")}
            className={inputClass}
          />
        </Field>

        <Field label="Certificate Type" error={errors.certificate_type}>
          <div className="flex flex-wrap gap-3">
            {(meta.certificate_types || [form.certificate_type]).map((type) => {
              const active = form.certificate_type === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, certificate_type: type }))}
                  className={`flex h-12 items-center gap-2 rounded-xl border px-4 font-medium cursor-pointer ${
                    active
                      ? "border-yellow-400 bg-yellow-50 text-slate-900"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {active && <Check size={16} />}
                  {type}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-12 rounded-xl border border-gray-300 bg-white px-6 font-medium hover:bg-gray-100 cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="h-12 rounded-xl bg-yellow-400 px-6 font-semibold text-slate-900 hover:bg-yellow-300 cursor-pointer"
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
}