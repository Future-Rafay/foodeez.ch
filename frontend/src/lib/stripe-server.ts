import Stripe from "stripe";

// Server-only Stripe client shared by checkout, verification and the webhook.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});
