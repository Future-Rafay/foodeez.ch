"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";

export default function CartIcon() {
  const { totalItems } = useCartStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a placeholder on the server to avoid hydration mismatch
    return (
      <div className="relative p-2 lg:p-3">
        <ShoppingCart className="h-6 w-6 text-text-main" />
      </div>
    );
  }

  return (
    <Link
      href="/cart"
      aria-label={`Open cart${totalItems > 0 ? ` with ${totalItems} item${totalItems === 1 ? "" : "s"}` : ""}`}
      className="group transition-all duration-200 relative p-2 lg:p-3 rounded-full text-text-main hover:bg-primary-dark hover:text-white"
    >
      <ShoppingCart className="h-6 w-6 text-text-main group-hover:text-white" />
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-dark text-white text-xs font-bold">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
