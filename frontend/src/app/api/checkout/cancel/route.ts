import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredStripeOrderInventory } from "@/lib/inventory";
import { stripe } from "@/lib/stripe-server";

export const runtime = "nodejs";

/**
 * The customer came back from Stripe without paying. Closing the payment page ends that order, so its
 * reserved stock is free at once instead of after the 35-minute expiry. The session id is the proof of
 * ownership: /api/checkout only ever returns it to the browser that started the checkout.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]{8,250}$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
  }

  const order = await prisma.business_order.findFirst({
    where: { STRIPE_CHECKOUT_SESSION_ID: sessionId },
    select: { BUSINESS_ORDER_ID: true },
  });
  if (!order) return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });

  try {
    let session = await stripe.checkout.sessions.retrieve(sessionId);
    // Stripe closes only open sessions; a paid one stays exactly as it is.
    if (session.status === "open") session = await stripe.checkout.sessions.expire(sessionId);
    const released =
      session.status === "expired" &&
      (await prisma.$transaction((tx) => releaseExpiredStripeOrderInventory(tx, order.BUSINESS_ORDER_ID)));
    return NextResponse.json({ released });
  } catch (error) {
    console.error("Checkout cancel failed", {
      orderId: order.BUSINESS_ORDER_ID,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Checkout could not be cancelled." }, { status: 502 });
  }
}
