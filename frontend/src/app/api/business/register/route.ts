import { NextResponse } from "next/server";
import { publicFormRateLimitResponse } from "@/lib/checkout-rate-limit";
import { sendEmail } from "@/services/EmailService";

const REQUIRED_FIELDS = [
  "BUSINESS_NAME",
  "DESCRIPTION",
  "ADDRESS_STREET",
  "ADDRESS_ZIP",
  "ADDRESS_TOWN",
  "ADDRESS_COUNTRY",
  "PHONE_NUMBER",
];
const OPTIONAL_FIELDS = [
  "SHORT_NAME",
  "PHONE_NUMBER_SHORT",
  "WHATSAPP_NUMBER",
  "WEB_ADDRESS",
  "FACEBOOK_LINK",
  "INSTA_LINK",
  "TIKTOK_LINK",
  "GOOGLE_PROFILE",
  "IMAGE_URL",
];

const clean = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, 1000) : "";

// Requests go to the admin by email; nothing is listed publicly until the admin adds the restaurant.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || REQUIRED_FIELDS.some((field) => !clean(body[field]))) {
      return NextResponse.json({ message: "Please fill in all required fields." }, { status: 400 });
    }

    const limited = await publicFormRateLimitResponse(request.headers, "business-register", null);
    if (limited) return limited;

    const details = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]
      .filter((field) => clean(body[field]))
      .map((field) => `${field}: ${clean(body[field])}`)
      .join("\n");

    await sendEmail(process.env.ADMIN_EMAIL || "admin@foodeez.ch", "contact", {
      name: clean(body.BUSINESS_NAME),
      email: "Not provided, use the phone number below",
      subject: `Business registration request: ${clean(body.BUSINESS_NAME)}`,
      message: details,
    });

    return NextResponse.json({ message: "Registration request submitted" });
  } catch (error) {
    console.error("Business registration error:", error);
    return NextResponse.json({ message: "We couldn't submit your registration. Please try again." }, { status: 500 });
  }
}
