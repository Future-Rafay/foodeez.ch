"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, MapPin } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import {
  formatCHF,
  getOrderProgressSteps,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  isPickupOrder,
} from "@/lib/orderStatus";
import { generateSlug } from "@/lib/utils/genSlug";

type Order = {
  BUSINESS_ORDER_ID: number;
  BUSINESS_ID?: number | null;
  CREATION_DATETIME?: string | null;
  DELIVERY_ET?: string | null;
  ORDER_STATUS?: number | null;
  ORDER_TYPE: string;
  PAYMENT_DONE?: number | null;
  PAYMENT_MODE?: string | null;
  ADDRESS_STREET?: string | null;
  ADDRESS_ZIP?: string | null;
  ADDRESS_TOWN?: string | null;
  ADDRESS_COUNTRY_CODE?: string | null;
  ORDER_GROSS_AMOUNT: number;
  ORDER_DISCOUNT_AMOUNT: number;
  SHIPPING_CHARGES: number;
  ORDER_TAX_AMOUNT: number;
  ORDER_REFUND_AMOUNT: number;
  ORDER_FINAL_AMOUNT: number;
  business?: {
    BUSINESS_ID: number;
    BUSINESS_NAME?: string | null;
    ADDRESS_STREET?: string | null;
    ADDRESS_ZIP?: string | null;
    ADDRESS_TOWN?: string | null;
    ADDRESS_COUNTRY?: string | null;
    PICKUP_INSTRUCTIONS?: string | null;
    DEFAULT_DELIVERY_PREP_MINUTES?: number | null;
    DEFAULT_PICKUP_PREP_MINUTES?: number | null;
  } | null;
  details: Array<{
    BUSINESS_ORDER_DETAIL_ID: number;
    ORDER_QUANTITY?: number | null;
    PRODUCT_SELL_PRICE: number;
    PRODUCT_PRICE: number;
    product?: { TITLE?: string | null; PRODUCT_PRICE?: number | null } | null;
  }>;
};

const dateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : null;

const defaultEta = (order: Order) => {
  if (order.DELIVERY_ET) return dateTime(order.DELIVERY_ET);
  if (!order.CREATION_DATETIME) return null;

  const minutes = isPickupOrder(order)
    ? order.business?.DEFAULT_PICKUP_PREP_MINUTES ?? 20
    : order.business?.DEFAULT_DELIVERY_PREP_MINUTES ?? 45;
  const eta = new Date(order.CREATION_DATETIME);
  eta.setMinutes(eta.getMinutes() + minutes);
  return eta.toLocaleString();
};

function Timeline({ order }: { order: Order }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {getOrderProgressSteps(order).map((step) => (
        <div key={step.status} className="rounded-lg border bg-white p-3">
          <span className={`mb-2 block h-2 w-2 rounded-full ${step.status <= (order.ORDER_STATUS ?? 0) ? "bg-primary" : "bg-gray-300"}`} />
          <p className="text-sm font-medium">{step.label}</p>
        </div>
      ))}
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderIdParam = searchParams.get("orderId");
  const { clearCart } = useCartStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  const loadOrder = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      let orderId = Number(orderIdParam);

      if (!orderId && sessionId) {
        const verifyResponse = await fetch(`/api/order/verify?session_id=${sessionId}`, { cache: "no-store" });
        const verifyData = await verifyResponse.json().catch(() => ({}));
        if (!verifyResponse.ok) throw new Error(verifyData.error || "Failed to verify order");
        orderId = Number(verifyData.orderId);
      }

      if (!orderId) throw new Error("Order could not be found. Please check My Orders.");

      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Order could not be found.");

      setOrder(data.order);
      clearCart();
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be loaded.");
      setStatus("error");
    }
  }, [clearCart, orderIdParam, sessionId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <h2 className="text-xl font-semibold">Loading your order</h2>
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className="mx-auto my-8 max-w-3xl rounded-xl bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-600" />
        <h1 className="mb-2 text-2xl font-bold">Order not found</h1>
        <p className="mb-6 text-gray-600">{error}</p>
        <Link href="/dashboard/orders" className="inline-flex rounded-md bg-primary px-5 py-3 font-medium text-white hover:bg-primary-dark">
          View my orders
        </Link>
      </div>
    );
  }

  const pickup = isPickupOrder(order);
  const eta = defaultEta(order);
  const restaurantHref = order.business?.BUSINESS_ID
    ? `/business/${generateSlug(order.business.BUSINESS_NAME || "restaurant", order.business.BUSINESS_ID)}/menu`
    : "/";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-xl border bg-white p-6 text-center shadow-sm">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
        <h1 className="main-heading mb-2">Order received</h1>
        <p className="text-gray-600">Order #{order.BUSINESS_ORDER_ID}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{getOrderStatusLabel(order)}</span>
          <span className="rounded-full bg-gray-100 px-3 py-1">{getPaymentStatusLabel(order.PAYMENT_DONE)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">{pickup ? "Pickup order" : "Delivery order"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 text-primary" />
              <div className="text-sm text-gray-700">
                {pickup ? (
                  <>
                    <p className="font-medium">{order.business?.BUSINESS_NAME || "Restaurant"}</p>
                    <p>{order.business?.ADDRESS_STREET}</p>
                    <p>{[order.business?.ADDRESS_ZIP, order.business?.ADDRESS_TOWN].filter(Boolean).join(" ")}</p>
                    <p>{order.business?.ADDRESS_COUNTRY || "CH"}</p>
                  </>
                ) : (
                  <>
                    <p>{order.ADDRESS_STREET}</p>
                    <p>{[order.ADDRESS_ZIP, order.ADDRESS_TOWN].filter(Boolean).join(" ")}</p>
                    <p>{order.ADDRESS_COUNTRY_CODE || "CH"}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-1 h-5 w-5 text-primary" />
              <div className="text-sm text-gray-700">
                <p className="font-medium">{pickup ? "Estimated pickup time" : "Estimated delivery time"}</p>
                <p>
                  {order.DELIVERY_ET
                    ? eta
                    : `${pickup ? "Estimated pickup time" : "Estimated delivery time"}: around ${eta || "soon"}`}
                </p>
              </div>
            </div>
          </div>
          {pickup && order.business?.PICKUP_INSTRUCTIONS && (
            <p className="mt-4 rounded-md border bg-gray-50 p-3 text-sm text-gray-700">{order.business.PICKUP_INSTRUCTIONS}</p>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Payment summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Gross amount</dt><dd>{formatCHF(order.ORDER_GROSS_AMOUNT)}</dd></div>
            <div className="flex justify-between"><dt>Discount</dt><dd>{formatCHF(order.ORDER_DISCOUNT_AMOUNT)}</dd></div>
            <div className="flex justify-between"><dt>Delivery fee</dt><dd>{formatCHF(order.SHIPPING_CHARGES)}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{formatCHF(order.ORDER_TAX_AMOUNT)}</dd></div>
            {order.ORDER_REFUND_AMOUNT > 0 && (
              <div className="flex justify-between text-blue-700"><dt>Refund amount</dt><dd>{formatCHF(order.ORDER_REFUND_AMOUNT)}</dd></div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold"><dt>Final total</dt><dd>{formatCHF(order.ORDER_FINAL_AMOUNT)}</dd></div>
            <div className="flex justify-between"><dt>Payment mode</dt><dd>{order.PAYMENT_MODE || "Not set"}</dd></div>
            <div className="flex justify-between"><dt>Payment status</dt><dd>{getPaymentStatusLabel(order.PAYMENT_DONE)}</dd></div>
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Order timeline</h2>
        <Timeline order={order} />
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Items</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">Product</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.details.map((item) => {
              const quantity = item.ORDER_QUANTITY || 1;
              const unit = item.PRODUCT_SELL_PRICE || item.product?.PRODUCT_PRICE || 0;
              return (
                <tr key={item.BUSINESS_ORDER_DETAIL_ID}>
                  <td className="py-3">{item.product?.TITLE || "Product"}</td>
                  <td>{quantity}</td>
                  <td>{formatCHF(unit)}</td>
                  <td>{formatCHF(item.PRODUCT_PRICE || unit * quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/dashboard/orders" className="inline-flex justify-center rounded-md bg-primary px-5 py-3 font-medium text-white hover:bg-primary-dark">
          View my orders
        </Link>
        <Link href={restaurantHref} className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50">
          Continue browsing
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-10 text-center">Loading your order...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
