import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXTAUTH_SECRET ??= "test-secret";

test("claim codes are six digits and verify only for their own request", async () => {
  const { newClaimCode, hashClaimCode, claimCodeMatches } = await import("./onboarding");
  const code = newClaimCode();
  assert.match(code, /^\d{6}$/);
  const hash = hashClaimCode(10, code);
  assert.equal(claimCodeMatches(10, code, hash), true);
  assert.equal(claimCodeMatches(11, code, hash), false);
  assert.equal(claimCodeMatches(10, code === "000000" ? "000001" : "000000", hash), false);
  assert.equal(claimCodeMatches(10, { not: "" }, hash), false);
  assert.equal(claimCodeMatches(10, code, null), false);
  assert.equal(claimCodeMatches(10, code, "short"), false);
});

test("masked emails keep the domain and hide most of the name", async () => {
  const { maskEmail } = await import("./onboarding");
  assert.equal(maskEmail("info@pizza.ch"), "in••@pizza.ch");
  assert.equal(maskEmail("a@b.ch"), "••@b.ch");
  assert.equal(maskEmail("broken"), "your restaurant's email");
});

test("registration refuses missing, oversized and malformed fields", async () => {
  const { parseRegistration } = await import("./onboarding");
  const valid = {
    BUSINESS_NAME: "Pizza Roma",
    DESCRIPTION: "Wood-fired pizza",
    ADDRESS_STREET: "Bahnhofstrasse 1",
    ADDRESS_ZIP: "8001",
    ADDRESS_TOWN: "Zürich",
    ADDRESS_COUNTRY: "Switzerland",
    PHONE_NUMBER: "+41 44 000 00 00",
    EMAIL_ADDRESS: "info@pizza-roma.ch",
  };
  const ok = parseRegistration(valid);
  assert.ok("data" in ok);
  if ("data" in ok) {
    assert.equal(ok.data.ADDRESS_ZIP, BigInt(8001));
    assert.equal(ok.data.SHORT_NAME, undefined);
  }
  assert.ok("error" in parseRegistration({ ...valid, BUSINESS_NAME: " " }));
  assert.ok("error" in parseRegistration({ ...valid, SHORT_NAME: "x".repeat(21) }));
  assert.ok("error" in parseRegistration({ ...valid, EMAIL_ADDRESS: "not-an-email" }));
  assert.ok("error" in parseRegistration({ ...valid, ADDRESS_ZIP: "80a1" }));
  assert.ok("error" in parseRegistration(null));
});
