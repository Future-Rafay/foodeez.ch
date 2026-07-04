"use server";

import { prisma } from "@/lib/prisma";
import type { MenuCard, MenuProduct } from "@/types/product";

export async function getBusinessMenuOnly(BUSINESS_ID: number) {
  try {
    const business = await prisma.business.findUnique({
      where: { BUSINESS_ID },
      select: {
        BUSINESS_ID: true,
        BUSINESS_NAME: true,
        DESCRIPTION: true,
        ADDRESS_STREET: true,
        ADDRESS_ZIP: true,
        ADDRESS_TOWN: true,
        PHONE_NUMBER_SHORT: true,
        EMAIL_ADDRESS: true,
        WHATSAPP_NUMBER: true,
        WEB_ADDRESS: true,
        LOGO: true,
        GOOGLE_PROFILE: true,
        IMAGE_URL: true,
      },
    });

    if (!business) return [];

    const menuCards = await activeMenuCards(BUSINESS_ID);

    return menuCards.map((card) => ({
      ...business,
      ADDRESS_ZIP: business.ADDRESS_ZIP ? Number(business.ADDRESS_ZIP) : null,
      BUSINESS_FOOD_MENU_CARD_ID: card.BUSINESS_FOOD_MENU_CARD_ID,
      MENU_NAME: card.TITLE,
    })) as MenuCard[];
  } catch (error) {
    console.error('Error fetching menu cards:', error);
    return [];
  }
}

export async function getBusinessMenuWithProducts(businessId: number) {
  try {
    const menuCards = await activeMenuCards(businessId);
    const menuIds = new Set(
      menuCards.map((card) => card.BUSINESS_FOOD_MENU_CARD_ID)
    );
    if (!menuIds.size) return [];

    const rows = await prisma.$queryRaw<MenuProduct[]>`
      SELECT
        v.BUSINESS_ID,
        v.BUSINESS_NAME,
        v.BUSINESS_FOOD_MENU_CARD_ID,
        v.MENU_NAME,
        v.BUSINESS_PRODUCT_CATEGORY_ID,
        v.CATEGORY,
        v.BUSINESS_PRODUCT_ID,
        v.PRODUCT_NAME,
        v.PRODUCT_DESCRIPTION,
        v.PRODUCT_PRICE,
        v.COMPARE_AS_PRICE,
        v.PIC,
        f.TRACK_INVENTORY,
        f.INVENTORY_AVAILABLE,
        f.WEIGHT,
        f.WEIGHT_UNIT
      FROM business_food_menu_card_detail_view v
      JOIN business_product f ON f.BUSINESS_PRODUCT_ID = v.BUSINESS_PRODUCT_ID
      WHERE v.BUSINESS_ID = ${businessId}
      ORDER BY v.BUSINESS_FOOD_MENU_CARD_ID, v.BUSINESS_PRODUCT_CATEGORY_ID, v.PRODUCT_NAME
    `;

    const seen = new Set<string>();
    return rows.filter((product) => {
      if (!menuIds.has(product.BUSINESS_FOOD_MENU_CARD_ID)) return false;
      const key = `${product.BUSINESS_FOOD_MENU_CARD_ID}-${product.BUSINESS_PRODUCT_CATEGORY_ID}-${product.BUSINESS_PRODUCT_ID}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((product) => ({
      ...product,
      PRODUCT_PRICE: Number(product.PRODUCT_PRICE),
      COMPARE_AS_PRICE: Number(product.COMPARE_AS_PRICE ?? 0),
      TRACK_INVENTORY: Number(product.TRACK_INVENTORY ?? 0),
      INVENTORY_AVAILABLE: Number(product.INVENTORY_AVAILABLE ?? 0),
      WEIGHT: Number(product.WEIGHT ?? 0),
    }));
  } catch (error) {
    console.error('Error fetching business menu with products:', error);
    return [];
  }
}

type MenuCardSchedule = {
  BUSINESS_FOOD_MENU_CARD_ID: number;
  TITLE: string | null;
  VALID_FROM: Date | null;
  VALID_TO: Date | null;
  STATUS: number | null;
  REPEAT_WEEKLY: number | null;
  ACTIVE_DAYS_JSON: string | null;
  IS_UNLIMITED: number | null;
};

async function activeMenuCards(businessId: number) {
  const cards = await prisma.$queryRaw<MenuCardSchedule[]>`
    SELECT
      BUSINESS_FOOD_MENU_CARD_ID,
      TITLE,
      VALID_FROM,
      VALID_TO,
      STATUS,
      REPEAT_WEEKLY,
      ACTIVE_DAYS_JSON,
      IS_UNLIMITED
    FROM business_food_menu_card
    WHERE BUSINESS_ID = ${businessId}
    ORDER BY TITLE ASC
  `;
  const today = startOfDay(new Date());
  const weekday = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  return cards.filter((card) => isActiveToday(card, today, weekday));
}

function isActiveToday(card: MenuCardSchedule, today: Date, weekday: string) {
  if (Number(card.STATUS ?? 1) !== 1 || !card.VALID_FROM) return false;
  if (startOfDay(card.VALID_FROM) > today) return false;
  if (Number(card.IS_UNLIMITED ?? 0) !== 1 && card.VALID_TO && startOfDay(card.VALID_TO) < today) {
    return false;
  }
  if (Number(card.REPEAT_WEEKLY ?? 0) === 1) {
    const activeDays = parseActiveDays(card.ACTIVE_DAYS_JSON);
    return activeDays.includes(weekday);
  }
  return true;
}

function parseActiveDays(value: string | null) {
  try {
    const days = JSON.parse(value || "[]");
    return Array.isArray(days) ? days.map((day) => String(day).toLowerCase()) : [];
  } catch {
    return [];
  }
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
