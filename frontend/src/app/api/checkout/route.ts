import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import type { CartItem } from "@/stores/cartStore";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDeliveryQuote, getFulfillmentOptions } from "@/lib/fulfillment";
import { createGuestOrderToken } from "@/lib/guest-order";
import {
  enforceGuestCheckoutRateLimit,
  GuestCheckoutRateLimitError,
} from "@/lib/checkout-rate-limit";
import { getAvailablePaymentMethods, type PaymentMethod } from "@/lib/payment-options";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { sendGuestOrderEmailSafely } from "@/lib/guest-order-email";
import { generateOrderNumberFromId, ORDER_STATUS, ORDER_TYPE, PAYMENT_DONE } from "@/lib/order";
import {
  reserveCartInventory,
  validateCartInventory,
} from "@/lib/inventory";
import { sendEmail } from "@/services/EmailService";
import { cents, chf, type AppliedDiscount } from "@/lib/discounts";
import { resolveOnlineDiscount } from "@/lib/online-discounts";
import { getBusinessMenuWithProducts } from "@/services/MenuPageService";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});

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

type TrustedItem = CartItem & { businessId: string; price: number };
type ExistingOrder = {
  BUSINESS_ORDER_ID: number;
  BUSINESS_ID: number | null;
  VISITOR_ID: number | null;
  EMAIL_ADDRESS: string | null;
  CREATION_DATETIME: Date | null;
  ORDER_NUMBER: string | null;
  STRIPE_CHECKOUT_SESSION_ID: string | null;
  PAYMENT_MODE: string | null;
  ORDER_TYPE: string;
  ORDER_GROSS_AMOUNT: unknown;
  ORDER_DISCOUNT_AMOUNT: unknown;
  DISCOUNT_ID: number | null;
  DISCOUNT_NAME: string | null;
  DISCOUNT_TYPE: string | null;
  DISCOUNT_VALUE: unknown;
  DISCOUNT_CODE: string | null;
  ORDER_FINAL_AMOUNT: unknown;
  SHIPPING_CHARGES: unknown;
  INVENTORY_RELEASED_DATETIME: Date | null;
  PAYMENT_DONE: number | null;
};

const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

async function visitorIdFor(email?: string | null) {
  if (!email) return 0;
  const user = await prisma.visitors_account.findUnique({
    where: { EMAIL_ADDRESS: email },
    select: { VISITORS_ACCOUNT_ID: true },
  });
  return user ? Number(user.VISITORS_ACCOUNT_ID) : 0;
}

async function findByRequestId(requestId: string) {
  const rows = await prisma.$queryRaw<ExistingOrder[]>`
    SELECT BUSINESS_ORDER_ID, BUSINESS_ID, VISITOR_ID, EMAIL_ADDRESS,
           CREATION_DATETIME, ORDER_NUMBER, STRIPE_CHECKOUT_SESSION_ID,
           PAYMENT_MODE, ORDER_TYPE, ORDER_GROSS_AMOUNT, SHIPPING_CHARGES,
           ORDER_DISCOUNT_AMOUNT, DISCOUNT_ID, DISCOUNT_NAME, DISCOUNT_TYPE,
           DISCOUNT_VALUE, DISCOUNT_CODE, ORDER_FINAL_AMOUNT,
           INVENTORY_RELEASED_DATETIME, PAYMENT_DONE
    FROM business_order
    WHERE CHECKOUT_REQUEST_ID = ${requestId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function createUnpaidOrder(params: {
  items: TrustedItem[];
  businessId: number;
  customerInfo: CustomerInfo;
  orderType: "delivery" | "pickup";
  paymentMethod: PaymentMethod | "stripe";
  requestId: string;
  shippingCharges: number;
  totalAmount: number;
  discount: AppliedDiscount | null;
  visitorId: number;
}) {
  const existing = await findByRequestId(params.requestId);
  if (existing) return { order: existing, created: false };

  try {
    return await prisma.$transaction(async (tx) => {
      await reserveCartInventory(tx, params.items);
      const order = await tx.business_order.create({
        data: {
          CREATION_DATETIME: new Date(),
          BUSINESS_ID: params.businessId,
          VISITOR_ID: params.visitorId,
          PAYMENT_DONE: PAYMENT_DONE.pending,
          PAYMENT_MODE: params.paymentMethod,
          ORDER_STATUS: ORDER_STATUS.preparing,
          ORDER_TYPE: params.orderType,
          TERMINAL: "web",
          FIRST_NAME: params.customerInfo.firstName.trim(),
          LAST_NAME: params.customerInfo.lastName.trim(),
          ADDRESS_STREET:
            params.orderType === ORDER_TYPE.delivery
              ? params.customerInfo.street?.trim() || ""
              : "",
          ADDRESS_ZIP:
            params.orderType === ORDER_TYPE.delivery
              ? params.customerInfo.zip?.trim() || ""
              : "",
          ADDRESS_TOWN:
            params.orderType === ORDER_TYPE.delivery
              ? params.customerInfo.city?.trim() || ""
              : "",
          ADDRESS_COUNTRY_CODE: params.customerInfo.country || "CH",
          PHONE_NUMBER: params.customerInfo.phone.trim(),
          EMAIL_ADDRESS: normalizeEmail(params.customerInfo.email),
          ORDER_GROSS_AMOUNT: params.totalAmount,
          ORDER_NET_AMOUNT: params.totalAmount - chf(params.discount?.amountCents ?? 0),
          ORDER_AMOUNT: params.totalAmount - chf(params.discount?.amountCents ?? 0),
          ORDER_DISCOUNT_AMOUNT: chf(params.discount?.amountCents ?? 0),
          DISCOUNT_ID: params.discount?.id ?? null,
          DISCOUNT_NAME: params.discount?.name ?? null,
          DISCOUNT_TYPE: params.discount?.type ?? null,
          DISCOUNT_VALUE: params.discount?.value ?? null,
          DISCOUNT_CODE: params.discount?.code ?? null,
          SHIPPING_CHARGES: params.shippingCharges,
          ORDER_FINAL_AMOUNT: params.totalAmount - chf(params.discount?.amountCents ?? 0) + params.shippingCharges,
          CHECKOUT_REQUEST_ID: params.requestId,
        },
      });
      const orderWithNumber = await tx.business_order.update({
        where: { BUSINESS_ORDER_ID: order.BUSINESS_ORDER_ID },
        data: { ORDER_NUMBER: generateOrderNumberFromId(order.BUSINESS_ORDER_ID) },
      });
      for (const item of params.items) {
        await tx.$executeRaw`
          INSERT INTO business_order_detail (
            CREATION_DATETIME, BUSINESS_ORDER_ID,
            BUSINESS_PRODUCT_ID, ORDER_QUANTITY, PRODUCT_SELL_PRICE,
            PRODUCT_PRICE, QUANTITY_BALANCE
          ) VALUES (
            NOW(), ${order.BUSINESS_ORDER_ID},
            ${Number(item.id)}, ${item.quantity}, ${item.price},
            ${item.price * item.quantity}, ${item.quantity}
          )
        `;
      }
      return { order: orderWithNumber, created: true };
    });
  } catch (error) {
    const duplicate = await findByRequestId(params.requestId);
    if (duplicate) return { order: duplicate, created: false };
    throw error;
  }
}

function guestTracking(order: ExistingOrder, origin: string) {
  const token = createGuestOrderToken({
    orderId: order.BUSINESS_ORDER_ID,
    email: order.EMAIL_ADDRESS || "",
    createdAt: order.CREATION_DATETIME,
  });
  const path = `/order/success?orderId=${order.BUSINESS_ORDER_ID}&guestToken=${encodeURIComponent(token)}`;
  return { token, path, url: `${origin}${path}` };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid request body", { status: 400 });
  const {
    items,
    customerInfo,
    checkoutRequestId,
    orderType = ORDER_TYPE.delivery,
    paymentMethod = "card",
    couponCode,
    expectedItemsTotalCents,
    expectedDiscountId,
  } = body as {
    items: CartItem[];
    customerInfo: CustomerInfo;
    checkoutRequestId?: string;
    orderType?: "delivery" | "pickup";
    paymentMethod?: PaymentMethod;
    couponCode?: unknown;
    expectedItemsTotalCents?: unknown;
    expectedDiscountId?: unknown;
  };

  if (!Array.isArray(items) || !items.length) {
    return new NextResponse("Cart is empty", { status: 400 });
  }
  if (!customerInfo || typeof customerInfo !== "object") {
    return new NextResponse("Customer information is required", { status: 400 });
  }
  if (!checkoutRequestId || !/^[a-zA-Z0-9-]{16,64}$/.test(checkoutRequestId)) {
    return new NextResponse("Invalid checkout request", { status: 400 });
  }
  if (orderType !== ORDER_TYPE.delivery && orderType !== ORDER_TYPE.pickup) {
    return new NextResponse("Invalid order type", { status: 400 });
  }
  const textFields: (keyof CustomerInfo)[] = [
    "firstName",
    "lastName",
    "email",
    "phone",
    ...(orderType === ORDER_TYPE.delivery
      ? (["street", "zip", "city", "country"] as (keyof CustomerInfo)[])
      : []),
  ];
  if (textFields.some((field) => typeof customerInfo[field] !== "string")) {
    return new NextResponse("Customer fields must be text.", { status: 400 });
  }
  if (!(["card", "cash_on_delivery", "pay_at_pickup"] as string[]).includes(paymentMethod)) {
    return new NextResponse("Invalid payment method", { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const visitorId = await visitorIdFor(session?.user?.email);
  const isGuest = visitorId === 0;
  let origin: string;
  try {
    origin = getPublicAppOrigin();
  } catch {
    console.error("Checkout public URL configuration is invalid.");
    return new NextResponse("Checkout is temporarily unavailable.", { status: 500 });
  }
  const existing = await findByRequestId(checkoutRequestId);
  if (existing) {
    const sameIdentity =
      normalizeEmail(existing.EMAIL_ADDRESS || "") ===
        normalizeEmail(customerInfo.email || "") &&
      (isGuest
        ? Number(existing.VISITOR_ID ?? 0) === 0
        : Number(existing.VISITOR_ID ?? 0) === visitorId);
    if (!sameIdentity) {
      return new NextResponse("Checkout request conflicts with an existing order.", { status: 409 });
    }
    if (existing.INVENTORY_RELEASED_DATETIME) {
      return new NextResponse("This checkout expired. Please submit the cart again.", { status: 409 });
    }
    if (existing.STRIPE_CHECKOUT_SESSION_ID) {
      return NextResponse.json({
        sessionId: existing.STRIPE_CHECKOUT_SESSION_ID,
        orderId: existing.BUSINESS_ORDER_ID,
      });
    }
    if (existing.PAYMENT_MODE !== "stripe") {
      const tracking = isGuest ? guestTracking(existing, origin) : null;
      return NextResponse.json({
        orderId: existing.BUSINESS_ORDER_ID,
        redirectUrl:
          tracking?.path ||
          `/order/success?orderId=${existing.BUSINESS_ORDER_ID}`,
      });
    }
    if (paymentMethod !== "card") {
      return new NextResponse("This checkout is already awaiting card payment.", { status: 409 });
    }
    if (existing.PAYMENT_DONE === PAYMENT_DONE.failed) {
      return new NextResponse("This checkout expired. Please submit the cart again.", { status: 409 });
    }
  }

  if (isGuest && !existing) {
    try {
      await enforceGuestCheckoutRateLimit(req.headers, customerInfo.email);
    } catch (error) {
      if (error instanceof GuestCheckoutRateLimitError) {
        return new NextResponse(error.message, {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        });
      }
      console.error("Guest checkout rate limiting failed", error);
      return new NextResponse("Checkout is temporarily unavailable.", { status: 503 });
    }
  }

  const resumingCardOrder = existing?.PAYMENT_MODE === "stripe";
  const effectiveOrderType = resumingCardOrder
    ? existing?.ORDER_TYPE === ORDER_TYPE.pickup
      ? ORDER_TYPE.pickup
      : ORDER_TYPE.delivery
    : orderType;
  let trustedItems: TrustedItem[];
  let businessId: number;
  if (resumingCardOrder && existing) {
    businessId = Number(existing.BUSINESS_ID);
    const details = await prisma.business_order_detail.findMany({
      where: { BUSINESS_ORDER_ID: existing.BUSINESS_ORDER_ID },
    });
    const persistedProducts = await prisma.business_product.findMany({
      where: {
        BUSINESS_PRODUCT_ID: {
          in: details
            .map((detail) => detail.BUSINESS_PRODUCT_ID)
            .filter((id): id is number => id !== null),
        },
      },
      select: { BUSINESS_PRODUCT_ID: true, TITLE: true, PIC: true },
    });
    const productById = new Map(
      persistedProducts.map((product) => [product.BUSINESS_PRODUCT_ID, product])
    );
    trustedItems = details.map((detail) => ({
      id: String(detail.BUSINESS_PRODUCT_ID),
      businessId: String(businessId),
      name: productById.get(detail.BUSINESS_PRODUCT_ID || 0)?.TITLE || "Product",
      image: productById.get(detail.BUSINESS_PRODUCT_ID || 0)?.PIC || undefined,
      price: Number(detail.PRODUCT_SELL_PRICE),
      quantity: Number(detail.ORDER_QUANTITY),
    }));
  } else {
    let products;
    try {
      products = await validateCartInventory(items);
    } catch (error) {
      return new NextResponse(error instanceof Error ? error.message : "Invalid cart item", { status: 400 });
    }
    const productById = new Map(products.map((product) => [product.BUSINESS_PRODUCT_ID, product]));
    trustedItems = items.map((item) => {
      const product = productById.get(Number(item.id))!;
      return {
        ...item,
        businessId: String(product.BUSINESS_ID),
        image: product.PIC || undefined,
        name: product.TITLE,
        price: Number(product.PRODUCT_PRICE),
        quantity: Number(item.quantity),
      };
    });
    const businessIds = Array.from(new Set(products.map((product) => product.BUSINESS_ID).filter(Boolean)));
    if (businessIds.length !== 1) {
      return new NextResponse("You can only order from one restaurant at a time.", { status: 400 });
    }
    businessId = Number(businessIds[0]);
    const onlineProducts = await getBusinessMenuWithProducts(businessId);
    const availableOnline = new Set(
      onlineProducts.map((product) => Number(product.BUSINESS_PRODUCT_ID))
    );
    if (trustedItems.some((item) => !availableOnline.has(Number(item.id)))) {
      return new NextResponse("One or more products are no longer available online. Refresh the menu and try again.", {
        status: 409,
      });
    }
  }
  const [settings, cashSettings, business] = await Promise.all([
    prisma.business_settings.findUnique({ where: { BUSINESS_ID: businessId } }),
    prisma.$queryRaw<Array<{
      CASH_ON_DELIVERY_ENABLED: number | null;
      CASH_ON_PICKUP_ENABLED: number | null;
    }>>`
      SELECT CASH_ON_DELIVERY_ENABLED, CASH_ON_PICKUP_ENABLED
      FROM business_settings
      WHERE BUSINESS_ID = ${businessId}
      LIMIT 1
    `,
    prisma.business.findUnique({
      where: { BUSINESS_ID: businessId },
      select: { BUSINESS_NAME: true },
    }),
  ]);
  const options = getFulfillmentOptions(settings);
  const totalAmount = resumingCardOrder
    ? Number(existing?.ORDER_GROSS_AMOUNT ?? 0)
    : trustedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalCents = cents(totalAmount);
  let appliedDiscount: AppliedDiscount | null = null;
  if (resumingCardOrder && existing?.DISCOUNT_ID) {
    appliedDiscount = {
      id: existing.DISCOUNT_ID, name: existing.DISCOUNT_NAME || "Discount",
      type: existing.DISCOUNT_TYPE === "fixed" ? "fixed" : "percentage",
      value: Number(existing.DISCOUNT_VALUE ?? 0), amountCents: cents(Number(existing.ORDER_DISCOUNT_AMOUNT ?? 0)),
      code: existing.DISCOUNT_CODE,
    };
  }
  let shippingCharges = resumingCardOrder
    ? Number(existing?.SHIPPING_CHARGES ?? 0)
    : 0;
  const requiredFields: (keyof CustomerInfo)[] = ["firstName", "lastName", "email", "phone"];
  if (!resumingCardOrder && orderType === ORDER_TYPE.delivery) {
    requiredFields.push("street", "zip", "city", "country");
    const quote = getDeliveryQuote(settings, customerInfo.zip || "", totalAmount);
    if (!quote.available) {
      return new NextResponse(quote.reason || "Delivery unavailable", { status: 400 });
    }
    shippingCharges = quote.deliveryPrice;
  } else if (!resumingCardOrder && !options.pickupEnabled) {
    return new NextResponse("Pickup is currently unavailable", { status: 400 });
  }
  if (!resumingCardOrder) {
    try {
      appliedDiscount = (await resolveOnlineDiscount(
        businessId, subtotalCents, couponCode,
        paymentMethod === "card" ? Math.max(1, 50 - cents(shippingCharges)) : 1
      )).applied;
    } catch (error) {
      return new NextResponse(error instanceof Error ? error.message : "Discount unavailable.", { status: 409 });
    }
    if (Number(expectedItemsTotalCents) !== subtotalCents - (appliedDiscount?.amountCents ?? 0) ||
      (expectedDiscountId == null ? null : Number(expectedDiscountId)) !== (appliedDiscount?.id ?? null)) {
      return new NextResponse("Order total changed. Review your discount and try again.", { status: 409 });
    }
  }
  const missingFields = requiredFields.filter((field) => !String(customerInfo[field] ?? "").trim());
  if (missingFields.length) {
    return new NextResponse(`Missing required fields: ${missingFields.join(", ")}`, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim())) {
    return new NextResponse("Enter a valid email address.", { status: 400 });
  }

  const allowedPaymentMethods = getAvailablePaymentMethods(effectiveOrderType, {
    cashOnDeliveryEnabled: cashSettings[0]?.CASH_ON_DELIVERY_ENABLED === 1,
    cashOnPickupEnabled: cashSettings[0]?.CASH_ON_PICKUP_ENABLED === 1,
  });
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return new NextResponse("This payment method is not available for the selected order type.", { status: 400 });
  }
  if (paymentMethod === "card" && cents(totalAmount - chf(appliedDiscount?.amountCents ?? 0) + shippingCharges) < 50) {
    return new NextResponse("Card payments require at least CHF 0.50 after discounts.", { status: 409 });
  }

  if (
    existing &&
    (existing.BUSINESS_ID !== businessId ||
      normalizeEmail(existing.EMAIL_ADDRESS || "") !== normalizeEmail(customerInfo.email))
  ) {
    return new NextResponse("Checkout request conflicts with an existing order.", { status: 409 });
  }

  let result;
  try {
    result = await createUnpaidOrder({
      items: trustedItems,
      businessId,
      customerInfo,
      orderType: effectiveOrderType,
      paymentMethod: paymentMethod === "card" ? "stripe" : paymentMethod,
      requestId: checkoutRequestId,
      shippingCharges,
      totalAmount,
      discount: appliedDiscount,
      visitorId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Only ")) {
      return new NextResponse(error.message, { status: 409 });
    }
    console.error("Checkout order creation failed", error);
    return new NextResponse("Checkout could not be completed. Please retry.", { status: 503 });
  }
  const order = result.order as ExistingOrder;
  appliedDiscount = order.DISCOUNT_ID ? {
    id: order.DISCOUNT_ID,
    name: order.DISCOUNT_NAME || "Discount",
    type: order.DISCOUNT_TYPE === "fixed" ? "fixed" : "percentage",
    value: Number(order.DISCOUNT_VALUE ?? 0),
    amountCents: cents(Number(order.ORDER_DISCOUNT_AMOUNT ?? 0)),
    code: order.DISCOUNT_CODE,
  } : null;
  const tracking = isGuest ? guestTracking(order, origin) : null;

  const emailGuest = async (paymentStatus: string) => {
    if (!isGuest || !result.created || !tracking) return;
    await sendGuestOrderEmailSafely(
      sendEmail,
      customerInfo.email,
      {
        orderNumber: order.ORDER_NUMBER || generateOrderNumberFromId(order.BUSINESS_ORDER_ID),
        restaurantName: business?.BUSINESS_NAME || "Restaurant",
        items: trustedItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          subtotal: `CHF ${(item.price * item.quantity).toFixed(2)}`,
        })),
        discount: appliedDiscount ? { name: appliedDiscount.name, amount: `CHF ${chf(appliedDiscount.amountCents).toFixed(2)}` } : null,
        total: `CHF ${(totalAmount - chf(appliedDiscount?.amountCents ?? 0) + shippingCharges).toFixed(2)}`,
        paymentStatus,
        fulfillment: effectiveOrderType === "pickup" ? "Pickup" : "Delivery",
        trackingUrl: tracking.url,
      },
      order.BUSINESS_ORDER_ID
    );
  };

  if (paymentMethod !== "card") {
    await emailGuest("Payment pending");
    return NextResponse.json({
      orderId: order.BUSINESS_ORDER_ID,
      redirectUrl: tracking?.path || `/order/success?orderId=${order.BUSINESS_ORDER_ID}`,
    });
  }
  if (order.STRIPE_CHECKOUT_SESSION_ID) {
    return NextResponse.json({
      sessionId: order.STRIPE_CHECKOUT_SESSION_ID,
      orderId: order.BUSINESS_ORDER_ID,
    });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = trustedItems.map((item) => ({
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
    orderId: String(order.BUSINESS_ORDER_ID),
    businessId: String(businessId),
    customerId: String(visitorId || customerInfo.userId || "guest"),
    customerEmail: normalizeEmail(customerInfo.email),
    customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
    customerPhone: customerInfo.phone,
    orderType: effectiveOrderType,
    paymentMethod,
    shippingCharges: shippingCharges.toFixed(2),
    totalAmount: (totalAmount - chf(appliedDiscount?.amountCents ?? 0) + shippingCharges).toFixed(2),
  };
  const successParams = tracking
    ? `&orderId=${order.BUSINESS_ORDER_ID}&guestToken=${encodeURIComponent(tracking.token)}`
    : "";
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}${successParams}`,
    cancel_url: `${origin}/cart`,
    client_reference_id: visitorId ? String(visitorId) : undefined,
    metadata,
    payment_intent_data: { metadata },
    submit_type: "pay",
    shipping_options: [{
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: { amount: Math.round(shippingCharges * 100), currency: "chf" },
        display_name: effectiveOrderType === ORDER_TYPE.pickup ? "Pickup" : "Delivery",
      },
    }],
    customer_email: normalizeEmail(customerInfo.email),
    phone_number_collection: { enabled: true },
  };
  if (effectiveOrderType === ORDER_TYPE.delivery) {
    sessionConfig.shipping_address_collection = { allowed_countries: ["CH"] };
  }
  if (appliedDiscount?.amountCents) {
    try {
      const couponId = `fdz-order-${checkoutRequestId}`;
      let coupon: Stripe.Coupon;
      try {
        coupon = await stripe.coupons.create({
          id: couponId, amount_off: appliedDiscount.amountCents,
          currency: "chf", duration: "once", name: appliedDiscount.name,
        }, { idempotencyKey: `discount-${checkoutRequestId}` });
      } catch {
        coupon = await stripe.coupons.retrieve(couponId);
      }
      if (!coupon.valid || coupon.amount_off !== appliedDiscount.amountCents || coupon.currency !== "chf") {
        throw new Error("Stripe coupon does not match the order discount.");
      }
      sessionConfig.discounts = [{ coupon: coupon.id }];
    } catch (error) {
      console.error("Stripe discount creation failed", error);
      return new NextResponse("Card discount could not be prepared. Please retry this checkout.", { status: 502 });
    }
  }
  let checkoutSession: Stripe.Checkout.Session;
  try {
    checkoutSession = await stripe.checkout.sessions.create(sessionConfig, {
      idempotencyKey: checkoutRequestId,
    });
    if (checkoutSession.currency !== "chf" || checkoutSession.amount_total !== cents(Number(order.ORDER_FINAL_AMOUNT))) {
      throw new Error("Stripe checkout amount does not match the order total.");
    }
    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id;
    await prisma.business_order.update({
      where: { BUSINESS_ORDER_ID: order.BUSINESS_ORDER_ID },
      data: {
        STRIPE_CHECKOUT_SESSION_ID: checkoutSession.id,
        STRIPE_PAYMENT_INTENT_ID: paymentIntentId || null,
      },
    });
  } catch (error) {
    console.error("Stripe checkout creation failed", {
      orderId: order.BUSINESS_ORDER_ID,
      error: error instanceof Error ? error.message : "Unknown Stripe error",
    });
    return new NextResponse("Card checkout could not be started. Please retry this checkout.", {
      status: 502,
    });
  }
  await emailGuest("Card payment pending");
  return NextResponse.json({
    sessionId: checkoutSession.id,
    orderId: order.BUSINESS_ORDER_ID,
  });
}
