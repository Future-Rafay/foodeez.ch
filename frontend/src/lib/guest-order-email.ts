import type { GuestOrderConfirmationData } from "@/emails/GuestOrderConfirmationEmail";

type GuestOrderEmailSender = (
  to: string,
  template: "guestOrderConfirmation",
  data: GuestOrderConfirmationData
) => Promise<unknown>;

export async function sendGuestOrderEmailSafely(
  send: GuestOrderEmailSender,
  to: string,
  data: GuestOrderConfirmationData,
  orderId: number
) {
  try {
    await send(to, "guestOrderConfirmation", data);
    return true;
  } catch (error) {
    console.error("Guest order confirmation email failed", {
      orderId,
      error: error instanceof Error ? error.message : "Unknown provider error",
    });
    return false;
  }
}
