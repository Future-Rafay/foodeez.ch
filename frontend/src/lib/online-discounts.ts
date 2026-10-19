import { prisma } from "@/lib/prisma";
import { bestDiscount, calculateDiscount, type AppliedDiscount, type Discount } from "@/lib/discounts";

function rowToDiscount(row: {
  DISCOUNT_ID: number; NAME: string; TYPE: string; VALUE: unknown; MINIMUM_ORDER: unknown;
  ACTIVE: number; POS_ENABLED: number; ONLINE_ENABLED: number; ONLINE_AUTOMATIC: number;
  VALID_FROM: Date | null; VALID_UNTIL: Date | null;
}): Discount {
  return {
    id: row.DISCOUNT_ID, name: row.NAME, type: row.TYPE as Discount["type"], value: Number(row.VALUE),
    minimumOrder: row.MINIMUM_ORDER == null ? null : Number(row.MINIMUM_ORDER),
    active: row.ACTIVE === 1, posEnabled: row.POS_ENABLED === 1,
    onlineEnabled: row.ONLINE_ENABLED === 1, onlineAutomatic: row.ONLINE_AUTOMATIC === 1,
    validFrom: row.VALID_FROM?.toISOString().slice(0, 10) ?? null,
    validUntil: row.VALID_UNTIL?.toISOString().slice(0, 10) ?? null,
  };
}

export function normalizeCouponCode(input: unknown) {
  if (input == null || input === "") return null;
  if (typeof input !== "string") throw new Error("Invalid coupon code.");
  const code = input.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{4,64}$/.test(code)) throw new Error("Invalid coupon code.");
  return code;
}

export async function resolveOnlineDiscount(
  businessId: number,
  subtotalCents: number,
  rawCode: unknown,
  minimumPayableCents: number
): Promise<{ applied: AppliedDiscount | null; couponCode: string | null; automaticBeatCoupon: boolean }> {
  const code = normalizeCouponCode(rawCode);
  const rows = await prisma.business_discount.findMany({ where: { BUSINESS_ID: businessId, ACTIVE: 1, ONLINE_ENABLED: 1 } });
  const discounts = rows.map(rowToDiscount);
  const automatic = discounts.filter((item) => item.onlineAutomatic).map((discount) => ({ discount, code: null }));
  let coupon: { discount: Discount; code: string } | null = null;
  if (code) {
    const codeRow = await prisma.business_discount_code.findFirst({ where: { BUSINESS_ID: businessId, CODE: code, ACTIVE: 1 } });
    const discount = discounts.find((item) => item.id === codeRow?.DISCOUNT_ID);
    if (!discount || calculateDiscount(discount, subtotalCents, "online") <= 0 ||
      subtotalCents - calculateDiscount(discount, subtotalCents, "online") < minimumPayableCents) {
      throw new Error("Coupon is invalid or not eligible for this order.");
    }
    coupon = { discount, code };
  }
  const applied = bestDiscount([...automatic, ...(coupon ? [coupon] : [])], subtotalCents, "online", minimumPayableCents);
  return { applied, couponCode: code, automaticBeatCoupon: Boolean(code && applied && !applied.code) };
}
