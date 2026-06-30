"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, X, XCircle } from "lucide-react";
import {
  formatCHF,
  getOrderProgressSteps,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  ORDER_STATUS,
  PAYMENT_DONE,
  isPickupOrder,
} from "@/lib/orderStatus";

type OrderItem = {
  BUSINESS_ORDER_DETAIL_ID: number;
  ORDER_QUANTITY?: number | null;
  PRODUCT_SELL_PRICE: number;
  PRODUCT_DISCOUNT: number;
  PRODUCT_PRICE: number;
  product?: {
    TITLE?: string | null;
    PRODUCT_PRICE?: number | null;
  } | null;
};

type Order = {
  BUSINESS_ORDER_ID: number;
  CREATION_DATETIME?: string | null;
  PAYMENT_DONE?: number | null;
  PAYMENT_MODE?: string | null;
  DELIVERY_ET?: string | null;
  ORDER_STATUS?: number | null;
  ORDER_TYPE: string;
  ADDRESS_STREET?: string | null;
  ADDRESS_ZIP?: string | null;
  ADDRESS_TOWN?: string | null;
  ADDRESS_COUNTRY_CODE?: string | null;
  ORDER_GROSS_AMOUNT: number;
  ORDER_TAX_AMOUNT: number;
  ORDER_DISCOUNT_AMOUNT: number;
  SHIPPING_CHARGES: number;
  ORDER_REFUND_AMOUNT: number;
  ORDER_FINAL_AMOUNT: number;
  ORDER_REJECTION_REASON?: string | null;
  ORDER_REJECTION_NOTE?: string | null;
  business?: {
    BUSINESS_NAME?: string | null;
    ADDRESS_STREET?: string | null;
    ADDRESS_ZIP?: string | null;
    ADDRESS_TOWN?: string | null;
    ADDRESS_COUNTRY?: string | null;
    DEFAULT_DELIVERY_PREP_MINUTES?: number | null;
    DEFAULT_PICKUP_PREP_MINUTES?: number | null;
  } | null;
  details: OrderItem[];
};

const filters = ["All", "Active", "Completed", "Cancelled / Rejected", "Refunded"] as const;
type Filter = (typeof filters)[number];

const dateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "Not set";

const estimatedTime = (order: Order) => {
  if (order.DELIVERY_ET) return dateTime(order.DELIVERY_ET);
  if (!order.CREATION_DATETIME) return "Not set";
  const minutes = isPickupOrder(order)
    ? order.business?.DEFAULT_PICKUP_PREP_MINUTES ?? 20
    : order.business?.DEFAULT_DELIVERY_PREP_MINUTES ?? 45;
  const eta = new Date(order.CREATION_DATETIME);
  eta.setMinutes(eta.getMinutes() + minutes);
  return `around ${eta.toLocaleString()}`;
};

const isActiveOrder = (order: Order) =>
  isPickupOrder(order)
    ? [ORDER_STATUS.preparing, ORDER_STATUS.readyForPickup].some((status) => status === order.ORDER_STATUS)
    : [ORDER_STATUS.preparing, ORDER_STATUS.outForDelivery].some((status) => status === order.ORDER_STATUS);

const isCompletedOrder = (order: Order) =>
  isPickupOrder(order)
    ? order.ORDER_STATUS === ORDER_STATUS.pickedUp
    : order.ORDER_STATUS === ORDER_STATUS.delivered;

const isRefundedOrder = (order: Order) =>
  order.PAYMENT_DONE === PAYMENT_DONE.refunded || order.ORDER_REFUND_AMOUNT > 0;

const matchesFilter = (order: Order, filter: Filter) => {
  if (filter === "Active") return isActiveOrder(order);
  if (filter === "Completed") return isCompletedOrder(order);
  if (filter === "Cancelled / Rejected") return order.ORDER_STATUS === ORDER_STATUS.rejected;
  if (filter === "Refunded") return isRefundedOrder(order);
  return true;
};

function Timeline({ order }: { order: Order }) {
  const steps = getOrderProgressSteps(order);
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => {
        const done = step.status === order.ORDER_STATUS || step.status < (order.ORDER_STATUS ?? 0);
        return (
          <div key={step.status} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${done ? "bg-primary" : "bg-gray-300"}`} />
            <span className="text-sm text-gray-700">{step.label}</span>
          </div>
        );
      })}
      {order.ORDER_STATUS === ORDER_STATUS.rejected && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">{order.ORDER_REJECTION_REASON || "Rejected"}</p>
          {order.ORDER_REJECTION_NOTE && <p>{order.ORDER_REJECTION_NOTE}</p>}
        </div>
      )}
    </div>
  );
}

function OrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const paidNotRefunded = order.PAYMENT_DONE === PAYMENT_DONE.paid && !isRefundedOrder(order);
  const rejected = order.ORDER_STATUS === ORDER_STATUS.rejected;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
      <div className="mx-auto max-w-4xl rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold">Order #{order.BUSINESS_ORDER_ID}</h2>
            <p className="text-sm text-gray-500">{order.business?.BUSINESS_NAME || "Restaurant"}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <section className="space-y-3">
            <h3 className="font-semibold">Status</h3>
            <p className="text-sm text-gray-700">{isPickupOrder(order) ? "Pickup" : "Delivery"} order</p>
            <Timeline order={order} />
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Payment details</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Mode</dt><dd>{order.PAYMENT_MODE || "Not set"}</dd>
              <dt className="text-gray-500">Status</dt><dd>{getPaymentStatusLabel(order.PAYMENT_DONE)}</dd>
              <dt className="text-gray-500">Gross</dt><dd>{formatCHF(order.ORDER_GROSS_AMOUNT)}</dd>
              <dt className="text-gray-500">Discount</dt><dd>{formatCHF(order.ORDER_DISCOUNT_AMOUNT)}</dd>
              <dt className="text-gray-500">Delivery fee</dt>
              <dd>
                {!isPickupOrder(order) && order.SHIPPING_CHARGES === 0 ? (
                  <span className="text-green-700">Free delivery</span>
                ) : (
                  formatCHF(order.SHIPPING_CHARGES)
                )}
              </dd>
              <dt className="text-gray-500">Tax</dt><dd>{formatCHF(order.ORDER_TAX_AMOUNT)}</dd>
              <dt className="text-gray-500">Refund</dt><dd>{formatCHF(order.ORDER_REFUND_AMOUNT)}</dd>
              <dt className="font-medium">Final total</dt><dd className="font-medium">{formatCHF(order.ORDER_FINAL_AMOUNT)}</dd>
            </dl>
            {isRefundedOrder(order) && (
              <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">Refunded: {formatCHF(order.ORDER_REFUND_AMOUNT)}</p>
            )}
            {!isPickupOrder(order) && order.SHIPPING_CHARGES === 0 && (
              <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">Free delivery applied.</p>
            )}
            {rejected && paidNotRefunded && (
              <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">Refund pending</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">{isPickupOrder(order) ? "Pickup address" : "Delivery address"}</h3>
            {isPickupOrder(order) ? (
              <p className="text-sm text-gray-700">
                {order.business?.ADDRESS_STREET}<br />
                {[order.business?.ADDRESS_ZIP, order.business?.ADDRESS_TOWN].filter(Boolean).join(" ")}<br />
                {order.business?.ADDRESS_COUNTRY || "CH"}
              </p>
            ) : (
              <p className="text-sm text-gray-700">
                {order.ADDRESS_STREET}<br />
                {[order.ADDRESS_ZIP, order.ADDRESS_TOWN].filter(Boolean).join(" ")}<br />
                {order.ADDRESS_COUNTRY_CODE || "CH"}
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Estimated time</h3>
            <p className="text-sm text-gray-700">
              Estimated {isPickupOrder(order) ? "pickup" : "delivery"} time: {estimatedTime(order)}
            </p>
          </section>
        </div>

        <div className="overflow-x-auto border-t p-5">
          <h3 className="mb-3 font-semibold">Items</h3>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Discount</th>
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
                    <td>{formatCHF(item.PRODUCT_DISCOUNT)}</td>
                    <td>{formatCHF(item.PRODUCT_PRICE || unit * quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/orders/history", { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(Array.from(new Map((data.orders || []).map((order: Order) => [order.BUSINESS_ORDER_ID, order])).values()) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visibleOrders = useMemo(
    () => orders.filter((order) => matchesFilter(order, filter)),
    [orders, filter]
  );
  const activeOrder = orders.find(isActiveOrder);
  const stats = [
    ["Total orders", orders.length],
    ["Active orders", orders.filter(isActiveOrder).length],
    ["Completed orders", orders.filter(isCompletedOrder).length],
    ["Refunded orders", orders.filter(isRefundedOrder).length],
  ];

  return (
    <div className="mx-auto px-4 lg:px-0 py-8 space-y-8">
      <div>
        <h1 className="sub-heading">My orders</h1>
        <p className="text-gray-500">Track your recent orders and payments</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex gap-3">
            <XCircle className="h-5 w-5" />
            <div>
              <p className="text-sm">{error}</p>
              <button onClick={fetchOrders} className="mt-2 text-sm font-medium underline">Try again</button>
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">No orders yet</h3>
          <p className="mx-auto mt-2 max-w-md text-gray-500">
            When you place an order, you’ll be able to track it here.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark">
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-white p-4">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {activeOrder && (
            <button
              onClick={() => setSelectedOrder(activeOrder)}
              className="w-full rounded-lg border border-primary/30 bg-primary/5 p-5 text-left hover:bg-primary/10"
            >
              <p className="text-sm font-medium text-primary">Recent active order</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Order #{activeOrder.BUSINESS_ORDER_ID}</p>
                  <p className="text-sm text-gray-600">{activeOrder.business?.BUSINESS_NAME || "Restaurant"} · {getOrderStatusLabel(activeOrder)}</p>
                </div>
                <p className="font-semibold">{formatCHF(activeOrder.ORDER_FINAL_AMOUNT)}</p>
              </div>
            </button>
          )}

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1 text-sm ${filter === item ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="hidden grid-cols-8 gap-4 border-b bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 lg:grid">
              <span>Order</span>
              <span>Restaurant</span>
              <span>Type</span>
              <span>Status</span>
              <span>Payment</span>
              <span>Date</span>
              <span>ETA</span>
              <span className="text-right">Amount</span>
            </div>
            {visibleOrders.map((order) => (
              <button
                key={order.BUSINESS_ORDER_ID}
                onClick={() => setSelectedOrder(order)}
                className="grid w-full gap-2 border-b px-4 py-4 text-left hover:bg-gray-50 lg:grid-cols-8 lg:gap-4"
              >
                <span className="font-medium">#{order.BUSINESS_ORDER_ID}</span>
                <span>{order.business?.BUSINESS_NAME || "Restaurant"}</span>
                <span>{isPickupOrder(order) ? "Pickup" : "Delivery"}</span>
                <span>{getOrderStatusLabel(order)}</span>
                <span>{getPaymentStatusLabel(order.PAYMENT_DONE)}</span>
                <span>{dateTime(order.CREATION_DATETIME)}</span>
                <span>{order.DELIVERY_ET ? dateTime(order.DELIVERY_ET) : "Not set"}</span>
                <span className="lg:text-right">
                  {formatCHF(order.ORDER_FINAL_AMOUNT)}
                  {order.ORDER_REFUND_AMOUNT > 0 && (
                    <span className="block text-xs text-blue-700">Refund {formatCHF(order.ORDER_REFUND_AMOUNT)}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
