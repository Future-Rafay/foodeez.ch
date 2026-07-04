import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PAYMENT_DONE } from "@/lib/order";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

const intentId = (value: string | Stripe.PaymentIntent | null) =>
  typeof value === "string" ? value : value?.id ?? null;

async function markBySession(session: Stripe.Checkout.Session) {
  await prisma.business_order.updateMany({
    where: {
      OR: [
        { STRIPE_CHECKOUT_SESSION_ID: session.id },
        { BUSINESS_ORDER_ID: Number(session.metadata?.orderId || 0) },
      ],
    },
    data: {
      PAYMENT_DONE: PAYMENT_DONE.paid,
      PAYMENT_MODE: "stripe",
      STRIPE_PAYMENT_INTENT_ID: intentId(session.payment_intent),
    },
  });
}

async function markByPaymentIntent(paymentIntent: Stripe.PaymentIntent, paymentDone: number) {
  await prisma.business_order.updateMany({
    where: {
      OR: [
        { STRIPE_PAYMENT_INTENT_ID: paymentIntent.id },
        { BUSINESS_ORDER_ID: Number(paymentIntent.metadata?.orderId || 0) },
      ],
    },
    data: {
      PAYMENT_DONE: paymentDone,
      PAYMENT_MODE: "stripe",
      STRIPE_PAYMENT_INTENT_ID: paymentIntent.id,
    },
  });
}

export async function POST(req: NextRequest) {
  const signature = headers().get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    await markBySession(event.data.object as Stripe.Checkout.Session);
  } else if (event.type === "payment_intent.succeeded") {
    await markByPaymentIntent(event.data.object as Stripe.PaymentIntent, PAYMENT_DONE.paid);
  } else if (event.type === "payment_intent.payment_failed") {
    await markByPaymentIntent(event.data.object as Stripe.PaymentIntent, PAYMENT_DONE.failed);
  }

  return NextResponse.json({ received: true });
}
