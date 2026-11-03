export type BusinessSearchFilters = {
  searchTerm?: string;
  category?: string;
  foodType?: string;
  priceRange?: string;
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: "rating" | "popularity" | "newest";
  name?: string;
  zipCode?: string;
};

const MAX_LIMIT = 50;
const MAX_TEXT_LENGTH = 100;

const CATEGORY_IDS = new Map([
  ["Pizza & Pasta", [5, 6]],
  ["Fast Food", [7]],
  ["Kebab & Donner", [8]],
  ["Combo Box", [9, 10, 11]],
]);
const FOOD_TYPE_IDS = new Map([["HALAL", 3], ["Vegetarian", 2], ["Vegan", 1]]);
const PRICE_RANGE_IDS = new Map([["Budget", 1], ["Mid-Range", 2], ["Premium", 3], ["Luxury", 4]]);

const ORDER_BY = new Map([
  ["rating", "CAST(GOOGLE_RATING AS FLOAT) DESC"],
  ["newest", "BUSINESS_ID DESC"],
]);
const DEFAULT_ORDER_BY = "Ranking DESC, CAST(GOOGLE_RATING AS FLOAT) DESC";

// Server action arguments come from the browser, so types are not guaranteed at runtime.
const text = (value: unknown) => (typeof value === "string" ? value.trim().slice(0, MAX_TEXT_LENGTH) : "");
const wholeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const number = Math.trunc(Number(value));
  return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : fallback;
};

/** Every value from the caller is a bound `?` parameter; only fixed strings from this file enter the SQL. */
export function buildBusinessSearchQuery(filters: BusinessSearchFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const name = text(filters.name);
  if (name) {
    conditions.push("BUSINESS_NAME LIKE ?");
    params.push(`%${name}%`);
  }

  const zipCode = text(filters.zipCode);
  if (zipCode) {
    conditions.push("ADDRESS_ZIP = ?");
    params.push(zipCode);
  }

  const searchTerm = text(filters.searchTerm);
  if (searchTerm) {
    conditions.push("(BUSINESS_NAME LIKE ? OR DESCRIPTION LIKE ? OR ADDRESS_TOWN LIKE ? OR ADDRESS_STREET LIKE ?)");
    params.push(...Array<string>(4).fill(`%${searchTerm}%`));
  }

  const categoryIds = CATEGORY_IDS.get(String(filters.category));
  if (categoryIds) {
    conditions.push(
      `BUSINESS_ID IN (SELECT BUSINESS_ID FROM business_2_business_category WHERE BUSINESS_CATEGORY_ID IN (${categoryIds.map(() => "?").join(",")}))`
    );
    params.push(...categoryIds);
  }

  const foodTypeId = FOOD_TYPE_IDS.get(String(filters.foodType));
  if (foodTypeId) {
    conditions.push("BUSINESS_ID IN (SELECT BUSINESS_ID FROM business_2_food_type WHERE FOOD_TYPE_ID = ?)");
    params.push(foodTypeId);
  }

  const priceRangeId = PRICE_RANGE_IDS.get(String(filters.priceRange));
  if (priceRangeId) {
    conditions.push("BUSINESS_ID IN (SELECT BUSINESS_ID FROM business_detail WHERE PRICE_RANGE_ID = ?)");
    params.push(priceRangeId);
  }

  const rating = Math.min(Math.max(Number(filters.rating) || 0, 0), 5);
  if (rating > 0) {
    conditions.push("CAST(GOOGLE_RATING AS FLOAT) >= ?");
    params.push(rating);
  }

  const where = ["1=1", ...conditions].join(" AND ");
  const limit = wholeNumber(filters.limit, 12, 1, MAX_LIMIT);
  const page = wholeNumber(filters.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const orderBy = ORDER_BY.get(String(filters.sortBy)) ?? DEFAULT_ORDER_BY;

  return {
    sql: `SELECT * FROM business_detail_view_all WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    params: [...params, limit, (page - 1) * limit],
    countSql: `SELECT COUNT(*) as total FROM business_detail_view_all WHERE ${where}`,
    countParams: params,
  };
}
