"use client";

import { useMemo, useState } from "react";
import type { MenuCard, MenuProduct } from "@/types/product";
import MenuHeroSection from "@/components/menu/MenuHeroSection";
import MenuCategorySection from "@/components/menu/MenuCategorySection";
import MenuSwitchSkeleton from "@/components/menu/MenuSwitchSkeleton";

export default function MenuPageClient({
  business,
  menuCards,
  products,
}: {
  business: MenuCard;
  menuCards: MenuCard[];
  products: MenuProduct[];
}) {
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(
    products[0]?.BUSINESS_FOOD_MENU_CARD_ID ??
      menuCards[0]?.BUSINESS_FOOD_MENU_CARD_ID ??
      null
  );
  const [switchingMenu, setSwitchingMenu] = useState(false);

  const selectedMenuProducts = useMemo(
    () =>
      selectedMenuId
        ? products.filter(
            (product) => product.BUSINESS_FOOD_MENU_CARD_ID === selectedMenuId
          )
        : [],
    [products, selectedMenuId]
  );

  const menuByCategory = useMemo(
    () =>
      selectedMenuProducts.reduce((acc, item) => {
        const cat = item.CATEGORY || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, MenuProduct[]>),
    [selectedMenuProducts]
  );

  return (
    <div className="px-0">
      <MenuHeroSection
        business={business}
        Menu={menuCards}
        setSelectedMenuId={(id) => {
          setSwitchingMenu(true);
          setTimeout(() => {
            setSelectedMenuId(id);
            setSwitchingMenu(false);
          }, 100);
        }}
        selectedMenuId={selectedMenuId}
      />
      <div className="px-4 lg:px-0">
        {switchingMenu ? (
          <MenuSwitchSkeleton />
        ) : selectedMenuProducts.length === 0 ? (
          <div className="text-center py-20 text-text-main bg-primary/10">
            <h2 className="sub-heading text-center mb-2">No products found.</h2>
          </div>
        ) : (
          Object.entries(menuByCategory).map(([category, products], idx, arr) => (
            <div key={category}>
              <MenuCategorySection
                category={category}
                products={products}
                businessZipCode={business.ADDRESS_ZIP?.toString() || ""}
              />
              {idx < arr.length - 1 && (
                <hr
                  className="my-12 border-t-2 border-background-muted"
                  aria-hidden="true"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
