import test from "node:test";
import assert from "node:assert/strict";
import roleMiddleware from "../src/middleware/roleMiddleware.js";

const run = (user, ...roles) => {
  const res = {
    statusCode: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let nextCalled = false;
  roleMiddleware(...roles)({ user }, res, () => { nextCalled = true; });
  return { res, nextCalled };
};

test("allows a permitted role", () => {
  assert.equal(run({ role: "HR" }, "HR", "Admin").nextCalled, true);
});

test("blocks a role that is not permitted with 403", () => {
  const { res, nextCalled } = run({ role: "Employee" }, "HR", "Admin");
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("blocks unauthenticated requests with 401", () => {
  const { res, nextCalled } = run(undefined, "HR");
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});