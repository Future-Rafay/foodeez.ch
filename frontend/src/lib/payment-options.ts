export type FulfillmentType = "delivery" | "pickup";
export type PaymentMethod = "card" | "cash_on_delivery" | "pay_at_pickup";

export type CashPaymentSettings = {
  cashOnDeliveryEnabled: boolean;
  cashOnPickupEnabled: boolean;
};

export function getAvailablePaymentMethods(
  fulfillmentType: FulfillmentType,
  settings: CashPaymentSettings
): PaymentMethod[] {
  return [
    "card",
    ...(fulfillmentType === "delivery" && settings.cashOnDeliveryEnabled
      ? (["cash_on_delivery"] as const)
      : []),
    ...(fulfillmentType === "pickup" && settings.cashOnPickupEnabled
      ? (["pay_at_pickup"] as const)
      : []),
  ];
}

export const paymentMethodLabel = (method: PaymentMethod) =>
  method === "cash_on_delivery"
    ? "Cash on Delivery"
    : method === "pay_at_pickup"
      ? "Cash on Pickup"
      : "Card";
