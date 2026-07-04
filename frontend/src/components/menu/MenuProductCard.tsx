"use client";

import Image from "next/image";
import { MenuProduct } from "@/types/product";
import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import Button from "../core/Button";
import ProductDetailsModal from "./ProductDetailsModal";
import { toast } from "react-hot-toast";
import { formatCHF } from "@/lib/order";

interface MenuProductCardProps {
  product: MenuProduct;
  businessZipCode?: string;
}

export default function MenuProductCard({ product }: MenuProductCardProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { items, addToCart } = useCartStore();
  const isInCart = items.some((item) => item.id === String(product.BUSINESS_PRODUCT_ID));
  const price = Number(product.PRODUCT_PRICE);
  const compareAtPrice = Number(product.COMPARE_AS_PRICE ?? 0);
  const tracksInventory = Number(product.TRACK_INVENTORY ?? 0) === 1;
  const inventoryAvailable = Number(product.INVENTORY_AVAILABLE ?? 0);
  const outOfStock = tracksInventory && inventoryAvailable <= 0;
  const weight = Number(product.WEIGHT ?? 0);

  const handleAddToCart = () => {
    if (outOfStock) return;
    const result = addToCart({
      id: String(product.BUSINESS_PRODUCT_ID),
      name: product.PRODUCT_NAME,
      price,
      description: product.PRODUCT_DESCRIPTION || '',
      image: product.PIC,
      businessId: String(product.BUSINESS_ID),
      trackInventory: tracksInventory,
      inventoryAvailable,
    });
    if (result.ok) {
      toast.success("Added to cart");
    } else {
      toast.error(result.message || "Only 0 left in stock.");
    }
  };

  return (
    <>
      <ProductDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        product={product}
        onAddToCart={handleAddToCart}
        isInCart={isInCart}
        outOfStock={outOfStock}
      />

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
