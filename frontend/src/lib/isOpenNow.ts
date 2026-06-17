import { OpeningHourDay } from "@/types/google-business";
import { format, subDays } from "date-fns";

/** "9:00 AM" / "09:00" → minutes since midnight, or -1 if unparseable */
const parseTimeToMinutes = (timeStr: string): number => {
  const t = timeStr.trim();

  const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }

  const h24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1], 10) * 60 + parseInt(h24[2], 10);

  return -1;
};

const CLOSED_PATTERNS = [
  /^closed$/i,
  /^closed\s+now$/i,
  /^temporarily\s+closed$/i,
  /^closed\s+today$/i,
  /^not\s+open$/i,
  /^geschlossen$/i,
  /^fermé$/i,
  /^ferme$/i,
];

const OPEN_24_PATTERNS = [
  /^open\s*24\s*hours?$/i,
  /^24\s*hours?$/i,
  /^open\s*24\s*\/\s*7$/i,
  /^24\s*\/\s*7$/i,
  /^always\s+open$/i,
  /^open\s*all\s*day$/i,
  /^24\s*stunden\s*geöffnet$/i,
  /^rund\s*um\s*die\s*uhr$/i,
  /^ouvert\s*24\s*h(?:\s*\/\s*24)?$/i,
];

export function isClosedHours(hours: string): boolean {
  const normalized = hours.trim();
  if (!normalized) return true;

  return CLOSED_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isOpen24Hours(hours: string): boolean {
  const normalized = hours.trim();
  if (!normalized) return false;

  return OPEN_24_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Google sometimes encodes 24h as 12:00 AM – 12:00 AM or a full-day span. */
const isFullDayRange = (openAt: number, closeAt: number): boolean => {
  if (openAt === 0 && closeAt === 0) return true;
  if (openAt === 0 && closeAt >= 23 * 60 + 59) return true;
  return false;
};

const isWithinRange = (
  nowMinutes: number,
  openAt: number,
  closeAt: number
): boolean => {
  if (isFullDayRange(openAt, closeAt)) return true;

  if (closeAt < openAt) {
    return nowMinutes >= openAt || nowMinutes < closeAt;
  }

  return nowMinutes >= openAt && nowMinutes < closeAt;
};

const checkDayHours = (hours: string, nowMinutes: number): boolean => {
  const trimmedHours = hours.trim();
  if (!trimmedHours || isClosedHours(trimmedHours)) return false;
  if (isOpen24Hours(trimmedHours)) return true;

  const ranges = trimmedHours.split(",");

  for (const range of ranges) {
    const segment = range.trim();
    if (!segment || isClosedHours(segment)) continue;
    if (isOpen24Hours(segment)) return true;

    const parts = segment.split(/\s*[–-]\s*/);
    if (parts.length < 2) continue;

    const openAt = parseTimeToMinutes(parts[0]);
    const closeAt = parseTimeToMinutes(parts[1]);
    if (openAt === -1 || closeAt === -1) continue;

    if (isWithinRange(nowMinutes, openAt, closeAt)) return true;
  }

  return false;
};

const findDayEntry = (
  openingHours: OpeningHourDay[],
  dayName: string
): OpeningHourDay | undefined =>
  openingHours.find(
    (item) => item.day.toLowerCase() === dayName.toLowerCase()
  );

/** True when an overnight range from the previous day is still open. */
const isOpenFromPreviousDay = (
  openingHours: OpeningHourDay[],
  previousDayName: string,
  nowMinutes: number
): boolean => {
  const previousEntry = findDayEntry(openingHours, previousDayName);
  if (!previousEntry) return false;

  const hours = previousEntry.hours.trim();
  if (!hours || isClosedHours(hours) || isOpen24Hours(hours)) return false;

  for (const range of hours.split(",")) {
    const segment = range.trim();
    if (!segment || isClosedHours(segment) || isOpen24Hours(segment)) continue;

    const parts = segment.split(/\s*[–-]\s*/);
    if (parts.length < 2) continue;

    const openAt = parseTimeToMinutes(parts[0]);
    const closeAt = parseTimeToMinutes(parts[1]);
    if (openAt === -1 || closeAt === -1) continue;

    // Overnight only: e.g. 10:00 PM – 2:00 AM, still open after midnight
    if (closeAt < openAt && nowMinutes < closeAt) return true;
  }

  return false;
};

/**
 * Returns true when the business is open right now according to openingHours.
 *
 * Handles:
 * - Closed / Closed now / temporarily closed (incl. DE/FR variants)
 * - Open 24 hours / 24/7 / always open
 * - Multiple ranges per day (e.g. lunch + dinner)
 * - Overnight ranges spanning into the next calendar day
 * - Full-day time ranges (12:00 AM – 12:00 AM, 12:00 AM – 11:59 PM)
 */
export function isOpenNow(openingHours: OpeningHourDay[]): boolean {
  if (!openingHours?.length) return false;

  const now = new Date();
  const currentDay = format(now, "EEEE");
  const previousDay = format(subDays(now, 1), "EEEE");
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (isOpenFromPreviousDay(openingHours, previousDay, nowMinutes)) {
    return true;
  }

  const todayEntry = findDayEntry(openingHours, currentDay);
  if (!todayEntry) return false;

  return checkDayHours(todayEntry.hours, nowMinutes);
}

/** @deprecated Use isOpenNow instead */
export const CheckisOpenNow = isOpenNow;
