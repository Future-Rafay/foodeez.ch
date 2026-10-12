import assert from "node:assert/strict";
import test from "node:test";
import { metadata } from "@/app/order/success/layout";

test("guest tracking pages suppress token-bearing referrers and indexing", () => {
  assert.equal(metadata.referrer, "no-referrer");
  assert.deepEqual(metadata.robots, { index: false, follow: false });
});
