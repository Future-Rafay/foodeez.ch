import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LOGIN_LIMITS, publicFormRateLimitResponse } from "@/lib/checkout-rate-limit";
import {
  CLAIM_CODE_MAX_ATTEMPTS,
  CLAIM_CODE_TTL_MS,
  OPEN_REQUEST_STATUSES,
  claimCodeMatches,
  hashClaimCode,
  isEmailAddress,
  maskEmail,
  newClaimCode,
} from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/EmailService";

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

const notifyAdmin = (businessName: string, businessId: number, claimantEmail: string, verified: boolean) =>
  sendEmail(process.env.ADMIN_EMAIL || "admin@foodeez.ch", "contact", {
    name: businessName,
    email: claimantEmail,
    subject: `Restaurant claim waiting: ${businessName}`,
    message: `${claimantEmail} claimed ${businessName} (restaurant #${businessId}). ${verified ? "They confirmed the code sent to the restaurant's email." : "The restaurant has no email on file, so check this claim by hand."} Review it under Super Admin → Requests.`,
  }).catch((error) => console.error("Claim notification failed:", error));

/**
 * Claiming an existing restaurant, for a signed-in account:
 *   { action: "start", businessId }        → sends a 6-digit code to the restaurant's saved email (never one the claimant types)
 *   { action: "verify", requestId, code }  → moves the claim to the Super Admin queue
 * A restaurant with no saved email goes straight to the queue for a manual check.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return json({ error: "Please sign in to claim this restaurant." }, 401);

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "start" && action !== "verify") return json({ error: "Invalid claim request" }, 400);

    // Starting sends an email, so it gets the strict email-form limit; a typo while verifying should not lock anyone out for an hour.
    const limited = await publicFormRateLimitResponse(request.headers, `claim-business-${action}`, session.user.email, action === "verify" ? LOGIN_LIMITS : undefined);
    if (limited) return limited;

    const account = await prisma.visitors_account.findUnique({ where: { EMAIL_ADDRESS: session.user.email }, select: { VISITORS_ACCOUNT_ID: true } });
    if (!account) return json({ error: "Please sign in again." }, 401);
    const accountId = account.VISITORS_ACCOUNT_ID;

    if (action === "verify") {
      const requestId = Number(body.requestId);
      if (!Number.isInteger(requestId) || requestId <= 0) return json({ error: "Invalid claim request" }, 400);
      const claim = await prisma.business_onboarding_request.findFirst({
        where: { REQUEST_ID: requestId, VISITORS_ACCOUNT_ID: accountId, REQUEST_TYPE: "claim", STATUS: "email_pending" },
      });
      if (!claim) return json({ error: "This code has expired. Please start again." }, 400);
      if (claim.EMAIL_CODE_ATTEMPTS >= CLAIM_CODE_MAX_ATTEMPTS || !claim.EMAIL_CODE_EXPIRES || claim.EMAIL_CODE_EXPIRES < new Date()) {
        return json({ error: "This code has expired. Please start again." }, 400);
      }
      if (!claimCodeMatches(requestId, body.code, claim.EMAIL_CODE_HASH)) {
        await prisma.business_onboarding_request.update({ where: { REQUEST_ID: requestId }, data: { EMAIL_CODE_ATTEMPTS: { increment: 1 } } });
        return json({ error: "That code is not correct." }, 400);
      }
      // updateMany on the expected status so two verifications of the same code cannot both succeed.
      const verified = await prisma.business_onboarding_request.updateMany({
        where: { REQUEST_ID: requestId, STATUS: "email_pending" },
        data: { STATUS: "pending", EMAIL_VERIFIED_DATETIME: new Date(), EMAIL_CODE_HASH: null },
      });
      if (verified.count) {
        const business = await prisma.business.findUnique({ where: { BUSINESS_ID: claim.BUSINESS_ID }, select: { BUSINESS_NAME: true } });
        await notifyAdmin(business?.BUSINESS_NAME || `Restaurant #${claim.BUSINESS_ID}`, claim.BUSINESS_ID, session.user.email, true);
      }
      return json({ status: "pending" });
    }

    const businessId = Number(body.businessId);
    if (!Number.isInteger(businessId) || businessId <= 0 || businessId > 2_147_483_647) return json({ error: "Invalid claim request" }, 400);
    const business = await prisma.business.findFirst({
      where: { BUSINESS_ID: businessId, APPROVED: 1, STATUS: 1 },
      select: { BUSINESS_ID: true, BUSINESS_NAME: true, EMAIL_ADDRESS: true },
    });
    if (!business) return json({ error: "This restaurant cannot be claimed." }, 404);

    const owned = await prisma.business_owner_2_business.findFirst({ where: { BUSINESS_ID: BigInt(businessId) }, select: { BUSINESS_OWNER_2_BUSINESS_ID: true } });
    if (owned) return json({ error: "This restaurant already has an owner on Foodeez. Contact us if that is not you." }, 409);

    const existing = await prisma.business_onboarding_request.findFirst({
      where: { BUSINESS_ID: businessId, VISITORS_ACCOUNT_ID: accountId, REQUEST_TYPE: "claim", STATUS: { in: OPEN_REQUEST_STATUSES } },
      orderBy: { REQUEST_ID: "desc" },
    });
    if (existing?.STATUS === "pending") return json({ status: "pending" });

    const officialEmail = business.EMAIL_ADDRESS?.trim();
    const name = business.BUSINESS_NAME || `Restaurant #${businessId}`;
    if (!isEmailAddress(officialEmail)) {
      if (existing) await prisma.business_onboarding_request.update({ where: { REQUEST_ID: existing.REQUEST_ID }, data: { STATUS: "pending" } });
      else await prisma.business_onboarding_request.create({ data: { REQUEST_TYPE: "claim", STATUS: "pending", BUSINESS_ID: businessId, VISITORS_ACCOUNT_ID: accountId } });
      await notifyAdmin(name, businessId, session.user.email, false);
      return json({ status: "pending", manual: true });
    }

    const claim = existing ?? (await prisma.business_onboarding_request.create({
      data: { REQUEST_TYPE: "claim", STATUS: "email_pending", BUSINESS_ID: businessId, VISITORS_ACCOUNT_ID: accountId },
    }));
    const code = newClaimCode();
    await prisma.business_onboarding_request.update({
      where: { REQUEST_ID: claim.REQUEST_ID },
      data: { EMAIL_CODE_HASH: hashClaimCode(claim.REQUEST_ID, code), EMAIL_CODE_EXPIRES: new Date(Date.now() + CLAIM_CODE_TTL_MS), EMAIL_CODE_ATTEMPTS: 0 },
    });
    await sendEmail(officialEmail, "claimCode", { code, businessName: name });
    return json({ status: "email_pending", requestId: claim.REQUEST_ID, sentTo: maskEmail(officialEmail) });
  } catch (error) {
    console.error("Business claim error:", error);
    return json({ error: "We couldn't process your claim. Please try again." }, 500);
  }
}
