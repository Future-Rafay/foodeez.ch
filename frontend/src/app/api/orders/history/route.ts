import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/order-data";
import { getCustomerNotifications, NOTIFICATION_ORDER_LIMIT, syncCustomerNotifications } from "@/lib/customer-notifications";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const visitorId = Number(session?.user?.id);
  if (!session?.user?.email || !Number.isInteger(visitorId) || visitorId < 1) {
    return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
  }

  // The navbar bell polls on every page and shows notifications only, so it skips the full history.
  const bellOnly = new URL(request.url).searchParams.get("view") === "notifications";
  const orders = await getCustomerOrders(visitorId, session.user.email, bellOnly ? NOTIFICATION_ORDER_LIMIT : undefined);
  await syncCustomerNotifications(visitorId, orders);
  const notifications = await getCustomerNotifications(visitorId);

  return NextResponse.json({
    success: true,
    ...(bellOnly ? {} : { orders }),
    notifications,
    user: {
      email: session.user.email,
      visitorId,
    },
  });
}
