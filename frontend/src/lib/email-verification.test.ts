import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXTAUTH_SECRET ??= "test-secret";

test("confirmation links work once per account and email, and expire after 48 hours", async () => {
  const { emailVerificationToken, readEmailVerificationToken, VERIFY_LINK_TTL_MS } = await import("./email-verification");
  const now = Date.UTC(2026, 10, 20);
  const token = emailVerificationToken(BigInt(42), "Ana@Example.ch", now);
  const read = readEmailVerificationToken(token, now + 1000);
  assert.ok(read);
  assert.equal(read.accountId, BigInt(42));
  assert.equal(read.matches("ana@example.ch"), true, "email case does not matter");
  assert.equal(read.matches("deleted-42@deleted.invalid"), false, "a changed email breaks the link");
  assert.equal(readEmailVerificationToken(token, now + VERIFY_LINK_TTL_MS + 1), null, "expired");
  assert.equal(readEmailVerificationToken(token.replace(/^42\./, "43."), now)?.matches("ana@example.ch") ?? false, false, "another account");
  assert.equal(readEmailVerificationToken({ not: "" }, now), null);
  assert.equal(readEmailVerificationToken("1.2", now), null);
});
