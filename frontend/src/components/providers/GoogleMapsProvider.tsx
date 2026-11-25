'use client';

import React from "react";
import { LoadScript } from "@react-google-maps/api";

// Static libraries array to prevent reloading
const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Without a key, render the page without maps or place suggestions; visitors see no error.
  if (!apiKey) {
    console.warn("[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set, so maps and place suggestions are hidden.");
    return <>{children}</>;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={LIBRARIES}
      onError={(error) => console.warn("[Google Maps] The Maps script failed to load, so maps are hidden:", error)}
    >
      {children}
    </LoadScript>
  );
}
