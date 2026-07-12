import { getDeliveryZonesDisplay, getFulfillmentOptions } from "@/lib/fulfillment";
import { prisma } from "@/lib/prisma";
import { generateSlug, parseSlug } from "@/lib/utils/genSlug";
import { getBusinessById } from "@/services/BusinessProfilePageService";
import type { BusinessGoogleData } from "@/types/google-business";
import BusinessDeferredSections from "./components/BusinessDeferredSections";
import BusinessImage from "@/components/BusinessSlug/BusinessImage";
import BusinessInfoSection, { FulfillmentOptions } from "./components/BusinessInfoSection";
import ResturantProfilePageHeader from "@/components/BusinessSlug/ResturantProfilePageHeader";

async function getBusinessFulfillmentOptions(businessId: number): Promise<FulfillmentOptions | null> {
  const settings = await prisma.business_settings.findUnique({ where: { BUSINESS_ID: businessId } });

  return {
    ...getFulfillmentOptions(settings),
    deliveryZones: getDeliveryZonesDisplay(settings),
  };
}

async function getGoogleBusinessData(businessId: number): Promise<BusinessGoogleData | null> {
  try {
    const business = await prisma.business_detail_view_all.findFirst({
      where: { BUSINESS_ID: businessId },
      select: { BUSINESS_NAME: true, PLACE_ID: true },
    });
    if (!business?.PLACE_ID) return null;

    const [reviews, openingHours, photos] = await Promise.all([
      prisma.business_google_review_view.findMany({
        where: { BUSINESS_ID: businessId, PLACE_ID: business.PLACE_ID },
      }),
      prisma.business_opening_hours_view.findMany({
        where: { BUSINESS_ID: businessId, PLACE_ID: business.PLACE_ID },
      }),
      prisma.business_google_images_view.findMany({
        where: { BUSINESS_ID: businessId, PLACE_ID: business.PLACE_ID },
      }),
    ]);

    return {
      name: business.BUSINESS_NAME || "",
      rating: 0,
      totalReviews: reviews.length,
      reviews: reviews.map((review) => ({
        author_name: review.AUTHOR || "",
        rating: Number(review.RATING || 0),
        text: review.REVIEW || "",
        relative_time_description: review.RELATIVE_TIME || "",
        profile_photo_url: review.PROFILE_PHOTO_URL || "",
      })),
      openingHours: openingHours.map((hours) => ({
        day: hours.DAY || "",
        hours: `${hours.OPEN_1 || ""} - ${hours.CLOSE_1 || ""}${
          hours.OPEN_2 ? `, ${hours.OPEN_2} - ${hours.CLOSE_2}` : ""
        }`,
      })),
      photos: photos.map((photo) => ({
        photoUrl: photo.IMAGE_URL || "",
        width: photo.WIDTH ?? 800,
        height: photo.HEIGHT ?? 600,
      })),
      cached: true,
    };
  } catch (error) {
    console.error("Error fetching Google place details:", error);
    return null;
  }
}

export default async function BusinessDetailPage({ params }: { params: { slug: string } }) {
  const parsedId = parseSlug(params.slug);
  const businessId = Number(parsedId.id);

  const [business, fulfillmentOptions, googleBusinessData] = await Promise.all([
    getBusinessById(businessId),
    getBusinessFulfillmentOptions(businessId),
    getGoogleBusinessData(businessId),
  ]);

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-500">
        Business not found
      </div>
    );
  }

  const genSlug = generateSlug(business.BUSINESS_NAME || "business", business.BUSINESS_ID || 0);

  return (
    <div>
      <ResturantProfilePageHeader
        BUSINESS_NAME={business.BUSINESS_NAME || ""}
        CITY_NAME={business.CITY_NAME || ""}
        HALAL={business.HALAL}
        VEGAN={business.VEGAN}
        VEGETARIAN={business.VEGETARIAN}
      />

      <BusinessImage
        imageUrl={business.IMAGE_URL || ""}
        businessName={business.BUSINESS_NAME || ""}
        className="mb-6"
      />

      <BusinessInfoSection business={business} genSlug={genSlug} fulfillmentOptions={fulfillmentOptions} />

      <BusinessDeferredSections business={business} googleBusinessData={googleBusinessData} />
    </div>
  );
}
