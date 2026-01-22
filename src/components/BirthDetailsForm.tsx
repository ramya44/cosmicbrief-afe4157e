import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceAutocomplete, PlaceSelection } from '@/components/PlaceAutocomplete';
import { validateBirthForm, isFormValid, MIN_DATE } from '@/lib/validation';
import { getDeviceId } from '@/lib/deviceId';
import { Calendar, Clock, MapPin, Check, X, Loader2, User, Mail } from 'lucide-react';

export interface BirthFormData {
  name?: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
}

export interface BirthDetailsFormProps {
  // Configuration
  showName?: boolean;
  showEmail?: boolean;
  requireAge18?: boolean;
  storageKey?: string;

  // Callbacks
  onSubmit: (data: BirthFormData) => void | Promise<void>;

  // State
  isSubmitting?: boolean;
  submitButtonText?: string;
  submitButtonIcon?: React.ReactNode;

  // Initial values (optional)
  initialValues?: Partial<{
    name: string;
    email: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
  }>;
}

interface SavedFormData {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  placeCoords: { lat: number; lon: number } | null;
  deviceId: string;
}

export const BirthDetailsForm = ({
  showName = false,
  showEmail = true,
  requireAge18 = false,
  storageKey,
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Continue',
  submitButtonIcon,
  initialValues,
}: BirthDetailsFormProps) => {
  const [formData, setFormData] = useState({
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    birthDate: initialValues?.birthDate || '',
    birthTime: initialValues?.birthTime || '',
    birthPlace: initialValues?.birthPlace || '',
  });
  const [placeCoords, setPlaceCoords] = useState<{ lat: number; lon: number } | null>(
    initialValues?.latitude && initialValues?.longitude
      ? { lat: initialValues.latitude, lon: initialValues.longitude }
      : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  // Load saved form data on mount (only if storageKey provided)
  useEffect(() => {
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: SavedFormData = JSON.parse(saved);
        const currentDeviceId = getDeviceId();
        if (parsed.deviceId === currentDeviceId) {
          setFormData({
            name: parsed.name || '',
            email: parsed.email || '',
            birthDate: parsed.birthDate || '',
            birthTime: parsed.birthTime || '',
            birthPlace: parsed.birthPlace || '',
          });
          if (parsed.placeCoords) {
            setPlaceCoords(parsed.placeCoords);
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  // Save form data on changes (only if storageKey provided)
  useEffect(() => {
    if (!storageKey) return;

    try {
      const dataToSave: SavedFormData = {
        ...formData,
        placeCoords,
        deviceId: getDeviceId(),
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch {
      // Ignore localStorage errors
    }
  }, [formData, placeCoords, storageKey]);

  const validateForm = () => {
    const newErrors = validateBirthForm(formData, {
      requireAge18,
      hasPlaceCoords: !!placeCoords,
    });

    // If email is not shown, don't validate it
    if (!showEmail) {
      delete newErrors.email;
    }

    setErrors(newErrors);
    return isFormValid(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !placeCoords) {
      return;
    }

    const submitData: BirthFormData = {
      email: formData.email.trim(),
      birthDate: formData.birthDate,
      birthTime: formData.birthTime,
      birthPlace: formData.birthPlace,
      latitude: placeCoords.lat,
      longitude: placeCoords.lon,
    };

    if (showName && formData.name.trim()) {
      submitData.name = formData.name.trim();
    }

    await onSubmit(submitData);
  };

  const handlePlaceSelect = (place: PlaceSelection) => {
    setPlaceCoords({ lat: place.lat, lon: place.lon });
  };

  const handlePlaceChange = (value: string) => {
    setFormData({ ...formData, birthPlace: value });
    setPlaceCoords(null);
  };

  const clearSelectedPlace = () => {
    setFormData({ ...formData, birthPlace: '' });
    setPlaceCoords(null);
  };

  let animationDelay = 50;
  const getNextDelay = () => {
    const delay = animationDelay;
    animationDelay += 50;
    return delay;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
      {/* Name (Optional) */}
      {showName && (
        <div
          className="space-y-2 animate-fade-up"
          style={{ animationDelay: `${getNextDelay()}ms`, animationFillMode: 'both' }}
        >
          <Label htmlFor="name" className="text-cream flex items-center gap-2">
            <User className="w-4 h-4 text-gold" />
            Name <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>
      )}

      {/* Email (Required when shown) */}
      {showEmail && (
        <div
          className="space-y-2 animate-fade-up"
          style={{ animationDelay: `${getNextDelay()}ms`, animationFillMode: 'both' }}
        >
          <Label htmlFor="email" className="text-cream flex items-center gap-2">
            <Mail className="w-4 h-4 text-gold" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
            disabled={isSubmitting}
            maxLength={255}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
      )}

      {/* Date of Birth */}
      <div
        className="space-y-2 animate-fade-up"
        style={{ animationDelay: `${getNextDelay()}ms`, animationFillMode: 'both' }}
      >
        <Label htmlFor="birthDate" className="text-cream flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          Date of Birth
        </Label>
        <Input
          id="birthDate"
          type="date"
          min={MIN_DATE}
          max={today}
          value={formData.birthDate}
          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20 text-left"
          disabled={isSubmitting}
        />
        {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
      </div>

      {/* Time of Birth */}
      <div
        className="space-y-2 animate-fade-up"
        style={{ animationDelay: `${getNextDelay()}ms`, animationFillMode: 'both' }}
      >
        <Label htmlFor="birthTime" className="text-cream flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold" />
          Time of Birth
        </Label>
        <Input
          id="birthTime"
          type="time"
          value={formData.birthTime}
          onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
          className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20 text-left"
          disabled={isSubmitting}
        />
        {errors.birthTime && <p className="text-sm text-destructive">{errors.birthTime}</p>}
      </div>

      {/* Place of Birth */}
      <div
        className="space-y-2 animate-fade-up relative z-50"
        style={{ animationDelay: `${getNextDelay()}ms`, animationFillMode: 'both' }}
      >
        <Label htmlFor="birthPlace" className="text-cream flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gold" />
          Place of Birth
        </Label>
        {placeCoords ? (
          <div className="flex items-center gap-2 p-3 bg-secondary/50 border border-gold/30 rounded-md">
            <Check className="w-4 h-4 text-gold flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cream truncate">{formData.birthPlace}</p>
              <p className="text-xs text-muted-foreground">
                {placeCoords.lat.toFixed(4)}, {placeCoords.lon.toFixed(4)}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelectedPlace}
              className="p-1 hover:bg-accent/50 rounded transition-colors"
              aria-label="Clear location"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-cream" />
            </button>
          </div>
        ) : (
          <PlaceAutocomplete
            value={formData.birthPlace}
            onChange={handlePlaceChange}
            onPlaceSelect={handlePlaceSelect}
            placeholder="Start typing a city..."
            className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
          />
        )}
        {errors.birthPlace && <p className="text-sm text-destructive">{errors.birthPlace}</p>}
      </div>

      {/* Submit Button */}
      <div
        className="pt-4 animate-fade-up"
        style={{ animationDelay: `${getNextDelay()}ms`, animationFillMode: 'both' }}
      >
        <Button type="submit" variant="hero" size="lg" className="w-full group" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {submitButtonText}
              {submitButtonIcon}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default BirthDetailsForm;
