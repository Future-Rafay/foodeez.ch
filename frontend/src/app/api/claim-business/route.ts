import { NextResponse } from "next/server";
import { sendEmail } from "@/services/EmailService";

export async function POST(request: Request) {
  try {
    const { email, businessId, businessName } = await request.json();
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || !Number.isInteger(businessId) || typeof businessName !== "string" || !businessName.trim()) {
      return NextResponse.json({ error: "Invalid claim request" }, { status: 400 });
    }

    await sendEmail(process.env.ADMIN_EMAIL! , "contact", {
      name: businessName,
      email,
      subject: `Business claim request: ${businessName}`,
      message: `A claim was submitted for ${businessName} (business ID: ${businessId}) using the official email ${email}.`,
    });

    return NextResponse.json({ message: "Claim request submitted" });
  } catch (error) {
    console.error("Business claim submission error:", error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : "Failed to submit claim request" },
      { status: 500 }
    );
  }
}
