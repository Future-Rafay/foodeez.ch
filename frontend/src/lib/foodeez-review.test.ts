import assert from "node:assert/strict";
import test from "node:test";
import { pickReviewUpdate, serializeBigInt, withoutForeignEmail } from "./foodeez-review";

test("review edits cannot self-approve or change ownership, and return to moderation", () => {
  const data = pickReviewUpdate({
    APPROVED: 1,
    REVIEWER_EMAIL: "victim@example.com",
    AVATAR: "https://evil.example/a.png",
    RATING: 4,
    REVIEW: " Great ",
    REVIEWER_NAME: "Sam",
  });

  assert.deepEqual(data, { APPROVED: 0, RATING: 4, REVIEW: "Great", REVIEWER_NAME: "Sam" });
});

test("review edits ignore invalid ratings", () => {
  assert.equal(pickReviewUpdate({ RATING: 9 }).RATING, undefined);
  assert.equal(pickReviewUpdate({ RATING: "5" }).RATING, undefined);
});

test("public review lists only keep the viewer's own email", () => {
  const review = { FOODEEZ_REVIEW_ID: 1, REVIEWER_EMAIL: "author@example.com" };

  assert.equal(withoutForeignEmail(review, null).REVIEWER_EMAIL, null);
  assert.equal(withoutForeignEmail(review, "other@example.com").REVIEWER_EMAIL, null);
  assert.equal(withoutForeignEmail(review, "author@example.com").REVIEWER_EMAIL, "author@example.com");
});

test("BigInt ids become strings while dates stay dates", () => {
  const created = new Date("2026-10-31T12:00:00Z");
  const result = serializeBigInt([{ FOODEEZ_REVIEW_ID: BigInt(7), CREATION_DATETIME: created }]) as Array<Record<string, unknown>>;

  assert.equal(result[0].FOODEEZ_REVIEW_ID, "7");
  assert.equal(result[0].CREATION_DATETIME, created);
});
