import { NextResponse } from "next/server";
import { readEmailVerificationToken } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { getPublicAppOrigin } from "@/lib/public-app-url";

// Opened from the confirmation email. Marks the email verified and sends the person to sign-in.
export async function GET(request: Request) {
  const signIn = (result: "verified" | "invalid") => NextResponse.redirect(`${getPublicAppOrigin()}/auth/signin?${result}=1`, 303);
  const token = readEmailVerificationToken(new URL(request.url).searchParams.get("token"));
  if (!token) return signIn("invalid");
  try {
    const account = await prisma.visitors_account.findUnique({
      where: { VISITORS_ACCOUNT_ID: token.accountId },
      select: { EMAIL_ADDRESS: true, EMAIL_VERIFIED_DATETIME: true },
    });
    if (!account?.EMAIL_ADDRESS || !token.matches(account.EMAIL_ADDRESS)) return signIn("invalid");
    if (!account.EMAIL_VERIFIED_DATETIME) {
      // Inbox ownership is proven, so the password was set by the owner: the RESET_TOKEN_EXPIRY marker keeps it on Google sign-in.
      await prisma.visitors_account.update({
        where: { VISITORS_ACCOUNT_ID: token.accountId },
        data: { EMAIL_VERIFIED_DATETIME: new Date(), RESET_TOKEN: null, RESET_TOKEN_EXPIRY: new Date() },
      });
    }
    return signIn("verified");
  } catch (error) {
    console.error("Email verification failed:", error instanceof Error ? error.message : error);
    return signIn("invalid");
  }
}
