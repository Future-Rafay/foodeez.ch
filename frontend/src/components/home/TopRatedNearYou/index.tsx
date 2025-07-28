"use client";

/**
 * TopRatedNearYou Component
 * 
 * This component displays the top 4 rated restaurants near the user's location.
 * 
 * Features:
 * - Automatically detects if user has location enabled
 * - Falls back to IP-based location if GPS location is not available
 * - Removes the component entirely if no restaurants are found
 * - Uses 1km radius for GPS location, 5km radius for IP location
 * - Shows loading states and error handling
 * - Reuses existing BusinessCard component
 */

import { useState, useEffect, useCallback } from "react";
import { BusinessDetail } from "@/types/business.types";
import { getTopRatedRestaurantsNearYou, getTopRatedRestaurantsByIPLocation } from "@/services/HomePageService";
import BusinessCard from "@/components/core/BusinessCard";
import { MapPin, Star } from "lucide-react";
import Button from "@/components/core/Button";
import Separator from "@/components/ui/separator";

interface TopRatedNearYouProps {
    className?: string;
}

export default function TopRatedNearYou({ className = "" }: TopRatedNearYouProps) {
    const [restaurants, setRestaurants] = useState<BusinessDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [initialLocationCheck, setInitialLocationCheck] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    // Get user location
    const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by this browser."));
                return;
            }

                  navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ lat: latitude, lng: longitude });
        },
        () => {
          reject(new Error("Unable to retrieve your location."));
        },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                }
            );
        });
    };

      // Try to get restaurants with user location first, then fallback to IP
  const tryGetRestaurants = useCallback(async (useUserLocation: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      let nearbyRestaurants: BusinessDetail[] = [];
      
      if (useUserLocation && userLocation) {
        // Try with user's GPS location (1km radius)
        nearbyRestaurants = await getTopRatedRestaurantsNearYou(userLocation.lat, userLocation.lng, 4);
      }
      
      // If no restaurants found with GPS location, try IP-based location
      if (nearbyRestaurants.length === 0) {
        nearbyRestaurants = await getTopRatedRestaurantsByIPLocation(4);
      }
      
      // If still no restaurants found, hide the component
      if (nearbyRestaurants.length === 0) {
        setShouldRender(false);
        return;
      }
      
      setRestaurants(nearbyRestaurants);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to fetch restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

    // Enable location and fetch restaurants
    const enableLocationAndFetch = async () => {
        try {
            setLoading(true);
            setError(null);

            const location = await getUserLocation();
            setUserLocation(location);
            setLocationEnabled(true);

            await tryGetRestaurants(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get location");
            setLocationEnabled(false);

            // If user location fails, try IP-based location
            await tryGetRestaurants(false);
        } finally {
            setLoading(false);
        }
    };

    // Check if location is already enabled on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setLocationEnabled(true);
                    setInitialLocationCheck(false);

                    // Auto-fetch restaurants if location is already available
                    tryGetRestaurants(true);
                },
                () => {
                    // Location not available, try IP-based location
                    setLocationEnabled(false);
                    setInitialLocationCheck(false);
                    tryGetRestaurants(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
            setInitialLocationCheck(false);
            // Try IP-based location as fallback
            tryGetRestaurants(false);
        }
    }, [tryGetRestaurants]);

    // Don't render the component if no restaurants found
    if (!shouldRender) {
        return null;
    }

    if (initialLocationCheck) {
        return (
            <section className={`py-16 px-4 lg:px-0 ${className}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                            Top Rated Restaurants Near You
                        </h2>
                        <p className="text-lg text-text-muted">
                            Checking your location...
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="bg-gray-200 rounded-xl h-[560px]"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!locationEnabled && !loading && restaurants.length === 0) {
        return (
            <section className={`py-16 px-4 lg:px-0 ${className}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                            Top Rated Restaurants Near You
                        </h2>
                        <p className="text-lg text-text-muted max-w-2xl mx-auto">
                            Enable location access to discover the best-rated restaurants within 1km of your current location
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <Button
                            onClick={enableLocationAndFetch}
                            disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-semibold text-lg flex items-center gap-2"
                        >
                            <MapPin size={20} />
                            {loading ? "Getting Location..." : "Enable Location & Discover"}
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    if (loading) {
        return (
            <>
                <section className={`py-16 px-4 lg:px-0 ${className}`}>
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                                Top Rated Restaurants Near You
                            </h2>
                            <p className="text-lg text-text-muted">
                                Finding the best restaurants in your area...
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, index) => (
                                <div key={index} className="animate-pulse">
                                    <div className="bg-gray-200 rounded-xl h-[560px]"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <Separator />
            </>
        );
    }

    if (error && restaurants.length === 0) {
        return (
            <section className={`py-16 px-4 lg:px-0 ${className}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                            Top Rated Restaurants Near You
                        </h2>
                        <p className="text-lg text-text-muted mb-6">
                            {error}
                        </p>
                        <Button
                            onClick={enableLocationAndFetch}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-full"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className={`py-16 px-4 lg:px-0 ${className}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                            Top Rated Restaurants Near You
                        </h2>
                        <p className="text-lg text-text-muted max-w-2xl mx-auto">
                            Discover the highest-rated restaurants within 1km of your current location
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-muted">
                            <MapPin size={16} />
                            <span>Within 1km radius</span>
                            <Star size={16} className="text-highlight" />
                            <span>Sorted by rating</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {restaurants.map((restaurant) => (
                            <BusinessCard key={restaurant.BUSINESS_ID} business={restaurant} />
                        ))}
                    </div>
                </div>

            </section>
            <Separator />
        </>
    );
} 