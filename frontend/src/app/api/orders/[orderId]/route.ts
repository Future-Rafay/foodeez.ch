import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomerOrder, getVisitorByEmail } from "@/lib/order-data";
import { prisma } from "@/lib/prisma";
import { verifyGuestOrderToken } from "@/lib/guest-order";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const orderId = Number(params.orderId);
  if (!orderId) return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });

  const token = new URL(req.url).searchParams.get("guestToken");
  if (token !== null) {
    const row = await prisma.business_order.findUnique({
      where: { BUSINESS_ORDER_ID: orderId },
      select: {
        VISITOR_ID: true,
        EMAIL_ADDRESS: true,
        CREATION_DATETIME: true,
      },
    });
    if (
      !row ||
      Number(row.VISITOR_ID ?? 0) !== 0 ||
      !row.EMAIL_ADDRESS ||
      !verifyGuestOrderToken(
        {
          orderId,
          email: row.EMAIL_ADDRESS,
          createdAt: row.CREATION_DATETIME,
        },
        token
      )
    ) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await getCustomerOrder(orderId, 0, row.EMAIL_ADDRESS);
    return order
      ? NextResponse.json({ success: true, order })
      : NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const user = await getVisitorByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const order = await getCustomerOrder(orderId, Number(user.VISITORS_ACCOUNT_ID), user.EMAIL_ADDRESS || session.user.email);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ success: true, order });
}
