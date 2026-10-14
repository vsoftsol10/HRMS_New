import test from "node:test";
import assert from "node:assert/strict";
import { collectEnvProblems } from "../src/config/security.js";

const good = {
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "key",
  JWT_SECRET: "s".repeat(48),
  CORS_ORIGINS: "https://hrms.example.com",
  FRONTEND_LOGIN_URL: "https://hrms.example.com",
};

test("a complete production config has no problems", () => {
  assert.deepEqual(collectEnvProblems(good, true), []);
});

test("production requires CORS_ORIGINS and FRONTEND_LOGIN_URL", () => {
  const problems = collectEnvProblems(
    { ...good, CORS_ORIGINS: "", FRONTEND_LOGIN_URL: "" },
    true,
  );
  assert.equal(problems.length, 2);
});

test("development does not require them", () => {
  assert.deepEqual(
    collectEnvProblems({ ...good, CORS_ORIGINS: "", FRONTEND_LOGIN_URL: "" }, false),
    [],
  );
});

test("short JWT secret and missing keys are always reported", () => {
  const problems = collectEnvProblems({ JWT_SECRET: "short" }, false);
  assert.ok(problems.some((p) => p.includes("SUPABASE_URL")));
  assert.ok(problems.some((p) => p.includes("too short")));
});

test("localhost frontend URL and disabled rate limit are rejected in production", () => {
  const problems = collectEnvProblems(
    { ...good, FRONTEND_LOGIN_URL: "http://localhost:5173", DISABLE_RATE_LIMIT: "true" },
    true,
  );
  assert.equal(problems.length, 2);
});