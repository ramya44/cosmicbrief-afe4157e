import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { PlaceAutocomplete, PlaceSelection } from '@/components/PlaceAutocomplete';
import { VedicLoadingScreen } from '@/components/VedicLoadingScreen';
import { useForecastStore } from '@/store/forecastStore';
import { convertBirthTimeToUtc } from '@/lib/convertBirthTimeToUtc';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles, Calendar, Clock, MapPin, Check, X, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VedicInputPage = () => {
  const navigate = useNavigate();
  const { setBirthData, setIsPaid, setStrategicForecast } = useForecastStore();
  
  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    email: '',
  });
  const [placeCoords, setPlaceCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const minDate = '1900-01-01';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Please enter your birth date';
    } else {
      const selectedDate = new Date(formData.birthDate);
      const min = new Date(minDate);
      const max = new Date(today);
      if (selectedDate < min) {
        newErrors.birthDate = 'Date cannot be before 1900';
      } else if (selectedDate > max) {
        newErrors.birthDate = 'Date cannot be in the future';
      }
    }
    if (!formData.birthTime) {
      newErrors.birthTime = 'Please enter your birth time';
    }
    if (!formData.birthPlace.trim()) {
      newErrors.birthPlace = 'Please enter your birth place';
    } else if (!placeCoords) {
      newErrors.birthPlace = 'Please select a location from the dropdown to confirm coordinates';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[VedicInputPage] Form submitted');
    
    if (!validateForm() || !placeCoords) {
      console.log('[VedicInputPage] Validation failed or no coords', { placeCoords });
      return;
    }

    setIsSubmitting(true);
    console.log('[VedicInputPage] Starting API calls...');

    try {
      // Reset paid state for new forecast entry
      setIsPaid(false);
      setStrategicForecast(null);
      
      // Convert birth time to UTC
      let birthDateTimeUtc: string | undefined;
      try {
        birthDateTimeUtc = await convertBirthTimeToUtc(
          formData.birthDate,
          formData.birthTime,
          placeCoords.lat,
          placeCoords.lon
        );
        console.log('[VedicInputPage] UTC conversion result:', birthDateTimeUtc);
      } catch (error) {
        console.error('[VedicInputPage] Error converting to UTC:', error);
      }

      // Use the UTC datetime or construct a local one
      const datetimeForApi = birthDateTimeUtc || `${formData.birthDate}T${formData.birthTime}:00`;
      console.log('[VedicInputPage] Calling get-advanced-kundli with:', { datetimeForApi, lat: placeCoords.lat, lon: placeCoords.lon });
      
      // Call get-advanced-kundli edge function
      const { data: kundliData, error: kundliError } = await supabase.functions.invoke(
        'get-advanced-kundli',
        {
          body: {
            datetime: datetimeForApi,
            latitude: placeCoords.lat,
            longitude: placeCoords.lon,
            ayanamsa: 1, // Lahiri
          },
        }
      );

      console.log('[VedicInputPage] Kundli API response:', { kundliData, kundliError });
      
      if (kundliError) {
        throw new Error(kundliError.message || 'Failed to fetch Kundli data');
      }

      if (kundliData?.error) {
        throw new Error(kundliData.error);
      }

      console.log('[VedicInputPage] Calling save-kundli-details...');
      
      // Save to database via save-kundli-details edge function
      const { data: saveResult, error: saveError } = await supabase.functions.invoke(
        'save-kundli-details',
        {
          body: {
            birth_date: formData.birthDate,
            birth_time: formData.birthTime,
            birth_place: formData.birthPlace,
            birth_time_utc: birthDateTimeUtc,
            latitude: placeCoords.lat,
            longitude: placeCoords.lon,
            email: formData.email,
            kundli_data: kundliData,
          },
        }
      );

      console.log('[VedicInputPage] Save result:', { saveResult, saveError });
      
      if (saveError) {
        throw new Error(saveError.message || 'Failed to save Kundli details');
      }

      if (saveResult?.error) {
        throw new Error(saveResult.error);
      }

      // Store birth data in store
      const fullBirthData = {
        ...formData,
        lat: placeCoords.lat,
        lon: placeCoords.lon,
        birthDateTimeUtc,
      };
      
      setBirthData(fullBirthData);

      // Show the loading screen for forecast generation
      setIsSubmitting(false);
      setIsGeneratingForecast(true);

      console.log('[VedicInputPage] Generating free Vedic forecast...');

      // Generate the free Vedic forecast
      const { data: forecastResult, error: forecastError } = await supabase.functions.invoke(
        'generate-free-vedic-forecast',
        {
          body: {
            kundli_id: saveResult.id,
          },
        }
      );

      if (forecastError) {
        console.error('[VedicInputPage] Forecast generation error:', forecastError);
        toast.error('Forecast generation failed. Redirecting to results...');
      } else {
        console.log('[VedicInputPage] Forecast generated:', { 
          hasText: !!forecastResult?.forecast,
          model: forecastResult?.model 
        });
      }
      
      console.log('[VedicInputPage] Navigating to /vedic/results with id:', saveResult.id);
      
      // Navigate to results page with the record ID
      navigate(`/vedic/results?id=${saveResult.id}`);
    } catch (error) {
      console.error('[VedicInputPage] Error submitting Vedic form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate Kundli. Please try again.');
      setIsGeneratingForecast(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaceSelect = (place: PlaceSelection) => {
    setPlaceCoords({ lat: place.lat, lon: place.lon });
  };

  const handlePlaceChange = (value: string) => {
    setFormData({ ...formData, birthPlace: value });
    // Clear coordinates when user types (they need to re-select)
    setPlaceCoords(null);
  };

  const clearSelectedPlace = () => {
    setFormData({ ...formData, birthPlace: '' });
    setPlaceCoords(null);
  };

  // Show full-screen loading during forecast generation
  if (isGeneratingForecast) {
    return <VedicLoadingScreen />;
  }

  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="text-cream-muted hover:text-cream"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-up">
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">
              Your Birth Details
            </h1>
            <p className="text-cream-muted">
              Enter the moment you arrived into the world
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
            {/* Date of Birth */}
            <div 
              className="space-y-2 animate-fade-up"
              style={{ animationDelay: '100ms', animationFillMode: 'both' }}
            >
              <Label htmlFor="birthDate" className="text-cream flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                Date of Birth
              </Label>
              <Input
                id="birthDate"
                type="date"
                min={minDate}
                max={today}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                disabled={isSubmitting}
              />
              {errors.birthDate && (
                <p className="text-sm text-destructive">{errors.birthDate}</p>
              )}
            </div>

            {/* Time of Birth */}
            <div 
              className="space-y-2 animate-fade-up"
              style={{ animationDelay: '150ms', animationFillMode: 'both' }}
            >
              <Label htmlFor="birthTime" className="text-cream flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                Time of Birth <span className="text-muted-foreground text-xs">(Approximate)</span>
              </Label>
              <Input
                id="birthTime"
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                disabled={isSubmitting}
              />
              {errors.birthTime && (
                <p className="text-sm text-destructive">{errors.birthTime}</p>
              )}
            </div>

            {/* Place of Birth */}
            <div 
              className="space-y-2 animate-fade-up relative z-50"
              style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
              <Label htmlFor="birthPlace" className="text-cream flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                Place of Birth
              </Label>
              {placeCoords ? (
                // Show confirmed location
                <div className="flex items-center gap-2 p-3 bg-secondary/50 border border-gold/30 rounded-md">
                  <Check className="w-4 h-4 text-gold flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cream truncate">{formData.birthPlace}</p>
                    <p className="text-xs text-muted-foreground">
                      {placeCoords.lat.toFixed(4)}°, {placeCoords.lon.toFixed(4)}°
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
              {errors.birthPlace && (
                <p className="text-sm text-destructive">{errors.birthPlace}</p>
              )}
            </div>

            {/* Email Address */}
            <div 
              className="space-y-2 animate-fade-up"
              style={{ animationDelay: '250ms', animationFillMode: 'both' }}
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
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <div 
              className="pt-4 animate-fade-up"
              style={{ animationDelay: '250ms', animationFillMode: 'both' }}
            >
              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full group"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Kundli...
                  </>
                ) : (
                  <>
                    Generate My 2026 Forecast
                    <Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p 
            className="text-center text-xs text-muted-foreground mt-8 animate-fade-up"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            Your information is used only to generate your personalized forecast. We never sell information, ever.
          </p>
          <p 
            className="text-center text-xs text-muted-foreground mt-3 animate-fade-up"
            style={{ animationDelay: '350ms', animationFillMode: 'both' }}
          >
            <a href="/#/2026-astrology-forecast" className="text-gold hover:underline">2026 Forecast</a>
            {' · '}
            <a href="/#/privacy" className="text-gold hover:underline">Privacy Policy</a>
            {' · '}
            <a href="/#/terms" className="text-gold hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VedicInputPage;
