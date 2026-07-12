"use client";

import Image from "next/image";
import { MenuProduct } from "@/types/product";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import Button from "../core/Button";
import ProductDetailsModal from "./ProductDetailsModal";
import { toast } from "react-hot-toast";
import { formatCHF } from "@/lib/order";
import { generateSlug } from "@/lib/utils/genSlug";
import ModalPortal from "../core/ModalPortal";
import { X } from "lucide-react";

interface MenuProductCardProps {
  product: MenuProduct;
  businessZipCode?: string;
}

export default function MenuProductCard({ product }: MenuProductCardProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [currentBusinessName, setCurrentBusinessName] = useState("another restaurant");
  const { items, addToCart } = useCartStore();
  const isInCart = items.some((item) => item.id === String(product.BUSINESS_PRODUCT_ID));
  const price = Number(product.PRODUCT_PRICE);
  const compareAtPrice = Number(product.COMPARE_AS_PRICE ?? 0);
  const tracksInventory = Number(product.TRACK_INVENTORY ?? 0) === 1;
  const inventoryAvailable = Number(product.INVENTORY_AVAILABLE ?? 0);
  const outOfStock = tracksInventory && inventoryAvailable <= 0;
  const weight = Number(product.WEIGHT ?? 0);

  const cartProduct = () => ({
    id: String(product.BUSINESS_PRODUCT_ID),
    name: product.PRODUCT_NAME,
    price,
    description: product.PRODUCT_DESCRIPTION || '',
    image: product.PIC,
    businessId: String(product.BUSINESS_ID),
    businessSlug: generateSlug(product.BUSINESS_NAME || "restaurant", product.BUSINESS_ID),
    businessName: product.BUSINESS_NAME || "Restaurant",
    trackInventory: tracksInventory,
    inventoryAvailable,
  });

  const handleAddToCart = (replaceCart = false) => {
    if (outOfStock) return;
    const currentBusiness = items.find((item) => item.businessId)?.businessId;
    if (!replaceCart && currentBusiness && String(currentBusiness) !== String(product.BUSINESS_ID)) {
      setCurrentBusinessName(items.find((item) => item.businessName)?.businessName || "another restaurant");
      setShowNewOrderDialog(true);
      return;
    }

    const result = addToCart(cartProduct(), replaceCart);
    if (result.ok) {
      setShowNewOrderDialog(false);
      toast.success("Added to cart");
    } else if (result.reason === "mixed-business") {
      setCurrentBusinessName(result.currentBusinessName || "another restaurant");
      setShowNewOrderDialog(true);
    } else {
      toast.error(result.message || "Only 0 left in stock.");
    }
  };

  useEffect(() => {
    if (!showNewOrderDialog) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowNewOrderDialog(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showNewOrderDialog]);

  return (
    <>
      <ProductDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        product={product}
        onAddToCart={() => handleAddToCart()}
        isInCart={isInCart}
        outOfStock={outOfStock}
      />

      {showNewOrderDialog && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowNewOrderDialog(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-order-title"
              aria-describedby="new-order-description"
              className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowNewOrderDialog(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 id="new-order-title" className="pr-8 text-lg font-semibold text-gray-900">Start a new order?</h2>
              <p id="new-order-description" className="mt-2 text-sm text-gray-600">
              Your cart has items from {currentBusinessName}. You can only order from one restaurant at a time.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setShowNewOrderDialog(false)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Keep current cart
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear cart and add this item
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <div 
        className="bg-white rounded-2xl border-2 border-primary shadow-md flex flex-col overflow-hidden transition hover:shadow-xl h-full cursor-pointer"
        onClick={() => setShowDetailsModal(true)}
      >
        {/* Image Container */}
        <div className="relative w-full h-[220px] bg-gray-50">
          {product.PIC ? (
            <Image
              src={product.PIC}
              alt={product.PRODUCT_NAME}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <h3
            className="font-semibold text-base lg:text-lg text-gray-800 mb-1 truncate"
            title={product.PRODUCT_NAME}
          >
            {product.PRODUCT_NAME}
          </h3>

          <p className="text-sm text-text-main mb-2 line-clamp-2">
            {product.PRODUCT_DESCRIPTION}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-bold text-primary">
              {formatCHF(price)}
            </span>

            {compareAtPrice > price ? (
              <span className="text-sm line-through text-gray-400">
                {formatCHF(compareAtPrice)}
              </span>
            ) : null}
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {weight > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                {weight} {product.WEIGHT_UNIT || "gm"}
              </span>
            )}
            {outOfStock ? (
              <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">
                Out of stock
              </span>
            ) : tracksInventory ? (
              <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                {inventoryAvailable} available
              </span>
            ) : null}
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              className={`w-full text-white transition-colors ${
                outOfStock
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : isInCart
                  ? 'bg-secondary hover:bg-secondary-dark cursor-not-allowed opacity-70'
                  : 'bg-primary hover:bg-primary-dark'
              }`}
              disabled={outOfStock}
            >
              {outOfStock ? 'Out of stock' : isInCart ? 'Added to Cart' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
