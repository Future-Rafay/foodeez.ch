import assert from "node:assert/strict";
import test from "node:test";
import { getDeliveryQuote, getFulfillmentOptions } from "./fulfillment";

test("delivery options and quotes require an explicit enabled setting", () => {
  for (const settings of [null, { DELIVERY_ENABLED: null }, { DELIVERY_ENABLED: 0 }]) {
    assert.equal(getFulfillmentOptions(settings).deliveryEnabled, false);
    assert.equal(getDeliveryQuote(settings, "8000", 20).available, false);
  }
  const enabled = { DELIVERY_ENABLED: 1, DELIVERY_RANGE_ZIP_CODES: "8000" };
  assert.equal(getFulfillmentOptions(enabled).deliveryEnabled, true);
  assert.equal(getDeliveryQuote(enabled, "8000", 20).available, true);
});
