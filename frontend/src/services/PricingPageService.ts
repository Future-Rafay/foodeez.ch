"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Browser-callable, so the account comes from the session, never from an argument.
export const checkBusinessOwnerExist = async () => {
  try {
    const session = await getServerSession(authOptions);
    const visitorId = Number(session?.user?.id);
    if (!Number.isInteger(visitorId) || visitorId < 1) return false;

    const businessOwner = await prisma.business_owner.findFirst({
      where: { VISITORS_ACCOUNT_ID: visitorId },
      select: { VISITORS_ACCOUNT_ID: true },
    });
    return Boolean(businessOwner);
  } catch (error) {
    console.error("Error fetching business owner:", error);
    return false;
  }
};
