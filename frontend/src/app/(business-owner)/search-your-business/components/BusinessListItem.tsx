import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Calendar, Phone } from "lucide-react";
import { generateSlug } from "@/lib/utils/genSlug";
import { SocialLinks } from "@/components/core/SocialLinks";
import { BusinessDetail } from "@/types/business.types";
import { toExternalUrl } from "@/lib/utils";

interface Props {
  business: BusinessDetail;
}

export default function BusinessListItem({ business }: Props) {
  const {
    BUSINESS_ID,
    BUSINESS_NAME,
    IMAGE_URL,
    ADDRESS_TOWN,
    GOOGLE_RATING,
    DESCRIPTION,
    PHONE_NUMBER,
    WHATSAPP_NUMBER,
    WEB_ADDRESS,
    FACEBOOK_LINK,
    INSTA_LINK,
  } = business || {};

  const slug = generateSlug(BUSINESS_NAME || "business", BUSINESS_ID);
  const rating = GOOGLE_RATING ? parseFloat(GOOGLE_RATING) : null;


  const socialLinks = {
    facebook: toExternalUrl(FACEBOOK_LINK),
    instagram: toExternalUrl(INSTA_LINK),
    whatsapp: WHATSAPP_NUMBER,
    website: toExternalUrl(WEB_ADDRESS),
  };


  const hasSocialLinks = Object.values(socialLinks).some(
    (link) => link !== null && link !== undefined && link !== ''
  );

  return (
    <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Image Section */}
      <Link
        href={`/business/${slug}`}
        className="relative min-w-[140px] h-[140px] bg-gray-100"
      >
        {IMAGE_URL ? (
          <Image
            src={IMAGE_URL}
            alt={BUSINESS_NAME || "Business Image"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-2xl font-bold text-gray-400 uppercase">
              {BUSINESS_NAME?.charAt(0)}
            </span>
          </div>
        )}
      </Link>

      {/* Content Section */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <Link href={`/business/${slug}`}>
              <h3 className="text-lg font-semibold text-primary">
                {BUSINESS_NAME}
              </h3>
            </Link>
            {rating && (
              <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-full">
                <Star size={14} className="text-yellow-500 fill-yellow-400" />
                <span className="ml-1 text-xs text-yellow-600">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
          {ADDRESS_TOWN && (
            <p className="mt-1 flex items-center text-sm text-gray-500">
              <MapPin size={14} className="mr-1.5 text-primary" />
              {ADDRESS_TOWN}
            </p>
          )}
          {PHONE_NUMBER && (
            <p className="mt-1 flex items-center text-sm text-gray-500">
              <Phone size={14} className="mr-1.5 text-primary" />
              {PHONE_NUMBER}
            </p>
          )}
          </div>

          {DESCRIPTION && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {DESCRIPTION}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          {hasSocialLinks && (
            <SocialLinks
              {...socialLinks}
              size="sm"
              variant="default"
            />
          )}
          <Link
            href={`/business/${slug}/reservation`}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            <Calendar size={14} />
            Reserve
          </Link>
        </div>
      </div>
    </div>
  );
}
