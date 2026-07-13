import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/order-data";
import { getCustomerNotifications, syncCustomerNotifications } from "@/lib/customer-notifications";

export async function GET() {
  const session = await getServerSession(authOptions);
  const visitorId = Number(session?.user?.id);
  if (!session?.user?.email || !Number.isInteger(visitorId) || visitorId < 1) {
    return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
  }

  const orders = await getCustomerOrders(visitorId, session.user.email);
  await syncCustomerNotifications(visitorId, orders);
  const notifications = await getCustomerNotifications(visitorId);

  return NextResponse.json({
    success: true,
    orders,
    notifications,
    user: {
      email: session.user.email,
      visitorId,
    },
  });
}
