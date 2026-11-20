import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { publicFormRateLimitResponse } from "@/lib/checkout-rate-limit";
import { OPEN_REQUEST_STATUSES, parseRegistration } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/EmailService";

const MAX_OPEN_REGISTRATIONS = 3;

// Creates the restaurant hidden (APPROVED = 0, STATUS = 0) with a pending request; a Super Admin approves it in the admin app.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Please sign in to register your restaurant." }, { status: 401 });
    }

    const parsed = parseRegistration(await request.json().catch(() => null));
    if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

    const limited = await publicFormRateLimitResponse(request.headers, "business-register", session.user.email);
    if (limited) return limited;

    const account = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email },
      select: { VISITORS_ACCOUNT_ID: true, FIRST_NAME: true, LAST_NAME: true },
    });
    if (!account) return NextResponse.json({ message: "Please sign in again." }, { status: 401 });

    const open = await prisma.business_onboarding_request.count({
      where: { VISITORS_ACCOUNT_ID: account.VISITORS_ACCOUNT_ID, REQUEST_TYPE: "register", STATUS: { in: OPEN_REQUEST_STATUSES } },
    });
    if (open >= MAX_OPEN_REGISTRATIONS) {
      return NextResponse.json({ message: "You already have registrations waiting for review. We will email you once they are checked." }, { status: 409 });
    }

    const now = new Date();
    const { business } = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { ...parsed.data, CREATION_DATETIME: now, APPROVED: 0, STATUS: 0 },
        select: { BUSINESS_ID: true },
      });
      await tx.business_onboarding_request.create({
        data: {
          REQUEST_TYPE: "register",
          STATUS: "pending",
          BUSINESS_ID: business.BUSINESS_ID,
          VISITORS_ACCOUNT_ID: account.VISITORS_ACCOUNT_ID,
          CONTACT_NAME: [account.FIRST_NAME, account.LAST_NAME].filter(Boolean).join(" ").slice(0, 100) || null,
          CONTACT_PHONE: parsed.data.PHONE_NUMBER?.slice(0, 45) ?? null,
        },
      });
      return { business };
    });

    // The request is saved; a failed notification must not fail the registration.
    await sendEmail(process.env.ADMIN_EMAIL || "admin@foodeez.ch", "contact", {
      name: parsed.data.BUSINESS_NAME ?? "New restaurant",
      email: session.user.email,
      subject: `New restaurant registration: ${parsed.data.BUSINESS_NAME}`,
      message: `${parsed.data.BUSINESS_NAME} (restaurant #${business.BUSINESS_ID}) is waiting for approval under Super Admin → Requests.`,
    }).catch((error) => console.error("Registration notification failed:", error));

    return NextResponse.json({ message: "Registration submitted" });
  } catch (error) {
    console.error("Business registration error:", error);
    return NextResponse.json({ message: "We couldn't submit your registration. Please try again." }, { status: 500 });
  }
}
