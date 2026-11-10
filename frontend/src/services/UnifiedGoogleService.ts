import {
  GooglePhoto,
  GoogleReview,
  OpeningHourDay,
  BusinessGoogleData,
  GooglePlacesApiResponse,
} from '@/types/google-business';

export class UnifiedGoogleService {
  // Server-side web-service key. The public Maps key is only a fallback until GOOGLE_PLACES_API_KEY is set.
  private static readonly API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
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

      return await this.transformGoogleApiResponse(data);
    } catch (error) {
      console.error("Error fetching Google place details:", error);
      throw error;
    }
  }

  /**
   * Transform Google API response to our unified format
   */
  private static async transformGoogleApiResponse(data: GooglePlacesApiResponse): Promise<BusinessGoogleData> {
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

    // Photos are saved as the image URL Google redirects to, so the API key never reaches the database or the page.
    const photos: GooglePhoto[] = (
      await Promise.all(
        (result.photos || []).map(async (photo: any) => {
          const photoUrl = await this.resolvePhotoUrl(photo.photo_reference);
          return photoUrl ? { photoUrl, width: photo.width, height: photo.height } : null;
        })
      )
    ).filter((photo): photo is GooglePhoto => photo !== null);

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

  private static async resolvePhotoUrl(photoReference: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${encodeURIComponent(photoReference)}&key=${this.API_KEY}`,
        { redirect: "manual" }
      );
      const location = response.headers.get("location");
      return location && !location.includes("key=") ? location : null;
    } catch (error) {
      console.error("Google photo lookup failed:", error);
      return null;
    }
  }
}
