// components/BusinessCard.tsx

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Globe, Phone } from "lucide-react";
import { generateSlug } from "@/lib/utils/genSlug";
import { BusinessDetail } from "@/types/business.types";
import { SocialLinks } from "@/components/core/SocialLinks";
import StarIcon from "@/components/ui/StarIcon";
import { toExternalUrl } from "@/lib/utils";

export interface BusinessCardProps {
  business: BusinessDetail;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  const {
    BUSINESS_ID,
    BUSINESS_NAME = "Business",
    IMAGE_URL,
    ADDRESS_TOWN,
    DESCRIPTION,
    GOOGLE_RATING,
    PHONE_NUMBER,
    WHATSAPP_NUMBER,
    WEB_ADDRESS,
    FACEBOOK_LINK,
    GOOGLE_PROFILE,
    INSTA_LINK,
  } = business || {};

  if (!BUSINESS_ID) return null;

  const slug = generateSlug(BUSINESS_NAME || "business", BUSINESS_ID);
  const rating = GOOGLE_RATING ? parseFloat(GOOGLE_RATING) : null;


  const socialLinks = {
    facebook: toExternalUrl(FACEBOOK_LINK),
    instagram: toExternalUrl(INSTA_LINK),
    whatsapp: WHATSAPP_NUMBER,
  };

  const hasSocialLinks = Object.values(socialLinks).some(
    (link) => link !== null
  );

  return (
    <div className="group relative bg-background-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden w-full max-w-md h-[460px] flex flex-col">
      {/* Image */}

      <div className="">
        <Link
          href={`/manage-business/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full h-[170px] aspect-video overflow-hidden"
        >
          {IMAGE_URL ? (
            <Image
              src={IMAGE_URL}
              alt={BUSINESS_NAME}
              height={1000}
              width={1000}
              className="object-cover transition-transform duration-500 group-hover:scale-105 aspect-video"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-3xl font-bold text-gray-600 uppercase">
                {BUSINESS_NAME.charAt(0)}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-4">
        {rating !== null && (
          <div className="flex items-center gap-2 self-end">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => {
                const starValue = Math.min(1, Math.max(0, rating - i));
                return <StarIcon key={i} fillLevel={starValue} size={16} />;
              })}
            </div>
            <span className="text-sm font-medium text-accent">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
        <div className="mt-2">
          {/* Title */}
          <Link
            href={`/manage-business/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className="text-lg font-semibold text-primary  line-clamp-2">
              {BUSINESS_NAME}
            </h3>
          </Link>

          {/* Description */}
          {DESCRIPTION && (
            <p className="mt-2 text-sm text-text-main line-clamp-2">
              {DESCRIPTION}
            </p>
          )}

          {/* Address */}
          {ADDRESS_TOWN &&
            (GOOGLE_PROFILE ? (
              <Link href={GOOGLE_PROFILE} target="_blank">
                <p className="mt-6 flex items-center text-sm text-text-main  hover:text-accent transition">
                  <MapPin size={14} className="mr-1.5 text-primary" />
                  <span className="line-clamp-1">{ADDRESS_TOWN}</span>
                </p>
              </Link>
            ) : (
              <div className="mt-6 flex items-center text-sm text-text-main cursor-not-allowed">
                <MapPin size={14} className="mr-1.5 " />
                <span className="line-clamp-1">{ADDRESS_TOWN}</span>
              </div>
            ))}

          {/* Contact Info */}
          <div className="mt-1 space-y-1 text-sm text-text-main">
            {PHONE_NUMBER && (
              <div className="flex items-center">
                <Phone size={14} className="mr-2 text-primary" />
                <a
                  href={`tel:${PHONE_NUMBER}`}
                  className="hover:text-accent transition-colors"
                >
                  {PHONE_NUMBER}
                </a>
              </div>
            )}

            {WEB_ADDRESS && (
              <div className="flex items-center text-text-main">
                <Globe size={14} className="mr-2 text-primary" />
                <a
                  href={toExternalUrl(WEB_ADDRESS) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors line-clamp-1"
                >
                  {WEB_ADDRESS.replace(/^https?:\/\//, "").split("/")[0]}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 flex items-center justify-between">
          {/* Socials */}
          {hasSocialLinks && (
            <div className="flex gap-1 items-center">
              <SocialLinks
                {...socialLinks}
                size="lg"
                variant="default"
                className="mt-2 justify-center drop-shadow-xl "
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(BusinessCard);
