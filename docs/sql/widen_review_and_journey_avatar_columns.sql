-- Apply manually to the shared Foodeez production database after approval.
-- Safe to rerun. Do not run prisma migrate for this file.
-- S3 and Google photo URLs are longer than 100 characters, so these columns cannot hold them.
-- After applying: run `npx prisma db pull` and `npx prisma generate` from frontend, then remove
-- the shortcut in shortPhotoUrl (frontend/src/lib/media.ts) so full URLs are saved.

ALTER TABLE foodeez_review MODIFY AVATAR VARCHAR(255) NULL;
ALTER TABLE visitor_food_journey MODIFY VISITOR_PIC VARCHAR(255) NULL;
