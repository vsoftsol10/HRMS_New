import test from "node:test";
import assert from "node:assert/strict";
import { validatePassword } from "../src/utils/passwordPolicy.js";

test("accepts a password with letters and numbers, 8+ chars", () => {
  assert.equal(validatePassword("Hrms2026ok"), null);
  assert.equal(validatePassword("abcdefg1"), null);
});

test("rejects short, letter-only, number-only and non-string values", () => {
  assert.ok(validatePassword("abc12"));
  assert.ok(validatePassword("abcdefghij"));
  assert.ok(validatePassword("1234567890"));
  assert.ok(validatePassword(""));
  assert.ok(validatePassword(undefined));
  assert.ok(validatePassword(12345678));
});

test("rejects passwords longer than bcrypt's 72-byte limit", () => {
  assert.ok(validatePassword("a1".repeat(40)));
  assert.equal(validatePassword("a1".repeat(36)), null);
});