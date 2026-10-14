// passwordPolicy.js
//
// One password rule for every path that lets a user choose a password
// (forgot-password reset, HR "change password", employee settings).
// bcrypt silently ignores everything after 72 bytes, so longer input is
// rejected instead of being truncated without the user knowing.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_RULE_TEXT =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters long and contain ` +
  "at least one letter and one number.";

// Returns null when the password is acceptable, otherwise a message.
export const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return PASSWORD_RULE_TEXT;
  }

  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return `Password is too long (maximum ${PASSWORD_MAX_BYTES} bytes).`;
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return PASSWORD_RULE_TEXT;
  }

  return null;
};