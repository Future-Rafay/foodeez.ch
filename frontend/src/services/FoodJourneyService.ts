'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// These functions run from the browser, so the viewer comes from the session, never from an argument.
async function viewerId() {
  const session = await getServerSession(authOptions);
  const id = Number(session?.user?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getFoodJourney() {
  try {
    const userId = await viewerId();
    return await prisma.visitor_food_journey_view.findMany({
      where: { OR: [{ APPROVED: 1 }, ...(userId ? [{ VISITORS_ACCOUNT_ID: userId }] : [])] },
      omit: { VISITOR_EMAIL_ADDRESS: true },
    });
  } catch (error) {
    console.error("Error fetching food journey:", error);
    return [];
  }
}

export async function getFoodJourneyById(id: number) {
  try {
    const userId = await viewerId();
    return await prisma.visitor_food_journey_view.findFirst({
      where: {
        VISITOR_FOOD_JOURNEY_ID: Number(id),
        OR: [{ APPROVED: 1 }, ...(userId ? [{ VISITORS_ACCOUNT_ID: userId }] : [])],
      },
      omit: { VISITOR_EMAIL_ADDRESS: true },
    });
  } catch (error) {
    console.error('Error fetching food journey by ID:', error);
    return null;
  }
}
