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
import ResturantProfilePageHeader from "../../../business/[slug]/components/ResturantProfilePageHeader";
import FoodeezReviews from "../../../business/[slug]/components/FoodeezReviews";
import { getBusinessById } from "@/services/BusinessProfilePageService";
import { business_detail_view_all } from "@prisma/client";
import Separator from "@/components/ui/separator";
import { BusinessGoogleData, BusinessGoogleDataResponse } from "@/types/google-business";
import SEO from "@/components/seo/SEO";
import { buildBusinessBreadcrumbs, buildLocalBusinessSchema } from "@/lib/seo";

const ManageBusinessDetailPage = () => {
  const slug = useParams();
  const parsedId = parseSlug(slug?.slug as unknown as string);

  const [business, setBusiness] = useState<business_detail_view_all | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleBusinessData, setGoogleBusinessData] = useState<BusinessGoogleData>();
  const [googleDataLoading, setGoogleDataLoading] = useState(false);
  const [googleDataError, setGoogleDataError] = useState<string | null>(null);

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
      setGoogleDataError(null);

      try {
        const response = await fetch(`/api/business-google-data/${business.BUSINESS_ID}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch Google data: ${response.statusText}`);
        }

        const data: BusinessGoogleDataResponse = await response.json();
        console.log(data);

        if (!data.success) {
          throw new Error(data.error || 'Unknown error occurred');
        }

        if (isMounted) {
          setGoogleBusinessData(data);
        }
      } catch (error) {
        console.error("Error fetching Google place details:", error);
        if (isMounted) {
          setGoogleDataError(error instanceof Error ? error.message : 'Failed to load Google data');
        }
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
      {/* SEO */}
      <SEO
        title={`Manage ${business.BUSINESS_NAME || "Business"}`}
        description={`Manage ${business.BUSINESS_NAME || "this restaurant"} on Foodeez. View photos, hours, reviews and more.`}
        url={`https://foodeez.ch/manage-business/${business.BUSINESS_ID}`}
        canonical={`https://foodeez.ch/manage-business/${business.BUSINESS_ID}`}
        type="website"
        noindex
        nofollow
        breadcrumbs={buildBusinessBreadcrumbs('https://foodeez.ch', [
          { name: 'Manage Business', url: 'https://foodeez.ch/manage-business' },
          { name: business.BUSINESS_NAME || 'Business', url: `https://foodeez.ch/manage-business/${generateSlug(business.BUSINESS_NAME || 'business', business.BUSINESS_ID || 0)}` },
        ])}
        structuredData={buildLocalBusinessSchema(business, (googleBusinessData as unknown as BusinessGoogleData) || undefined, `https://foodeez.ch/manage-business/${business.BUSINESS_ID}`)}
      />
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
          <BusinessInfoSection business={business} />

          <Separator />

          {googleDataLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading Google photos...</div>
            </div>
          ) : googleDataError ? (
            <div className="text-red-500 text-center py-4">
              Error loading photos: {googleDataError}
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
            />
          )}

          <Separator />

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
              />
            )}
          </div>

          <Separator />

          <MapCard placeId={business.PLACE_ID || ''} />

        </div>
      </div>
    </>
  );
};

export default ManageBusinessDetailPage;
