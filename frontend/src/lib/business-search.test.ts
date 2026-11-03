import assert from "node:assert/strict";
import test from "node:test";
import { buildBusinessSearchQuery } from "./business-search";

const attack = "x' UNION SELECT PASSWORD FROM visitors_account -- ";

test("search text never enters the SQL string", () => {
  const { sql, params, countSql, countParams } = buildBusinessSearchQuery({
    name: attack, searchTerm: attack, zipCode: attack,
  });

  for (const statement of [sql, countSql]) {
    assert.ok(!statement.includes("UNION"));
    assert.ok(!statement.includes("visitors_account"));
    assert.ok(!statement.includes("'"));
  }
  assert.equal(params[0], `%${attack.trim()}%`);
  assert.equal(countParams[1], attack.trim());
  // One placeholder per value, or the driver would misalign them.
  assert.equal(sql.split("?").length - 1, params.length);
  assert.equal(countSql.split("?").length - 1, countParams.length);
});

test("non-text and unknown filter values from the browser are dropped", () => {
  const forged = {
    name: { toString: () => attack },
    category: "constructor",
    foodType: "__proto__",
    priceRange: "toString",
    sortBy: `rating; DROP TABLE business --`,
  } as never;
  const { sql, params } = buildBusinessSearchQuery(forged);

  assert.ok(!sql.includes("DROP"));
  assert.ok(sql.includes("Ranking DESC"));
  assert.deepEqual(params, [12, 0]);
});

test("paging and rating numbers are forced into a safe range", () => {
  assert.deepEqual(buildBusinessSearchQuery({ page: NaN, limit: 1e9 }).params, [50, 0]);
  assert.deepEqual(buildBusinessSearchQuery({ page: -4, limit: -1 }).params, [1, 0]);
  assert.deepEqual(buildBusinessSearchQuery({ page: 3, limit: 10 }).params, [10, 20]);
  assert.deepEqual(buildBusinessSearchQuery({ rating: "1 OR 1=1" as never }).params, [12, 0]);
  assert.deepEqual(buildBusinessSearchQuery({ rating: 4.5 }).params, [4.5, 12, 0]);
});

test("known filters still apply", () => {
  const { sql, params } = buildBusinessSearchQuery({ category: "Pizza & Pasta", foodType: "Vegan", priceRange: "Luxury", sortBy: "newest" });

  assert.ok(sql.includes("BUSINESS_CATEGORY_ID IN (?,?)"));
  assert.ok(sql.includes("ORDER BY BUSINESS_ID DESC"));
  assert.deepEqual(params, [5, 6, 1, 4, 12, 0]);
});
