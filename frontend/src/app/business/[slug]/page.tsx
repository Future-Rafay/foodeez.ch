"use client";

import { useParams } from "next/navigation";
import { generateSlug, parseSlug } from "@/lib/utils/genSlug";
import BusinessImage from "./components/BusinessImage";
import React, { useState, useEffect } from "react";
import MapCard from "./components/MapSectionBusinesProfile";
import GooglePhotoGallery from "./components/PhotoGallary";
import GoogleReviews from "./components/GoogleReviews";
import OpeningHours from "./components/OpeningHoursSection";
import BusinessInfoSection from "./components/BusinessInfoSection";
import BusinessProfilePageLoadingSkeleton from "./components/BusinessProfilePageLoadingSkeleton";
import ResturantProfilePageHeader from "./components/ResturantProfilePageHeader";
import FoodeezReviews from "./components/FoodeezReviews";
import { getBusinessById } from "@/services/BusinessProfilePageService";
import { business_detail_view_all } from "@prisma/client";
import Separator from "@/components/ui/separator";
import { BusinessGoogleData, BusinessGoogleDataResponse } from "@/types/google-business";

const BusinessDetailPage = () => {
  const slug = useParams();
  const parsedId = parseSlug(slug?.slug as unknown as string);

  const [business, setBusiness] = useState<business_detail_view_all | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleBusinessData, setGoogleBusinessData] = useState<BusinessGoogleData>();
  const [googleDataLoading, setGoogleDataLoading] = useState(false);

  const genSlug = generateSlug(
    business?.BUSINESS_NAME || "business",
    business?.BUSINESS_ID || 0
  );

  useEffect(() => {
    async function fetchBusiness() {
      const data = await getBusinessById(Number(parsedId.id));

      setBusiness(data as business_detail_view_all);
      setLoading(false);
    }

    fetchBusiness();
  }, [parsedId.id]);

  useEffect(() => {
    let isMounted = true;

    if (!business?.BUSINESS_ID) return;

    const fetchGoogleData = async () => {
      setGoogleDataLoading(true);


      try {
        const response = await fetch(`/api/business-google-data/${business.BUSINESS_ID}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch Google data: ${response.statusText}`);
        }

        const data: BusinessGoogleDataResponse = await response.json();
        console.log(data.cached ? "Loaded Google data from cache" : "Fetched fresh Google data from API");

        if (!data.success) {
          throw new Error(data.error || 'Unknown error occurred');
        }

        if (isMounted) {
          setGoogleBusinessData(data);
        }
      } catch (error) {
        console.error("Error fetching Google place details:", error);
      } finally {
        if (isMounted) {
          setGoogleDataLoading(false);
        }
      }
    };

    fetchGoogleData();

    return () => {
      isMounted = false;
    };
  }, [business?.BUSINESS_ID]);

  if (loading) {
    return <BusinessProfilePageLoadingSkeleton />;
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-500">
        Business not found
      </div>
    );
  }

  return (
    <>

      <div className="">
        <ResturantProfilePageHeader
          BUSINESS_NAME={business.BUSINESS_NAME || ""}
          CITY_NAME={business.CITY_NAME || ""}
          HALAL={business.HALAL}
          VEGAN={business.VEGAN}
          VEGETARIAN={business.VEGETARIAN}
        />

        {/* Main Content */}
        <div className="">
          {/* Restaurant Profile Picture */}
          <BusinessImage
            imageUrl={business.IMAGE_URL || ""}
            businessName={business.BUSINESS_NAME || ""}
            className="mb-6"
          />

          {/* Info Section */}
          <BusinessInfoSection business={business} genSlug={genSlug} />



          {googleDataLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-text-main">Loading Google photos...</div>
            </div>
          ) : (


            <GooglePhotoGallery
              photos={googleBusinessData?.photos || []}
              businessName={googleBusinessData?.name || business.BUSINESS_NAME || ''}
            />

          )}

          {/* Opening Hours */}
          {googleDataLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading opening hours...</div>
            </div>
          ) : (

            <OpeningHours
              openingHours={googleBusinessData?.openingHours || []}
              isOpenNow={googleBusinessData?.isOpenNow || false}
            />

          )}

          {/* Reviews */}
          <div className="">
            <FoodeezReviews genSlug={genSlug} business={business} />
          </div>
          <div className="">
            {googleDataLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading Google reviews...</div>
              </div>
            ) : (
              <GoogleReviews
                reviews={googleBusinessData?.reviews || []}
                GOOGLE_PROFILE={business.GOOGLE_PROFILE || ""}
              />
            )}
          </div>

          <Separator className="mb-0" />
          <div className="relative">
            <MapCard placeId={business.PLACE_ID || ''} />
          </div>

        </div>
      </div>
    </>
  );
};

export default BusinessDetailPage;
