import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import type { CartItem } from "@/stores/cartStore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeliveryQuote, getFulfillmentOptions } from "@/lib/fulfillment";
import { ORDER_STATUS, ORDER_TYPE, PAYMENT_DONE } from "@/lib/order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});

type PaymentMethod = "card" | "cash_on_delivery" | "pay_at_pickup";

type CustomerInfo = {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
};

const temporaryId = () => Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000000);

const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

async function visitorIdFor(email?: string | null) {
  if (!email) return 0;
  const user = await prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: email },
    select: { VISITORS_ACCOUNT_ID: true },
  });
  return user ? Number(user.VISITORS_ACCOUNT_ID) : 0;
}

async function createUnpaidOrder(params: {
  items: CartItem[];
  businessId: number;
  customerInfo: CustomerInfo;
  orderType: "delivery" | "pickup";
  paymentMethod: PaymentMethod;
  shippingCharges: number;
  totalAmount: number;
  visitorId: number;
}) {
  const order = await prisma.business_order.create({
    data: {
      BUSINESS_ORDER_ID: temporaryId(),
      CREATION_DATETIME: new Date(),
      BUSINESS_ID: params.businessId,
      VISITOR_ID: params.visitorId,
      PAYMENT_DONE: PAYMENT_DONE.pending,
      PAYMENT_MODE: params.paymentMethod,
      ORDER_STATUS: ORDER_STATUS.preparing,
      ORDER_TYPE: params.orderType,
      TERMINAL: "web",
      FIRST_NAME: params.customerInfo.firstName,
      LAST_NAME: params.customerInfo.lastName,
      ADDRESS_STREET: params.orderType === ORDER_TYPE.delivery ? params.customerInfo.street || "" : "",
      ADDRESS_ZIP: params.orderType === ORDER_TYPE.delivery ? params.customerInfo.zip || "" : "",
      ADDRESS_TOWN: params.orderType === ORDER_TYPE.delivery ? params.customerInfo.city || "" : "",
      ADDRESS_COUNTRY_CODE: params.customerInfo.country || "CH",
      PHONE_NUMBER: params.customerInfo.phone,
      EMAIL_ADDRESS: params.customerInfo.email,
      ORDER_GROSS_AMOUNT: params.totalAmount,
      ORDER_NET_AMOUNT: params.totalAmount,
      ORDER_AMOUNT: params.totalAmount,
      SHIPPING_CHARGES: params.shippingCharges,
      ORDER_FINAL_AMOUNT: params.totalAmount + params.shippingCharges,
    },
  });

  for (const item of params.items) {
    await prisma.$executeRaw`
      INSERT INTO business_order_detail (
        BUSINESS_ORDER_DETAIL_ID,
        CREATION_DATETIME,
        BUSINESS_ORDER_ID,
        BUSINESS_PRODUCT_ID,
        ORDER_QUANTITY,
        PRODUCT_SELL_PRICE,
        PRODUCT_PRICE,
        QUANTITY_BALANCE
      ) VALUES (
        ${temporaryId()},
        NOW(),
        ${order.BUSINESS_ORDER_ID},
        ${Number(item.id)},
        ${item.quantity},
        ${item.price},
        ${item.price * item.quantity},
        ${item.quantity}
      )
    `;
  }

  return order;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    items,
    customerInfo,
    orderType = ORDER_TYPE.delivery,
    paymentMethod = "card",
  } = body as {
    items: CartItem[];
    customerInfo: CustomerInfo;
    businessId?: string | number;
    orderType?: "delivery" | "pickup";
    paymentMethod?: PaymentMethod;
  };

  if (!items?.length) return new NextResponse("Cart is empty", { status: 400 });
  if (orderType !== ORDER_TYPE.delivery && orderType !== ORDER_TYPE.pickup) {
    return new NextResponse("Invalid order type", { status: 400 });
  }

  const productIds = Array.from(new Set(items.map((item) => Number(item.id))));
  if (productIds.some((id) => !id)) return new NextResponse("Invalid cart item", { status: 400 });

  const products = await prisma.business_product.findMany({
    where: { BUSINESS_PRODUCT_ID: { in: productIds } },
    select: { BUSINESS_PRODUCT_ID: true, BUSINESS_ID: true },
  });
  if (products.length !== productIds.length) return new NextResponse("Invalid cart item", { status: 400 });

  const businessIds = Array.from(new Set(products.map((product) => product.BUSINESS_ID).filter(Boolean)));
  if (businessIds.length !== 1) return new NextResponse("Please order from one restaurant at a time", { status: 400 });

  const businessId = Number(businessIds[0]);
  const settings = await prisma.business_settings.findUnique({ where: { BUSINESS_ID: businessId } });
  const options = getFulfillmentOptions(settings);
  const totalAmount = cartTotal(items);
  let shippingCharges = 0;

  const requiredFields: (keyof CustomerInfo)[] = ["firstName", "lastName", "email", "phone"];
  if (orderType === ORDER_TYPE.delivery) {
    requiredFields.push("street", "zip", "city", "country");
    const quote = getDeliveryQuote(settings, customerInfo.zip || "", totalAmount);
    if (!quote.available) return new NextResponse(quote.reason || "Delivery unavailable", { status: 400 });
    shippingCharges = quote.deliveryPrice;
  } else if (!options.pickupEnabled) {
    return new NextResponse("Pickup is currently unavailable", { status: 400 });
  }

  const missingFields = requiredFields.filter((field) => !customerInfo[field]);
  if (missingFields.length) {
    return new NextResponse(`Missing required fields: ${missingFields.join(", ")}`, { status: 400 });
  }

  if (orderType === ORDER_TYPE.pickup && paymentMethod === "cash_on_delivery") {
    return new NextResponse("Invalid payment method for pickup", { status: 400 });
  }
  if (orderType === ORDER_TYPE.delivery && paymentMethod === "pay_at_pickup") {
    return new NextResponse("Invalid payment method for delivery", { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse("Please log in to place your order", { status: 401 });
  }

  const visitorId = await visitorIdFor(session?.user?.email || customerInfo.email);

  if (paymentMethod !== "card") {
    const order = await createUnpaidOrder({
      items,
      businessId,
      customerInfo,
      orderType,
      paymentMethod,
      shippingCharges,
      totalAmount,
      visitorId,
    });

    return NextResponse.json({
      orderId: order.BUSINESS_ORDER_ID,
      redirectUrl: `/order/success?orderId=${order.BUSINESS_ORDER_ID}`,
    });
  }

  const origin = headers().get("origin") || "http://localhost:3000";
  const line_items = items.map((item) => ({
    price_data: {
      currency: "chf",
      product_data: {
        name: item.name,
        images: item.image ? [item.image] : [],
        metadata: { productId: item.id },
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  const metadata = {
    businessId: String(businessId),
    customerId: String(visitorId || customerInfo.userId || "guest"),
    customerEmail: customerInfo.email,
    customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
    customerPhone: customerInfo.phone,
    orderType,
    paymentMethod,
    street: customerInfo.street || "",
    zip: customerInfo.zip || "",
    city: customerInfo.city || "",
    country: customerInfo.country || "CH",
    shippingCharges: shippingCharges.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    client_reference_id: String(visitorId || customerInfo.userId || "") || undefined,
    metadata,
    submit_type: "pay",
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: Math.round(shippingCharges * 100),
            currency: "chf",
          },
          display_name: orderType === ORDER_TYPE.pickup ? "Pickup" : "Delivery",
        },
      },
    ],
    customer_email: customerInfo.email,
    phone_number_collection: { enabled: true },
  };

  if (orderType === ORDER_TYPE.delivery) {
    sessionConfig.shipping_address_collection = { allowed_countries: ["CH"] };
  }

  const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);
  return NextResponse.json({ sessionId: checkoutSession.id });
}
