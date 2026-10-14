// Formatting helpers shared by the Internship Outcome dialogs.

// "2026-09-30" -> "Sep 30, 2026" (parsed as a LOCAL date so it never shifts
// a day in timezones behind UTC).
export const formatLongDate = (value) => {
  if (!value) return "-";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatRupees = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;