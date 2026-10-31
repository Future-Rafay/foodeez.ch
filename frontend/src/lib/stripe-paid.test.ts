import assert from "node:assert/strict";
import test from "node:test";

type Order = { PAYMENT_DONE: number; INVENTORY_RELEASED_DATETIME: Date | null; STRIPE_PAYMENT_INTENT_ID: string | null };

// Minimal stand-in that applies the same where-clause rules MySQL would.
function fakeDb(order: Order) {
  return {
    business_order: {
      updateMany: async ({ where, data }: { where: { PAYMENT_DONE: { in: number[] }; INVENTORY_RELEASED_DATETIME: null }; data: Partial<Order> }) => {
        const matches = where.PAYMENT_DONE.in.includes(order.PAYMENT_DONE) &&
          (where.INVENTORY_RELEASED_DATETIME !== null || order.INVENTORY_RELEASED_DATETIME === null);
        if (!matches) return { count: 0 };
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) (order as Record<string, unknown>)[key] = value;
        }
        return { count: 1 };
      },
    },
  };
}

test("a late paid event never revives an order whose stock was released", async () => {
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { markStripeOrderPaid } = await import("./inventory.ts");
  const order: Order = { PAYMENT_DONE: 3, INVENTORY_RELEASED_DATETIME: new Date(), STRIPE_PAYMENT_INTENT_ID: null };

  assert.equal(await markStripeOrderPaid(fakeDb(order) as never, 1, "pi_late"), false);
  assert.equal(order.PAYMENT_DONE, 3);
});

test("paid events never downgrade a refunded order", async () => {
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { markStripeOrderPaid } = await import("./inventory.ts");
  const order: Order = { PAYMENT_DONE: 2, INVENTORY_RELEASED_DATETIME: null, STRIPE_PAYMENT_INTENT_ID: "pi_1" };

  assert.equal(await markStripeOrderPaid(fakeDb(order) as never, 1, "pi_1"), false);
  assert.equal(order.PAYMENT_DONE, 2);
});

test("a pending order is marked paid and keeps its intent id when none is sent", async () => {
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { markStripeOrderPaid } = await import("./inventory.ts");
  const order: Order = { PAYMENT_DONE: 0, INVENTORY_RELEASED_DATETIME: null, STRIPE_PAYMENT_INTENT_ID: "pi_saved" };

  assert.equal(await markStripeOrderPaid(fakeDb(order) as never, 1, null), true);
  assert.equal(order.PAYMENT_DONE, 1);
  assert.equal(order.STRIPE_PAYMENT_INTENT_ID, "pi_saved");
});
