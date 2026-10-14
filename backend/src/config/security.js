// security.js
//
// HTTP hardening in one place: security headers, CORS allow-list, rate
// limits for the public auth endpoints, and a start-up check of the
// configuration. Used from server.js.

import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

/* =========================================================
   START-UP CHECK
   A weak JWT secret lets anyone forge an admin token, so in production the
   server refuses to start with one. Outside production it only warns, so
   local development keeps working.
========================================================= */
// Pure function (easy to unit-test): returns the list of problems.
export const collectEnvProblems = (env = process.env, production = isProduction) => {
  const problems = [];

  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"]) {
    if (!env[name]) problems.push(`${name} is not set.`);
  }

  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    problems.push(
      "JWT_SECRET is too short (use at least 32 random characters, e.g. " +
        "`node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"`).",
    );
  }

  if (production) {
    // Without these the app silently falls back to "allow every website" /
    // "links that point to localhost", so production refuses to start.
    if (parseOrigins(env.CORS_ORIGINS).length === 0) {
      problems.push(
        "CORS_ORIGINS is not set (comma separated frontend URL(s), e.g. https://hrms.example.com).",
      );
    }

    if (!env.FRONTEND_LOGIN_URL) {
      problems.push(
        "FRONTEND_LOGIN_URL is not set (used in password-reset and welcome e-mail links).",
      );
    } else if (/localhost|127\.0\.0\.1/.test(env.FRONTEND_LOGIN_URL)) {
      problems.push("FRONTEND_LOGIN_URL points to localhost.");
    }

    if (env.DISABLE_RATE_LIMIT === "true") {
      problems.push("DISABLE_RATE_LIMIT=true must not be used in production.");
    }
  }

  return problems;
};

export const validateEnv = () => {
  const problems = collectEnvProblems();

  if (!problems.length) return;

  const report = problems.map((p) => `  - ${p}`).join("\n");

  if (isProduction) {
    throw new Error(`Invalid configuration:\n${report}`);
  }

  console.warn(`[config] Configuration problems (fatal when NODE_ENV=production):\n${report}`);
};

/* =========================================================
   PROXY / HEADERS / CORS
========================================================= */
const parseTrustProxy = (value) => {
  if (value === undefined || value === "") return isProduction ? 1 : undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value; // e.g. "loopback" or a subnet
};

export const configureSecurity = (app) => {
  // Behind a reverse proxy (Render, Railway, nginx ...) req.ip would be the
  // proxy's address, and every user would share one rate-limit bucket.
  const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);
  if (trustProxy !== undefined) app.set("trust proxy", trustProxy);

  app.use(
    helmet({
      // The frontend is on another origin and loads files from this API.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

  if (allowedOrigins.length === 0) {
    // Development only: validateEnv() already stops production from
    // starting without CORS_ORIGINS, so this is never reached there.
    if (isProduction) {
      throw new Error("CORS_ORIGINS must be set in production.");
    }

    app.use(cors());
    return;
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // no Origin header = curl / server-to-server / same-origin
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
    }),
  );
};

/* =========================================================
   RATE LIMITS (public auth endpoints only)
========================================================= */
const limiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    // DISABLE_RATE_LIMIT=true for local testing of wrong passwords etc.
    skip: () => process.env.DISABLE_RATE_LIMIT === "true",
  });

// Only failed logins count, so normal use never hits the limit.
export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Please try again in 15 minutes.",
});

// Every request counts: each one can send an email.
export const forgotPasswordLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many password reset requests. Please try again later.",
});

export const resetPasswordLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many attempts. Please try again later.",
});