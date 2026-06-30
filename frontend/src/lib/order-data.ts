import { prisma } from "@/lib/prisma";

type DbOrder = Awaited<ReturnType<typeof prisma.business_order.findMany>>[number];
type DbDetail = Awaited<ReturnType<typeof prisma.business_order_detail.findMany>>[number];
type BusinessLite = {
  BUSINESS_ID: number;
  BUSINESS_NAME: string | null;
  ADDRESS_STREET: string | null;
  ADDRESS_ZIP: bigint | null;
  ADDRESS_TOWN: string | null;
  ADDRESS_COUNTRY: string | null;
};
type SettingsLite = {
  BUSINESS_ID: number;
  PICKUP_INSTRUCTIONS: string | null;
  DEFAULT_DELIVERY_PREP_MINUTES: number | null;
  DEFAULT_PICKUP_PREP_MINUTES: number | null;
};
type ProductLite = {
  BUSINESS_PRODUCT_ID: number;
  TITLE: string;
  DESCRIPTION: string | null;
  PIC: string | null;
  PRODUCT_PRICE: unknown;
};

export type CustomerOrder = ReturnType<typeof formatOrder>;

const number = (value: unknown) => Number(value ?? 0);
const iso = (value?: Date | null) => value?.toISOString() ?? null;

export async function getVisitorByEmail(email: string) {
  return prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: email },
    select: { VISITORS_ACCOUNT_ID: true, EMAIL_ADDRESS: true },
  });
}

async function hydrateOrders(orders: DbOrder[]) {
  const uniqueOrders = Array.from(
    new Map(orders.map((order) => [order.BUSINESS_ORDER_ID, order])).values()
  );
  const orderIds = uniqueOrders.map((order) => order.BUSINESS_ORDER_ID);
  const businessIds = Array.from(new Set(uniqueOrders.map((order) => order.BUSINESS_ID).filter(Boolean))) as number[];

  const [details, businesses, settings] = await Promise.all([
    orderIds.length
      ? prisma.business_order_detail.findMany({ where: { BUSINESS_ORDER_ID: { in: orderIds } } })
      : [],
    businessIds.length
      ? prisma.business.findMany({
          where: { BUSINESS_ID: { in: businessIds } },
          select: {
            BUSINESS_ID: true,
            BUSINESS_NAME: true,
            ADDRESS_STREET: true,
            ADDRESS_ZIP: true,
            ADDRESS_TOWN: true,
            ADDRESS_COUNTRY: true,
          },
        })
      : [],
    businessIds.length
      ? prisma.business_settings.findMany({
          where: { BUSINESS_ID: { in: businessIds } },
          select: {
            BUSINESS_ID: true,
            PICKUP_INSTRUCTIONS: true,
            DEFAULT_DELIVERY_PREP_MINUTES: true,
            DEFAULT_PICKUP_PREP_MINUTES: true,
          },
        })
      : [],
  ]);

  const productIds = Array.from(new Set(details.map((detail) => detail.BUSINESS_PRODUCT_ID).filter(Boolean))) as number[];
  const products = productIds.length
    ? await prisma.business_product.findMany({
        where: { BUSINESS_PRODUCT_ID: { in: productIds } },
        select: {
          BUSINESS_PRODUCT_ID: true,
          TITLE: true,
          DESCRIPTION: true,
          PIC: true,
          PRODUCT_PRICE: true,
        },
      })
    : [];

  const detailsByOrderId = new Map<number, DbDetail[]>();
  for (const detail of details) {
    if (!detail.BUSINESS_ORDER_ID) continue;
    detailsByOrderId.set(detail.BUSINESS_ORDER_ID, [
      ...(detailsByOrderId.get(detail.BUSINESS_ORDER_ID) ?? []),
      detail,
    ]);
  }

  const businessById = new Map(businesses.map((business) => [business.BUSINESS_ID, business]));
  const settingsByBusinessId = new Map(settings.map((item) => [item.BUSINESS_ID, item]));
  const productById = new Map(products.map((product) => [product.BUSINESS_PRODUCT_ID, product]));

  return uniqueOrders.map((order) =>
    formatOrder(
      order,
      businessById.get(order.BUSINESS_ID ?? 0) ?? null,
      settingsByBusinessId.get(order.BUSINESS_ID ?? 0) ?? null,
      (detailsByOrderId.get(order.BUSINESS_ORDER_ID) ?? []).map((detail) => ({
        ...detail,
        product: productById.get(detail.BUSINESS_PRODUCT_ID ?? 0) ?? null,
      }))
    )
  );
}

function formatOrder(
  order: DbOrder,
  business: BusinessLite | null,
  settings: SettingsLite | null,
  details: Array<DbDetail & { product: ProductLite | null }>
) {
  return {
    BUSINESS_ORDER_ID: order.BUSINESS_ORDER_ID,
    CREATION_DATETIME: iso(order.CREATION_DATETIME),
    BUSINESS_ID: order.BUSINESS_ID,
    VISITOR_ID: order.VISITOR_ID,
    PAYMENT_DONE: order.PAYMENT_DONE,
    PAYMENT_MODE: order.PAYMENT_MODE,
    DELIVERY_ET: iso(order.DELIVERY_ET),
    DELIVERY_DATETIME: iso(order.DELIVERY_DATETIME),
    ORDER_STATUS: order.ORDER_STATUS,
    ORDER_TYPE: order.ORDER_TYPE,
    FIRST_NAME: order.FIRST_NAME,
    LAST_NAME: order.LAST_NAME,
    ADDRESS_STREET: order.ADDRESS_STREET,
    ADDRESS_ZIP: order.ADDRESS_ZIP,
    ADDRESS_TOWN: order.ADDRESS_TOWN,
    ADDRESS_COUNTRY_CODE: order.ADDRESS_COUNTRY_CODE,
    PHONE_NUMBER: order.PHONE_NUMBER,
    EMAIL_ADDRESS: order.EMAIL_ADDRESS,
    ORDER_GROSS_AMOUNT: number(order.ORDER_GROSS_AMOUNT),
    ORDER_TAX_AMOUNT: number(order.ORDER_TAX_AMOUNT),
    ORDER_NET_AMOUNT: number(order.ORDER_NET_AMOUNT),
    ORDER_DISCOUNT_AMOUNT: number(order.ORDER_DISCOUNT_AMOUNT),
    ORDER_AMOUNT: number(order.ORDER_AMOUNT),
    SHIPPING_CHARGES: number(order.SHIPPING_CHARGES),
    ORDER_REFUND_AMOUNT: number(order.ORDER_REFUND_AMOUNT),
    ORDER_FINAL_AMOUNT: number(order.ORDER_FINAL_AMOUNT),
    ORDER_REJECTION_REASON: order.ORDER_REJECTION_REASON,
    ORDER_REJECTION_NOTE: order.ORDER_REJECTION_NOTE,
    REJECTED_DATETIME: iso(order.REJECTED_DATETIME),
    business: business
      ? {
          BUSINESS_ID: business.BUSINESS_ID,
          BUSINESS_NAME: business.BUSINESS_NAME,
          ADDRESS_STREET: business.ADDRESS_STREET,
          ADDRESS_ZIP: business.ADDRESS_ZIP?.toString() ?? null,
          ADDRESS_TOWN: business.ADDRESS_TOWN,
          ADDRESS_COUNTRY: business.ADDRESS_COUNTRY,
          PICKUP_INSTRUCTIONS: settings?.PICKUP_INSTRUCTIONS ?? null,
          DEFAULT_DELIVERY_PREP_MINUTES: settings?.DEFAULT_DELIVERY_PREP_MINUTES ?? 45,
          DEFAULT_PICKUP_PREP_MINUTES: settings?.DEFAULT_PICKUP_PREP_MINUTES ?? 20,
        }
      : null,
    details: details.map((detail) => ({
      BUSINESS_ORDER_DETAIL_ID: detail.BUSINESS_ORDER_DETAIL_ID,
      BUSINESS_PRODUCT_ID: detail.BUSINESS_PRODUCT_ID,
      ORDER_QUANTITY: detail.ORDER_QUANTITY,
      QUANTITY_DELIVERED: detail.QUANTITY_DELIVERED,
      PRODUCT_SELL_PRICE: number(detail.PRODUCT_SELL_PRICE),
      PRODUCT_DISCOUNT: number(detail.PRODUCT_DISCOUNT),
      PRODUCT_PRICE: number(detail.PRODUCT_PRICE),
      product: detail.product
        ? {
            BUSINESS_PRODUCT_ID: detail.product.BUSINESS_PRODUCT_ID,
            TITLE: detail.product.TITLE,
            DESCRIPTION: detail.product.DESCRIPTION,
            PIC: detail.product.PIC,
            PRODUCT_PRICE: number(detail.product.PRODUCT_PRICE),
          }
        : null,
    })),
  };
}

export async function getCustomerOrders(visitorId: number, email: string) {
  const orders = await prisma.business_order.findMany({
    where: visitorId ? { VISITOR_ID: visitorId } : { EMAIL_ADDRESS: email },
    orderBy: { CREATION_DATETIME: "desc" },
  });

  return hydrateOrders(orders);
}

export async function getCustomerOrder(orderId: number, visitorId: number, email: string) {
  const order = await prisma.business_order.findFirst({
    where: {
      BUSINESS_ORDER_ID: orderId,
      ...(visitorId ? { VISITOR_ID: visitorId } : { EMAIL_ADDRESS: email }),
    },
  });

  return order ? (await hydrateOrders([order]))[0] : null;
}
