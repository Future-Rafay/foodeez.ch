import type { visitor_food_journey_view } from "@/lib/prisma";

/** A food story as sent to the browser: author emails stay on the server. */
export type PublicFoodJourney = Omit<visitor_food_journey_view, "VISITOR_EMAIL_ADDRESS">;
