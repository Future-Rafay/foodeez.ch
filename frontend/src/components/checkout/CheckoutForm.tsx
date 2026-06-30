"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/cartStore";
import { getStripe } from "@/lib/stripe";
import { formatCHF, ORDER_TYPE } from "@/lib/order";
import type { DeliveryQuote } from "@/lib/fulfillment";
import LoginRequiredModal from "@/components/core/LoginRequiredModal";

type OrderType = "delivery" | "pickup";
type PaymentMethod = "card" | "cash_on_delivery" | "pay_at_pickup";

type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  zip: string;
  city: string;
  country: string;
};

export type CheckoutSummaryState = {
  fulfillmentType: OrderType | "";
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  deliveryQuoteReady: boolean;
  tax: number;
  discount: number;
  zoneName?: string;
  freeDeliveryApplied: boolean;
};

type FulfillmentOptions = {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  pickupInstructions?: string;
  defaultPickupPrepMinutes?: number;
  defaultDeliveryPrepMinutes?: number;
  restaurantAddress?: {
    name?: string | null;
    street?: string | null;
    zip?: string | null;
    town?: string | null;
    country?: string | null;
  } | null;
};

const emptyQuote: DeliveryQuote = {
  available: false,
  deliveryPrice: 0,
  freeDeliveryApplied: false,
};

export default function CheckoutForm({
  onSummaryChange,
}: {
  onSummaryChange?: (summary: CheckoutSummaryState) => void;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCartStore();
  const businessIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.businessId).filter(Boolean))),
    [items]
  );
  const businessId = businessIds.length === 1 ? businessIds[0] : "";

  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<FulfillmentOptions | null>(null);
  const [orderType, setOrderType] = useState<OrderType | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [quote, setQuote] = useState<DeliveryQuote>(emptyQuote);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    zip: "",
    city: "",
    country: "CH",
  });

  useEffect(() => {
    if (!session?.user) return;
    setFormData((prev) => ({
      ...prev,
      firstName: session.user?.name?.split(" ")[0] || "",
      lastName: session.user?.name?.split(" ").slice(1).join(" ") || "",
      email: session.user?.email || "",
    }));
  }, [session]);

  useEffect(() => {
    if (!businessId) {
      setOptionsLoading(false);
      return;
    }

    setOptionsLoading(true);
    fetch(`/api/businesses/${businessId}/fulfillment-options`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load ordering options.");
        return res.json();
      })
      .then((data: FulfillmentOptions) => {
        setOptions(data);
        setOrderType(data.deliveryEnabled ? ORDER_TYPE.delivery : data.pickupEnabled ? ORDER_TYPE.pickup : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load ordering options."))
      .finally(() => setOptionsLoading(false));
  }, [businessId]);

  useEffect(() => {
    setPaymentMethod(orderType === ORDER_TYPE.pickup ? "pay_at_pickup" : "card");
  }, [orderType]);

  useEffect(() => {
    if (orderType !== ORDER_TYPE.delivery || !businessId || !formData.zip.trim()) {
      setQuote(emptyQuote);
      return;
    }

    const controller = new AbortController();
    setQuoteLoading(true);
    fetch(`/api/businesses/${businessId}/delivery-quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postalCode: formData.zip, cartTotal: totalPrice }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: DeliveryQuote) => setQuote(data))
      .catch((err) => {
        if (err.name !== "AbortError") {
          setQuote({ ...emptyQuote, reason: "Could not check delivery for this postal code." });
        }
      })
      .finally(() => setQuoteLoading(false));

    return () => controller.abort();
  }, [businessId, formData.zip, orderType, totalPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const isDelivery = orderType === ORDER_TYPE.delivery;
  const deliveryBlocked = isDelivery && (!formData.zip.trim() || quoteLoading || !quote.available);
  const orderingUnavailable = !optionsLoading && options && !options.deliveryEnabled && !options.pickupEnabled;
  const mixedCart = businessIds.length > 1;
  const disabled = loading || optionsLoading || mixedCart || !businessId || !orderType || !!orderingUnavailable || deliveryBlocked;
  const shippingCharge = isDelivery && quote.available ? quote.deliveryPrice : 0;

  useEffect(() => {
    onSummaryChange?.({
      fulfillmentType: orderType,
      paymentMethod,
      deliveryFee: shippingCharge,
      deliveryQuoteReady: isDelivery ? quote.available : false,
      tax: 0,
      discount: 0,
      zoneName: quote.zoneName,
      freeDeliveryApplied: quote.freeDeliveryApplied,
    });
  }, [isDelivery, onSummaryChange, orderType, paymentMethod, quote.available, quote.freeDeliveryApplied, quote.zoneName, shippingCharge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (status !== "authenticated") {
      setShowLoginModal(true);
      return;
    }

    if (disabled) return;
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          businessId,
          orderType,
          paymentMethod,
          shippingCharges: shippingCharge,
          customerInfo: {
            ...formData,
          },
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      if (data.sessionId) {
        const stripe = await getStripe();
        const result = await stripe?.redirectToCheckout({ sessionId: data.sessionId });
        if (result?.error) throw result.error;
        return;
      }

      clearCart();
      router.push(data.redirectUrl || "/dashboard/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold">How would you like your order?</h2>

        {mixedCart ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            Please order from one restaurant at a time.
          </p>
        ) : orderingUnavailable ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            Ordering is currently unavailable.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: ORDER_TYPE.delivery, label: "Delivery", enabled: options?.deliveryEnabled },
              { value: ORDER_TYPE.pickup, label: "Pickup", enabled: options?.pickupEnabled },
            ].map((choice) => (
              <label
                key={choice.value}
                className={`rounded-lg border p-4 cursor-pointer transition ${
                  orderType === choice.value ? "border-primary bg-primary/5" : "border-gray-200"
                } ${choice.enabled ? "hover:border-primary" : "opacity-50 cursor-not-allowed"}`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value={choice.value}
                  checked={orderType === choice.value}
                  disabled={!choice.enabled}
                  onChange={() => setOrderType(choice.value)}
                  className="sr-only"
                />
                <span className="font-semibold">{choice.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["firstName", "First name", "text"],
            ["lastName", "Last name", "text"],
            ["email", "Email address", "email"],
            ["phone", "Phone number", "tel"],
          ].map(([name, label, type]) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} *
              </label>
              <input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof CheckoutFormData] as string}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {isDelivery ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Delivery Address</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street address *
              </label>
              <input id="street" name="street" value={formData.street} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal code / ZIP *
                </label>
                <input id="zip" name="zip" value={formData.zip} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Town/city *
                </label>
                <input id="city" name="city" value={formData.city} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country code *
                </label>
                <input id="country" name="country" value={formData.country} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            {quoteLoading ? (
              "Checking delivery..."
            ) : quote.available ? (
              <div className="space-y-1">
                {quote.zoneName && <p>{quote.zoneName}</p>}
                <p>Delivery fee: {formatCHF(quote.deliveryPrice)}</p>
                {quote.freeDeliveryApplied && <p className="text-green-700">Free delivery applied.</p>}
                {quote.deliveryInformation && <p>{quote.deliveryInformation}</p>}
              </div>
            ) : (
              <p className={formData.zip ? "text-red-700" : ""}>
                {formData.zip ? quote.reason : "Enter your postal code to check delivery."}
              </p>
            )}
          </div>
        </div>
      ) : orderType === ORDER_TYPE.pickup ? (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
          <h2 className="text-xl font-semibold">Pickup</h2>
          <div className="text-sm text-gray-700">
            <p className="font-medium">{options?.restaurantAddress?.name}</p>
            <p>{options?.restaurantAddress?.street}</p>
            <p>{[options?.restaurantAddress?.zip, options?.restaurantAddress?.town].filter(Boolean).join(" ")}</p>
            <p>{options?.restaurantAddress?.country || "CH"}</p>
          </div>
          {options?.pickupInstructions && (
            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3">
              {options.pickupInstructions}
            </p>
          )}
          <p className="text-sm text-green-700">Delivery fee: {formatCHF(0)}</p>
        </div>
      ) : null}

      <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
        <h2 className="text-xl font-semibold">Payment</h2>
        {(isDelivery
          ? [
              ["card", "Card"],
              ["cash_on_delivery", "Cash on delivery"],
            ]
          : [
              ["pay_at_pickup", "Pay at pickup"],
              ["card", "Card"],
            ]
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              value={value}
              checked={paymentMethod === value}
              onChange={() => setPaymentMethod(value as PaymentMethod)}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            {label}
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : paymentMethod === "card" ? "Proceed to Payment" : "Place Order"}
        </button>
      </div>
    </form>
    <LoginRequiredModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      title="Log in to continue"
      message="Please log in to place your order."
      callbackUrl="/cart?checkout=1"
    />
    </>
  );
}
