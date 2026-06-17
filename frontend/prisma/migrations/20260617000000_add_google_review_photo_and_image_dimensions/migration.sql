-- Add profile photo URL to Google reviews cache
ALTER TABLE `business_google_reviews`
  ADD COLUMN `PROFILE_PHOTO_URL` VARCHAR(1000) NULL AFTER `RELATIVE_TIME`;

-- Add image dimensions to Google photos cache
ALTER TABLE `business_google_images`
  ADD COLUMN `WIDTH` INT NULL AFTER `IMAGE_URL`,
  ADD COLUMN `HEIGHT` INT NULL AFTER `WIDTH`;

-- Recreate views to expose new columns
CREATE OR REPLACE VIEW `business_google_review_view` AS
SELECT
  `BUSINESS_GOOGLE_REVIEWS_ID`,
  `CREATION_DATETIME`,
  `BUSINESS_ID`,
  `PLACE_ID`,
  `AUTHOR`,
  `RATING`,
  `REVIEW`,
  `RELATIVE_TIME`,
  `PROFILE_PHOTO_URL`
FROM `business_google_reviews`;

CREATE OR REPLACE VIEW `business_google_images_view` AS
SELECT
  `BUSINESS_GOOGLE_IMAGES_ID`,
  `BUSINESS_ID`,
  `PLACE_ID`,
  `IMAGE_URL`,
  `WIDTH`,
  `HEIGHT`
FROM `business_google_images`;
