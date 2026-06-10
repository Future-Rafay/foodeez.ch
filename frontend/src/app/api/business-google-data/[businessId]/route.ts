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


export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const businessId = parseInt(params.businessId);
    if (!businessId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid business ID' 
      } as BusinessGoogleDataResponse, { status: 400 });
    }

    // Prefer DB always; only call API when DB has no data

    // Get PLACE_ID from DB
    const business = await prisma.business_detail_view_all.findFirst({
      where: { BUSINESS_ID: businessId },
      select: { PLACE_ID: true }
    });

    if (!business?.PLACE_ID) {
      return NextResponse.json({ 
        success: false, 
        error: 'Business not found' 
      } as BusinessGoogleDataResponse, { status: 404 });
    }

    const placeId = business.PLACE_ID;

    // Check DB for data first
    const cachedData = await getCachedBusinessData(businessId, placeId);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        success: true,
        dataSource: 'db'
      } as BusinessGoogleDataResponse as any);
    }

    // Fetch fresh data from Google API
    const freshData = await UnifiedGoogleService.fetchGooglePlaceDetails(placeId);
    
    // Save to database in background (don't await to return data quickly)
    saveBusinessDataToDb(businessId, placeId, freshData).catch(err => {
      console.error('Error saving Google data to DB:', err);
    });

    return NextResponse.json({
      ...freshData,
      success: true,
      dataSource: 'api'
    } as BusinessGoogleDataResponse as any);

  } catch (error) {
    console.error('Error in GET /business-google-data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    } as BusinessGoogleDataResponse, { status: 500 });
  }
}

/**
 * Get cached business data from database
 */
async function getCachedBusinessData(
  businessId: number, 
  placeId: string
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

    // Only return cached data if we have all three types
    if (cachedReviews.length === 0 || cachedOpeningHours.length === 0 || cachedPhotos.length === 0) {
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

    // Get the most recent creation date for lastUpdated
    const timestamps = [
      ...cachedReviews.map(() => new Date().getTime()), // Fallback since view might not have CREATION_DATETIME
      ...cachedOpeningHours.map(() => new Date().getTime()),
      ...cachedPhotos.map(() => new Date().getTime())
    ];
    const lastUpdated = new Date(Math.max(...timestamps));

    return {
      name: '', // We don't store business name in cache, will be filled from business table if needed
      rating: 0, // Will be calculated from reviews if needed
      totalReviews: reviews.length,
      reviews,
      openingHours,
      photos,
      isOpenNow : CheckisOpenNow(openingHours),
      cached: true,
      lastUpdated
    };
  } catch (error) {
    console.error('Error fetching cached data:', error);
    return null;
  }
}

/**
 * Save business data to database
 * Fixed version with proper error handling and logging
 */
async function saveBusinessDataToDb(
  businessId: number, 
  placeId: string, 
  data: BusinessGoogleData
): Promise<void> {
  try {
    // Guard: if any data already exists for this business/place, skip saving to avoid duplicates
    const [existingReviews, existingHours, existingPhotos] = await Promise.all([
      prisma.business_google_reviews.count({ where: { BUSINESS_ID: businessId, PLACE_ID: placeId } }),
      prisma.business_opening_hours.count({ where: { BUSINESS_ID: businessId, PLACE_ID: placeId } }),
      prisma.business_google_images.count({ where: { BUSINESS_ID: businessId, PLACE_ID: placeId } })
    ]);
    if (existingReviews > 0 || existingHours > 0 || existingPhotos > 0) {
      return;
    }

    // Save reviews
    for (let i = 0; i < data.reviews.length; i++) {
      const review = data.reviews[i];
      try {
        await prisma.business_google_reviews.create({
          data: {
            BUSINESS_ID: businessId,
            PLACE_ID: placeId,
            AUTHOR: review.author_name,
            RATING: String(review.rating),
            REVIEW: review.text,
            RELATIVE_TIME: review.relative_time_description,
            CREATION_DATETIME: new Date(),
          }
        });
      } catch (err) {
        console.error(`Error saving review ${i + 1}:`, err);
        console.error('Review data:', review);
      }
    }

    // Save opening hours using direct SQL to avoid Prisma issues
    for (let i = 0; i < data.openingHours.length; i++) {
      const hours = data.openingHours[i];
      try {
        const timeRanges = hours.hours.split(',').map(r => r.trim());
        const [open1, close1] = timeRanges[0]?.split(/[-–]/).map(t => t.trim()) || ['', ''];
        const [open2, close2] = timeRanges[1]?.split(/[-–]/).map(t => t.trim()) || ['', ''];
        const nextOpeningHoursId = await prisma.$queryRaw<Array<{ nextId: bigint | number }>>`
          SELECT COALESCE(MAX(BUSINESS_OPENING_HOURS_ID), 0) + 1 AS nextId
          FROM business_opening_hours
        `;
        
        await prisma.$executeRaw`
          INSERT INTO business_opening_hours (BUSINESS_OPENING_HOURS_ID, CREATION_DATETIME, BUSINESS_ID, PLACE_ID, DAY, OPEN_1, CLOSE_1, OPEN_2, CLOSE_2, REMARKS)
          VALUES (${Number(nextOpeningHoursId[0]?.nextId ?? 1)}, NOW(), ${businessId}, ${placeId}, ${hours.day}, ${open1}, ${close1}, ${open2}, ${close2}, ${hours.hours})
        `;
      } catch (err) {
        console.error(`Error saving opening hours ${i + 1}:`, err);
        console.error('Hours data:', hours);
      }
    }

    // Save photos using direct SQL
    for (let i = 0; i < data.photos.length; i++) {
      const photo = data.photos[i];
      try {
        await prisma.$executeRaw`
          INSERT INTO business_google_images (CREATION_DATETIME, BUSINESS_ID, PLACE_ID, IMAGE_URL)
          VALUES (NOW(), ${businessId}, ${placeId}, ${photo.photoUrl})
        `;
      } catch (err) {
        console.error(`Error saving photo ${i + 1}:`, err);
        console.error('Photo data:', photo);
      }
    }
  } catch (error) {
    console.error('Critical error saving business data to database:', error);
    // Don't throw error to prevent API from failing if DB save fails
  }
}
