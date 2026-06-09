"use server";

import { prisma } from "../lib/prisma";

export async function getBusinesses() {
  try {
    const businesses = await prisma.business_detail_view_all.findMany({
      take: 9, // Limit to 9 results
      orderBy: {
        BUSINESS_ID: "asc", // Order by BUSINESS_ID ascending
      },
    })
    // Return as is - already using uppercase field names from the DB view
    return businesses
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return []
  }
}

export async function getBusinessById(id: number) {
  try {
    const business = await prisma.business_detail_view_all.findFirst({
      where: {
        BUSINESS_ID: id
      }
    })
    return business
  } catch (error) {
    console.error('Error fetching business:', error)
    return null
  }
}

export async function getBusinessReviewsForUser(businessId: number, userId?: number) {
  try {
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
