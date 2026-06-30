"use client";

import { SocialLinks } from "@/components/core/SocialLinks";
import { MapPin, Phone, Globe } from "lucide-react";
import Link from "next/link";
import FoodTypeBadges from "@/components/core/FoodTypeBadges";
import type { business_detail_view_all } from "@prisma/client";
import Separator from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { formatCHF } from "@/lib/orderStatus";

type DeliveryZone = {
  zoneName: string;
  postalCodes: string[];
  minimumOrderPrice: number;
  deliveryPrice: number;
  freeDeliveryAbove: number;
  deliveryInformation?: string;
};

type FulfillmentOptions = {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  pickupInstructions?: string;
  deliveryZones?: DeliveryZone[];
};

function StatusBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
      {label} {enabled ? "available" : "not available"}
    </span>
  );
}

function FulfillmentInfoBox({ businessId }: { businessId: number }) {
  const [options, setOptions] = useState<FulfillmentOptions | null>(null);

  useEffect(() => {
    fetch(`/api/businesses/${businessId}/fulfillment-options`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setOptions)
      .catch(() => setOptions(null));
  }, [businessId]);

  if (!options) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Ordering options</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge enabled={options.pickupEnabled} label="Pickup" />
          <StatusBadge enabled={options.deliveryEnabled} label="Delivery" />
        </div>
      </div>

      {!options.pickupEnabled && !options.deliveryEnabled ? (
        <p className="text-sm text-gray-700">Online ordering is currently unavailable.</p>
      ) : (
        <div className="space-y-4 text-sm text-gray-700">
          <p>{options.pickupEnabled ? "Pickup is available." : "Pickup is not available."}</p>
          {options.deliveryEnabled ? (
            <div className="space-y-3">
              <p>Delivery is available in these zipcode areas:</p>
              {(options.deliveryZones || []).map((zone) => (
                <div key={zone.zoneName} className="rounded-md border border-gray-200 bg-white p-3">
                  {/* <p className="font-medium text-gray-900">{zone.zoneName}</p> */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {zone.postalCodes.map((code) => (
                      <span key={code} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                        {code}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-gray-600">
                    Delivery {formatCHF(zone.deliveryPrice)}
                    {zone.freeDeliveryAbove > 0 ? ` · Free above ${formatCHF(zone.freeDeliveryAbove)}` : ""}
                    {zone.minimumOrderPrice > 0 ? ` · Minimum ${formatCHF(zone.minimumOrderPrice)}` : ""}
                  </p>
                  {zone.deliveryInformation && <p className="mt-1 text-gray-500">{zone.deliveryInformation}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p>Delivery is not available right now.</p>
          )}
        </div>
      )}
    </div>
  );
}

const BusinessInfoSection: React.FC<{ business: business_detail_view_all, genSlug: string }> = ({
  business,
  genSlug,
}) => {

  return (
    <div className="py-8 px-4 lg:px-0 space-y-8 lg:space-y-4">
      {/* Description Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="sub-heading mb-8">Description</h2>

        <FoodTypeBadges
          HALAL={business.HALAL || 0}
          VEGAN={business.VEGAN || 0}
          VEGETARIAN={business.VEGETARIAN || 0}
        />
      </div>

      <p className="sub-heading-description mt-3 text-start text-text-main max-w-none">
        {business.DESCRIPTION}
      </p>
      <Separator />
      {/* Address & Contact */}
      <div className="space-y-4">
        <h2 className="sub-heading my-8">Address & Contact</h2>
        <div className="flex items-start gap-4">
          <MapPin className="text-primary mt-1 h-5 w-5" />
          <div className="space-y-1">
            <p className="font-medium text-gray-900">
              {business.ADDRESS_STREET}
            </p>
            <p className="text-gray-600">
              {/* {business.ADDRESS_TOWN && `${business.ADDRESS_TOWN}, `} */}
              {business.CITY_NAME && `${business.CITY_NAME}, `}
              {business.ADDRESS_ZIP && `${business.ADDRESS_ZIP}, `}
              {business.ADDRESS_COUNTRY}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Phone className="text-primary mt-1 h-5 w-5" />
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{business.PHONE_NUMBER}</p>
            {business.WEB_ADDRESS && (
              <a
                href={business.WEB_ADDRESS}
                className="text-primary flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {new URL(business.WEB_ADDRESS).hostname}
              </a>
            )}
          </div>
        </div>
      </div>
      <Separator />
      {/* Social & Reserve */}
      <div className="flex flex-col md:flex-row gap-10 justify-between pt-8">
        <div className="flex items-center gap-2">
          {business.EMAIL_ADDRESS ? (
            <Link href={`/business/${genSlug}/reservation`} target="_blank">
              <button className="btn-primary">Reserve Table</button>
            </Link>
          ) : (
            <button
              className="btn-primary opacity-50 cursor-not-allowed"
              disabled
            >
              Reserve Table
            </button>
          )}
          {business.HAVING_ACTIVE_MENU_CARD ? (
            <Link href={`/business/${genSlug}/menu`} target="_blank">
              <button className="btn-primary">See Menu</button>
            </Link>
          ) : (
            <button
              className="btn-primary opacity-50 cursor-not-allowed"
              disabled
            >
              Menu info not available
            </button>
          )}
        </div>

        <SocialLinks
          facebook={business.FACEBOOK_LINK}
          instagram={business.INSTA_LINK}
          whatsapp={business.WHATSAPP_NUMBER}
          size="xl"
          className="gap-2 [&>a]:text-primary"
        />
      </div>
      <FulfillmentInfoBox businessId={business.BUSINESS_ID} />
    </div>
  );
};

export default BusinessInfoSection;
