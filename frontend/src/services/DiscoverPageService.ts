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


