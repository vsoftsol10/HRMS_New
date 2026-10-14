const GENERIC_MESSAGE = "Something went wrong. Please try again.";

// Postgres error codes that have a safe, useful client-facing meaning.
const PG_ERROR_MAP = {
  "23505": [409, "A record with these details already exists."],
  "23503": [400, "This record refers to something that does not exist, or is still in use."],
  "23502": [400, "A required field is missing."],
  "22P02": [400, "One of the values has an invalid format."],
};

export const sendServerError = (res, err, context = "Request failed") => {
  console.error(`[${context}]`, err?.message || err);

  const mapped = PG_ERROR_MAP[err?.code];

  if (mapped) {
    return res.status(mapped[0]).json({ message: mapped[1] });
  }

  return res.status(500).json({ message: GENERIC_MESSAGE });
};

// An error thrown on purpose by our own code (`throw new Error("Insufficient
// leave balance")`) is a plain Error with no database fields, and its message
// is written for the user. Anything else - Supabase / Postgres errors,
// TypeErrors, network failures - carries internals and is never shown.
const isPlainAppError = (err) =>
  err instanceof Error &&
  Object.getPrototypeOf(err) === Error.prototype &&
  !err.code &&
  !err.details &&
  !err.hint;

// For handlers that build their own response body (e.g. they also send
// `success: false`): returns the message that is safe to send to the client
// and logs the real error on the server.
export const safeErrorMessage = (err, context = "Request failed") => {
  console.error(`[${context}]`, err?.message || err);

  const mapped = PG_ERROR_MAP[err?.code];

  if (mapped) return mapped[1];

  if (isPlainAppError(err) && err.message) return err.message;

  return GENERIC_MESSAGE;
};

// Copies only the listed keys (and only keys that are actually present)
// from `source`. Used to whitelist what a client may write.
export const pick = (source, allowedKeys) => {
  const out = {};

  if (!source || typeof source !== "object") return out;

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key];
    }
  }

  return out;
};