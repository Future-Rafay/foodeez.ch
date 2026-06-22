'use client';

import { useState, useRef, useCallback } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import GoogleMapsProvider from "@/components/providers/GoogleMapsProvider";

interface MapCardProps {
  placeId: string;
}

export default function MapCard({ placeId }: MapCardProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key is not defined in environment variables.");
  }

  if (!placeId) {
    console.error("Place ID is required to display the map.");
  }

  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    const service = new google.maps.places.PlacesService(map);
    service.getDetails({ placeId }, (place, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        place?.geometry?.location
      ) {
        setCenter({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      } else {
        console.error("Failed to fetch place details:", status);
      }
    });
  }, [placeId]);



  return (
    <>
      <Card className="overflow-hidden">
        {!placeId ? <MapFallback /> : (
          <GoogleMapsProvider>
            <GoogleMap
              mapContainerStyle={{ height: "400px", width: "100%" }}
              center={center || { lat: 0, lng: 0 }}
              zoom={center ? 17 : 1}
              onLoad={handleLoad}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              {!center && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <p className="text-gray-600">Loading map...</p>
                </div>
              )}
            </GoogleMap>
          </GoogleMapsProvider>
        )}
      </Card>
    </>
  );
}


function MapFallback() {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Google Map</h3>
        <p className="text-gray-500 mt-2">Map will be displayed here</p>
      </div>
    </div>
  );
}
