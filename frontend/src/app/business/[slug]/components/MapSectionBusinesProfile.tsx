"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import GoogleMapsProvider from "@/components/providers/GoogleMapsProvider";

interface MapCardProps {
  placeId: string;
}

export default function MapCard({ placeId }: MapCardProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      if (!placeId) {
        setError("Map location is not available at the moment.");
        console.error("Place ID is missing. Cannot load map location.");
        return;
      }

      try {
        const service = new google.maps.places.PlacesService(map);
        service.getDetails({ placeId }, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            setCenter({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          } else {
            console.error("Google Maps Error:", status);
            setError("We're unable to load this map right now. Please try later.");
          }
        });
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("There was a configuration issue. Please check map settings.");
      }
    },
    [placeId]
  );

  if (!apiKey) {
    return (
      <Card className="overflow-hidden">
        <MapFallback message="Google Maps is not available some thing went wrong." />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {error ? (
        <MapFallback message={error} />
      ) : (
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
          />
        </GoogleMapsProvider>
      )}
    </Card>
  );
}

function MapFallback({ message }: { message: string }) {
  return (
    <div className="p-8 flex items-center justify-center h-[400px] bg-gray-50 rounded-xl shadow-inner">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <Info className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text-main">{message}</h3>
      </div>
    </div>
  );
}
