"use client";

import { useEffect, useState, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";

// Styles
const containerStyle = {
  width: "100%",
  height: "600px",
};

const defaultZoom = 14;

// Custom hook for geolocation
function useGeolocation(timeoutMs = 15000) {
  const [locationState, setLocationState] = useState({
    loading: true,
    coords: null as { lat: number; lng: number } | null,
    error: null as string | null,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationState({
        loading: false,
        coords: null,
        error: "Geolocation is not supported by your browser.",
      });
      return;
    }

    let didRespond = false;

    const successHandler = (position: GeolocationPosition) => {
      didRespond = true;
      setLocationState({
        loading: false,
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        error: null,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      didRespond = true;
      let errorMessage = "";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Permission to access your location was denied.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is currently unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage = "The request to get your location timed out.";
          break;
        default:
          errorMessage = "An unknown error occurred while getting your location.";
          break;
      }

      setLocationState({
        loading: false,
        coords: null,
        error: errorMessage,
      });
    };

    try {
      navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      });

      // Custom timeout for "user ignored"
      const fallbackTimer = setTimeout(() => {
        if (!didRespond) {
          setLocationState({
            loading: false,
            coords: null,
            error: "Location request ignored. Please allow location access.",
          });
        }
      }, timeoutMs + 2000);

      return () => clearTimeout(fallbackTimer);
    } catch (e) {
      console.error("Error fetching location:", e);
      setLocationState({
        loading: false,
        coords: null,
        error: "An unexpected error occurred. Please try again.",
      });
    }
  }, [timeoutMs]);

  return locationState;
}

export default function MapSection() {
  const { loading, coords, error } = useGeolocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<any>(null);

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    if (coords && window.google?.maps?.marker?.AdvancedMarkerElement) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: coords,
        title: "You are here!",
      });
    }
  };

  useEffect(() => {
    if (mapRef.current && coords && window.google?.maps?.marker?.AdvancedMarkerElement) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: coords,
        title: "You are here!",
      });
    }
  }, [coords]);

  // GoogleMapsProvider already logs the missing key; visitors see no map and no error.
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return null;
  if (loading) return <MapSkeleton />;

  if (error) {
    return (
      <ErrorCard
        message={error}
      />
    );
  }

  return (
    <div className="relative w-full h-[600px] overflow-hidden shadow-md rounded-lg">
      {coords && (

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={coords}
          zoom={defaultZoom}
          onLoad={handleMapLoad}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        />

      )}
    </div>
  );
}

// Skeleton loader
function MapSkeleton() {
  return (
    <div className="w-full h-[600px] bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-xl"></span>
    </div>
  );
}

// Error UI
function ErrorCard({
  message,
}: {
  message: string;
}) {
  return ( 
    <div className="flex flex-col items-center justify-center h-[600px] bg-gray-100 text-gray-600 text-center px-6 rounded-xl">
      <h2 className="text-xl font-semibold mb-2">{message}</h2>
      <span className="text-6xl my-4">⚠️</span>
    </div>
  );
}
