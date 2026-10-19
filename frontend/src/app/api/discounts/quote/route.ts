import { NextResponse } from "next/server";
import type { CartItem } from "@/stores/cartStore";
import { cents } from "@/lib/discounts";
import { resolveOnlineDiscount } from "@/lib/online-discounts";
import { validateCartInventory } from "@/lib/inventory";
import { getBusinessMenuWithProducts } from "@/services/MenuPageService";
import { prisma } from "@/lib/prisma";
import { getDeliveryQuote } from "@/lib/fulfillment";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || !body.items.length || body.items.length > 100) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }
  const items = body.items as CartItem[];
  if (items.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 999)) {
    return NextResponse.json({ error: "Invalid item quantity." }, { status: 400 });
  }
  if (body.paymentMethod !== "card" && body.paymentMethod !== "cash_on_delivery" && body.paymentMethod !== "pay_at_pickup") {
    return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
  }
  if (body.orderType !== "delivery" && body.orderType !== "pickup") return NextResponse.json({ error: "Choose delivery or pickup." }, { status: 400 });
  try {
    const products = await validateCartInventory(items);
    const businessIds = new Set(products.map((item) => item.BUSINESS_ID));
    if (businessIds.size !== 1) throw new Error("Order items must belong to one restaurant.");
    const businessId = Number(products[0].BUSINESS_ID);
    const menu = await getBusinessMenuWithProducts(businessId);
    const available = new Set(menu.map((item) => Number(item.BUSINESS_PRODUCT_ID)));
    if (products.some((item) => !available.has(item.BUSINESS_PRODUCT_ID))) throw new Error("One or more products are unavailable online.");
    const price = new Map(products.map((item) => [item.BUSINESS_PRODUCT_ID, Number(item.PRODUCT_PRICE)]));
    const subtotalCents = items.reduce((sum, item) => sum + cents(price.get(Number(item.id)) || 0) * Number(item.quantity), 0);
    let shippingCents = 0;
    if (body.orderType === "delivery" && typeof body.postalCode === "string" && body.postalCode.trim()) {
      const settings = await prisma.business_settings.findUnique({ where: { BUSINESS_ID: businessId } });
      const delivery = getDeliveryQuote(settings, body.postalCode, subtotalCents / 100);
      if (delivery.available) shippingCents = cents(delivery.deliveryPrice);
    }
    const { applied, automaticBeatCoupon } = await resolveOnlineDiscount(
      businessId, subtotalCents, body.couponCode,
      body.paymentMethod === "card" ? Math.max(1, 50 - shippingCents) : 1
    );
    return NextResponse.json({
      subtotalCents, discountCents: applied?.amountCents ?? 0,
      itemsTotalCents: subtotalCents - (applied?.amountCents ?? 0),
      discountId: applied?.id ?? null, discountName: applied?.name ?? null,
      couponCode: applied?.code ?? null, automaticBeatCoupon,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("Coupon ")) return NextResponse.json({ error: message }, { status: 409 });
    return NextResponse.json({ error: "Cart or discount changed. Refresh checkout and try again." }, { status: 409 });
  }
}
