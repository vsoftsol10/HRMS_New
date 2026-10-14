// Same rule as the backend (backend/src/utils/passwordPolicy.js).
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULE_TEXT =
  "Password must be at least 8 characters and include a letter and a number";

// Returns an error message, or "" when the password is acceptable.
export const getPasswordError = (password) => {
  const value = String(password ?? "");

  if (
    value.length < PASSWORD_MIN_LENGTH ||
    !/[A-Za-z]/.test(value) ||
    !/\d/.test(value)
  ) {
    return PASSWORD_RULE_TEXT;
  }

  return "";
};