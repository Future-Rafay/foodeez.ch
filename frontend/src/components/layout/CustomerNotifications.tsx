"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Package } from "lucide-react";
import { getOrderStatusLabel, getPaymentStatusLabel, PAYMENT_DONE } from "@/lib/order";

type OrderNotification = {
  BUSINESS_ORDER_ID: number;
  CREATION_DATETIME?: string | null;
  DELIVERY_ET?: string | null;
  ORDER_STATUS?: number | null;
  ORDER_TYPE?: string | null;
  PAYMENT_DONE?: number | null;
  STRIPE_REFUND_STATUS?: string | null;
  business?: { BUSINESS_NAME?: string | null } | null;
};

type NotificationItem = {
  id: string;
  orderId: number;
  title: string;
  body: string;
  time: string | null;
};

type CustomerNotificationsProps = {
  userEmail?: string | null;
  className?: string;
};

const formatTime = (value: string | null) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const toNotifications = (orders: OrderNotification[]): NotificationItem[] =>
  orders.slice(0, 8).map((order) => {
    const status = getOrderStatusLabel(order);
    const business = order.business?.BUSINESS_NAME || "Restaurant";
    const payment =
      order.PAYMENT_DONE === PAYMENT_DONE.refunded ||
      order.PAYMENT_DONE === PAYMENT_DONE.failed
        ? ` ${getPaymentStatusLabel(order.PAYMENT_DONE).toLowerCase()}.`
        : "";

    return {
      id: `${order.BUSINESS_ORDER_ID}:${order.ORDER_STATUS ?? "x"}:${order.PAYMENT_DONE ?? "x"}:${order.DELIVERY_ET ?? ""}`,
      orderId: order.BUSINESS_ORDER_ID,
      title: `Order #${order.BUSINESS_ORDER_ID} is ${status.toLowerCase()}`,
      body: `${business}${payment}`,
      time: order.DELIVERY_ET || order.CREATION_DATETIME || null,
    };
  });

export default function CustomerNotifications({
  userEmail,
  className = "",
}: CustomerNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<OrderNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const storageKey = `foodeez:customer-notifications:${userEmail || "guest"}`;

  useEffect(() => {
    if (!userEmail) return;

    const stored = window.localStorage.getItem(storageKey);
    try {
      setReadIds(stored ? JSON.parse(stored) : []);
    } catch {
      setReadIds([]);
    }

    const load = async () => {
      const response = await fetch("/api/orders/history", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    };

    load();
    const interval = window.setInterval(load, 60000);
    return () => window.clearInterval(interval);
  }, [storageKey, userEmail]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const notifications = useMemo(() => toNotifications(orders), [orders]);
  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;

  const markAllRead = () => {
    const ids = notifications.map((item) => item.id);
    setReadIds(ids);
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  };

  const markRead = (id: string) => {
    if (readIds.includes(id)) return;
    const ids = [...readIds, id];
    setReadIds(ids);
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  };

  if (!userEmail) return null;

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative rounded-full p-2 text-gray-700 hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Customer notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-3 right-3 top-[100px]  md:top-20 z-50 mt-0 w-auto overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Latest order updates</p>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <Check className="h-3.5 w-3.5" />
                Read
              </button>
            )}
          </div>

          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto sm:max-h-96">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No customer notifications yet.
              </div>
            ) : (
              notifications.map((item) => {
                const unread = !readIds.includes(item.id);
                return (
                  <Link
                    key={item.id}
                    href="/dashboard/orders"
                    onClick={() => markRead(item.id)}
                    className={`flex gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-0 ${
                      unread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Package className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-gray-500">{item.body}</span>
                      <span className="mt-1 block text-xs text-gray-400">
                        {formatTime(item.time)}
                      </span>
                    </span>
                    {unread && <span className="mt-2 h-2 w-2 rounded-full bg-primary" />}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
