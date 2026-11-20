import { after, NextRequest, NextResponse } from 'next/server';
import { UnifiedGoogleService } from '@/services/UnifiedGoogleService';
import {
  BusinessGoogleData,
  BusinessGoogleDataResponse,
  GoogleReview,
  OpeningHourDay,
  GooglePhoto
} from '@/types/google-business';
import prisma from '@/lib/prisma';
import { getGoogleCacheStatus, saveBusinessDataToDb } from '@/lib/google-business-refresh';

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
  { params }: { params: Promise<{ businessId: string }> }
) {
  // Each call can spend Google Places quota and no page calls this route, so it is closed to the public.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const businessId = parseInt((await params).businessId);
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
    await saveBusinessDataToDb(businessId, placeId, freshData).catch(() => undefined);

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
// after() keeps the serverless function alive until the refresh finishes.
// ─────────────────────────────────────────────────────────────────────────────
function scheduleBackgroundRefresh(businessId: number, placeId: string): void {
  after(() =>
    UnifiedGoogleService.fetchGooglePlaceDetails(placeId)
      .then(freshData => saveBusinessDataToDb(businessId, placeId, freshData))
      .catch(error =>
        console.error(`[BackgroundRefresh] Failed for business ${businessId}:`, error)
      )
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

    // Older rows embed the Maps API key in the URL; never send those to the browser.
    const photos: GooglePhoto[] = cachedPhotos.filter(p => p.IMAGE_URL && !p.IMAGE_URL.includes('key=')).map(p => ({
      photoUrl: p.IMAGE_URL || '',
      width: Number(p.WIDTH ?? 800) || 800,
      height: Number(p.HEIGHT ?? 600) || 600
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

