import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { MapPin } from 'lucide-react';

interface Place {
  display_name: string;
  place_id: number;
  lat: string;
  lon: string;
}

export interface PlaceSelection {
  displayName: string;
  lat: number;
  lon: number;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceSelection) => void;
  placeholder?: string;
  className?: string;
}

export const PlaceAutocomplete = ({ 
  value, 
  onChange,
  onPlaceSelect,
  placeholder = "City, Country",
  className 
}: PlaceAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions via backend proxy (avoids browser CORS / header restrictions)
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-place', {
        body: { query },
      });

      if (error) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      const results = Array.isArray(data?.results) ? data.results : [];
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectPlace = (place: Place) => {
    onChange(place.display_name);
    onPlaceSelect?.({
      displayName: place.display_name,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
    });
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        className={className}
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-secondary border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="w-full px-3 py-2 text-left text-sm text-cream hover:bg-accent/50 flex items-start gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{place.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
