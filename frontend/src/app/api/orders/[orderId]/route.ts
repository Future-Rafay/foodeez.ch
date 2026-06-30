import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomerOrder, getVisitorByEmail } from "@/lib/order-data";

export async function GET(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
  }

  const orderId = Number(params.orderId);
  if (!orderId) return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });

  const user = await getVisitorByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const order = await getCustomerOrder(orderId, Number(user.VISITORS_ACCOUNT_ID), user.EMAIL_ADDRESS || session.user.email);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ success: true, order });
}
