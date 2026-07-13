import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomerOrders, getVisitorByEmail } from "@/lib/order-data";
import { getCustomerNotifications, syncCustomerNotifications } from "@/lib/customer-notifications";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
  }

  const user = await getVisitorByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found - No visitor account for this email" }, { status: 404 });
  }

  const orders = await getCustomerOrders(Number(user.VISITORS_ACCOUNT_ID), user.EMAIL_ADDRESS || session.user.email);
  await syncCustomerNotifications(Number(user.VISITORS_ACCOUNT_ID), orders);
  const notifications = await getCustomerNotifications(Number(user.VISITORS_ACCOUNT_ID));

  return NextResponse.json({
    success: true,
    orders,
    notifications,
    user: {
      email: user.EMAIL_ADDRESS,
      visitorId: Number(user.VISITORS_ACCOUNT_ID),
    },
  });
}
