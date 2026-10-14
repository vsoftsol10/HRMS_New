/**
 * Shared date helpers - LOCAL calendar dates, never UTC.
 *
 * `new Date(...).toISOString().split("T")[0]` converts to UTC before
 * formatting. In IST (UTC+5:30) local midnight becomes 6:30 PM of the
 * PREVIOUS day in UTC, so e.g. new Date(2026, 8, 1).toISOString() is
 * "2026-08-31T18:30:00.000Z" and the date part comes out as 2026-08-31.
 *
 * These mirror the helpers in backend/src/utils/dateUtils.js.
 */

/**
 * Format a Date as YYYY-MM-DD using LOCAL time.
 */
export const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * First day of the LOCAL month of `reference`, as YYYY-MM-DD.
 */
export const getMonthStart = (reference = new Date()) => {
  return formatLocalDate(
    new Date(reference.getFullYear(), reference.getMonth(), 1),
  );
};