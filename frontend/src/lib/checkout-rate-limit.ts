import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Rule = { limit: number; windowMs: number };
type Limits = { ip: Rule; email: Rule };

const RATE_LIMITS: Limits = {
  ip: { limit: 30, windowMs: 10 * 60 * 1000 },
  email: { limit: 6, windowMs: 15 * 60 * 1000 },
};

// Public forms send email, so each recipient address gets only a few per hour.
const PUBLIC_FORM_LIMITS: Limits = {
  ip: { limit: 10, windowMs: 60 * 60 * 1000 },
  email: { limit: 3, windowMs: 60 * 60 * 1000 },
};

export class RateLimitError extends Error {
  constructor(
    public readonly retryAfterSeconds: number,
    message = "Too many requests. Please wait and try again."
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class GuestCheckoutRateLimitError extends RateLimitError {
  constructor(retryAfterSeconds: number) {
    super(retryAfterSeconds, "Too many checkout attempts. Please wait and try again.");
    this.name = "GuestCheckoutRateLimitError";
  }
}

function secret() {
  const value = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!value) throw new Error("Guest checkout rate limiting is not configured.");
  return value;
}

export function getCheckoutClientIp(headers: Headers) {
  const forwarded =
    headers.get("x-vercel-forwarded-for") ||
    headers.get("x-forwarded-for") ||
    headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || null;
}

export function getRateLimitRules(
  headers: Headers,
  purpose: string,
  email: string,
  limits: Limits = PUBLIC_FORM_LIMITS
) {
  const ip = getCheckoutClientIp(headers);
  const identities = [
    ...(ip ? [{ scope: "ip" as const, value: ip }] : []),
    { scope: "email" as const, value: email.trim().toLowerCase() },
  ];

  return identities.map(({ scope, value }) => ({
    key: createHmac("sha256", secret())
      .update(`${purpose}:${scope}:${value}`)
      .digest("hex"),
    ...limits[scope],
  }));
}

export function getGuestCheckoutRateLimitRules(headers: Headers, email: string) {
  return getRateLimitRules(headers, "guest-checkout", email, RATE_LIMITS);
}

async function enforceRules(rules: ReturnType<typeof getRateLimitRules>, toError: (retryAfterSeconds: number) => RateLimitError) {
  const now = new Date();
  await prisma.checkout_rate_limit.deleteMany({
    where: {
      LAST_REQUEST_DATETIME: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
  });

  for (const rule of rules) {
    const windowStart = new Date(now.getTime() - rule.windowMs);
    await prisma.$executeRaw`
      INSERT INTO checkout_rate_limit (
        RATE_LIMIT_KEY, WINDOW_STARTED_AT, REQUEST_COUNT, LAST_REQUEST_DATETIME
      ) VALUES (${rule.key}, ${now}, 1, ${now})
      ON DUPLICATE KEY UPDATE
        REQUEST_COUNT = IF(WINDOW_STARTED_AT <= ${windowStart}, 1, REQUEST_COUNT + 1),
        WINDOW_STARTED_AT = IF(WINDOW_STARTED_AT <= ${windowStart}, ${now}, WINDOW_STARTED_AT),
        LAST_REQUEST_DATETIME = ${now}
    `;

    const state = await prisma.checkout_rate_limit.findUnique({
      where: { RATE_LIMIT_KEY: rule.key },
      select: { REQUEST_COUNT: true, WINDOW_STARTED_AT: true },
    });
    if (state && state.REQUEST_COUNT > rule.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(
          (state.WINDOW_STARTED_AT.getTime() + rule.windowMs - now.getTime()) / 1000
        )
      );
      throw toError(retryAfterSeconds);
    }
  }
}

export async function enforceGuestCheckoutRateLimit(headers: Headers, email: string) {
  await enforceRules(
    getGuestCheckoutRateLimitRules(headers, email),
    (seconds) => new GuestCheckoutRateLimitError(seconds)
  );
}

/** Returns a 429 response when a public email-sending form is over its limit, otherwise null. */
export async function publicFormRateLimitResponse(headers: Headers, purpose: string, email: string) {
  try {
    await enforceRules(getRateLimitRules(headers, purpose, email), (seconds) => new RateLimitError(seconds));
    return null;
  } catch (error) {
    if (!(error instanceof RateLimitError)) throw error;
    return NextResponse.json(
      { success: false, error: error.message, message: error.message },
      { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
    );
  }
}
