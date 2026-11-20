import assert from "node:assert/strict";
import test from "node:test";
import { anonymiseAccount, anonymisedEmail } from "./account-deletion";

test("deleting an account removes personal rows, detaches orders and anonymises the account last", async () => {
  const calls: string[] = [];
  const table = (name: string) => ({
    deleteMany: async (args: unknown) => calls.push(`${name}.deleteMany ${JSON.stringify(args)}`),
    updateMany: async (args: unknown) => calls.push(`${name}.updateMany ${JSON.stringify(args)}`),
    update: async (args: { data: Record<string, unknown> }) => calls.push(`${name}.update ${JSON.stringify(args.data)}`),
  });
  const tx = new Proxy({}, { get: (_target, name: string) => table(name) });
  await anonymiseAccount(tx as never, { id: BigInt(42), email: "ana@example.ch" });

  for (const name of ["visitor_business_review", "visitor_product_review", "visitor_food_journey", "visitor_favorite_restaurants", "visitor_followed_events", "visitor_followed_restaurants", "customer_order_notification"]) {
    assert.ok(calls.includes(`${name}.deleteMany {"where":{"VISITORS_ACCOUNT_ID":42}}`), name);
  }
  assert.ok(calls.includes('foodeez_review.deleteMany {"where":{"REVIEWER_EMAIL":"ana@example.ch"}}'));
  assert.ok(calls.includes('business_order.updateMany {"where":{"VISITOR_ID":42},"data":{"VISITOR_ID":0}}'), "orders are kept, only detached");
  assert.ok(!calls.some((call) => call.startsWith("business_order.deleteMany")), "orders are never deleted");
  const last = calls.at(-1)!;
  assert.match(last, /^visitors_account\.update /);
  assert.match(last, /"PASSWORD":null/);
  assert.match(last, /"EMAIL_ADDRESS":"deleted-42@deleted\.invalid"/);
  assert.equal(anonymisedEmail(BigInt(7)), "deleted-7@deleted.invalid");
});
