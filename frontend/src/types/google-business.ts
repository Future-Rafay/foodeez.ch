import { 
  business_google_review_view, 
  business_opening_hours_view, 
  business_google_images_view 
} from '@prisma/client';

// Google API Response Types
export interface GooglePhoto {
  photoUrl: string;
  width: number;
  height: number;
}

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string;
}

export interface OpeningHourDay {
  day: string;
  hours: string;
}

export interface GoogleGeometry {
  location: {
    lat: number;
    lng: number;
  };
}

// Unified Business Google Data Type
export interface BusinessGoogleData {
  name: string;
  rating: number;
  totalReviews: number;
  reviews: GoogleReview[];
  photos: GooglePhoto[];
  openingHours: OpeningHourDay[];
  geometry?: GoogleGeometry;
  cached: boolean; // Indicates if data came from cache
  lastUpdated?: Date;
}

// Database View Types (from Prisma)
export type BusinessGoogleReviewView = business_google_review_view;
export type BusinessOpeningHoursView = business_opening_hours_view;
export type BusinessGoogleImagesView = business_google_images_view;

// API Response Types
export interface BusinessGoogleDataResponse extends BusinessGoogleData {
  success: boolean;
  error?: string;
}

export interface CacheCheckResponse {
  hasCachedData: boolean;
  reviewsCount: number;
  openingHoursCount: number;
  photosCount: number;
  lastUpdated: string | null;
}

// Google Places API Raw Response Types (for internal use)
export interface GooglePlacesApiResponse {
  status: string;
  result: {
    name: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: any[];
    photos?: any[];
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
    geometry?: GoogleGeometry;
  };
  error_message?: string;
}
