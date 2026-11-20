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

test("reserving stock never takes more than is available, even when the cart repeats a product", async () => {
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { reserveCartInventory } = await import("./inventory.ts");
  const product = {
    BUSINESS_PRODUCT_ID: 7, BUSINESS_ID: 1, TITLE: "Pizza", PIC: null, PRODUCT_PRICE: 12.5,
    TRACK_INVENTORY: 1, INVENTORY_AVAILABLE: 3, INVENTORY_COMMITED: 0,
  };
  const db = {
    business_product: {
      findMany: async () => [{ ...product }],
      findUnique: async () => ({ ...product }),
      // Mirrors the SQL guard: the row changes only while enough stock is left.
      updateMany: async ({ where, data }: {
        where: { INVENTORY_AVAILABLE: { gte: number } };
        data: { INVENTORY_AVAILABLE: { decrement: number }; INVENTORY_COMMITED: { increment: number } };
      }) => {
        if (product.INVENTORY_AVAILABLE < where.INVENTORY_AVAILABLE.gte) return { count: 0 };
        product.INVENTORY_AVAILABLE -= data.INVENTORY_AVAILABLE.decrement;
        product.INVENTORY_COMMITED += data.INVENTORY_COMMITED.increment;
        return { count: 1 };
      },
    },
  };

  await reserveCartInventory(db as never, [{ id: 7, quantity: 2 }]);
  assert.deepEqual([product.INVENTORY_AVAILABLE, product.INVENTORY_COMMITED], [1, 2]);

  // Each line alone fits the one item left; together they do not.
  await assert.rejects(
    reserveCartInventory(db as never, [{ id: 7, quantity: 1 }, { id: 7, quantity: 1 }]),
    /Only 0 left in stock for Pizza\./
  );
  assert.equal(product.INVENTORY_AVAILABLE, 0);

  await assert.rejects(reserveCartInventory(db as never, [{ id: 7, quantity: 1 }]), /Only 0 left in stock for Pizza\./);
});
