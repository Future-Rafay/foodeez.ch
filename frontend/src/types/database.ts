import type { business_detail_view_all } from '@/lib/prisma';

// Extended business type that can handle both field naming conventions
export interface BusinessData extends business_detail_view_all {
  // Add any additional properties that might exist in raw SQL queries
  [key: string]: any;
} 