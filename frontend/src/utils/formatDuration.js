/**
 * Formats a "HH:MM:SS" (or "HH:MM") time-span string, as returned by the
 * backend for attendance.working_hours, into a friendly duration label.
 *
 * Examples:
 *   "02:00:00" -> "2h"
 *   "02:30:00" -> "2h 30m"
 *   "00:45:00" -> "45m"
 *   "00:00:00" -> "0m"
 *   null / ""  -> "-"
 */
export function formatWorkingHours(value) {
  if (!value) return "-";

  const parts = value.split(":").map(Number);
  const [hours, minutes] = parts;

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "-";

  if (hours === 0 && minutes === 0) return "0m";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}