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
import { CheckisOpenNow } from '@/lib/isOpenNow';
import { evaluateGoogleCache } from '@/lib/googleCache';

const GOOGLE_CACHE_TTL_MS = Number(process.env.NEXT_PUBLIC_GOOGLE_CACHE_TTL_MS ?? 90 * 24 * 60 * 60 * 1000);

type GoogleDataTimestampRow = {
  google_data_fetched_at: Date | null;
};

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
    const cacheStatus = await getGoogleCacheStatus(businessId, placeId);
    const cachedData = cacheStatus.hasAnyData
      ? await getCachedBusinessData(businessId, placeId, cacheStatus.lastFetchedAt)
      : null;

    if (cacheStatus.isFresh && cachedData) {
      return NextResponse.json({
        ...cachedData,
        success: true,
        dataSource: 'db'
      } as BusinessGoogleDataResponse as any);
    }

    try {
      const freshData = await UnifiedGoogleService.fetchGooglePlaceDetails(placeId);
      await saveBusinessDataToDb(businessId, placeId, freshData);

      return NextResponse.json({
        ...freshData,
        success: true,
        dataSource: 'api'
      } as BusinessGoogleDataResponse as any);
    } catch (error) {
      console.error('Error refreshing Google data:', error);

      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          success: true,
          dataSource: 'db'
        } as BusinessGoogleDataResponse as any);
      }

      throw error;
    }
  } catch (error) {
    console.error('Error in GET /business-google-data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as BusinessGoogleDataResponse,
      { status: 500 }
    );
  }
}

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
      }),
    ]);

    if (cachedReviews.length === 0 && cachedOpeningHours.length === 0 && cachedPhotos.length === 0) {
      return null;
    }

    const reviews: GoogleReview[] = cachedReviews.map(r => ({
      author_name: r.AUTHOR || '',
      rating: parseFloat(r.RATING || '0'),
      text: r.REVIEW || '',
      relative_time_description: r.RELATIVE_TIME || '',
      profile_photo_url: ''
    }));

    const openingHours: OpeningHourDay[] = cachedOpeningHours.map(h => ({
      day: h.DAY || '',
      hours: `${h.OPEN_1 || ''} - ${h.CLOSE_1 || ''}${h.OPEN_2 ? `, ${h.OPEN_2} - ${h.CLOSE_2}` : ''}`
    }));

    const photos: GooglePhoto[] = cachedPhotos.map(p => ({
      photoUrl: p.IMAGE_URL || '',
      width: 0,
      height: 0
    }));

    return {
      name: '',
      rating: 0,
      totalReviews: reviews.length,
      reviews,
      openingHours,
      photos,
      isOpenNow: CheckisOpenNow(openingHours),
      cached: true,
      lastUpdated: lastFetchedAt ?? new Date()
    };
  } catch (error) {
    console.error('Error fetching cached data:', error);
    return null;
  }
}

async function getGoogleCacheStatus(businessId: number, placeId: string) {
  const [latestReview, latestOpeningHours, latestPhoto, reviewCount, openingHoursCount, photoCount] = await Promise.all([
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
      { hasData: Number(reviewCount[0]?.count ?? 0) > 0, fetchedAt: latestReview[0]?.google_data_fetched_at },
      { hasData: Number(openingHoursCount[0]?.count ?? 0) > 0, fetchedAt: latestOpeningHours[0]?.google_data_fetched_at },
      { hasData: Number(photoCount[0]?.count ?? 0) > 0, fetchedAt: latestPhoto[0]?.google_data_fetched_at },
    ],
    GOOGLE_CACHE_TTL_MS
  );
}

async function saveBusinessDataToDb(
  businessId: number,
  placeId: string,
  data: BusinessGoogleData
): Promise<void> {
  const fetchedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
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

      for (const review of data.reviews) {
        await tx.$executeRaw`
          INSERT INTO business_google_reviews
            (CREATION_DATETIME, google_data_fetched_at, BUSINESS_ID, PLACE_ID, AUTHOR, RATING, REVIEW, RELATIVE_TIME)
          VALUES
            (${fetchedAt}, ${fetchedAt}, ${businessId}, ${placeId}, ${review.author_name}, ${String(review.rating)}, ${review.text}, ${review.relative_time_description})
        `;
      }

      for (const hours of data.openingHours) {
        const timeRanges = hours.hours.split(',').map((range: string) => range.trim());
        const [open1, close1] = timeRanges[0]?.split(/[-–]/).map((time: string) => time.trim()) || ['', ''];
        const [open2, close2] = timeRanges[1]?.split(/[-–]/).map((time: string) => time.trim()) || ['', ''];

        const nextOpeningHoursId = await tx.$queryRaw<Array<{ nextId: bigint | number }>>`
          SELECT COALESCE(MAX(BUSINESS_OPENING_HOURS_ID), 0) + 1 AS nextId
          FROM business_opening_hours
        `;

        await tx.$executeRaw`
          INSERT INTO business_opening_hours
            (BUSINESS_OPENING_HOURS_ID, CREATION_DATETIME, google_data_fetched_at, BUSINESS_ID, PLACE_ID, DAY, OPEN_1, CLOSE_1, OPEN_2, CLOSE_2, REMARKS)
          VALUES
            (${Number(nextOpeningHoursId[0]?.nextId ?? 1)}, ${fetchedAt}, ${fetchedAt}, ${businessId}, ${placeId}, ${hours.day}, ${open1}, ${close1}, ${open2}, ${close2}, ${hours.hours})
        `;
      }

      for (const photo of data.photos) {
        await tx.$executeRaw`
          INSERT INTO business_google_images
            (CREATION_DATETIME, google_data_fetched_at, BUSINESS_ID, PLACE_ID, IMAGE_URL)
          VALUES
            (${fetchedAt}, ${fetchedAt}, ${businessId}, ${placeId}, ${photo.photoUrl})
        `;
      }
    });
  } catch (error) {
    console.error('Critical error saving business data to database:', error);
  }
}
