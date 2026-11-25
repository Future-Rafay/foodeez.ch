"use client";

import { useState, useEffect, useCallback } from "react";
import { getBusinessesByLocation, getCities } from "@/services/HomePageService";
import { BusinessDetail } from "@/types/business.types";
import CitySelectionButtons from "./CitySelectionButtons";
import ZipCodeSearch from "./ZipCodeSearch";
import ContentHeader from "./ContentHeader";
import LoadingSkeleton from "./LoadingSkeleton";
import BusinessGrid from "./BusinessGrid";


type City = { CITY_NAME: string | null };

const MAIN_CITIES = [
  "Zurich",
  "Geneva",
  "Luzern",
  "Bern",
  "Interlaken",
  "Zermatt",
  "St. Moritz",
];

const INITIAL_CITY = "Zurich";

export default function CitySection() {
  const [cities, setCities] = useState<City[]>([]);
  const [businesses, setBusinesses] = useState<BusinessDetail[]>([]);
  const [selectedCity, setSelectedCity] = useState(INITIAL_CITY);
  const [zipCode, setZipCode] = useState("");
  const [searchZipCode, setSearchZipCode] = useState("");
  const [loading, setLoading] = useState({ cities: true, businesses: true });
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch functions
  const fetchCities = useCallback(async () => {
    try {
      const data = await getCities();
      setCities(data.filter((c) => c.CITY_NAME));
      setError(null);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Could not load cities.");
    } finally {
      setLoading((prev) => ({ ...prev, cities: false }));
    }
  }, []);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, businesses: true }));
  
      // Determine which parameter to use for search
      const params: { city?: string; zipCode?: string; limit?: number } = {
        limit: 12,
      };

      if (searchZipCode) {
        params.zipCode = searchZipCode; // Prioritize zip code if present
      } else if (selectedCity) {
        params.city = selectedCity; // Fallback to city if no zip code
      }

      const data = await getBusinessesByLocation(params);
  
      if (!data || data.length === 0) {
        throw new Error("No businesses found");
      }
  
      // Assuming the data already matches the BusinessDetail type
      setBusinesses(data as BusinessDetail[]);
      setError(null);
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setError("Could not load businesses.");
      setBusinesses([]); // optional: reset businesses on error
    } finally {
      setLoading((prev) => ({ ...prev, businesses: false }));
    }
  }, [selectedCity, searchZipCode]);
  

  // Initial data fetch
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Business data fetch
  useEffect(() => {
    // Only fetch if either city or zipCode is set
    if (selectedCity || searchZipCode) {
      fetchBusinesses();
    }
  }, [selectedCity, searchZipCode, fetchBusinesses]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setZipCode("");
    setSearchZipCode("");
  };

  const handleZipCodeSearchSubmit = (zip: string) => {
    setSearchZipCode(zip);
    setSelectedCity(""); // Clear selected city when searching by zip code
  };

  const otherCities = cities
    .filter((c) => c.CITY_NAME && !MAIN_CITIES.includes(c.CITY_NAME))
    .map((c) => c.CITY_NAME!)

  const isLoading = loading.cities || loading.businesses;
  const showSkeleton = isLoading && !error;
  const showEmptyState = !isLoading && !error && businesses.length === 0;

  return (
    <section className="py-12">
      <div className="text-center mb-10">
        <h2 className="sub-heading">
          Find Restaurants in Your City
        </h2>
        <p className="sub-heading-description">
          Discover incredible dining options in top cities across Switzerland,
          or search by postal code for local restaurants.
        </p>
      </div>

      <CitySelectionButtons
        mainCities={MAIN_CITIES}
        selectedCity={selectedCity}
        onCitySelect={handleCitySelect}
        otherCities={otherCities}
      />

      <ZipCodeSearch
        zipCode={zipCode}
        setZipCode={setZipCode}
        setSearchZipCode={setSearchZipCode}
        onSearchSubmit={handleZipCodeSearchSubmit}
      />

      <ContentHeader
        selectedCity={selectedCity}
        searchZipCode={searchZipCode}
      />

      {showSkeleton && <LoadingSkeleton />}

      {error && (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {showEmptyState && (
        <div className="text-center py-10">
          <p className="text-gray-500">
            No restaurants found{selectedCity ? ` in ${selectedCity}` : ""}
          </p>
        </div>
      )}

      {!isLoading && !error && businesses.length > 0 && (
        <BusinessGrid businesses={businesses} />
      )}

    </section>
  );
}
