"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  ReceiptText,
  RefreshCcw,
  ShoppingBag,
  Truck,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  formatCHF,
  getDisplayEta,
  getDisplayOrderNumber,
  getOrderProgressSteps,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  ORDER_STATUS,
  PAYMENT_DONE,
  isPickupOrder,
} from "@/lib/orderStatus";
import {
  ChangedField,
  ChangedOrders,
  findOrderChanges,
  PENDING_ORDER_CHANGES_KEY,
} from "@/lib/order-changes";

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
  ORDER_NUMBER?: string | null;
  CREATION_DATETIME?: string | null;
  PAYMENT_DONE?: number | null;
  PAYMENT_MODE?: string | null;
  STRIPE_REFUND_STATUS?: string | null;
  STRIPE_REFUNDED_DATETIME?: string | null;
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
    BUSINESS_ID?: number | null;
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

const filters = ["Active", "All", "Completed", "Rejected", "Refunded"] as const;
type Filter = (typeof filters)[number];
const changedClass = (changed: boolean) =>
  changed ? "bg-primary/10 ring-2 ring-primary/30" : "";

const dateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not set";

const isActiveOrder = (order: Order) =>
  isPickupOrder(order)
    ? order.ORDER_STATUS === ORDER_STATUS.preparing || order.ORDER_STATUS === ORDER_STATUS.readyForPickup
    : order.ORDER_STATUS === ORDER_STATUS.preparing || order.ORDER_STATUS === ORDER_STATUS.outForDelivery;

const isCompletedOrder = (order: Order) =>
  isPickupOrder(order)
    ? order.ORDER_STATUS === ORDER_STATUS.pickedUp
    : order.ORDER_STATUS === ORDER_STATUS.delivered;

const isRefundedOrder = (order: Order) =>
  order.PAYMENT_DONE === PAYMENT_DONE.refunded || order.ORDER_REFUND_AMOUNT > 0;

const paymentLabel = (order: Order) =>
  order.PAYMENT_DONE === PAYMENT_DONE.pending &&
  ["stripe", "card"].includes((order.PAYMENT_MODE || "").toLowerCase())
    ? "Payment processing"
    : getPaymentStatusLabel(order.PAYMENT_DONE);

const matchesFilter = (order: Order, filter: Filter) => {
  if (filter === "Active") return isActiveOrder(order);
  if (filter === "Completed") return isCompletedOrder(order);
  if (filter === "Rejected") return order.ORDER_STATUS === ORDER_STATUS.rejected;
  if (filter === "Refunded") return isRefundedOrder(order);
  return true;
};

const emptyTitle: Record<Exclude<Filter, "All">, string> = {
  Active: "No active orders",
  Completed: "No completed orders",
  Rejected: "No rejected orders",
  Refunded: "No refunded orders",
};

const statusTone = (order: Order) => {
  if (isRefundedOrder(order)) return "bg-blue-50 text-blue-700 border-blue-100";
  if (order.ORDER_STATUS === ORDER_STATUS.rejected) return "bg-red-50 text-red-700 border-red-100";
  if (isCompletedOrder(order)) return "bg-green-50 text-green-700 border-green-100";
  return "bg-primary/10 text-primary border-primary/20";
};

function SkeletonCards() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-9 w-28 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((__, cell) => (
              <div key={cell} className="h-14 animate-pulse rounded bg-gray-50" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function DetailPill({
  icon: Icon,
  label,
  value,
  changed = false,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  changed?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-gray-50 p-3 transition-colors duration-1000 ${changedClass(changed)}`}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Timeline({ order, rejectionChanged = false }: { order: Order; rejectionChanged?: boolean }) {
  return (
    <div className="space-y-3">
      {getOrderProgressSteps(order).map((step) => {
        const done = step.status === order.ORDER_STATUS || step.status < (order.ORDER_STATUS ?? 0);
        return (
          <div key={step.status} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${done ? "bg-primary" : "bg-gray-300"}`} />
            <span className="text-sm text-gray-700">{step.label}</span>
          </div>
        );
      })}
      {order.ORDER_STATUS === ORDER_STATUS.rejected && (
        <div className={`rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 transition-colors duration-1000 ${changedClass(rejectionChanged)}`}>
          <p className="font-medium">{order.ORDER_REJECTION_REASON || "Rejected"}</p>
          {order.ORDER_REJECTION_NOTE && <p>{order.ORDER_REJECTION_NOTE}</p>}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  featured = false,
  onSelect,
  changed = [],
}: {
  order: Order;
  featured?: boolean;
  onSelect: () => void;
  changed?: ChangedField[];
}) {
  const pickup = isPickupOrder(order);
  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        featured ? "border-primary/30 bg-primary/5" : "border-gray-200"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {featured && <p className="mb-1 text-sm font-semibold text-primary">Your active order</p>}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">{getDisplayOrderNumber(order)}</h2>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-shadow duration-1000 ${statusTone(order)} ${changedClass(changed.includes("status"))}`}>
              {isRefundedOrder(order) ? "Refunded" : getOrderStatusLabel(order)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{order.business?.BUSINESS_NAME || "Restaurant"}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
          <p className="text-lg font-semibold text-gray-900">{formatCHF(order.ORDER_FINAL_AMOUNT)}</p>
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            View details
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailPill icon={pickup ? ShoppingBag : Truck} label="Type" value={pickup ? "Pickup" : "Delivery"} />
        <DetailPill icon={Clock} label="ETA" value={getDisplayEta(order)} changed={changed.includes("eta")} />
        <DetailPill icon={Wallet} label="Payment" value={paymentLabel(order)} changed={changed.includes("payment")} />
        <DetailPill icon={CalendarDays} label="Placed" value={dateTime(order.CREATION_DATETIME)} />
      </div>
    </article>
  );
}

function OrdersTable({
  orders,
  onSelect,
  changedOrders,
}: {
  orders: Order[];
  onSelect: (order: Order) => void;
  changedOrders: ChangedOrders;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">ETA</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const changed = changedOrders[order.BUSINESS_ORDER_ID] || [];
              return (
              <tr key={order.BUSINESS_ORDER_ID} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-semibold text-gray-900">{getDisplayOrderNumber(order)}</td>
                <td className="px-4 py-4 text-gray-700">
                  <Link href={`/business/${order.business?.BUSINESS_NAME}-${order.business?.BUSINESS_ID}`} target="_blank" className="text-primary hover:underline">
                    {order.business?.BUSINESS_NAME || "Restaurant"}
                  </Link>
                </td>
                <td className="px-4 py-4 text-gray-700">{isPickupOrder(order) ? "Pickup" : "Delivery"}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-shadow duration-1000 ${statusTone(order)} ${changedClass(changed.includes("status"))}`}>
                    {isRefundedOrder(order) ? "Refunded" : getOrderStatusLabel(order)}
                  </span>
                </td>
                <td className={`px-4 py-4 text-gray-700 transition-colors duration-1000 ${changedClass(changed.includes("eta"))}`}>{getDisplayEta(order)}</td>
                <td className={`px-4 py-4 text-gray-700 transition-colors duration-1000 ${changedClass(changed.includes("payment"))}`}>{paymentLabel(order)}</td>
                <td className="px-4 py-4 text-gray-700">{dateTime(order.CREATION_DATETIME)}</td>
                <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatCHF(order.ORDER_FINAL_AMOUNT)}</td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onSelect(order)}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
                  >
                    View details
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderModal({ order, onClose, changed = [] }: { order: Order; onClose: () => void; changed?: ChangedField[] }) {
  const pickup = isPickupOrder(order);
  const rejected = order.ORDER_STATUS === ORDER_STATUS.rejected;
  const paidNotRefunded = order.PAYMENT_DONE === PAYMENT_DONE.paid && !isRefundedOrder(order);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <p className="text-sm font-medium text-primary">{pickup ? "Pickup order" : "Delivery order"}</p>
            <h2 className="mt-1 text-2xl font-semibold text-gray-900">{getDisplayOrderNumber(order)}</h2>
            <p className="text-sm text-gray-500">{order.business?.BUSINESS_NAME || "Restaurant"}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailPill icon={Clock} label="ETA" value={getDisplayEta(order)} changed={changed.includes("eta")} />
              <DetailPill icon={ReceiptText} label="Status" value={getOrderStatusLabel(order)} changed={changed.includes("status")} />
              <DetailPill icon={Wallet} label="Payment" value={paymentLabel(order)} changed={changed.includes("payment")} />
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-4 font-semibold text-gray-900">Order timeline</h3>
              <Timeline order={order} rejectionChanged={changed.includes("rejection")} />
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Items</h3>
              <div className="divide-y">
                {order.details.map((item) => {
                  const quantity = item.ORDER_QUANTITY || 1;
                  const unit = item.PRODUCT_SELL_PRICE || item.product?.PRODUCT_PRICE || 0;
                  return (
                    <div key={item.BUSINESS_ORDER_DETAIL_ID} className="flex items-start justify-between gap-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.product?.TITLE || "Product"}</p>
                        <p className="text-gray-500">Qty {quantity} x {formatCHF(unit)}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCHF(item.PRODUCT_PRICE || unit * quantity)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <MapPin className="h-4 w-4 text-primary" />
                {pickup ? "Pickup address" : "Delivery address"}
              </h3>
              <p className="text-sm leading-6 text-gray-700">
                {pickup ? (
                  <>
                    {order.business?.ADDRESS_STREET}<br />
                    {[order.business?.ADDRESS_ZIP, order.business?.ADDRESS_TOWN].filter(Boolean).join(" ")}<br />
                    {order.business?.ADDRESS_COUNTRY || "CH"}
                  </>
                ) : (
                  <>
                    {order.ADDRESS_STREET}<br />
                    {[order.ADDRESS_ZIP, order.ADDRESS_TOWN].filter(Boolean).join(" ")}<br />
                    {order.ADDRESS_COUNTRY_CODE || "CH"}
                  </>
                )}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 font-semibold text-gray-900">Payment summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Gross</dt><dd>{formatCHF(order.ORDER_GROSS_AMOUNT)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Discount</dt><dd>{formatCHF(order.ORDER_DISCOUNT_AMOUNT)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Delivery fee</dt><dd>{formatCHF(order.SHIPPING_CHARGES)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Tax</dt><dd>{formatCHF(order.ORDER_TAX_AMOUNT)}</dd></div>
                {order.ORDER_REFUND_AMOUNT > 0 && (
                  <div className="flex justify-between text-blue-700"><dt>Refund</dt><dd>{formatCHF(order.ORDER_REFUND_AMOUNT)}</dd></div>
                )}
                <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                  <dt>Final total</dt><dd>{formatCHF(order.ORDER_FINAL_AMOUNT)}</dd>
                </div>
              </dl>
              {isRefundedOrder(order) && order.STRIPE_REFUND_STATUS && (
                <p className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  Refund status: {order.STRIPE_REFUND_STATUS}
                  {order.STRIPE_REFUNDED_DATETIME ? ` on ${dateTime(order.STRIPE_REFUNDED_DATETIME)}` : ""}
                </p>
              )}
              {rejected && paidNotRefunded && (
                <p className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">Refund pending</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<Filter>("Active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [changedOrders, setChangedOrders] = useState<ChangedOrders>({});
  const previousOrders = useRef<Order[] | null>(null);
  const highlightTimer = useRef<number>();

  const showChanges = useCallback((changes: ChangedOrders) => {
    if (!Object.keys(changes).length) return;
    setChangedOrders(changes);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setChangedOrders({}), 6000);
  }, []);

  const showPendingChanges = useCallback(() => {
    if (document.hidden) return;
    try {
      const stored = window.localStorage.getItem(PENDING_ORDER_CHANGES_KEY);
      if (stored) showChanges(JSON.parse(stored));
    } catch {}
    window.localStorage.removeItem(PENDING_ORDER_CHANGES_KEY);
  }, [showChanges]);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setError("");
    }
    try {
      const response = await fetch("/api/orders/history", { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch orders");
      }
      const data = await response.json();
      const nextOrders = Array.from(
          new Map((data.orders || []).map((order: Order) => [order.BUSINESS_ORDER_ID, order])).values()
        ) as Order[];
      if (previousOrders.current) {
        const changes = findOrderChanges(previousOrders.current, nextOrders);
        if (!document.hidden) showChanges(changes);
      }
      previousOrders.current = nextOrders;
      setOrders(nextOrders);
      setSelectedOrder((selected) =>
        selected ? nextOrders.find((order) => order.BUSINESS_ORDER_ID === selected.BUSINESS_ORDER_ID) || null : null
      );
      window.dispatchEvent(new CustomEvent("foodeez:orders-updated", { detail: nextOrders }));
      window.dispatchEvent(new CustomEvent("foodeez:customer-notifications-updated", { detail: data.notifications || [] }));
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [showChanges]);

  useEffect(() => {
    showPendingChanges();
    fetchOrders();
    const interval = window.setInterval(() => fetchOrders({ silent: true }), 30000);
    const showIncomingChanges = (event: Event) => {
      if (!document.hidden) {
        showChanges((event as CustomEvent<ChangedOrders>).detail || {});
        window.localStorage.removeItem(PENDING_ORDER_CHANGES_KEY);
      }
    };
    document.addEventListener("visibilitychange", showPendingChanges);
    window.addEventListener("foodeez:order-changes", showIncomingChanges);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(highlightTimer.current);
      document.removeEventListener("visibilitychange", showPendingChanges);
      window.removeEventListener("foodeez:order-changes", showIncomingChanges);
    };
  }, [fetchOrders, showChanges, showPendingChanges]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.CREATION_DATETIME || 0).getTime() -
          new Date(a.CREATION_DATETIME || 0).getTime()
      ),
    [orders]
  );
  const activeOrder = sortedOrders.find(isActiveOrder);
  const visibleOrders = useMemo(
    () => sortedOrders.filter((order) => matchesFilter(order, filter)),
    [filter, sortedOrders]
  );
  const metrics = [
    { label: "All orders", value: orders.length, icon: ReceiptText },
    { label: "Active", value: orders.filter(isActiveOrder).length, icon: Clock },
    { label: "Completed", value: orders.filter(isCompletedOrder).length, icon: Package },
    { label: "Refunded", value: orders.filter(isRefundedOrder).length, icon: RefreshCcw },
  ];
  const showFilteredEmpty = visibleOrders.length === 0 && !(filter === "Active" && activeOrder);

  return (
    <div className="mx-auto min-h-screen px-4 py-8 lg:px-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="sub-heading">My orders</h1>
          <p className="text-gray-500">Track active orders, payments, refunds, and order history.</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ShoppingBag className="h-4 w-4" />
          Explore Restaurants
        </Link>
      </div>

      {isLoading ? (
        <SkeletonCards />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex gap-3">
            <XCircle className="h-5 w-5" />
            <div>
              <p className="text-sm">{error}</p>
              <button onClick={() => fetchOrders()} className="mt-2 text-sm font-medium underline">Try again</button>
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">No orders yet</h3>
          <p className="mx-auto mt-2 max-w-md text-gray-500">
            When you place an order, you will be able to track it here.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark">
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          {activeOrder && (
            <OrderCard order={activeOrder} featured changed={changedOrders[activeOrder.BUSINESS_ORDER_ID]} onSelect={() => setSelectedOrder(activeOrder)} />
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  filter === item ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <section className="min-h-[600px]">
            {showFilteredEmpty ? (
              <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white px-6 min-h-[600px] flex flex-col items-center justify-center text-center shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">
                  {filter === "All" ? "No orders yet" : emptyTitle[filter as Exclude<Filter, "All">]}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-gray-500">
                  Try another filter or explore restaurants.
                </p>
                <Link href="/business" className="mt-5 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark">
                  Explore Restaurants
                </Link>
              </div>
              </div>
            ) : visibleOrders.length > 0 ? (
              <OrdersTable orders={visibleOrders} changedOrders={changedOrders} onSelect={setSelectedOrder} />
            ) : null}
          </section>
        </div>
      )}

      {selectedOrder && <OrderModal order={selectedOrder} changed={changedOrders[selectedOrder.BUSINESS_ORDER_ID]} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
