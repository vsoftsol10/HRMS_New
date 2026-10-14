export const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD using server LOCAL time.
 */
export const getToday = () => {
  return formatLocalDate(new Date());
};

/**
 * Get the first and last calendar day of the current LOCAL month,
 * as YYYY-MM-DD strings.
 */
export const getMonthRange = (reference = new Date()) => {
  const startOfMonth = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    1,
  );

  const endOfMonth = new Date(
    reference.getFullYear(),
    reference.getMonth() + 1,
    0,
  );

  return {
    startOfMonth: formatLocalDate(startOfMonth),
    endOfMonth: formatLocalDate(endOfMonth),
  };
};

/**
 * Get the LOCAL weekday name for a date, e.g. "Monday".
 */
export const getWeekdayName = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
};

/**
 * Check whether a date falls on a configured weekly-off day.
 *
 * weeklyOffDays is a comma-separated string from attendance_policy,
 * e.g. "Saturday, Sunday" or "Sunday".
 */
export const isWeeklyOffDay = (weeklyOffDays, date) => {
  if (!weeklyOffDays) {
    return false;
  }

  const todayName = getWeekdayName(date);

  const offDays = String(weeklyOffDays)
    .split(",")
    .map((day) => day.trim().toLowerCase())
    .filter(Boolean);

  return offDays.includes(todayName.toLowerCase());
};

/**
 * Count the applicable WORKING days in a calendar month - total days
 * minus weekly-off days minus ALL holidays (Optional included), matching
 * the same non-working definition the daily absence/LOP jobs use.
 *
 * Used as the denominator for the LOP daily rate (Basic / working days),
 * per the payroll redesign business decision.
 *
 * @param {number} year
 * @param {number} month - 1-12
 * @param {string} weeklyOffDays - from attendance_policy.weekly_off_days
 * @param {string[]} holidayDates - "YYYY-MM-DD" strings falling in this month
 */
export const getWorkingDaysInMonth = (
  year,
  month,
  weeklyOffDays,
  holidayDates = [],
) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidaySet = new Set(holidayDates);

  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const dateString = formatLocalDate(date);

    if (isWeeklyOffDay(weeklyOffDays, date)) continue;
    if (holidaySet.has(dateString)) continue;

    workingDays += 1;
  }

  return workingDays;
};