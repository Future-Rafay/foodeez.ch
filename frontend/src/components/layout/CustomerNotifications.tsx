"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Package } from "lucide-react";
import { ChangedField, ChangedOrders, PENDING_ORDER_CHANGES_KEY } from "@/lib/order-changes";
import { usePathname } from "next/navigation";

type CustomerNotification = {
  id: number;
  orderId: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string | null;
  metadata?: { changedField?: ChangedField };
};

type CustomerNotificationsProps = {
  userEmail?: string | null;
  className?: string;
};

const formatTime = (value: string | null) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
};

export default function CustomerNotifications({
  userEmail,
  className = "",
}: CustomerNotificationsProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<number> | null>(null);

  const rememberHighlights = useCallback((items: CustomerNotification[]) => {
    const nextChanges: ChangedOrders = {};
    items.forEach((item) => {
      const field = item.metadata?.changedField;
      if (field) nextChanges[item.orderId] = Array.from(new Set([...(nextChanges[item.orderId] || []), field]));
    });
    if (!Object.keys(nextChanges).length) return;
    let pending: ChangedOrders = {};
    try { pending = JSON.parse(window.localStorage.getItem(PENDING_ORDER_CHANGES_KEY) || "{}"); } catch {}
    Object.entries(nextChanges).forEach(([orderId, fields]) => {
      pending[Number(orderId)] = Array.from(new Set([...(pending[Number(orderId)] || []), ...fields]));
    });
    window.localStorage.setItem(PENDING_ORDER_CHANGES_KEY, JSON.stringify(pending));
    window.dispatchEvent(new CustomEvent("foodeez:order-changes", { detail: nextChanges }));
  }, []);

  const updateNotifications = useCallback((next: CustomerNotification[]) => {
    const fresh = knownIds.current
      ? next.filter((item) => !item.isRead && !knownIds.current?.has(item.id))
      : next.filter((item) => !item.isRead);
    rememberHighlights(fresh);
    knownIds.current = new Set(next.map((item) => item.id));
    setNotifications(next);
  }, [rememberHighlights]);

  useEffect(() => {
    if (!userEmail) return;
    if (pathname === "/dashboard/orders") return;

    const load = async () => {
      if (document.hidden) return;
      const response = await fetch("/api/orders/history", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      updateNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    };

    load();
    const interval = window.setInterval(load, 30000);
    const onVisibilityChange = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, updateNotifications, userEmail]);

  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<CustomerNotification[]>).detail;
      if (Array.isArray(next)) updateNotifications(next);
    };
    window.addEventListener("foodeez:customer-notifications-updated", update);
    return () => window.removeEventListener("foodeez:customer-notifications-updated", update);
  }, [updateNotifications]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    void fetch("/api/customer-notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }),
    });
  };

  const markRead = (item: CustomerNotification) => {
    rememberHighlights([item]);
    if (item.isRead) return;
    setNotifications((current) => current.map((row) => row.id === item.id ? { ...row, isRead: true } : row));
    void fetch("/api/customer-notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: item.id }),
    });
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
                const unread = !item.isRead;
                return (
                  <Link
                    key={item.id}
                    href="/dashboard/orders"
                    onClick={() => markRead(item)}
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
                        {formatTime(item.createdAt)}
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
