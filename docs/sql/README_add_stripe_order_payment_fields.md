# Stripe order payment fields

Run manually:

1. Open `docs/sql/add_stripe_order_payment_fields.sql` in MySQL Workbench and run it against the customer frontend database.
2. Run `npx prisma db pull` from `frontend`.
3. Run `npx prisma generate` from `frontend`.
4. Continue frontend/backend code work.

Do not run `prisma migrate` for this change.
