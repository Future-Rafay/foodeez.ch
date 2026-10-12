import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

const checkoutBody = {
  items: [{ id: "1", name: "Meal", price: 10, quantity: 1 }],
  checkoutRequestId: "checkout-request-1234",
  orderType: "delivery",
  paymentMethod: "forged-payment-method",
  customerInfo: {
    firstName: "Guest",
    lastName: "Customer",
    email: "guest@example.com",
    phone: "+41000000000",
    street: "Test Street 1",
    zip: "8000",
    city: "Zurich",
    country: "CH",
  },
};

async function checkoutPost() {
  process.env.STRIPE_SECRET_KEY ||= "sk_test_contract_only";
  process.env.NEXTAUTH_SECRET ||= "test-only-secret";
  process.env.RESEND_API_KEY ||= "re_test_contract_only";
  return import("@/app/api/checkout/route").then((module) => module.POST);
}

test("checkout API rejects forged payment methods before database writes", async () => {
  const POST = await checkoutPost();
  const response = await POST(new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutBody),
  }));

  assert.equal(response.status, 400);
  assert.equal(await response.text(), "Invalid payment method");
});

test("checkout API rejects malformed JSON", async () => {
  const POST = await checkoutPost();
  const response = await POST(new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  }));

  assert.equal(response.status, 400);
  assert.equal(await response.text(), "Invalid request body");
});

test("checkout API rejects a non-array cart before database access", async () => {
  const POST = await checkoutPost();
  const response = await POST(new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...checkoutBody, items: "not-a-cart", paymentMethod: "card" }),
  }));

  assert.equal(response.status, 400);
  assert.equal(await response.text(), "Cart is empty");
});
