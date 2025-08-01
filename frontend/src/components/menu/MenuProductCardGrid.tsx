"use client";

import MenuProductCard from "./MenuProductCard";

interface MenuProductCardGridProps {
  products: any[];
}

export default function MenuProductCardGrid({ products }: MenuProductCardGridProps) {
  if (!products?.length) return <div className="text-center text-text-muted py-12">No products found.</div>;
  
  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <MenuProductCard key={product.BUSINESS_FOOD_MENU_CARD_ID} product={product} />
        ))}
      </div>
    </section>
  );
} 