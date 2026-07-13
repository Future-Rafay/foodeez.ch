import { prisma } from "@/lib/prisma";

type InventoryItem = {
  id: string | number;
  quantity: number | null | undefined;
};

type InventoryDb = Pick<typeof prisma, "business_product">;

export async function validateCartInventory(items: InventoryItem[], db: InventoryDb = prisma) {
  const productIds = Array.from(new Set(items.map((item) => Number(item.id))));
  if (!productIds.length || productIds.some((id) => !Number.isInteger(id))) {
    throw new Error("Invalid cart item");
  }

  const products = await db.business_product.findMany({
    where: { BUSINESS_PRODUCT_ID: { in: productIds }, STATUS: 1 },
    select: {
      BUSINESS_PRODUCT_ID: true,
      BUSINESS_ID: true,
      TITLE: true,
      TRACK_INVENTORY: true,
      INVENTORY_AVAILABLE: true,
    },
  });

  if (products.length !== productIds.length) throw new Error("Invalid cart item");

  const productById = new Map(
    products.map((product) => [product.BUSINESS_PRODUCT_ID, product])
  );

  for (const item of items) {
    const product = productById.get(Number(item.id));
    const quantity = Number(item.quantity ?? 0);
    const available = Number(product?.INVENTORY_AVAILABLE ?? 0);

    if (!product || quantity <= 0) throw new Error("Invalid cart item");
    if (Number(product.TRACK_INVENTORY ?? 0) === 1 && quantity > available) {
      throw new Error(`Only ${available} left in stock for ${product.TITLE}.`);
    }
  }

  return products;
}

export async function reserveCartInventory(db: InventoryDb, items: InventoryItem[]) {
  const products = await validateCartInventory(items, db);
  const productById = new Map(
    products.map((product) => [product.BUSINESS_PRODUCT_ID, product])
  );

  for (const item of items) {
    const product = productById.get(Number(item.id));
    const quantity = Number(item.quantity ?? 0);
    if (!product || Number(product.TRACK_INVENTORY ?? 0) !== 1) continue;

    const result = await db.business_product.updateMany({
      where: {
        BUSINESS_PRODUCT_ID: product.BUSINESS_PRODUCT_ID,
        TRACK_INVENTORY: 1,
        INVENTORY_AVAILABLE: { gte: quantity },
      },
      data: {
        INVENTORY_AVAILABLE: { decrement: quantity },
        INVENTORY_COMMITED: { increment: quantity },
      },
    });

    if (result.count !== 1) {
      const fresh = await db.business_product.findUnique({
        where: { BUSINESS_PRODUCT_ID: product.BUSINESS_PRODUCT_ID },
        select: { INVENTORY_AVAILABLE: true, TITLE: true },
      });
      throw new Error(
        `Only ${Number(fresh?.INVENTORY_AVAILABLE ?? 0)} left in stock for ${fresh?.TITLE || product.TITLE}.`
      );
    }
  }
}
