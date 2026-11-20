import { createHmac, timingSafeEqual } from "node:crypto";

// New password sign-ups confirm their email before they can sign in (visitors_account.EMAIL_VERIFIED_DATETIME).
// The link is stateless: account id, expiry and a signature bound to the email, so it stops working if the email changes
// (for example after the account is deleted and anonymised).

export const VERIFY_LINK_TTL_MS = 48 * 60 * 60 * 1000;
export { EMAIL_NOT_VERIFIED } from "./email-verification-constants";

function secret() {
  const value = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!value) throw new Error("Email verification is not configured.");
  return value;
}

const sign = (accountId: string, expires: number, email: string) =>
  createHmac("sha256", secret()).update(`verify-email:${accountId}:${expires}:${email.trim().toLowerCase()}`).digest("base64url");

export function emailVerificationToken(accountId: bigint | number, email: string, now = Date.now()) {
  const expires = now + VERIFY_LINK_TTL_MS;
  return `${accountId}.${expires}.${sign(String(accountId), expires, email)}`;
}

/** Returns the account id the token was made for, but only if the caller confirms the email still matches. */
export function readEmailVerificationToken(token: unknown, now = Date.now()) {
  if (typeof token !== "string" || token.length > 200) return null;
  const [id, expiresText, signature] = token.split(".");
  const expires = Number(expiresText);
  if (!/^\d+$/.test(id ?? "") || !Number.isSafeInteger(expires) || expires < now || !signature) return null;
  return {
    accountId: BigInt(id),
    matches(email: string) {
      const expected = Buffer.from(sign(id, expires, email));
      const actual = Buffer.from(signature);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    },
  };
}
