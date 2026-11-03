'use server';

import { BusinessDetail } from "@/types/business.types";
import { prisma } from "../lib/prisma"
import { buildBusinessSearchQuery, type BusinessSearchFilters } from "@/lib/business-search";

export async function searchBusinesses(
  filters: BusinessSearchFilters
): Promise<{ businesses: BusinessDetail[]; total: number }> {
  try {
    const { sql, params, countSql, countParams } = buildBusinessSearchQuery(filters ?? {});

    // Execute queries
    const [results, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(sql, ...params),
      prisma.$queryRawUnsafe(countSql, ...countParams)
    ]);

    const total = Array.isArray(countResult) && countResult.length > 0
      ? Number(countResult[0].total)
      : 0;

    return {
      businesses: results as BusinessDetail[],
      total
    };
  } catch (error) {
    console.error("Error searching businesses:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return { businesses: [], total: 0 };
  }
}


/**
 * Get food categories for filters
 */
export async function getFoodCategories(): Promise<{ id: number; name: string; count: number }[]> {
  try {
    const categories = await prisma.$queryRaw`
      SELECT 
        bc.BUSINESS_CATEGORY_ID as id,
        bc.CATEGORY_NAME as name,
        COUNT(b2bc.BUSINESS_ID) as count
      FROM 
        business_category bc
      LEFT JOIN 
        business_2_business_category b2bc ON bc.BUSINESS_CATEGORY_ID = b2bc.BUSINESS_CATEGORY_ID
      GROUP BY 
        bc.BUSINESS_CATEGORY_ID
      HAVING 
        count > 0
      ORDER BY 
        count DESC
    `;

    return categories as { id: number; name: string; count: number }[];
  } catch (error) {
    console.error("Error fetching food categories:", error);
    return [];
  }
}

/**
 * Get dietary preferences
 */
export async function getDietaryPreferences(): Promise<{ id: number; name: string; count: number }[]> {
  try {
    const preferences = await prisma.$queryRaw`
      SELECT 
        ft.FOOD_TYPE_ID as id,
        ft.FOOD_TYPE_NAME as name,
        COUNT(b2ft.BUSINESS_ID) as count
      FROM 
        food_type ft
      LEFT JOIN 
        business_2_food_type b2ft ON ft.FOOD_TYPE_ID = b2ft.FOOD_TYPE_ID
      GROUP BY 
        ft.FOOD_TYPE_ID
      HAVING 
        count > 0
      ORDER BY 
        count DESC
    `;

    return preferences as { id: number; name: string; count: number }[];
  } catch (error) {
    console.error("Error fetching dietary preferences:", error);
    return [];
  }
}
