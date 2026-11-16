import { cents, chf } from "@/lib/discounts";

/** What the customer pays in CHF: items minus discount plus delivery, counted in whole cents like the Stripe total. */
export const orderFinalAmount = (itemsTotal: number, discountCents: number, shippingCharges: number) =>
  chf(cents(itemsTotal) - discountCents + cents(shippingCharges));

export function matchesOrderCharge(orderFinalAmount: unknown, amountCents: number | null, currency: string | null) {
  return currency?.toLowerCase() === "chf" && Number.isSafeInteger(amountCents) &&
    amountCents === cents(Number(orderFinalAmount));
}
