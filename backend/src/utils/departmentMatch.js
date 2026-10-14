export const INTERNS_TOKEN = "Interns";

// Returns null when the value means "no targeting" (everyone), otherwise an
// array of tokens (department ids, "All" and/or "Interns").
export const parseDepartments = (stored) => {
  if (stored === null || stored === undefined) return null;

  let value = stored;

  if (typeof value === "string") {
    const text = value.trim();

    if (text === "") return null;

    if (text.startsWith("[")) {
      try {
        value = JSON.parse(text);
      } catch {
        value = text.replace(/^\[|\]$/g, "").split(",");
      }
    } else if (text.includes(",")) {
      value = text.split(",");
    } else {
      value = [text];
    }
  }

  const list = (Array.isArray(value) ? value : [value])
    .map((item) =>
      typeof item === "string" ? item.trim().replace(/^"|"$/g, "") : item,
    )
    .filter((item) => item !== "" && item !== null && item !== undefined);

  return list.length ? list : null;
};

// Always an array - safe for the frontend to .map() / .includes().
export const departmentsAsArray = (stored) => parseDepartments(stored) ?? [];

export const matchesDepartment = (
  storedDepartment,
  employeeDepartmentId,
  isIntern = false,
) => {
  const tokens = parseDepartments(storedDepartment);

  // Not targeted at all -> visible to everyone.
  if (!tokens) return true;

  const hasInterns = tokens.some((token) => String(token) === INTERNS_TOKEN);

  // "Interns" reaches every intern regardless of department.
  if (isIntern && hasInterns) return true;

  const departmentTokens = tokens.filter(
    (token) => String(token) !== INTERNS_TOKEN,
  );

  // Interns-only announcement: employees (and non-matching interns) never
  // see it.
  if (departmentTokens.length === 0) return false;

  return departmentTokens.some(
    (token) =>
      String(token) === "All" ||
      (employeeDepartmentId !== null &&
        employeeDepartmentId !== undefined &&
        String(token) === String(employeeDepartmentId)),
  );
};