"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GoogleMap } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
import GoogleMapsProvider from "@/components/providers/GoogleMapsProvider";
import { Info } from "lucide-react";

interface MapCardProps {
  placeId: string;
}

export default function MapCard({ placeId }: MapCardProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // ✅ Case: API key missing
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps is not available some thing went wrong.");
      console.error("Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.");
    }
  }, [apiKey]);

  // ✅ Load Place Details
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
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            setCenter({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          } else {
            console.error("Google Maps Error:", status);
            setError("We’re unable to load this map right now. Please try later.");
          }
        });
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("There was a configuration issue. Please check map settings.");
      }
    },
    [placeId]
  );

  return (
    <Card className="overflow-hidden">
      {error ? (
        <MapFallback message={error} />
      ) : (
       <div>
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
            <style>{`
  /* Hide Google's ugly default error overlay */
  .gm-err-container,
  .gm-err-content {
    display: none !important;
  }

  /* Inject our own friendly overlay on error */
  .custom-map-error {
    position: absolute;
    inset: 0;
    background: #ffffff; /* White background */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 2rem;
    z-index: 10;
  }

  .custom-map-error h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #333;
    margin-top: 0.75rem;
  }
`}</style>


            {/* 👇 Custom Error Overlay */}
           
              <div className="custom-map-error">

                <Info className="w-12 h-12 text-primary" />
                <h3>
                  Map couldn’t load. Some thing went wrong.
                </h3>
              </div>
           
          </GoogleMap>


        </GoogleMapsProvider>
       </div>
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

