"use client";

import { useCartStore } from "@/stores/cartStore";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import CheckoutForm, { CheckoutSummaryState } from "@/components/checkout/CheckoutForm";
import { useRouter } from "next/navigation";
import ProductDetailsModal from "@/components/menu/ProductDetailsModal";
import { useSession } from "next-auth/react";
import LoginRequiredModal from "@/components/core/LoginRequiredModal";
import { calculateCartTotals } from "@/lib/cartTotals";
import { formatCHF, ORDER_TYPE } from "@/lib/orderStatus";

type SummaryProps = {
  items: ReturnType<typeof useCartStore.getState>["items"];
  totalItems: number;
  checkoutSummary?: CheckoutSummaryState | null;
  showPayment?: boolean;
};

function OrderSummary({ items, totalItems, checkoutSummary, showPayment = false }: SummaryProps) {
  const totals = calculateCartTotals({
    items,
    discount: checkoutSummary?.discount ?? 0,
    deliveryFee: checkoutSummary?.deliveryFee ?? 0,
    tax: checkoutSummary?.tax ?? 0,
  });
  const isPickup = checkoutSummary?.fulfillmentType === ORDER_TYPE.pickup;
  const isDelivery = checkoutSummary?.fulfillmentType === ORDER_TYPE.delivery;

  return (
    <div className="space-y-3">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3">
            <div className="flex min-w-0 items-center">
              <Image
                src={item.image || "/placeholder.png"}
                alt={item.name}
                width={50}
                height={50}
                className="mr-2 h-12 w-12 rounded-md object-cover"
              />
              <span className="truncate text-sm">{item.name} x {item.quantity}</span>
            </div>
            <span className="whitespace-nowrap text-sm">{formatCHF(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Items subtotal ({totalItems} items)</span>
          <span>{formatCHF(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>-{formatCHF(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Fulfillment</span>
          <span>{isPickup ? "Pickup" : isDelivery ? "Delivery" : "Not selected"}</span>
        </div>
        {showPayment && checkoutSummary?.paymentMethod && (
          <div className="flex justify-between">
            <span>Payment</span>
            <span>{checkoutSummary.paymentMethod === "card" ? "Card" : checkoutSummary.paymentMethod === "cash_on_delivery" ? "Cash on delivery" : "Pay at pickup"}</span>
          </div>
        )}
        {checkoutSummary?.zoneName && (
          <div className="flex justify-between">
            <span>Delivery zone</span>
            <span>{checkoutSummary.zoneName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery fee</span>
          {isPickup ? (
            <span className="text-green-700">Pickup — no delivery fee</span>
          ) : isDelivery && !checkoutSummary?.deliveryQuoteReady ? (
            <span className="text-gray-500">Please enter ZIP to see delivery fee</span>
          ) : checkoutSummary ? (
            <span className={totals.deliveryFee === 0 ? "text-green-700" : ""}>
              {totals.deliveryFee === 0 ? "Free delivery" : formatCHF(totals.deliveryFee)}
            </span>
          ) : (
            <span className="text-gray-500">Delivery fee calculated at checkout</span>
          )}
        </div>
        {checkoutSummary?.freeDeliveryApplied && (
          <p className="text-right text-xs text-green-700">Free delivery applied.</p>
        )}
        {totals.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCHF(totals.tax)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-primary">
          <span>Final total</span>
          <span>{formatCHF(totals.finalTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, totalItems, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const { status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryState | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("checkout") === "1" && status === "authenticated") {
      setShowCheckout(true);
    }
  }, [status]);

  const handleBackToCart = () => {
    setShowCheckout(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutClick = () => {
    if (status !== "authenticated") {
      setShowLoginModal(true);
      return;
    }
    setShowCheckout(true);
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (item: any) => {
    // Convert cart item to MenuProduct format according to business_food_menu_card_detail_view
    const product = {
      BUSINESS_ID: 0, // Default value since we don't have this in cart item
      BUSINESS_NAME: '', // Not critical for product display
      BUSINESS_FOOD_MENU_CARD_ID: 0, // Default value
      MENU_NAME: '', // Not critical for product display
      BUSINESS_PRODUCT_CATEGORY_ID: 0, // Default value
      CATEGORY: item.category || '', // Use category from cart item if available
      BUSINESS_PRODUCT_ID: parseInt(item.id),
      PRODUCT_NAME: item.name,
      PRODUCT_DESCRIPTION: item.description || '', // Make sure to map the description
      PRODUCT_PRICE: item.price,
      COMPARE_AS_PRICE: null, // Can be null according to schema
      PIC: item.image || '', // Default to empty string if no image
    };
    setSelectedProduct(product);
  };

  const isInCart = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  if (!isClient) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading Cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="sub-heading mb-4">Your Cart is Empty</h1>
        <p className="sub-heading-description mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/" className="btn-primary">
          Start Exploring
        </Link>
      </div>
    );
  }

  // Render the checkout form if showCheckout is true
  if (showCheckout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleBackToCart}
          className="flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Cart
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="sub-heading mb-6">Checkout</h1>
            <CheckoutForm onSummaryChange={setCheckoutSummary} />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="sub-heading border-b border-primary pb-4 mb-4">Order Summary</h2>
              <OrderSummary items={items} totalItems={totalItems} checkoutSummary={checkoutSummary} showPayment />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the cart view
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="sub-heading">Your Shopping Cart</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
              >
                <Image
                  src={item.image || '/placeholder.png'}
                  onClick={() => handleProductClick(item)}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="rounded-md object-cover w-20 h-20"
                />
                <div className="ml-4 flex-grow"
                onClick={() => handleProductClick(item)}
                >
                  <h2 className="font-semibold text-lg">{item.name}</h2>
                  <p className="text-primary font-bold">CHF {item.price.toFixed(2)}</p>
                </div>
                <div className="flex flex-col lg:flex-row items-end lg:items-center gap-4">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                    aria-label="Remove item"
                  >
                    <Trash2 size={20} />
                  </button>
                  <div className="flex items-center bg-primary/10 border rounded-md">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="p-2 hover:bg-gray-100 rounded-l-md"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 py-1 font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-100 rounded-r-md"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => router.back()}
              className="bg-primary text-white px-3 py-2 rounded-md shadow hover:bg-primary-dark flex items-center transition-all"
            >
              <ArrowLeft size={16} className="mr-1" /> Back To Menu
            </button>

            <button
              onClick={clearCart}
              className="bg-red-500 text-white text-sm px-3 py-2 rounded-md shadow hover:bg-red-600 transition-all"
            >
              Clear Cart
            </button>
          </div>

        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="sub-heading border-b border-primary pb-4 mb-4">Order Summary</h2>
            <OrderSummary items={items} totalItems={totalItems} />

            <button
              onClick={handleCheckoutClick}
              className="w-full bg-primary text-white mt-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>

            {status === "unauthenticated" && (
              <div className="mt-4 text-sm text-center text-gray-600">
                <p>Have an account?{' '}
                  <Link href="/auth/signin?callbackUrl=/cart" className="text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  for a faster checkout.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedProduct && (
        <ProductDetailsModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          isInCart={isInCart(selectedProduct.BUSINESS_PRODUCT_ID.toString())}
        />
      )}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Log in to continue"
        message="Please log in to place your order."
        callbackUrl="/cart?checkout=1"
      />
    </div>
  );
}
