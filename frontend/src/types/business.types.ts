// types/business.types.ts

import type { Prisma } from "@/lib/prisma";

export interface BusinessDetail {
  BUSINESS_ID: number;
  BUSINESS_NAME?: string;
  SHORT_NAME?: string;
  DESCRIPTION?: string;
  ADDRESS_STREET?: string;
  ADDRESS_ZIP?: bigint;
  ADDRESS_TOWN?: string;
  ADDRESS_CITY_ID?: number;
  CITY_CODE?: string;
  CITY_NAME?: string;
  EMAIL_ADDRESS?: string;
  ADDRESS_COUNTRY?: string;
  PHONE_NUMBER?: string;
  WHATSAPP_NUMBER?: string;
  WEB_ADDRESS?: string;
  LOGO?: string;
  FACEBOOK_LINK?: string;
  INSTA_LINK?: string;
  TIKTOK_LINK?: string;
  GOOGLE_PROFILE?: string;
  IMAGE_URL?: string;
  GOOGLE_RATING?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
  APPROVED?: number;
  STATUS?: number;
  RANKING?: bigint;
  VEGAN: number;
  VEGETARIAN: number;
  HALAL: number;
  CAN_RESERVE_TABLE: number;
  HAVING_ACTIVE_MENU_CARD: number;
}

export type BusinessCategory = {
  CNT?: bigint;
  BUSINESS_CATEGORY_ID: number;
  CATEGORY_NAME: string | null;
  CATEGORY: string | null;
};

export type BusinessResult = Prisma.business_detail_view_allGetPayload<{
  select: {
    BUSINESS_ID: true;
    BUSINESS_NAME: true;
    SHORT_NAME: true;
    DESCRIPTION: true;
    ADDRESS_STREET: true;
    ADDRESS_ZIP: true;
    ADDRESS_TOWN: true;
    ADDRESS_CITY_ID: true;
    CITY_CODE: true;
    CITY_NAME: true;
    EMAIL_ADDRESS: true;
    ADDRESS_COUNTRY: true;
    PHONE_NUMBER: true;
    WHATSAPP_NUMBER: true;
    WEB_ADDRESS: true;
    LOGO: true;
    FACEBOOK_LINK: true;
    INSTA_LINK: true;
    TIKTOK_LINK: true;
    GOOGLE_PROFILE: true;
    IMAGE_URL: true;
    GOOGLE_RATING: true;
    LATITUDE: true;
    LONGITUDE: true;
    APPROVED: true;
    STATUS: true;
    RANKING: true;
    VEGAN: true;
    VEGETARIAN: true;
    HALAL: true;
    CAN_RESERVE_TABLE: true;
    HAVING_ACTIVE_MENU_CARD: true;
  }
}>[] | BusinessDetail[];
