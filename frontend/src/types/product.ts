export type MenuCard = {
  BUSINESS_ID: number;
  BUSINESS_NAME: string | null;
  DESCRIPTION: string | null;
  ADDRESS_STREET: string | null;
  ADDRESS_ZIP: bigint | number | null;
  ADDRESS_TOWN: string | null;
  PHONE_NUMBER_SHORT: string | null;
  EMAIL_ADDRESS: string | null;
  WHATSAPP_NUMBER: string | null;
  WEB_ADDRESS: string | null;
  LOGO: string | null;
  GOOGLE_PROFILE: string | null;
  IMAGE_URL: string | null;
  BUSINESS_FOOD_MENU_CARD_ID: number;
  MENU_NAME: string | null;
};

export type MenuProduct = {
  ROW_NUMBER?: bigint | number;
  BUSINESS_ID: number;
  BUSINESS_NAME: string | null;
  BUSINESS_FOOD_MENU_CARD_ID: number;
  MENU_NAME: string | null;
  BUSINESS_PRODUCT_CATEGORY_ID: number | null;
  CATEGORY: string | null;
  BUSINESS_PRODUCT_ID: number;
  PRODUCT_NAME: string;
  PRODUCT_DESCRIPTION: string;
  PRODUCT_PRICE: number;
  COMPARE_AS_PRICE: number | null;
  PIC: string;
  TRACK_INVENTORY: number | null;
  INVENTORY_AVAILABLE: number | null;
  WEIGHT: number | null;
  WEIGHT_UNIT: string | null;
};
