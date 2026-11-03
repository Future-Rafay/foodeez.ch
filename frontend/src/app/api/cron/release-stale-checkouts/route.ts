import { NextResponse } from "next/server";
import { releaseUnstartedStripeOrders } from "@/lib/inventory";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; without a configured secret the route stays closed.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ released: await releaseUnstartedStripeOrders() });
}
