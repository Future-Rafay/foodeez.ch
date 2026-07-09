"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { business_detail_view_all } from "@/lib/prisma";
import Separator from "@/components/ui/separator";
import type { BusinessGoogleData } from "@/types/google-business";

const GooglePhotoGallery = dynamic(() => import("./PhotoGallary"), { ssr: false, loading: () => null });
const OpeningHours = dynamic(() => import("./OpeningHoursSection"), { ssr: false, loading: () => null });
const FoodeezReviews = dynamic(() => import("./FoodeezReviews"), { ssr: false, loading: () => null });
const GoogleReviews = dynamic(() => import("./GoogleReviews"), { ssr: false, loading: () => null });
const MapCard = dynamic(() => import("./MapSectionBusinesProfile"), { ssr: false, loading: () => null });

function LazyRender({
  children,
  minHeight,
  rootMargin = "0px",
}: {
  children: React.ReactNode;
  minHeight: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin, shouldLoad]);

  return (
    <div ref={ref} style={{ minHeight: shouldLoad ? undefined : minHeight }}>
      {shouldLoad ? children : null}
    </div>
  );
}

export default function BusinessDeferredSections({
  business,
  genSlug,
  googleBusinessData,
}: {
  business: business_detail_view_all;
  genSlug: string;
  googleBusinessData: BusinessGoogleData | null;
}) {
  return (
    <>
      <LazyRender minHeight={360} rootMargin="300px">
        <GooglePhotoGallery
          photos={googleBusinessData?.photos || []}
          businessName={googleBusinessData?.name || business.BUSINESS_NAME || ""}
        />
      </LazyRender>

      <LazyRender minHeight={360} rootMargin="300px">
        <OpeningHours openingHours={googleBusinessData?.openingHours || []} />
      </LazyRender>

      <LazyRender minHeight={460} rootMargin="300px">
        <FoodeezReviews genSlug={genSlug} business={business} />
      </LazyRender>

      <LazyRender minHeight={460} rootMargin="300px">
        <GoogleReviews reviews={googleBusinessData?.reviews || []} GOOGLE_PROFILE={business.GOOGLE_PROFILE || ""} />
      </LazyRender>

      <Separator className="mb-0" />
      <LazyRender minHeight={400} rootMargin="300px">
        <div className="relative">
          <MapCard placeId={business.PLACE_ID || ""} />
        </div>
      </LazyRender>
    </>
  );
}
