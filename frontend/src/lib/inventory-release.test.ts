import assert from "node:assert/strict";
import test from "node:test";

test("expired Stripe inventory is released only once", async () => {
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { releaseExpiredStripeOrderInventory } = await import("./inventory.ts");
  let claimed = false;
  let available = 7;
  let committed = 2;
  const db = {
    business_order: {
      updateMany: async () => {
        if (claimed) return { count: 0 };
        claimed = true;
        return { count: 1 };
      },
    },
    business_order_detail: {
      findMany: async () => [{ BUSINESS_PRODUCT_ID: 5, ORDER_QUANTITY: 2 }],
    },
    business_product: {
      findFirst: async () => ({ BUSINESS_PRODUCT_ID: 5 }),
      updateMany: async () => {
        available += 2;
        committed -= 2;
        return { count: 1 };
      },
    },
  };

  assert.equal(await releaseExpiredStripeOrderInventory(db as never, 42), true);
  assert.equal(await releaseExpiredStripeOrderInventory(db as never, 42), false);
  assert.equal(available, 9);
  assert.equal(committed, 0);
});
