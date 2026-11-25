import { after } from "next/server";
import prisma from "@/lib/prisma";
import { evaluateGoogleCache, GOOGLE_DATA_TTL_MS } from "@/lib/googleCache";
import { UnifiedGoogleService } from "@/services/UnifiedGoogleService";
import type { BusinessGoogleData } from "@/types/google-business";

// Google reviews, opening hours and photos are fetched once and kept in the business_google_* tables for 90 days
// (NEXT_PUBLIC_GOOGLE_CACHE_TTL_MS). A visit to a profile page with missing or older data starts one background refresh, and
// the next visit shows the new data. business_google_refresh records the last attempt, so a restaurant is fetched at most
// once per 90 days even when Google has no photos or reviews for it, and two visits at once never both pay for a fetch.

const GOOGLE_CACHE_TTL_MS = GOOGLE_DATA_TTL_MS;
/** A failed fetch is retried after a day instead of waiting the full 90 days. */
export const GOOGLE_FAILED_RETRY_MS = 24 * 60 * 60 * 1000;

type GoogleDataTimestampRow = {
  google_data_fetched_at: Date | null;
};

const BOT_USER_AGENT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|preview|lighthouse|headless|curl|wget|python|http-client|scrapy/i;

/** Search engines and link previews visit every page; they must never spend Google Places quota. */
export const isBotUserAgent = (userAgent: string | null) => !userAgent || BOT_USER_AGENT.test(userAgent);

// ─────────────────────────────────────────────────────────────────────────────
// CACHE STATUS — reads the latest google_data_fetched_at from each table
// and returns a unified freshness verdict via evaluateGoogleCache().
// ─────────────────────────────────────────────────────────────────────────────
export async function getGoogleCacheStatus(businessId: number, placeId: string) {
  const [
    latestReview,
    latestOpeningHours,
    latestPhoto,
    reviewCount,
    openingHoursCount,
    photoCount
  ] = await Promise.all([
    prisma.$queryRaw<GoogleDataTimestampRow[]>`
      SELECT google_data_fetched_at
      FROM business_google_reviews
      WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
      ORDER BY google_data_fetched_at DESC
      LIMIT 1
    `,
    prisma.$queryRaw<GoogleDataTimestampRow[]>`
      SELECT google_data_fetched_at
      FROM business_opening_hours
      WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
      ORDER BY google_data_fetched_at DESC
      LIMIT 1
    `,
    prisma.$queryRaw<GoogleDataTimestampRow[]>`
      SELECT google_data_fetched_at
      FROM business_google_images
      WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
      ORDER BY google_data_fetched_at DESC
      LIMIT 1
    `,
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM business_google_reviews
      WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
    `,
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM business_opening_hours
      WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
    `,
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) AS count
      FROM business_google_images
      WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
    `
  ]);

  return evaluateGoogleCache(
    [
      {
        hasData: Number(reviewCount[0]?.count ?? 0) > 0,
        fetchedAt: latestReview[0]?.google_data_fetched_at
      },
      {
        hasData: Number(openingHoursCount[0]?.count ?? 0) > 0,
        fetchedAt: latestOpeningHours[0]?.google_data_fetched_at
      },
      {
        hasData: Number(photoCount[0]?.count ?? 0) > 0,
        fetchedAt: latestPhoto[0]?.google_data_fetched_at
      }
    ],
    GOOGLE_CACHE_TTL_MS
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE TO DB — deletes stale rows and writes fresh ones inside a transaction.
// google_data_fetched_at acts as the "cached_at" timestamp for every row.
// ─────────────────────────────────────────────────────────────────────────────
export async function saveBusinessDataToDb(
  businessId: number,
  placeId: string,
  data: BusinessGoogleData
): Promise<void> {
  const fetchedAt = new Date(); // This is the "cached_at" value written to every row

  try {
    await prisma.$transaction(async tx => {
      // Clear old data for this business/place combo
      await Promise.all([
        tx.$executeRaw`
          DELETE FROM business_google_reviews
          WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
        `,
        tx.$executeRaw`
          DELETE FROM business_opening_hours
          WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
        `,
        tx.$executeRaw`
          DELETE FROM business_google_images
          WHERE BUSINESS_ID = ${businessId} AND PLACE_ID = ${placeId}
        `
      ]);

      // Insert reviews
      for (const review of data.reviews) {
        await tx.$executeRaw`
          INSERT INTO business_google_reviews
            (CREATION_DATETIME, google_data_fetched_at, BUSINESS_ID, PLACE_ID,
             AUTHOR, RATING, REVIEW, RELATIVE_TIME, PROFILE_PHOTO_URL)
          VALUES
            (${fetchedAt}, ${fetchedAt}, ${businessId}, ${placeId},
             ${review.author_name}, ${String(review.rating)}, ${review.text},
             ${review.relative_time_description}, ${review.profile_photo_url ?? null})
        `;
      }

      // Insert opening hours
      for (const hours of data.openingHours) {
        const timeRanges = hours.hours.split(',').map((r: string) => r.trim());
        const [open1, close1] = timeRanges[0]?.split(/[-–]/).map((t: string) => t.trim()) ?? ['', ''];
        const [open2, close2] = timeRanges[1]?.split(/[-–]/).map((t: string) => t.trim()) ?? ['', ''];

        const nextIdResult = await tx.$queryRaw<Array<{ nextId: bigint | number }>>`
          SELECT COALESCE(MAX(BUSINESS_OPENING_HOURS_ID), 0) + 1 AS nextId
          FROM business_opening_hours
        `;

        await tx.$executeRaw`
          INSERT INTO business_opening_hours
            (BUSINESS_OPENING_HOURS_ID, CREATION_DATETIME, google_data_fetched_at,
             BUSINESS_ID, PLACE_ID, DAY, OPEN_1, CLOSE_1, OPEN_2, CLOSE_2, REMARKS)
          VALUES
            (${Number(nextIdResult[0]?.nextId ?? 1)}, ${fetchedAt}, ${fetchedAt},
             ${businessId}, ${placeId}, ${hours.day}, ${open1}, ${close1},
             ${open2}, ${close2}, ${hours.hours})
        `;
      }

      // Insert photos
      for (const photo of data.photos) {
        await tx.$executeRaw`
          INSERT INTO business_google_images
            (CREATION_DATETIME, google_data_fetched_at, BUSINESS_ID, PLACE_ID,
             IMAGE_URL, WIDTH, HEIGHT)
          VALUES
            (${fetchedAt}, ${fetchedAt}, ${businessId}, ${placeId},
             ${photo.photoUrl}, ${photo.width}, ${photo.height})
        `;
      }
    });
  } catch (error) {
    // Callers catch this: the route still answers, and the background refresh schedules a retry.
    console.error(`[SaveToDB] Failed for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Called by the profile pages after they have read the stored data. Never throws and never makes the visitor wait:
 * the Google call runs in after(), once the page has been sent.
 */
export async function refreshGoogleDataIfStale(businessId: number, placeId: string | null | undefined, userAgent: string | null) {
  if (!placeId || isBotUserAgent(userAgent)) return;
  try {
    const now = Date.now();
    const cutoff = new Date(now - GOOGLE_CACHE_TTL_MS);
    const attempt = await prisma.business_google_refresh.findUnique({ where: { BUSINESS_ID: businessId } });
    if (attempt && attempt.LAST_ATTEMPT_DATETIME > cutoff) return;

    if (!attempt) {
      // First check for this restaurant: data saved before this table existed still counts for its 90 days.
      const status = await getGoogleCacheStatus(businessId, placeId);
      const seed = status.isFresh && status.lastFetchedAt ? status.lastFetchedAt : new Date(0);
      await prisma.$executeRaw`INSERT IGNORE INTO business_google_refresh (BUSINESS_ID, LAST_ATTEMPT_DATETIME) VALUES (${businessId}, ${seed})`;
      if (status.isFresh) return;
    }

    // Claim the refresh: only the request whose update changes the row fetches from Google.
    const claimed = await prisma.business_google_refresh.updateMany({
      where: { BUSINESS_ID: businessId, LAST_ATTEMPT_DATETIME: { lte: cutoff } },
      data: { LAST_ATTEMPT_DATETIME: new Date(now) },
    });
    if (!claimed.count) return;

    after(async () => {
      try {
        const freshData = await UnifiedGoogleService.fetchGooglePlaceDetails(placeId);
        await saveBusinessDataToDb(businessId, placeId, freshData);
      } catch (error) {
        console.warn(`[GoogleRefresh] Google fetch failed for business ${businessId}; the page keeps its stored data:`, error instanceof Error ? error.message : error);
        // Let the next visit after a day try again instead of waiting 90 days.
        await prisma.business_google_refresh
          .update({ where: { BUSINESS_ID: businessId }, data: { LAST_ATTEMPT_DATETIME: new Date(Date.now() - GOOGLE_CACHE_TTL_MS + GOOGLE_FAILED_RETRY_MS) } })
          .catch(() => undefined);
      }
    });
  } catch (error) {
    // warn, not error: the page still renders its stored Google data, so this must not surface as a page error.
    console.warn(`[GoogleRefresh] Freshness check skipped for business ${businessId}:`, error instanceof Error ? error.message : error);
  }
}
