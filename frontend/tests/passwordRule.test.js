import test from "node:test";
import assert from "node:assert/strict";
import { getPasswordError } from "../src/utils/passwordRule.js";

test("accepts 8+ characters with a letter and a number", () => {
  assert.equal(getPasswordError("Hrms2026ok"), "");
});

test("rejects short, letter-only and number-only passwords", () => {
  assert.ok(getPasswordError("abc12"));
  assert.ok(getPasswordError("abcdefghij"));
  assert.ok(getPasswordError("12345678"));
  assert.ok(getPasswordError(undefined));
});