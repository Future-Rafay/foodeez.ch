'use server';

import prisma from "@/lib/prisma";


export async function getFoodJourney(userId?: number) {
  try {
    const whereClause: any = {
      OR: [{ APPROVED: 1 }],
    };

    if (userId) {
      whereClause.OR.push({ VISITOR_ACCOUNT_ID: userId });
    }

    const journey = await prisma.visitor_food_journey_view.findMany({
      where: whereClause,
    });

    // Remove duplicate entries if userId is passed
    if (userId) {
      const seen = new Set();
      return journey.filter(j => {
        const key = j.VISITOR_FOOD_JOURNEY_ID;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return journey;
  } catch (error) {
    console.error("Error fetching food journey:", error);
    return [];
  }
}

export async function getFoodJourneyById(id: number) {
  try {
    const journey = await prisma.visitor_food_journey_view.findFirst({
      where: { VISITOR_FOOD_JOURNEY_ID: id },
    });
    return journey;
  } catch (error) {
    console.error('Error fetching food journey by ID:', error);
    return null;
  }
}
