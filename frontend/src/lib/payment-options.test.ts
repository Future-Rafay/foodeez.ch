import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's TypeScript test runner requires the file extension.
import { getAvailablePaymentMethods } from "./payment-options.ts";

test("card is always available and cash follows fulfillment settings", () => {
  assert.deepEqual(
    getAvailablePaymentMethods("delivery", {
      cashOnDeliveryEnabled: false,
      cashOnPickupEnabled: true,
    }),
    ["card"]
  );
  assert.deepEqual(
    getAvailablePaymentMethods("delivery", {
      cashOnDeliveryEnabled: true,
      cashOnPickupEnabled: true,
    }),
    ["card", "cash_on_delivery"]
  );
  assert.deepEqual(
    getAvailablePaymentMethods("pickup", {
      cashOnDeliveryEnabled: true,
      cashOnPickupEnabled: true,
    }),
    ["card", "pay_at_pickup"]
  );
});
