import { cents } from "@/lib/discounts";

export function matchesOrderCharge(orderFinalAmount: unknown, amountCents: number | null, currency: string | null) {
  return currency?.toLowerCase() === "chf" && Number.isSafeInteger(amountCents) &&
    amountCents === cents(Number(orderFinalAmount));
}
