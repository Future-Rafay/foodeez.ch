"use client";

import { cn } from "@/lib/utils";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface CitySelectionButtonsProps {
  mainCities: string[];
  selectedCity: string;
  onCitySelect: (city: string) => void;
  otherCities: string[];
}

export default function CitySelectionButtons({
  mainCities,
  selectedCity,
  onCitySelect,
  otherCities,
}: CitySelectionButtonsProps) {
  return (
    <div className="border border-accent mb-8 bg-secondary-light rounded-lg text-accent-dark">
      <div className="grid grid-cols-2 lg:flex gap-2 relative">
        {mainCities.map((city) => (
          <button
            key={city}
            onClick={() => onCitySelect(city)}
            className={cn(
              "lg:px-6 py-2 text-sm md:text-base transition-colors text-center",
              selectedCity === city
                ? "bg-primary text-white"
                : "bg-secondary-light hover:bg-primary-light"
            )}
          >
            {city}
          </button>
        ))}

        {otherCities.length > 0 && (
          <div className="relative w-full lg:w-auto">
            <SelectDropdown
              options={otherCities.map(city => ({ label: city, value: city }))}
              selectedValue={otherCities.includes(selectedCity) ? selectedCity : ''}
              onSelect={onCitySelect}
              placeholder="More Cities"
              openOnHover={true}
              buttonClassName="w-full lg:w-auto lg:px-6 py-2 text-sm md:text-base text-center flex items-center justify-center gap-1"
              menuClassName="md:w-56"
            />
          </div>
        )}
      </div>
    </div>
  );
}
