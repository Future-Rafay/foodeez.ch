import { PAYMENT_DONE } from "./order";

export type ChangedField = "eta" | "status" | "payment" | "rejection";
export type ChangedOrders = Record<number, ChangedField[]>;

type ChangeOrder = {
  BUSINESS_ORDER_ID: number;
  DELIVERY_ET?: string | null;
  ORDER_STATUS?: number | null;
  PAYMENT_DONE?: number | null;
  ORDER_REFUND_AMOUNT?: number | null;
  STRIPE_REFUND_STATUS?: string | null;
  STRIPE_REFUNDED_DATETIME?: string | null;
  ORDER_REJECTION_REASON?: string | null;
  ORDER_REJECTION_NOTE?: string | null;
};

export const PENDING_ORDER_CHANGES_KEY = "foodeez:pending-order-highlights";

export const findOrderChanges = (before: ChangeOrder[], after: ChangeOrder[]): ChangedOrders => {
  const previous = new Map(before.map((order) => [order.BUSINESS_ORDER_ID, order]));
  return Object.fromEntries(after.flatMap((order) => {
    const old = previous.get(order.BUSINESS_ORDER_ID);
    if (!old) return [];
    const changed: ChangedField[] = [];
    if (old.DELIVERY_ET !== order.DELIVERY_ET) changed.push("eta");
    if (
      old.ORDER_STATUS !== order.ORDER_STATUS ||
      (old.PAYMENT_DONE === PAYMENT_DONE.refunded || Number(old.ORDER_REFUND_AMOUNT) > 0) !==
        (order.PAYMENT_DONE === PAYMENT_DONE.refunded || Number(order.ORDER_REFUND_AMOUNT) > 0)
    ) changed.push("status");
    if (
      old.PAYMENT_DONE !== order.PAYMENT_DONE ||
      old.ORDER_REFUND_AMOUNT !== order.ORDER_REFUND_AMOUNT ||
      old.STRIPE_REFUND_STATUS !== order.STRIPE_REFUND_STATUS ||
      old.STRIPE_REFUNDED_DATETIME !== order.STRIPE_REFUNDED_DATETIME
    ) changed.push("payment");
    if (
      old.ORDER_REJECTION_REASON !== order.ORDER_REJECTION_REASON ||
      old.ORDER_REJECTION_NOTE !== order.ORDER_REJECTION_NOTE
    ) changed.push("rejection");
    return changed.length ? [[order.BUSINESS_ORDER_ID, changed]] : [];
  })) as ChangedOrders;
};
