import { createHmac, timingSafeEqual } from "node:crypto";

type GuestOrderIdentity = {
  orderId: number;
  email: string;
  createdAt: Date | string | null;
};

function secret() {
  const value = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!value) throw new Error("Guest order tracking is not configured.");
  return value;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function payload(order: GuestOrderIdentity) {
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toISOString()
    : "";
  return `${order.orderId}:${normalizeEmail(order.email)}:${createdAt}`;
}

export function createGuestOrderToken(order: GuestOrderIdentity) {
  return createHmac("sha256", secret()).update(payload(order)).digest("base64url");
}

export function verifyGuestOrderToken(
  order: GuestOrderIdentity,
  candidate: string | null
) {
  if (!candidate) return false;
  const expected = Buffer.from(createGuestOrderToken(order));
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
