"use client";

import { useEffect, useState } from "react";
import BusinessCard from "@/components/core/BusinessCard";
import Separator from "@/components/ui/separator";
import { getTopRatedRestaurantsNearYou } from "@/services/HomePageService";
import { BusinessDetail } from "@/types/business.types";

interface TopRatedNearYouProps {
    className?: string;
}

type LocationState = "checking" | "hidden" | "ready";

export default function TopRatedNearYou({ className = "" }: TopRatedNearYouProps) {
    const [restaurants, setRestaurants] = useState<BusinessDetail[]>([]);
    const [state, setState] = useState<LocationState>("checking");

    useEffect(() => {
        let cancelled = false;

        if (!navigator.geolocation) {
            setState("hidden");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const nearbyRestaurants = await getTopRatedRestaurantsNearYou(
                    coords.latitude,
                    coords.longitude,
                    4
                ).catch(() => []);

                if (cancelled) return;

                setRestaurants(nearbyRestaurants);
                setState(nearbyRestaurants.length > 0 ? "ready" : "hidden");
            },
            () => {
                if (!cancelled) setState("hidden");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );

        return () => {
            cancelled = true;
        };
    }, []);

    if (state !== "ready") {
        return null;
    }

    return (
        <>
            <section className={`py-0 lg:py-16 px-4 lg:px-0 ${className}`}>
                <div className="">
                    <div className="text-center mb-12">
                        <h2 className="sub-heading">Top Rated Restaurants Near You</h2>
                        <p className="sub-heading-description">
                            Discover the highest-rated restaurants within 1km of your current location
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {restaurants.map((restaurant) => (
                            <div key={restaurant.BUSINESS_ID} className="">
                                <BusinessCard business={restaurant} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <Separator />
        </>
    );
}
