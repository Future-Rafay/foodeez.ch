-- Add fetch timestamp columns for Google-cached data
ALTER TABLE `business_google_reviews`
  ADD COLUMN `google_data_fetched_at` DATETIME(0) NULL AFTER `CREATION_DATETIME`;

ALTER TABLE `business_opening_hours`
  ADD COLUMN `google_data_fetched_at` DATETIME(0) NULL AFTER `CREATION_DATETIME`;

ALTER TABLE `business_google_images`
  ADD COLUMN `google_data_fetched_at` DATETIME(0) NULL AFTER `CREATION_DATETIME`;
