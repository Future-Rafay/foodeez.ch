"use client";

import { cn } from "@/lib/utils";
import { BusinessCategory } from "@/types/business.types";
import SelectDropdown from "@/components/ui/SelectDropdown";

export default function CategoryFilter({
  visibleCategories,
  hiddenCategories,
  selectedCategory,
  onSelect,
  isPending,
}: {
  visibleCategories: BusinessCategory[];
  hiddenCategories: BusinessCategory[];
  selectedCategory: string;
  onSelect: (cat: string) => void;
  isPending: boolean;
}) {
  return (
    <div className=" border border-accent mb-8 bg-secondary-light rounded-lg text-accent-dark">
      <div className="grid grid-cols-2 lg:flex gap-2 relative">
        {visibleCategories.map((category) => {
          const isSelected = selectedCategory === category.CATEGORY;
          const displayName = category.CATEGORY
            ? `${category.CATEGORY} (${category.CNT || 0})`
            : "";
          return (
            <button
              key={category.BUSINESS_CATEGORY_ID}
              onClick={() => onSelect(category.CATEGORY || "")}
              className={cn(
                "lg:px-6 py-2 text-sm md:text-base transition-colors relative text-center",

                isSelected
                  ? "bg-primary text-white"
                  : "bg-secondary-light hover:bg-primary-light"
              )}
              disabled={isPending}
            >
              {displayName}
              {isPending && isSelected && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary animate-pulse rounded-full" />
              )}
            </button>
          );
        })}

        {hiddenCategories.length > 0 && (
          <div className="relative min-w-[10rem] lg:w-auto">
            <SelectDropdown
              options={hiddenCategories.map((cat) => ({
                label: cat.CATEGORY || "",
                value: cat.CATEGORY || "",
                count:
                  typeof cat.CNT === "bigint" ? Number(cat.CNT) : cat.CNT || 0,
              }))}
              selectedValue={
                selectedCategory &&
                hiddenCategories.some(
                  (cat) => cat.CATEGORY === selectedCategory
                )
                  ? selectedCategory
                  : ""
              }
              onSelect={(val) => onSelect(val)}
              placeholder="More Categories"
              openOnHover={true}
              disabled={isPending}
              buttonClassName="w-full lg:px-6 py-2 text-sm md:text-base text-center"
              menuClassName="md:w-56"
            />
          </div>
        )}
      </div>
    </div>
  );
}
