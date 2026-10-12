import assert from "node:assert/strict";
import test from "node:test";

test("guest checkout limits use private stable keys for IP and normalized email", async () => {
  process.env.NEXTAUTH_SECRET = "test-only-secret";
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { getGuestCheckoutRateLimitRules } = await import("./checkout-rate-limit.ts");
  const headers = new Headers({ "x-forwarded-for": "203.0.113.4, 10.0.0.1" });

  const first = getGuestCheckoutRateLimitRules(headers, " Guest@Example.com ");
  const second = getGuestCheckoutRateLimitRules(headers, "guest@example.com");

  assert.equal(first.length, 2);
  assert.deepEqual(first, second);
  assert.ok(first.every((rule) => /^[a-f0-9]{64}$/.test(rule.key)));
  assert.ok(first.every((rule) => !rule.key.includes("203.0.113.4")));
  assert.ok(first.every((rule) => !rule.key.includes("guest@example.com")));
});

test("guest checkout limits still protect an email when proxy headers are absent", async () => {
  process.env.NEXTAUTH_SECRET = "test-only-secret";
  // @ts-expect-error Node's TypeScript test runner requires the file extension.
  const { getGuestCheckoutRateLimitRules } = await import("./checkout-rate-limit.ts");

  assert.equal(getGuestCheckoutRateLimitRules(new Headers(), "guest@example.com").length, 1);
});
