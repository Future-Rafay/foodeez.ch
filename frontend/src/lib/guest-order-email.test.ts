import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { sendGuestOrderEmailSafely } from "./guest-order-email";

test("guest email provider failure does not invalidate the order flow", async () => {
  const consoleError = mock.method(console, "error", () => undefined);
  try {
    const sent = await sendGuestOrderEmailSafely(
      async () => {
        throw new Error("provider unavailable");
      },
      "guest@example.com",
      {
        orderNumber: "FDZ.000042",
        restaurantName: "Restaurant",
        items: [{ name: "Meal", quantity: 1, subtotal: "CHF 10.00" }],
        total: "CHF 10.00",
        paymentStatus: "Payment pending",
        fulfillment: "Pickup",
        trackingUrl: "https://foodeez.ch/order/success?guestToken=secret",
      },
      42
    );

    assert.equal(sent, false);
    assert.equal(consoleError.mock.callCount(), 1);
  } finally {
    consoleError.mock.restore();
  }
});
