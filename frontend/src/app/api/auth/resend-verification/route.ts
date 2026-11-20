import { NextResponse } from "next/server";
import { publicFormRateLimitResponse } from "@/lib/checkout-rate-limit";
import { emailVerificationToken } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { sendEmail } from "@/services/EmailService";

// Always answers the same way, so it cannot be used to find out which emails have accounts.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }
  const limited = await publicFormRateLimitResponse(request.headers, "resend-verification", email);
  if (limited) return limited;
  try {
    const account = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: email },
      select: { VISITORS_ACCOUNT_ID: true, EMAIL_ADDRESS: true, EMAIL_VERIFIED_DATETIME: true, PASSWORD: true },
    });
    if (account?.EMAIL_ADDRESS && account.PASSWORD && !account.EMAIL_VERIFIED_DATETIME) {
      const verifyUrl = `${getPublicAppOrigin()}/api/auth/verify-email?token=${encodeURIComponent(emailVerificationToken(account.VISITORS_ACCOUNT_ID, account.EMAIL_ADDRESS))}`;
      await sendEmail(account.EMAIL_ADDRESS, "verifyEmail", { verifyUrl });
    }
  } catch (error) {
    console.error("Resend verification failed:", error instanceof Error ? error.message : error);
  }
  return NextResponse.json({ message: "If that account is waiting for confirmation, we sent a new link." });
}
