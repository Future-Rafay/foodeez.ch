import { cn } from "@/lib/utils";

export default function FoodTypeFilter({
  foodTypes,
  selectedFoodType,
  onSelect,
  isPending,
}: {
  foodTypes: string[];
  selectedFoodType: string;
  onSelect: (type: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="border border-accent mb-8 bg-secondary-light rounded-lg overflow-hidden text-accent-dark">
      <div className="flex flex-wrap">
        {foodTypes.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              "px-4 py-2 lg:px-16 text-sm md:text-base transition-colors relative text-center",
              "w-1/2 md:w-auto", // pill layout on mobile, auto width on larger screens
              selectedFoodType === type
                ? "bg-primary text-white"
                : "bg-secondary-light hover:bg-primary-light"
            )}
            disabled={isPending}
          >
            {type}
            {isPending && selectedFoodType === type && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
