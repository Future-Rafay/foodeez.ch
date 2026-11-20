import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's TypeScript test runner requires the file extension.
import { matchesOrderCharge, orderFinalAmount } from "./payment-amount.ts";

test("payment reconciliation accepts the saved CHF final amount only", () => {
  assert.equal(matchesOrderCharge("135.00", 13500, "chf"), true);
  assert.equal(matchesOrderCharge("135.00", 15000, "chf"), false);
  assert.equal(matchesOrderCharge("135.00", 13500, "eur"), false);
  assert.equal(matchesOrderCharge("135.00", null, "chf"), false);
});

test("the saved order total equals what Stripe charges for the same lines", () => {
  // Three items at 0.10 make 0.30000000000000004 in floating point; Stripe adds whole cents per line.
  const lines = [{ price: 0.1, quantity: 3 }, { price: 19.99, quantity: 2 }];
  const itemsTotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const stripeCents = lines.reduce((sum, line) => sum + Math.round(line.price * 100) * line.quantity, 0) - 403 + 490;

  const total = orderFinalAmount(itemsTotal, 403, 4.9);
  assert.equal(total, 41.15);
  assert.equal(matchesOrderCharge(total, stripeCents, "chf"), true);
  assert.equal(orderFinalAmount(25, 0, 0), 25);
});
