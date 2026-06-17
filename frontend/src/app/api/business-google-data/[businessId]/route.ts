import { NextRequest, NextResponse } from 'next/server';
import { UnifiedGoogleService } from '@/services/UnifiedGoogleService';
import {
  BusinessGoogleData,
  BusinessGoogleDataResponse,
  GoogleReview,
  OpeningHourDay,
  GooglePhoto
} from '@/types/google-business';
import prisma from '@/lib/prisma';
import { evaluateGoogleCache } from '@/lib/googleCache';

const GOOGLE_CACHE_TTL_MS = Number(
  process.env.NEXT_PUBLIC_GOOGLE_CACHE_TTL_MS ?? 90 * 24 * 60 * 60 * 1000
);

type GoogleDataTimestampRow = {
  google_data_fetched_at: Date | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// Flow:
//   1. Look up business in DB
//   2. FIRST VISIT  → call Google API → save to DB → return data
//   3. FRESH data   → return DB data (no API call)
//   4. STALE data   → return DB data immediately + background refresh (user never waits)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = parseInt(params.businessId);
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Invalid business ID' } as BusinessGoogleDataResponse,
        { status: 400 }
      );
    }

    // ── Step 1: Resolve the Google Place ID for this business ─────────────────
    const business = await prisma.business_detail_view_all.findFirst({
      where: { BUSINESS_ID: businessId },
      select: { PLACE_ID: true }
    });

    if (!business?.PLACE_ID) {
      return NextResponse.json(
        { success: false, error: 'Business not found' } as BusinessGoogleDataResponse,
        { status: 404 }
      );
    }

    const placeId = business.PLACE_ID;

    // ── Step 2: Check what the DB already holds for this business ─────────────
    const cacheStatus = await getGoogleCacheStatus(businessId, placeId);

    // ── FIRST VISIT: nothing stored yet → call API, save, respond ─────────────
    if (!cacheStatus.hasAnyData) {
      return handleFirstVisit(businessId, placeId);
    }

    // ── RETURNING VISIT: we have data, load it ────────────────────────────────
    const cachedData = await getCachedBusinessData(
      businessId,
      placeId,
      cacheStatus.lastFetchedAt
    );

    // Edge case: cache status says data exists but the read came back empty
    // (e.g. a race condition during a previous delete). Treat as first visit.
    if (!cachedData) {
      return handleFirstVisit(businessId, placeId);
    }

    // ── FRESH: data is within the TTL window — serve from DB, skip the API ────
    if (cacheStatus.isFresh) {
      return NextResponse.json({
        ...cachedData,
        success: true,
        dataSource: 'db'
      } as BusinessGoogleDataResponse as any);
    }

    // ── STALE: data is older than TTL ─────────────────────────────────────────
    //    • Return the existing DB data to the user RIGHT NOW (no waiting)
    //    • Fire a background refresh so the next visitor gets fresher data
    //    • The user is NEVER blocked by the background call
    scheduleBackgroundRefresh(businessId, placeId);

    return NextResponse.json({
      ...cachedData,
      success: true,
      dataSource: 'db'
    } as BusinessGoogleDataResponse as any);

  } catch (error) {
    console.error('Error in GET /business-google-data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as BusinessGoogleDataResponse,
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRST VISIT FLOW
// No cached data exists at all. Fetch from Google API, persist, then return.
// This is the only code path that makes the user wait for a Google API call.
// ─────────────────────────────────────────────────────────────────────────────
async function handleFirstVisit(
  businessId: number,
  placeId: string
): Promise<NextResponse> {
  try {
    const freshData = await UnifiedGoogleService.fetchGooglePlaceDetails(placeId);

    // Persist synchronously so cached_at is set before we respond.
    // If the save fails we still return the data — the next visit will retry.
    await saveBusinessDataToDb(businessId, placeId, freshData);

    return NextResponse.json({
      ...freshData,
      success: true,
      dataSource: 'api'
    } as BusinessGoogleDataResponse as any);
  } catch (error) {
    console.error(`[FirstVisit] Failed to fetch Google data for business ${businessId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business data from Google' } as BusinessGoogleDataResponse,
      { status: 502 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND REFRESH (fire-and-forget)
//
// Called when cached data is STALE. The response has already been sent to the
// user by the time this runs, so they experience zero extra latency.
//
// NOTE on serverless environments (Vercel/AWS Lambda):
//   Fire-and-forget promises may be cut short if the function runtime exits
//   immediately after sending the response. If you are on Next.js 15+ you can
//   replace this with:
//
//     import { unstable_after as after } from 'next/server';
//     after(() => refreshGoogleData(businessId, placeId));
//
//   That API guarantees the callback runs even after the response is flushed.
// ─────────────────────────────────────────────────────────────────────────────
function scheduleBackgroundRefresh(businessId: number, placeId: string): void {
  UnifiedGoogleService.fetchGooglePlaceDetails(placeId)
    .then(freshData => saveBusinessDataToDb(businessId, placeId, freshData))
    .then(() =>
      console.log(`[BackgroundRefresh] Updated Google data for business ${businessId}`)
    )
    .catch(error =>
      console.error(`[BackgroundRefresh] Failed for business ${businessId}:`, error)
    );
  // Intentionally not awaited.
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE STATUS — reads the latest google_data_fetched_at from each table
// and returns a unified freshness verdict via evaluateGoogleCache().
// ─────────────────────────────────────────────────────────────────────────────
async function getGoogleCacheStatus(businessId: number, placeId: string) {
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
// READ CACHED DATA — assembles the full BusinessGoogleData object from the DB
// ─────────────────────────────────────────────────────────────────────────────
async function getCachedBusinessData(
  businessId: number,
  placeId: string,
  lastFetchedAt: Date | null
): Promise<BusinessGoogleData | null> {
  try {
    const [cachedReviews, cachedOpeningHours, cachedPhotos] = await Promise.all([
      prisma.business_google_review_view.findMany({
        where: { BUSINESS_ID: businessId, PLACE_ID: placeId }
      }),
      prisma.business_opening_hours_view.findMany({
        where: { BUSINESS_ID: businessId, PLACE_ID: placeId }
      }),
      prisma.business_google_images_view.findMany({
        where: { BUSINESS_ID: businessId, PLACE_ID: placeId }
      })
    ]);

    if (
      cachedReviews.length === 0 &&
      cachedOpeningHours.length === 0 &&
      cachedPhotos.length === 0
    ) {
      return null;
    }

    const reviews: GoogleReview[] = cachedReviews.map(r => ({
      author_name: r.AUTHOR || '',
      rating: parseFloat(r.RATING || '0'),
      text: r.REVIEW || '',
      relative_time_description: r.RELATIVE_TIME || '',
      profile_photo_url: r.PROFILE_PHOTO_URL || ''
    }));

    const openingHours: OpeningHourDay[] = cachedOpeningHours.map(h => ({
      day: h.DAY || '',
      hours: `${h.OPEN_1 || ''} - ${h.CLOSE_1 || ''}${
        h.OPEN_2 ? `, ${h.OPEN_2} - ${h.CLOSE_2}` : ''
      }`
    }));

    const photos: GooglePhoto[] = cachedPhotos.map(p => ({
      photoUrl: p.IMAGE_URL || '',
      width: p.WIDTH ?? 800,
      height: p.HEIGHT ?? 600
    }));

    return {
      name: '',
      rating: 0,
      totalReviews: reviews.length,
      reviews,
      openingHours,
      photos,
      cached: true,
      lastUpdated: lastFetchedAt ?? new Date()
    };
  } catch (error) {
    console.error('Error reading cached Google data:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE TO DB — deletes stale rows and writes fresh ones inside a transaction.
// google_data_fetched_at acts as the "cached_at" timestamp for every row.
// ─────────────────────────────────────────────────────────────────────────────
async function saveBusinessDataToDb(
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
    // Log but don't re-throw — a save failure should never crash the response
    console.error(`[SaveToDB] Failed for business ${businessId}:`, error);
  }
}