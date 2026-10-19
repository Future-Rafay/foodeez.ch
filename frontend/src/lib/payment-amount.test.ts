import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's TypeScript test runner requires the file extension.
import { matchesOrderCharge } from "./payment-amount.ts";

test("payment reconciliation accepts the saved CHF final amount only", () => {
  assert.equal(matchesOrderCharge("135.00", 13500, "chf"), true);
  assert.equal(matchesOrderCharge("135.00", 15000, "chf"), false);
  assert.equal(matchesOrderCharge("135.00", 13500, "eur"), false);
  assert.equal(matchesOrderCharge("135.00", null, "chf"), false);
});
