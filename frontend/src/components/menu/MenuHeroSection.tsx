"use client";

import Image from "next/image";
import type { MenuCard } from "@/types/product";

interface MenuHeroSectionProps {
  business: MenuCard | null;
  Menu: MenuCard[];
  setSelectedMenuId: (id: number) => void;
  selectedMenuId: number | null;
}

export default function MenuHeroSection({
  business,
  Menu,
  setSelectedMenuId,
  selectedMenuId,
}: MenuHeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary-light via-primary to-primary-dark text-white py-20 px-4 sm:px-8 text-center overflow-hidden">

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Business Logo */}
        <div className="relative mx-auto w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-8 border-white bg-white shadow-brand-lg transform transition-transform duration-300 hover:scale-105">
          {business?.IMAGE_URL ? (
            <Image
              src={business.IMAGE_URL}
              alt={`${business.BUSINESS_NAME || "Business"} logo`}
              width={192}
              height={192}
              className="object-cover w-full h-full"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-semibold p-4">
              <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
            </div>
          )}
        </div>

        {/* Business Info */}
        <h1 className="mt-8 sub-heading text-white font-extrabold tracking-tight drop-shadow-2xl font-display">
          {business?.BUSINESS_NAME} <span className="text-white/80">Menu</span>
        </h1>

        <p className="mt-4 sub-heading-description text-white leading-relaxed font-body">
          {business?.DESCRIPTION}
        </p>

        {business?.ADDRESS_STREET && (
          <p className="mt-2 text-base sm:text-lg text-white/70 font-body">
            {business.ADDRESS_STREET}, {business.ADDRESS_TOWN},{" "}
            {business.ADDRESS_ZIP}, Switzerland
          </p>
        )}
      </div>

      {/* Menu Selection */}
      {Menu && Menu.length > 0 && (
        <div className="sticky top-0 z-30 mt-10 bg-gradient-to-r from-primary-light to-primary-dark px-4 sm:px-8 py-4 border-y border-white/20 shadow-md">
          <div
            className="flex overflow-x-auto gap-3 scrollbar-thin scrollbar-thumb-white/40 scrollbar-track-white/10 sm:justify-center"
            role="tablist"
            aria-label="Menu Tabs"
          >
            {Menu.map((menu) => {
              const isSelected =
                selectedMenuId === menu.BUSINESS_FOOD_MENU_CARD_ID;
              return (
                <button
                  key={menu.BUSINESS_FOOD_MENU_CARD_ID}
                  className={`text-sm sm:text-base whitespace-nowrap font-medium px-4 py-2 rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2
                  ${
                    isSelected
                      ? "bg-white text-primary border-white"
                      : "bg-white/10 hover:bg-white/20 text-white border-transparent"
                  }`}
                  onClick={() =>
                    menu.BUSINESS_FOOD_MENU_CARD_ID &&
                    setSelectedMenuId(menu.BUSINESS_FOOD_MENU_CARD_ID)
                  }
            
                  aria-label={`Show menu: ${menu.MENU_NAME}`}
                  tabIndex={0}
                >
                  {menu.MENU_NAME}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
