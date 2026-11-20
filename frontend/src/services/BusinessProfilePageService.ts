"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "../lib/prisma";

// Returns null when the business does not exist, is switched off or is not approved; database errors throw so pages can show a retry.
export async function getBusinessById(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  return prisma.business_detail_view_all.findFirst({
    where: {
      BUSINESS_ID: id,
      APPROVED: 1,
      STATUS: 1,
    }
  })
}

export async function getBusinessReviewsForUser(businessId: number) {
  try {
    // Runs from the browser, so the viewer comes from the session, never from an argument.
    const session = await getServerSession(authOptions);
    const userId = Number(session?.user?.id) || undefined;
    const whereClause: any = {
      BUSINESS_ID: businessId,
      OR: [
        { APPROVED: 1 },
      ],
    };
    if (userId) {
      whereClause.OR.push({ VISITORS_ACCOUNT_ID: userId });
    }
    const reviews = await prisma.visitor_business_review_view.findMany({
      where: whereClause,
      orderBy: {
        CREATION_DATETIME: "desc",
      },
    });
    // If userId is provided, filter out duplicates (user's own review may be both approved and unapproved)
    if (userId) {
      const seen = new Set();
      return reviews.filter(r => {
        const key = r.VISITOR_BUSINESS_REVIEW_ID;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return reviews;
  } catch (error) {
    console.error("[getBusinessReviewsForUser] Failed to fetch reviews:", error);
    return [];
  }
}
