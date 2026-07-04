"use client";

import Image from "next/image";
import { MenuProduct } from "@/types/product";
import ModalPortal from "../core/ModalPortal";
import Button from "../core/Button";
import { X } from "lucide-react";
import { formatCHF } from "@/lib/order";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuProduct;
  onAddToCart?: () => void;
  isInCart?: boolean;
  outOfStock?: boolean;
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  isInCart = false,
  outOfStock = false
}: ProductDetailsModalProps) {
  if (!isOpen) return null;

  const price = Number(product.PRODUCT_PRICE);
  const compareAtPrice = Number(product.COMPARE_AS_PRICE ?? 0);
  const tracksInventory = Number(product.TRACK_INVENTORY ?? 0) === 1;
  const inventoryAvailable = Number(product.INVENTORY_AVAILABLE ?? 0);
  const weight = Number(product.WEIGHT ?? 0);

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 z-10 bg-white/80 rounded-full p-1.5 hover:bg-white transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            
            <div className="grid md:grid-cols-2 gap-8 p-6">
              {/* Product Image */}
              <div className="relative h-80 md:h-[400px] bg-gray-50 rounded-lg overflow-hidden">
                {product.PIC ? (
                  <Image
                    src={product.PIC}
                    alt={product.PRODUCT_NAME}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    No Image Available
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="py-2">
                <h2 className="text-2xl font-bold mb-2">{product.PRODUCT_NAME}</h2>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {formatCHF(price)}
                  </span>
                  {compareAtPrice > price ? (
                    <span className="text-lg line-through text-gray-400">
                      {formatCHF(compareAtPrice)}
                    </span>
                  ) : null}
                </div>

                <div className="mb-5 flex flex-wrap gap-2 text-sm">
                  {weight > 0 && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                      {weight} {product.WEIGHT_UNIT || "gm"}
                    </span>
                  )}
                  {outOfStock ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                      Out of stock
                    </span>
                  ) : tracksInventory ? (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                      {inventoryAvailable} available
                    </span>
                  ) : null}
                </div>
                
                {product.PRODUCT_DESCRIPTION && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-line">
                      {product.PRODUCT_DESCRIPTION}
                    </p>
                  </div>
                )}
                
                {/* Add to Cart Button */}
                {onAddToCart && (
                  <div className="mt-8">
                    <Button
                      onClick={onAddToCart}
                      className={`w-full py-3 text-lg ${outOfStock ? 'bg-gray-400 cursor-not-allowed' : isInCart ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary/90'}`}
                      disabled={isInCart || outOfStock}
                    >
                      {outOfStock ? 'Out of stock' : isInCart ? 'Added to Cart' : 'Add to Cart'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
