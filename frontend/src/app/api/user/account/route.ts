import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anonymiseAccount } from "@/lib/account-deletion";
import { prisma } from "@/lib/prisma";

// Deletes (anonymises) the signed-in customer's own account. The body must confirm, so a stray request cannot do it.
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (body?.confirm !== "DELETE") return NextResponse.json({ error: "Please confirm the deletion." }, { status: 400 });

    const account = await prisma.visitors_account.findUnique({
      where: { EMAIL_ADDRESS: session.user.email },
      select: { VISITORS_ACCOUNT_ID: true, EMAIL_ADDRESS: true, PLATFORM_ROLE: true },
    });
    if (!account?.EMAIL_ADDRESS) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    // Restaurant owners and Super Admins control restaurants; removing their sign-in must go through the Foodeez team.
    const owner = await prisma.business_owner.findFirst({ where: { VISITORS_ACCOUNT_ID: Number(account.VISITORS_ACCOUNT_ID) }, select: { BUSINESS_OWNER_ID: true } });
    if (owner || account.PLATFORM_ROLE) {
      return NextResponse.json({ error: "This account manages a restaurant. Please contact us through the contact form to close it." }, { status: 409 });
    }

    await prisma.$transaction((tx) => anonymiseAccount(tx, { id: account.VISITORS_ACCOUNT_ID, email: account.EMAIL_ADDRESS! }));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Account deletion failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "We couldn't delete your account. Please try again." }, { status: 500 });
  }
}
