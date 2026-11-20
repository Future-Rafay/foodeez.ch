/** Browser-side memory of the Stripe payment page the customer was sent to; see /api/checkout/cancel. */
export const OPEN_STRIPE_SESSION_KEY = "foodeez:open-stripe-session";

/**
 * After /api/checkout answers with an error: may an order already exist under this request id?
 * If it may, the next attempt must reuse the id with the same cart and answers so it finds that order.
 * If not (the cart, form, stock or discount was refused), the customer may change things and start fresh.
 */
export const checkoutOrderMayExist = (status: number, message: string) =>
  status >= 500 || /conflicts with an existing order|already awaiting card payment/.test(message);
