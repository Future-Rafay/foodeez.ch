import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { formatEtaTimeOnly, getDisplayOrderNumber, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/order";
import type { CustomerOrder } from "@/lib/order-data";

type Snapshot = {
  eta: string | null;
  status: number | null;
  payment: number | null;
  refundAmount: number;
  refundStatus: string | null;
  rejectionReason: string | null;
  rejectionNote: string | null;
};

const snapshot = (order: CustomerOrder): Snapshot => ({
  eta: order.DELIVERY_ET,
  status: order.ORDER_STATUS,
  payment: order.PAYMENT_DONE,
  refundAmount: order.ORDER_REFUND_AMOUNT,
  refundStatus: order.STRIPE_REFUND_STATUS,
  rejectionReason: order.ORDER_REJECTION_REASON,
  rejectionNote: order.ORDER_REJECTION_NOTE,
});

const eventKey = (orderId: number, type: string, value: unknown) =>
  createHash("sha256").update(`${orderId}:${type}:${JSON.stringify(value)}`).digest("hex");

export async function syncCustomerNotifications(visitorId: number, orders: CustomerOrder[]) {
  const tracked = orders.slice(0, 20);
  const existing = await prisma.customer_order_notification.findMany({
    where: { VISITORS_ACCOUNT_ID: visitorId, BUSINESS_ORDER_ID: { in: tracked.map((order) => order.BUSINESS_ORDER_ID) } },
    orderBy: { CUSTOMER_ORDER_NOTIFICATION_ID: "desc" },
    select: { BUSINESS_ORDER_ID: true, METADATA_JSON: true },
  });
  const previous = new Map<number, Snapshot>();
  for (const row of existing) {
    if (previous.has(row.BUSINESS_ORDER_ID)) continue;
    try {
      previous.set(row.BUSINESS_ORDER_ID, JSON.parse(row.METADATA_JSON || "{}").snapshot);
    } catch {}
  }

  const events = tracked.flatMap((order) => {
    const before = previous.get(order.BUSINESS_ORDER_ID);
    const current = snapshot(order);
    const number = getDisplayOrderNumber(order);
    const business = order.business?.BUSINESS_NAME || "Restaurant";
    const base = { VISITORS_ACCOUNT_ID: visitorId, BUSINESS_ORDER_ID: order.BUSINESS_ORDER_ID, BUSINESS_ID: order.BUSINESS_ID };
    const make = (type: string, title: string, message: string, changedField: string, value: unknown) => ({
      ...base,
      EVENT_KEY: eventKey(order.BUSINESS_ORDER_ID, type, value),
      NOTIFICATION_TYPE: type,
      TITLE: title,
      MESSAGE: message,
      METADATA_JSON: JSON.stringify({ changedField, snapshot: current }),
    });
    if (!before) return [make("order_created", `${number} Placed`, `${business} Received your order.`, "status", current.status)];
    const next = [];
    if (before.eta !== current.eta) next.push(make("eta_updated", `${number} ETA changed`, `${business} updated ETA to ${formatEtaTimeOnly(current.eta)}.`, "eta", current.eta));
    if (before.status !== current.status) next.push(make("status_updated", `${number} status changed`, `${business}: ${getOrderStatusLabel(order)}.`, "status", current.status));
    if (before.payment !== current.payment || before.refundAmount !== current.refundAmount || before.refundStatus !== current.refundStatus) {
      next.push(make("payment_updated", `${number} payment updated`, `${business}: ${getPaymentStatusLabel(current.payment)}.`, "payment", [current.payment, current.refundAmount, current.refundStatus]));
    }
    if (before.rejectionReason !== current.rejectionReason || before.rejectionNote !== current.rejectionNote) {
      next.push(make("rejection_updated", `${number} rejection updated`, `${business}: ${current.rejectionReason || "Rejection details changed"}.`, "rejection", [current.rejectionReason, current.rejectionNote]));
    }
    return next;
  });

  if (events.length) await prisma.customer_order_notification.createMany({ data: events, skipDuplicates: true });
}

export async function getCustomerNotifications(visitorId: number) {
  const rows = await prisma.customer_order_notification.findMany({
    where: { VISITORS_ACCOUNT_ID: visitorId },
    orderBy: { CUSTOMER_ORDER_NOTIFICATION_ID: "desc" },
    take: 50,
  });
  return rows.map((row) => ({
    id: row.CUSTOMER_ORDER_NOTIFICATION_ID,
    orderId: row.BUSINESS_ORDER_ID,
    title: row.TITLE,
    body: row.MESSAGE || "",
    isRead: row.IS_READ === 1,
    createdAt: row.CREATION_DATETIME?.toISOString() || null,
    metadata: (() => { try { return JSON.parse(row.METADATA_JSON || "{}"); } catch { return {}; } })(),
  }));
}
