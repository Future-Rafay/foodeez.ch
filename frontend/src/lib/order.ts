export const ORDER_STATUS = {
  preparing: 1,
  outForDelivery: 2,
  delivered: 3,
  rejected: 4,
  readyForPickup: 5,
  pickedUp: 6,
} as const;

export const PAYMENT_DONE = {
  pending: 0,
  paid: 1,
  refunded: 2,
  failed: 3,
} as const;

export const ORDER_TYPE = {
  delivery: "delivery",
  pickup: "pickup",
} as const;

type OrderLike = {
  BUSINESS_ORDER_ID?: number | null;
  ORDER_NUMBER?: string | null;
  CREATION_DATETIME?: string | null;
  DELIVERY_ET?: string | null;
  ORDER_STATUS?: number | null;
  ORDER_TYPE?: string | null;
  business?: {
    BUSINESS_NAME?: string | null;
    DEFAULT_DELIVERY_PREP_MINUTES?: number | null;
    DEFAULT_PICKUP_PREP_MINUTES?: number | null;
  } | null;
};

type MoneyLike = number | string | { toString(): string } | null | undefined;

export type OrderProgressStep = {
  status: number;
  label: string;
};

const DELIVERY_STATUS_LABELS: Partial<Record<number, string>> = {
  [ORDER_STATUS.preparing]: "Preparing",
  [ORDER_STATUS.outForDelivery]: "Out for delivery",
  [ORDER_STATUS.delivered]: "Delivered",
  [ORDER_STATUS.rejected]: "Rejected",
};

const PICKUP_STATUS_LABELS: Partial<Record<number, string>> = {
  [ORDER_STATUS.preparing]: "Preparing",
  [ORDER_STATUS.readyForPickup]: "Ready for pickup",
  [ORDER_STATUS.pickedUp]: "Picked up",
  [ORDER_STATUS.rejected]: "Rejected",
};

const PAYMENT_STATUS_LABELS: Partial<Record<number, string>> = {
  [PAYMENT_DONE.pending]: "Payment pending",
  [PAYMENT_DONE.paid]: "Paid",
  [PAYMENT_DONE.refunded]: "Refunded",
  [PAYMENT_DONE.failed]: "Payment failed",
};

const PAYMENT_STATUS_COLORS: Partial<Record<number, string>> = {
  [PAYMENT_DONE.pending]: "text-yellow-700",
  [PAYMENT_DONE.paid]: "text-green-700",
  [PAYMENT_DONE.refunded]: "text-blue-700",
  [PAYMENT_DONE.failed]: "text-red-700",
};

const DELIVERY_PROGRESS_STEPS: OrderProgressStep[] = [
  { status: ORDER_STATUS.preparing, label: "Preparing" },
  { status: ORDER_STATUS.outForDelivery, label: "Out for delivery" },
  { status: ORDER_STATUS.delivered, label: "Delivered" },
];

const PICKUP_PROGRESS_STEPS: OrderProgressStep[] = [
  { status: ORDER_STATUS.preparing, label: "Preparing" },
  { status: ORDER_STATUS.readyForPickup, label: "Ready for pickup" },
  { status: ORDER_STATUS.pickedUp, label: "Picked up" },
];

const REJECTED_PROGRESS_STEPS: OrderProgressStep[] = [
  { status: ORDER_STATUS.preparing, label: "Preparing" },
  { status: ORDER_STATUS.rejected, label: "Rejected" },
];

const chfFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "CHF",
});

export const isPickupOrder = (order: OrderLike) =>
  order.ORDER_TYPE === ORDER_TYPE.pickup;

export const isDeliveryOrder = (order: OrderLike) =>
  order.ORDER_TYPE === ORDER_TYPE.delivery;

export const getOrderStatusLabel = (order: OrderLike) =>
  (isPickupOrder(order) ? PICKUP_STATUS_LABELS : DELIVERY_STATUS_LABELS)[
    order.ORDER_STATUS ?? 0
  ] ?? "Unknown";

export const getOrderProgressSteps = (order: OrderLike) => {
  if (order.ORDER_STATUS === ORDER_STATUS.rejected) return REJECTED_PROGRESS_STEPS;
  return isPickupOrder(order) ? PICKUP_PROGRESS_STEPS : DELIVERY_PROGRESS_STEPS;
};

export const getPaymentStatusLabel = (paymentDone?: number | null) =>
  PAYMENT_STATUS_LABELS[paymentDone ?? -1] ?? "Unknown";

export const getPaymentStatusColor = (paymentDone?: number | null) =>
  PAYMENT_STATUS_COLORS[paymentDone ?? -1] ?? "text-gray-700";

export const formatCHF = (amount: MoneyLike) => {
  const value = Number(amount ?? 0);
  return chfFormatter.format(Number.isFinite(value) ? value : 0);
};

export const formatOrderNumberFromId = (id: number) =>
  `FDZ.${Math.trunc(id).toString().padStart(6, "0")}`;

export const generateOrderNumberFromId = formatOrderNumberFromId;

export const getDisplayOrderNumber = (order: OrderLike) =>
  order.ORDER_NUMBER || formatOrderNumberFromId(order.BUSINESS_ORDER_ID ?? 0);

export const formatEtaTimeOnly = (value?: string | Date | null) => {
  if (!value) return "Not set";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const getDisplayEta = (order: OrderLike) => {
  if (order.DELIVERY_ET) return formatEtaTimeOnly(order.DELIVERY_ET);
  if (!order.CREATION_DATETIME) return "Not set";
  const minutes = isPickupOrder(order)
    ? order.business?.DEFAULT_PICKUP_PREP_MINUTES ?? 20
    : order.business?.DEFAULT_DELIVERY_PREP_MINUTES ?? 45;
  const eta = new Date(order.CREATION_DATETIME);
  eta.setMinutes(eta.getMinutes() + minutes);
  return formatEtaTimeOnly(eta);
};
