import type { Prisma } from "../../prisma/generated/prisma/client";

// Self-service account deletion: the account is anonymised, not removed, so past orders keep their restaurant's records
// (Swiss bookkeeping keeps them for 10 years) but no longer point at a person's account.

/** A unique address that can never receive mail (.invalid is reserved), so the old email is free for a new sign-up. */
export const anonymisedEmail = (accountId: number | bigint) => `deleted-${accountId}@deleted.invalid`;

export const ANONYMISED_ACCOUNT = {
  PASSWORD: null,
  FIRST_NAME: null,
  LAST_NAME: null,
  LANGUAGE: null,
  PIC: null,
  RESET_TOKEN: null,
  RESET_TOKEN_EXPIRY: null,
  PLATFORM_ROLE: null,
} as const;

/** Removes everything personal for one account inside the caller's transaction. Orders stay, detached (VISITOR_ID 0). */
export async function anonymiseAccount(tx: Prisma.TransactionClient, account: { id: bigint; email: string }) {
  const id = Number(account.id);
  await tx.visitor_business_review.deleteMany({ where: { VISITORS_ACCOUNT_ID: id } });
  await tx.visitor_product_review.deleteMany({ where: { VISITORS_ACCOUNT_ID: id } });
  await tx.foodeez_review.deleteMany({ where: { REVIEWER_EMAIL: account.email } });
  await tx.visitor_food_journey.deleteMany({ where: { VISITORS_ACCOUNT_ID: id } });
  await tx.visitor_favorite_restaurants.deleteMany({ where: { VISITORS_ACCOUNT_ID: id } });
  await tx.visitor_followed_events.deleteMany({ where: { VISITORS_ACCOUNT_ID: id } });
  await tx.visitor_followed_restaurants.deleteMany({ where: { VISITORS_ACCOUNT_ID: id } });
  await tx.customer_order_notification.deleteMany({ where: { VISITORS_ACCOUNT_ID: id } });
  // VISITOR_ID 0 marks an order without an account; history and notification queries never include those.
  await tx.business_order.updateMany({ where: { VISITOR_ID: id }, data: { VISITOR_ID: 0 } });
  await tx.visitors_account.update({
    where: { VISITORS_ACCOUNT_ID: account.id },
    data: { ...ANONYMISED_ACCOUNT, EMAIL_ADDRESS: anonymisedEmail(account.id) },
  });
}
