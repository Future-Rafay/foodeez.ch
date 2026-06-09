'use server';

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma"
import { BusinessDetail, BusinessResult } from "@/types/business.types";

export async function getCities() {
  try {
    const cities = await prisma.business_detail_view_all.findMany({
      select: {
        CITY_NAME: true,
      },
      distinct: ['CITY_NAME'],
      orderBy: {
        CITY_NAME: 'asc'
      }
    });
    return cities;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

interface GetBusinessesParams {
  city?: string;
  zipCode?: string;
  limit?: number;
}

export async function getBusinessesByLocation({
  city,
  zipCode,
  limit = 12
}: GetBusinessesParams): Promise<BusinessResult> {
  try {
    const trimmedCity = city?.trim();
    const trimmedZip = zipCode?.trim();

    let whereClause: Prisma.business_detail_view_allWhereInput | undefined;

    if (trimmedZip) {
      // Prioritize zip code if provided
      const numericZip = Number(trimmedZip);
      if (!isNaN(numericZip)) {
        whereClause = { ADDRESS_ZIP: { equals: numericZip } };
      }
    } else if (trimmedCity) {
      // Fallback to city if no zip code is provided
      whereClause = { CITY_NAME: { equals: trimmedCity } };
    }

    if (!whereClause) {
      console.log("No valid search criteria provided.");
      return []; // No valid search criteria
    }

    const result = await prisma.business_detail_view_all.findMany({
      where: whereClause, // Use the determined where clause
      take: Math.min(limit, 50), // enforce upper bound
      orderBy: { BUSINESS_NAME: 'asc' },
    });

    return result as BusinessDetail[];
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[Prisma Error]', error.code, error.message);
    } else {
      console.error('[Unexpected Error]', (error as Error).message);
    }
    return [];
  }
}

export async function getAdsLinkData() {
  try {
    const adsLinkData = await prisma.adlink_view.findMany();
    return adsLinkData;
  } catch (error) {
    console.error('Error fetching ads link data:', error);
    return [];
  }
}

export async function getBusinessCategories() {
  try {
    const categories = await prisma.business_category_view.findMany();
    return categories;
  } catch (error) {
    console.error('Error fetching business categories:', error);
    return [];
  }
}

export async function getUpcomingEvents() {
  try {
    const events = await prisma.top_events_view.findMany({
      where: {
        DATE_1: {
          gte: new Date(),
        },
      },
      orderBy: {
        DATE_1: 'asc',
      },
      take: 4,

    });
    return events;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

export async function getBusinessByFoodtypeCategoryLocation(params: {
  foodType: string;
  categoryId?: number;
  city?: string;
  zipCode?: string;
  businessName?: string;
  limit?: number;
  skip?: number;
}) {
  const { foodType, categoryId, city, zipCode, businessName, limit = 12, skip = 0 } = params;
  const normalizedType = foodType.toLowerCase();

  try {
    const whereClause: Prisma.business_detail_view_allWhereInput = {};

    // Combine filters instead of overwriting
    if (zipCode) {
      const numericZip = Number(zipCode);
      if (!isNaN(numericZip)) {
        whereClause.ADDRESS_ZIP = { equals: numericZip };
      }
    }
    if (city && !zipCode) { // Only use city if zipCode is not present
      whereClause.CITY_NAME = { equals: city };
    }
    if (businessName) {
      whereClause.BUSINESS_NAME = { contains: businessName };
    }

    if (categoryId !== undefined) {
      const businessCategoryLinks = await prisma.business_2_business_category_view.findMany({
        where: {
          BUSINESS_CATEGORY_ID: categoryId,
          STATUS: 1
        },
        select: {
          BUSINESS_ID: true
        }
      });

      const businessIdsInCategory = businessCategoryLinks
        .map(link => Number(link.BUSINESS_ID))
        .filter((id): id is number => !isNaN(id) && id !== null && id !== undefined);

      if (businessIdsInCategory.length === 0) {
        return { businesses: [], totalCount: 0 };
      }

      whereClause.BUSINESS_ID = { in: businessIdsInCategory };
    }

    let businesses: BusinessDetail[] = [];
    let totalCount = 0;

    const getData = async (model: any) => {
      const [data, count] = await Promise.all([
        model.findMany({
          where: whereClause,
          take: limit,
          skip,
          orderBy: { BUSINESS_NAME: 'asc' }
        }),
        model.count({
          where: whereClause
        })
      ]);
      return { data, count };
    };

    try {
      if (normalizedType === 'halal') {
        ({ data: businesses, count: totalCount } = await getData(prisma.business_detail_view_halal));
      } else if (normalizedType === 'vegan') {
        ({ data: businesses, count: totalCount } = await getData(prisma.business_detail_view_vegan));
      } else if (normalizedType === 'vegetarian') {
        ({ data: businesses, count: totalCount } = await getData(prisma.business_detail_view_vegetarian));
      } else {
        ({ data: businesses, count: totalCount } = await getData(prisma.business_detail_view_all));
      }
    } catch (dbError) {
      console.error("dbError:", dbError);
      ({ data: businesses, count: totalCount } = await getData(prisma.business_detail_view_all));
    }

    return {
      businesses: businesses,
      totalCount
    };
  } catch (error) {
    console.error(`[ERROR] Error in getBusinessByFoodtypeCategoryLocation:`, error);
    return {
      businesses: [],
      totalCount: 0
    };
  }
}

export async function getFoodeezReview() {
  try {
    const reviews = await prisma.foodeez_review_view.findMany({
      where: {
        APPROVED: 1,
      },
      orderBy: {
        CREATION_DATETIME: 'desc',
      },
    });
    return reviews;
  } catch (error) {
    console.error('Error fetching Foodeez reviews:', error);
    return [];
  }
}


/**
 * Get top rated restaurants near user's location, or fallback if none found
 */
export async function getTopRatedRestaurantsNearYou(
  latitude: number,
  longitude: number,
  limit: number = 4,
  radius: number = 1
): Promise<BusinessDetail[]> {
  try {
    const restaurants = await prisma.$queryRaw<BusinessDetail[]>`
      SELECT * FROM (
        SELECT 
          b.*, 
          ROUND((calculate_distance_km(${latitude}, ${longitude}, b.latitude, b.longitude)) * 1000, 2) AS distance_m,
          calculate_distance_km(${latitude}, ${longitude}, b.latitude, b.longitude) AS distance_km
        FROM business_detail_view_all b
        WHERE 
          calculate_distance_km(${latitude}, ${longitude}, b.latitude, b.longitude) <= ${radius}
          AND b.APPROVED = 1
          AND b.STATUS = 1
          AND b.GOOGLE_RATING IS NOT NULL
          AND b.GOOGLE_RATING != ''
          AND b.GOOGLE_RATING != '0'

        UNION

        SELECT 
          b.*, 
          ROUND((calculate_distance_km(47.3769, 8.5417, b.latitude, b.longitude)) * 1000, 2) AS distance_m,
          calculate_distance_km(47.3769, 8.5417, b.latitude, b.longitude) AS distance_km
        FROM business_detail_view_all b
        WHERE 
          calculate_distance_km(47.3769, 8.5417, b.latitude, b.longitude) <= ${radius}
          AND b.APPROVED = 1
          AND b.STATUS = 1
          AND b.GOOGLE_RATING IS NOT NULL
          AND b.GOOGLE_RATING != ''
          AND b.GOOGLE_RATING != '0'
      ) AS combined_results
      ORDER BY GOOGLE_RATING DESC, distance_km ASC
      LIMIT ${limit};
    `;

    return restaurants;
  } catch (error) {
    console.error('Error fetching top rated restaurants near you:', error);
    return [];
  }
}
