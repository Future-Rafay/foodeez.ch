import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryQuote } from "@/lib/fulfillment";

export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const businessId = Number(params.businessId);
  if (!businessId) return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });

  const { postalCode, cartTotal } = await req.json();
  if (!postalCode) {
    return NextResponse.json({ available: false, reason: "Postal code is required.", deliveryPrice: 0, freeDeliveryApplied: false });
  }

  const settings = await prisma.business_settings.findUnique({ where: { BUSINESS_ID: businessId } });
  return NextResponse.json(getDeliveryQuote(settings, String(postalCode), Number(cartTotal ?? 0)));
}
