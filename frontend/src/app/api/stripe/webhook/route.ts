import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PAYMENT_DONE } from "@/lib/order";
import { markStripeOrderPaid, releaseExpiredStripeOrderInventory } from "@/lib/inventory";
import { matchesOrderCharge } from "@/lib/payment-amount";
import { stripe } from "@/lib/stripe-server";

export const runtime = "nodejs";

const intentId = (value: string | Stripe.PaymentIntent | null) =>
  typeof value === "string" ? value : value?.id ?? null;

async function markBySession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const order = await prisma.business_order.findFirst({ where: { STRIPE_CHECKOUT_SESSION_ID: session.id } }) ||
    (Number(session.metadata?.orderId) > 0 ? await prisma.business_order.findFirst({ where: {
      BUSINESS_ORDER_ID: Number(session.metadata?.orderId), STRIPE_CHECKOUT_SESSION_ID: null,
    } }) : null);
  if (!order || !matchesOrderCharge(order.ORDER_FINAL_AMOUNT, session.amount_total, session.currency)) {
    console.error("Stripe session total differs from order", { sessionId: session.id });
    return;
  }
  await markStripeOrderPaid(prisma, order.BUSINESS_ORDER_ID, intentId(session.payment_intent));
}

async function markByPaymentIntent(paymentIntent: Stripe.PaymentIntent, paymentDone: number) {
  const order = await prisma.business_order.findFirst({ where: { STRIPE_PAYMENT_INTENT_ID: paymentIntent.id } }) ||
    (Number(paymentIntent.metadata?.orderId) > 0 ? await prisma.business_order.findFirst({ where: {
      BUSINESS_ORDER_ID: Number(paymentIntent.metadata?.orderId), STRIPE_PAYMENT_INTENT_ID: null,
    } }) : null);
  if (!order || (paymentDone === PAYMENT_DONE.paid && !matchesOrderCharge(
    order.ORDER_FINAL_AMOUNT, paymentIntent.amount_received || paymentIntent.amount, paymentIntent.currency
  ))) {
    console.error("Stripe payment total differs from order", { paymentIntentId: paymentIntent.id });
    return;
  }
  if (paymentDone === PAYMENT_DONE.paid) {
    await markStripeOrderPaid(prisma, order.BUSINESS_ORDER_ID, paymentIntent.id);
    return;
  }
  await prisma.business_order.updateMany({
    where: {
      PAYMENT_MODE: "stripe",
      PAYMENT_DONE: PAYMENT_DONE.pending,
      BUSINESS_ORDER_ID: order.BUSINESS_ORDER_ID,
    },
    data: {
      PAYMENT_DONE: paymentDone,
      PAYMENT_MODE: "stripe",
      STRIPE_PAYMENT_INTENT_ID: paymentIntent.id,
    },
  });
}

async function releaseBySession(session: Stripe.Checkout.Session) {
  const metadataOrderId = Number(session.metadata?.orderId || 0);
  const order = await prisma.business_order.findFirst({
    where: { STRIPE_CHECKOUT_SESSION_ID: session.id }, select: { BUSINESS_ORDER_ID: true },
  }) || (Number.isInteger(metadataOrderId) && metadataOrderId > 0
    ? await prisma.business_order.findFirst({
        where: { BUSINESS_ORDER_ID: metadataOrderId, STRIPE_CHECKOUT_SESSION_ID: null },
        select: { BUSINESS_ORDER_ID: true },
      }) : null);
  if (!order) return;

  await prisma.$transaction((tx) =>
    releaseExpiredStripeOrderInventory(tx, order.BUSINESS_ORDER_ID)
  );
}

export async function POST(req: NextRequest) {
  const signature = (await headers()).get("stripe-signature");
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
  } else if (event.type === "checkout.session.expired") {
    await releaseBySession(event.data.object as Stripe.Checkout.Session);
  } else if (event.type === "payment_intent.succeeded") {
    await markByPaymentIntent(event.data.object as Stripe.PaymentIntent, PAYMENT_DONE.paid);
  } else if (event.type === "payment_intent.payment_failed") {
    await markByPaymentIntent(event.data.object as Stripe.PaymentIntent, PAYMENT_DONE.failed);
  }

  return NextResponse.json({ received: true });
}
