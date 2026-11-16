-- Apply manually to the shared Foodeez MySQL database (MySQL Workbench), then run `npx prisma db pull` and
-- `npx prisma generate` from frontend/. Additive only; safe to run twice.
-- One row per restaurant: when its Google reviews, hours and photos were last fetched (or a fetch was attempted).
-- Caps Google Places calls at one per restaurant per 90 days and lets only one visit start a refresh.
CREATE TABLE IF NOT EXISTS business_google_refresh (
  BUSINESS_ID INT NOT NULL PRIMARY KEY,
  LAST_ATTEMPT_DATETIME DATETIME NOT NULL
);
