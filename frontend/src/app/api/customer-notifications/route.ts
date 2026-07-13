import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisitorByEmail } from "@/lib/order-data";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const visitor = await getVisitorByEmail(session.user.email);
  if (!visitor) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const notificationId = Number(body.notificationId);
  if (!body.all && !Number.isInteger(notificationId)) {
    return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  }
  await prisma.customer_order_notification.updateMany({
    where: {
      VISITORS_ACCOUNT_ID: Number(visitor.VISITORS_ACCOUNT_ID),
      ...(body.all ? { IS_READ: 0 } : { CUSTOMER_ORDER_NOTIFICATION_ID: notificationId }),
    },
    data: { IS_READ: 1 },
  });
  return NextResponse.json({ success: true });
}
