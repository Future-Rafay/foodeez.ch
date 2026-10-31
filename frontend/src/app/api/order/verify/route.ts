import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PAYMENT_DONE } from "@/lib/order";
import { markStripeOrderPaid, releaseExpiredStripeOrderInventory } from "@/lib/inventory";
import { matchesOrderCharge } from "@/lib/payment-amount";
import { stripe } from "@/lib/stripe-server";

const paymentIntentId = (value: string | Stripe.PaymentIntent | null) =>
  typeof value === "string" ? value : value?.id ?? null;

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Session ID is missing." }, { status: 400 });
  }

  const order = await prisma.business_order.findFirst({
    where: { STRIPE_CHECKOUT_SESSION_ID: sessionId },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found for this Stripe session." }, { status: 404 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const intentId = paymentIntentId(session.payment_intent);
    const paymentDone =
      session.payment_status === "paid"
        ? PAYMENT_DONE.paid
        : session.status === "expired"
          ? PAYMENT_DONE.failed
          : PAYMENT_DONE.pending;

    if (paymentDone === PAYMENT_DONE.paid && !matchesOrderCharge(order.ORDER_FINAL_AMOUNT, session.amount_total, session.currency)) {
      console.error("Stripe session total differs from order", { orderId: order.BUSINESS_ORDER_ID, sessionId });
      return NextResponse.json({ success: false, error: "Payment amount needs review." }, { status: 409 });
    }

    if (session.status === "expired") {
      await prisma.$transaction((tx) =>
        releaseExpiredStripeOrderInventory(tx, order.BUSINESS_ORDER_ID)
      );
    } else if (paymentDone === PAYMENT_DONE.paid) {
      await markStripeOrderPaid(prisma, order.BUSINESS_ORDER_ID, intentId);
    }

    const currentOrder = await prisma.business_order.findUnique({
      where: { BUSINESS_ORDER_ID: order.BUSINESS_ORDER_ID },
      select: { PAYMENT_DONE: true },
    });

    return NextResponse.json({
      success: true,
      orderId: order.BUSINESS_ORDER_ID,
      paymentDone: currentOrder?.PAYMENT_DONE ?? paymentDone,
      paymentIntentId: intentId,
    });
  } catch (error) {
    console.error("Error verifying Stripe order:", error);
    return NextResponse.json(
      { success: false, error: "Order payment verification failed." },
      { status: 500 }
    );
  }
}
