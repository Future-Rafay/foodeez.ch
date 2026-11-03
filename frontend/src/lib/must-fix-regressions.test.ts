import assert from "node:assert/strict";
import test from "node:test";
import { swissDate } from "./discounts";
import { isMenuActiveOn, type MenuCardSchedule } from "./menu-schedule";
import { formatEtaTimeOnly, isUnpaidCardOrder, PAYMENT_DONE } from "./order";
import { shortPhotoUrl } from "./media";

const weeklyCard = (day: string): MenuCardSchedule => ({
  BUSINESS_FOOD_MENU_CARD_ID: 1,
  TITLE: "Weekly",
  VALID_FROM: new Date("2026-01-01T00:00:00Z"),
  VALID_TO: null,
  STATUS: 1,
  REPEAT_WEEKLY: 1,
  ACTIVE_DAYS_JSON: JSON.stringify([day]),
  IS_UNLIMITED: 1,
  SALES_CHANNEL: "online",
});

test("menus switch day at Swiss midnight, not UTC midnight", () => {
  // Monday 23:30 UTC is already Tuesday 00:30 in Zurich in winter.
  const now = new Date("2026-11-02T23:30:00Z");

  assert.equal(isMenuActiveOn(weeklyCard("tuesday"), now), true);
  assert.equal(isMenuActiveOn(weeklyCard("monday"), now), false);
});

test("menu validity dates are compared on the Swiss calendar", () => {
  // Saved from a Swiss browser: 1 Nov 00:00 and 30 Nov 23:59 in Zurich.
  const card: MenuCardSchedule = {
    ...weeklyCard("monday"),
    REPEAT_WEEKLY: 0,
    IS_UNLIMITED: 0,
    VALID_FROM: new Date("2026-10-31T23:00:00Z"),
    VALID_TO: new Date("2026-11-30T22:59:00Z"),
  };

  assert.equal(swissDate(card.VALID_FROM!), "2026-11-01");
  assert.equal(isMenuActiveOn(card, new Date("2026-10-31T22:59:00Z")), false);
  assert.equal(isMenuActiveOn(card, new Date("2026-10-31T23:01:00Z")), true);
  assert.equal(isMenuActiveOn(card, new Date("2026-11-30T22:30:00Z")), true);
  assert.equal(isMenuActiveOn(card, new Date("2026-11-30T23:30:00Z")), false);
});

test("ETA text uses Swiss time on any server", () => {
  assert.equal(formatEtaTimeOnly("2026-11-02T16:30:00Z"), "17:30");
  assert.equal(formatEtaTimeOnly("2026-07-02T16:23:00Z"), "18:30");
});

test("only unpaid card orders are treated as not yet real", () => {
  const card = { PAYMENT_MODE: "stripe" };

  assert.equal(isUnpaidCardOrder({ ...card, PAYMENT_DONE: PAYMENT_DONE.pending }), true);
  assert.equal(isUnpaidCardOrder({ ...card, PAYMENT_DONE: PAYMENT_DONE.failed }), true);
  assert.equal(isUnpaidCardOrder({ ...card, PAYMENT_DONE: PAYMENT_DONE.paid }), false);
  assert.equal(isUnpaidCardOrder({ PAYMENT_MODE: "pay_at_pickup", PAYMENT_DONE: PAYMENT_DONE.pending }), false);
});

test("photo URLs that do not fit the 100-character columns are left out", () => {
  assert.equal(shortPhotoUrl("https://x.test/a.jpg"), "https://x.test/a.jpg");
  assert.equal(shortPhotoUrl(`https://x.test/${"a".repeat(90)}.jpg`), undefined);
  assert.equal(shortPhotoUrl(null), undefined);
});

test("Google sign-in clears a password set by whoever registered the address", async () => {
  process.env.NEXTAUTH_SECRET ||= "test-only-secret";
  const { googleAccountUpdate } = await import("./auth");

  const account = { PIC: "a", PASSWORD: "hash", RESET_TOKEN: null, RESET_TOKEN_EXPIRY: null };

  assert.deepEqual(googleAccountUpdate(account, "a"), { PIC: "a", PASSWORD: null });
  assert.equal(googleAccountUpdate({ ...account, PASSWORD: null }, "a"), null);
});

test("Google sign-in keeps a password set through a completed email reset", async () => {
  process.env.NEXTAUTH_SECRET ||= "test-only-secret";
  const { googleAccountUpdate } = await import("./auth");
  const reset = { PIC: "a", PASSWORD: "hash", RESET_TOKEN: null, RESET_TOKEN_EXPIRY: new Date() };

  assert.equal(googleAccountUpdate(reset, "a"), null);
  assert.deepEqual(googleAccountUpdate(reset, "b"), { PIC: "b" });
  // A pending request proves nothing: anyone can ask for a reset, only the owner can finish one.
  assert.deepEqual(googleAccountUpdate({ ...reset, RESET_TOKEN: "pending" }, "a"), { PIC: "a", PASSWORD: null });
});

test("only a rejected expiry counts as an expired checkout", async () => {
  const { isStripeExpiryRejection } = await import("./inventory");
  const type = "StripeInvalidRequestError";

  assert.equal(isStripeExpiryRejection({ type, param: "expires_at" }), true);
  assert.equal(isStripeExpiryRejection({ type, param: "line_items[0][price_data][product_data][images][0]" }), false);
  assert.equal(isStripeExpiryRejection({ type: "StripeConnectionError", param: "expires_at" }), false);
  assert.equal(isStripeExpiryRejection(new Error("network")), false);
  assert.equal(isStripeExpiryRejection(undefined), false);
});

test("Stripe sessions expire 35 minutes after the order, the same on every retry", async () => {
  const { stripeSessionExpiresAt } = await import("./inventory");
  const created = new Date("2026-11-02T10:00:00Z");

  assert.equal(stripeSessionExpiresAt(created) - created.getTime() / 1000, 35 * 60);
  assert.equal(stripeSessionExpiresAt(new Date(created)), stripeSessionExpiresAt(created));
});

test("the stale-checkout job stays closed without the right secret", async () => {
  const { GET } = await import("@/app/api/cron/release-stale-checkouts/route");
  const call = (authorization?: string) => GET(new Request("http://localhost/api/cron/release-stale-checkouts", {
    headers: authorization ? { authorization } : {},
  }));

  delete process.env.CRON_SECRET;
  assert.equal((await call("Bearer undefined")).status, 401);
  process.env.CRON_SECRET = "test-cron-secret";
  assert.equal((await call()).status, 401);
  assert.equal((await call("Bearer wrong")).status, 401);
});
