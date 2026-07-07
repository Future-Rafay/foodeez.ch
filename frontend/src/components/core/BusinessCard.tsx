// components/BusinessCard.tsx

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, Globe, Phone } from "lucide-react";
import { generateSlug } from "@/lib/utils/genSlug";
import { BusinessDetail } from "@/types/business.types";
import { SocialLinks } from "@/components/core/SocialLinks";
import StarIcon from "../ui/StarIcon";
import { cn } from "@/lib/utils";
import FoodTypeBadges from "./FoodTypeBadges";

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
    EMAIL_ADDRESS,
    HALAL,
    VEGAN,
    VEGETARIAN,
  } = business || {};

  if (!BUSINESS_ID) return null;

  const slug = generateSlug(BUSINESS_NAME || "business", BUSINESS_ID);
  const rating = GOOGLE_RATING ? parseFloat(GOOGLE_RATING) : null;

  const formatUrl = (url: string | undefined) => {
    if (!url || url.trim() === "" || url === "0" || url === "null") return null;

    // Handle regular URLs
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  const socialLinks = {
    facebook: formatUrl(FACEBOOK_LINK),
    instagram: formatUrl(INSTA_LINK),
    whatsapp: WHATSAPP_NUMBER,
  };

  const hasSocialLinks = Object.values(socialLinks).some(
    (link) => link !== null
  );

  return (
    <div className="group relative bg-background-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden w-full h-[560px] flex flex-col">
      {/* Image */}
      <div className="">
        <Link
          href={`/business/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full h-[200px] md:h-[200px] aspect-video overflow-hidden"
        >
          {IMAGE_URL ? (
            <Image
              src={IMAGE_URL}
              alt={BUSINESS_NAME}
              height={1200}
              width={1200}
              className="object-cover transition-transform duration-500 group-hover:scale-105 aspect-video rounded-t-2xl"
              sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 336px"
              quality={70}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-4xl md:text-6xl text-wrap font-bold text-gray-600 uppercase">
                {BUSINESS_NAME}
              </span> 
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between p-4 lg:p-2">
        <div className="flex items-center justify-between gap-2">
          <FoodTypeBadges
            HALAL={HALAL || 0}
            VEGAN={VEGAN || 0}
            VEGETARIAN={VEGETARIAN || 0}
          />

          {rating !== null && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const starValue = Math.min(1, Math.max(0, rating - i));
                  return (
                    <StarIcon
                      key={i}
                      fillLevel={starValue}
                      className="w-4 h-4 lg:w-5 lg:h-5"
                    />
                  );
                })}
              </div>
              <span className="text-sm lg:text-lg font-medium text-accent">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div className="mt-2">
          {/* Title */}
          <Link
            href={`/business/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className="text-lg lg:text-2xl font-semibold text-primary  line-clamp-2">
              {BUSINESS_NAME}
            </h3>
          </Link>

          {/* Description */}
          {DESCRIPTION && (
            <p className="mt-2 text-sm lg:text-base text-text-main line-clamp-2">
              {DESCRIPTION}
            </p>
          )}

          {/* Address */}
          {ADDRESS_TOWN &&
            (GOOGLE_PROFILE ? (
              <Link href={GOOGLE_PROFILE} target="_blank">
                <p className="mt-6 flex items-center text-sm lg:text-base text-text-main  hover:text-accent transition">
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
          <div className="mt-1 space-y-1 text-sm lg:text-base text-text-main">
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
              <div className="flex items-center text-sm lg:text-base text-text-main">
                <Globe size={14} className="mr-2 text-primary" />
                <a
                  href={formatUrl(WEB_ADDRESS) || "#"}
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
          <Link
            href={EMAIL_ADDRESS ? `/business/${slug}/reservation` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-sm lg:text-lg px-4 py-2 rounded-full font-medium flex items-center gap-2 border-2 transition-colors duration-300 ease-in-out",
              EMAIL_ADDRESS
                ? "border-primary text-primary hover:bg-primary hover:text-white hover:border-primary"
                : "border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none opacity-60"
            )}
          >
            <Calendar size={16} className="shrink-0" />
            Reserve Table
          </Link>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BusinessCard);
