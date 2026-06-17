import {
  GooglePhoto,
  GoogleReview,
  OpeningHourDay,
  BusinessGoogleData,
  GooglePlacesApiResponse,
} from '@/types/google-business';

export class UnifiedGoogleService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
  private static readonly FIELDS = 'name,rating,user_ratings_total,reviews,url,opening_hours,photos,geometry';

  /**
   * Fetch Google Place Details from Google Places API
   */
  static async fetchGooglePlaceDetails(placeId: string): Promise<BusinessGoogleData> {
    if (!this.API_KEY) {
      throw new Error("Google API key is not configured");
    }

    if (!placeId) {
      throw new Error("Place ID is required");
    }

    const url = `${this.BASE_URL}?place_id=${placeId}&fields=${this.FIELDS}&key=${this.API_KEY}`;

    try {
      const response = await fetch(url);
      const data: GooglePlacesApiResponse = await response.json();

      if (data.status !== "OK") {
        throw new Error(data.error_message || "Failed to fetch place details");
      }

      return this.transformGoogleApiResponse(data);
    } catch (error) {
      console.error("Error fetching Google place details:", error);
      throw error;
    }
  }

  /**
   * Transform Google API response to our unified format
   */
  private static transformGoogleApiResponse(data: GooglePlacesApiResponse): BusinessGoogleData {
    const result = data.result;

    // Transform reviews
    const reviews: GoogleReview[] = (result.reviews || [])
      .slice(0, 5)
      .map((review: any) => ({
        author_name: review.author_name,
        rating: review.rating,
        text: review.text,
        relative_time_description: review.relative_time_description,
        profile_photo_url: review.profile_photo_url,
      }));

    // Transform photos
    const photos: GooglePhoto[] = (result.photos || []).map((photo: any) => ({
      photoUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.API_KEY}`,
      width: photo.width,
      height: photo.height,
    }));

    // Transform opening hours
    let openingHours: OpeningHourDay[] = [];
    if (result.opening_hours && result.opening_hours.weekday_text) {
      openingHours = result.opening_hours.weekday_text.map((text: string) => {
        const [day, ...hoursArr] = text.split(": ");
        return {
          day,
          hours: hoursArr.join(": ") || "Closed",
        };
      });
    }

    return {
      name: result.name,
      rating: result.rating || 0,
      totalReviews: result.user_ratings_total || 0,
      reviews,
      photos,
      openingHours,
      geometry: result.geometry,
      cached: false,
      lastUpdated: new Date()
    };
  }

  /**
   * Generate photo URL for Google Places photo reference
   */
  static generatePhotoUrl(photoReference: string, maxWidth: number = 800): string {
    if (!this.API_KEY) {
      throw new Error("Google API key is not configured");
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.API_KEY}`;
  }
}
