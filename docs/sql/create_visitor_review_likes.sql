-- Apply manually to the shared Foodeez production database after approval.
-- Safe to rerun. Do not run prisma migrate for this file.
-- After applying: run `npx prisma db pull` and `npx prisma generate` from frontend,
-- then switch /api/reviews/like to insert here and count rows (one like per account per review, ever).

CREATE TABLE IF NOT EXISTS visitor_review_like (
  VISITOR_REVIEW_LIKE_ID INT NOT NULL AUTO_INCREMENT,
  VISITOR_BUSINESS_REVIEW_ID INT NOT NULL,
  VISITORS_ACCOUNT_ID INT NOT NULL,
  CREATION_DATETIME DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (VISITOR_REVIEW_LIKE_ID),
  UNIQUE KEY visitor_review_like_review_visitor_unique (VISITOR_BUSINESS_REVIEW_ID, VISITORS_ACCOUNT_ID)
);
