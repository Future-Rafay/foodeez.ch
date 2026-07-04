import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PAYMENT_DONE } from "@/lib/order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

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

    await prisma.business_order.update({
      where: { BUSINESS_ORDER_ID: order.BUSINESS_ORDER_ID },
      data: {
        PAYMENT_DONE: paymentDone,
        PAYMENT_MODE: "stripe",
        STRIPE_PAYMENT_INTENT_ID: intentId || order.STRIPE_PAYMENT_INTENT_ID,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.BUSINESS_ORDER_ID,
      paymentDone,
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
