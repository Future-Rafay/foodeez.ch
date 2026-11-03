import { useEffect, useRef, useState } from 'react';

interface UseGoogleMapsAutocompleteProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  types?: string[];
  componentRestrictions?: google.maps.places.ComponentRestrictions;
  fields?: string[];
}

export function useGoogleMapsAutocomplete({
  inputRef,
  onPlaceSelect,
  types = ['(regions)'],
  componentRestrictions = { country: 'ch' },
  fields = ['address_components', 'formatted_address'],
}: UseGoogleMapsAutocompleteProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Wait for Google Maps to load
    const checkInterval = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      // Create autocomplete instance
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types,
          componentRestrictions,
          fields,
        }
      );

      // Add place_changed listener
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && onPlaceSelect) {
          onPlaceSelect(place);
        }
      });

      setError(null);
    } catch (err) {
      console.error('Google Places Autocomplete error:', err);
      setError('Failed to initialize location search');
    }
  }, [isLoaded, inputRef, onPlaceSelect, types, componentRestrictions, fields]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  return {
    isLoaded,
    error,
    autocomplete: autocompleteRef.current,
  };
}
