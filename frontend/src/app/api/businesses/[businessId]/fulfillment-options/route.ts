import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryZonesDisplay, getFulfillmentOptions } from "@/lib/fulfillment";

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } }
) {
  const businessId = Number(params.businessId);
  if (!businessId) return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });

  const [settings, business] = await Promise.all([
    prisma.business_settings.findUnique({ where: { BUSINESS_ID: businessId } }),
    prisma.business.findUnique({
      where: { BUSINESS_ID: businessId },
      select: {
        BUSINESS_NAME: true,
        ADDRESS_STREET: true,
        ADDRESS_ZIP: true,
        ADDRESS_TOWN: true,
        ADDRESS_COUNTRY: true,
      },
    }),
  ]);

  return NextResponse.json({
    ...getFulfillmentOptions(settings),
    deliveryZones: getDeliveryZonesDisplay(settings),
    restaurantAddress: business
      ? {
          name: business.BUSINESS_NAME,
          street: business.ADDRESS_STREET,
          zip: business.ADDRESS_ZIP?.toString(),
          town: business.ADDRESS_TOWN,
          country: business.ADDRESS_COUNTRY ?? "CH",
        }
      : null,
  });
}
