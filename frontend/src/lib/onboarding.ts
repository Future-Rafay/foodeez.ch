import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

// Restaurant registration and claim requests (business_onboarding_request). A Super Admin approves both in the admin app.
// STATUS: email_pending (claim code sent) → pending (waiting for a Super Admin) → approved | rejected.

export const CLAIM_CODE_TTL_MS = 15 * 60 * 1000;
export const CLAIM_CODE_MAX_ATTEMPTS = 5;
export const OPEN_REQUEST_STATUSES = ["email_pending", "pending"];

function secret() {
  const value = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!value) throw new Error("Claim verification is not configured.");
  return value;
}

export const newClaimCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** The code is bound to its request, so a code from one request never verifies another. */
export const hashClaimCode = (requestId: number, code: string) =>
  createHmac("sha256", secret()).update(`claim-code:${requestId}:${code}`).digest("hex");

export function claimCodeMatches(requestId: number, code: unknown, storedHash: string | null) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code) || !storedHash || !/^[a-f0-9]{64}$/.test(storedHash)) return false;
  return timingSafeEqual(Buffer.from(hashClaimCode(requestId, code), "hex"), Buffer.from(storedHash, "hex"));
}

/** "info@pizza-roma.ch" → "in••@pizza-roma.ch": enough for the owner to recognise, not enough to harvest. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "your restaurant's email";
  return `${local.slice(0, Math.min(2, local.length - 1))}${"•".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export const isEmailAddress = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Column sizes from business; values longer than these are refused, never cut.
const BUSINESS_FIELDS = {
  BUSINESS_NAME: { max: 255, required: true },
  SHORT_NAME: { max: 20 },
  DESCRIPTION: { max: 1000, required: true },
  ADDRESS_STREET: { max: 100, required: true },
  ADDRESS_TOWN: { max: 100, required: true },
  ADDRESS_COUNTRY: { max: 100, required: true },
  PHONE_NUMBER: { max: 45, required: true },
  PHONE_NUMBER_SHORT: { max: 45 },
  EMAIL_ADDRESS: { max: 255, required: true },
  WHATSAPP_NUMBER: { max: 45 },
  WEB_ADDRESS: { max: 1000 },
  FACEBOOK_LINK: { max: 1000 },
  INSTA_LINK: { max: 1000 },
  TIKTOK_LINK: { max: 1000 },
  GOOGLE_PROFILE: { max: 1000 },
  IMAGE_URL: { max: 1000 },
} as const satisfies Record<string, { max: number; required?: boolean }>;

type BusinessField = keyof typeof BUSINESS_FIELDS;
export type RegistrationInput = Partial<Record<BusinessField, string>> & { ADDRESS_ZIP: bigint };

/** Validates a registration body; returns the fields to store or the first error. */
export function parseRegistration(body: unknown): { data: RegistrationInput } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Please fill in all required fields." };
  const input = body as Record<string, unknown>;
  const data: Partial<Record<BusinessField, string>> = {};
  for (const [field, rule] of Object.entries(BUSINESS_FIELDS) as [BusinessField, { max: number; required?: boolean }][]) {
    const raw = input[field];
    const value = typeof raw === "string" || typeof raw === "number" ? String(raw).trim() : "";
    if (!value) {
      if (rule.required) return { error: "Please fill in all required fields." };
      continue;
    }
    if (value.length > rule.max) return { error: `${field.replaceAll("_", " ").toLowerCase()} is too long.` };
    data[field] = value;
  }
  if (!isEmailAddress(data.EMAIL_ADDRESS)) return { error: "Please enter a valid business email." };
  const zip = String(input.ADDRESS_ZIP ?? "").trim();
  if (!/^\d{4,6}$/.test(zip)) return { error: "Please enter a valid ZIP code." };
  return { data: { ...data, ADDRESS_ZIP: BigInt(zip) } };
}
