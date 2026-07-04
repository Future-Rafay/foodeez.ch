-- Add the minimal Stripe payment/refund tracking fields needed on orders.
-- Run this manually in MySQL Workbench against the Foodeez customer database.
--
-- This file avoids ADD COLUMN IF NOT EXISTS because older MySQL/MariaDB
-- servers reject that syntax.
-- Before running, check existing columns/indexes:
--   SHOW COLUMNS FROM business_order LIKE 'STRIPE_%';
--   SHOW INDEX FROM business_order WHERE Key_name IN ('STRIPE_CHECKOUT_SESSION_ID', 'STRIPE_PAYMENT_INTENT_ID');
-- Run only the missing ADD COLUMN / CREATE INDEX statements.
-- If either index already exists, skip its CREATE INDEX statement.

ALTER TABLE business_order
  ADD COLUMN STRIPE_CHECKOUT_SESSION_ID VARCHAR(255) NULL,
  ADD COLUMN STRIPE_PAYMENT_INTENT_ID VARCHAR(255) NULL,
  ADD COLUMN STRIPE_REFUND_ID VARCHAR(255) NULL,
  ADD COLUMN STRIPE_REFUND_STATUS VARCHAR(50) NULL,
  ADD COLUMN STRIPE_REFUNDED_DATETIME DATETIME(0) NULL;

CREATE INDEX STRIPE_CHECKOUT_SESSION_ID
  ON business_order (STRIPE_CHECKOUT_SESSION_ID);

CREATE INDEX STRIPE_PAYMENT_INTENT_ID
  ON business_order (STRIPE_PAYMENT_INTENT_ID);
