import { swissDate } from "@/lib/discounts";

export type MenuCardSchedule = {
  BUSINESS_FOOD_MENU_CARD_ID: number;
  TITLE: string | null;
  VALID_FROM: Date | null;
  VALID_TO: Date | null;
  STATUS: number | null;
  REPEAT_WEEKLY: number | null;
  ACTIVE_DAYS_JSON: string | null;
  IS_UNLIMITED: number | null;
  SALES_CHANNEL: string | null;
};

function parseActiveDays(value: string | null) {
  try {
    const days = JSON.parse(value || "[]");
    return Array.isArray(days) ? days.map((day) => String(day).toLowerCase()) : [];
  } catch {
    return [];
  }
}

/** Menu days follow the restaurant's clock in Switzerland, not the server's UTC clock. */
export function isMenuActiveOn(card: MenuCardSchedule, now = new Date()) {
  const today = swissDate(now);
  if (Number(card.STATUS ?? 1) !== 1 || !card.VALID_FROM) return false;
  if (swissDate(card.VALID_FROM) > today) return false;
  if (Number(card.IS_UNLIMITED ?? 0) !== 1 && card.VALID_TO && swissDate(card.VALID_TO) < today) {
    return false;
  }
  if (Number(card.REPEAT_WEEKLY ?? 0) === 1) {
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Zurich", weekday: "long" })
      .format(now)
      .toLowerCase();
    return parseActiveDays(card.ACTIVE_DAYS_JSON).includes(weekday);
  }
  return true;
}
