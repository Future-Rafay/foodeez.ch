import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

const RATE_LIMITS = {
  ip: { limit: 30, windowMs: 10 * 60 * 1000 },
  email: { limit: 6, windowMs: 15 * 60 * 1000 },
} as const;

export class GuestCheckoutRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many checkout attempts. Please wait and try again.");
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

export function getGuestCheckoutRateLimitRules(headers: Headers, email: string) {
  const ip = getCheckoutClientIp(headers);
  const identities = [
    ...(ip ? [{ scope: "ip" as const, value: ip }] : []),
    { scope: "email" as const, value: email.trim().toLowerCase() },
  ];

  return identities.map(({ scope, value }) => ({
    key: createHmac("sha256", secret())
      .update(`guest-checkout:${scope}:${value}`)
      .digest("hex"),
    ...RATE_LIMITS[scope],
  }));
}

export async function enforceGuestCheckoutRateLimit(headers: Headers, email: string) {
  const now = new Date();
  await prisma.checkout_rate_limit.deleteMany({
    where: {
      LAST_REQUEST_DATETIME: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
  });

  for (const rule of getGuestCheckoutRateLimitRules(headers, email)) {
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
      throw new GuestCheckoutRateLimitError(retryAfterSeconds);
    }
  }
}
