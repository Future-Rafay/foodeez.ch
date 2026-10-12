import assert from "node:assert/strict";
import test from "node:test";

test("guest tracking tokens are order-specific and reject modifications", async () => {
  process.env.NEXTAUTH_SECRET = "test-only-secret";
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { createGuestOrderToken, verifyGuestOrderToken } = await import("./guest-order.ts");
  const order = {
    orderId: 42,
    email: "Guest@Example.com",
    createdAt: "2026-10-12T10:00:00.000Z",
  };
  const token = createGuestOrderToken(order);
  assert.equal(verifyGuestOrderToken(order, token), true);
  assert.equal(verifyGuestOrderToken({ ...order, orderId: 43 }, token), false);
  assert.equal(verifyGuestOrderToken(order, token.slice(0, -1) + "x"), false);
});
