"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import GoogleMapsProvider from "@/components/providers/GoogleMapsProvider";

interface MapCardProps {
  placeId: string;
}

export default function MapCard({ placeId }: MapCardProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      if (!placeId) {
        console.warn("[Google Maps] This restaurant has no Google Place ID, so its map is hidden.");
        setFailed(true);
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
            console.warn(`[Google Maps] Place details for ${placeId} returned ${status}, so the map is hidden.`);
            setFailed(true);
          }
        });
      } catch (err) {
        console.warn("[Google Maps] The map could not start, so it is hidden:", err);
        setFailed(true);
      }
    },
    [placeId]
  );

  // Visitors never see map errors: the card is left out and the reason goes to the browser console.
  if (!apiKey) {
    console.warn("[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set, so the restaurant map is hidden.");
    return null;
  }
  if (failed) return null;

  return (
    <Card className="overflow-hidden">
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
    </Card>
  );
}
