import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeliveryZonesDisplay, getFulfillmentOptions } from "@/lib/fulfillment";

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } }
) {
  const businessId = Number(params.businessId);
  if (!businessId) return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });

  const [settings, business, cashSettings] = await Promise.all([
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
    prisma.$queryRaw<
      Array<{
        CASH_ON_DELIVERY_ENABLED: number | null;
        CASH_ON_PICKUP_ENABLED: number | null;
      }>
    >`
      SELECT CASH_ON_DELIVERY_ENABLED, CASH_ON_PICKUP_ENABLED
      FROM business_settings
      WHERE BUSINESS_ID = ${businessId}
      LIMIT 1
    `,
  ]);

  return NextResponse.json({
    ...getFulfillmentOptions(settings),
    cashOnDeliveryEnabled:
      cashSettings[0]?.CASH_ON_DELIVERY_ENABLED === 1,
    cashOnPickupEnabled: cashSettings[0]?.CASH_ON_PICKUP_ENABLED === 1,
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
