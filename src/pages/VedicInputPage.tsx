import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { PlaceAutocomplete, PlaceSelection } from '@/components/PlaceAutocomplete';
import { VedicLoadingScreen } from '@/components/VedicLoadingScreen';
import { useForecastStore } from '@/store/forecastStore';
import { convertBirthTimeToUtc } from '@/lib/convertBirthTimeToUtc';
import { getDeviceId } from '@/lib/deviceId';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles, Calendar, Clock, MapPin, Check, X, Mail, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

const FORM_STORAGE_KEY = 'vedic_input_form_data';

interface SavedFormData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  email: string;
  placeCoords: { lat: number; lon: number } | null;
  deviceId: string;
}

type FlowState = 'input' | 'name-prompt' | 'generating';

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
  const [flowState, setFlowState] = useState<FlowState>('input');
  
  // Name prompt state
  const [userName, setUserName] = useState('');
  const [kundliId, setKundliId] = useState<string | null>(null);
  const [forecastReady, setForecastReady] = useState(false);
  const forecastPromiseRef = useRef<Promise<any> | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Load saved form data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        const parsed: SavedFormData = JSON.parse(saved);
        const currentDeviceId = getDeviceId();
        // Only restore if same device
        if (parsed.deviceId === currentDeviceId) {
          setFormData({
            birthDate: parsed.birthDate || '',
            birthTime: parsed.birthTime || '',
            birthPlace: parsed.birthPlace || '',
            email: parsed.email || '',
          });
          if (parsed.placeCoords) {
            setPlaceCoords(parsed.placeCoords);
          }
        }
      }
    } catch (e) {
      console.error('[VedicInputPage] Error loading saved form data:', e);
    }
  }, []);

  // Save form data on changes
  useEffect(() => {
    try {
      const dataToSave: SavedFormData = {
        ...formData,
        placeCoords,
        deviceId: getDeviceId(),
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('[VedicInputPage] Error saving form data:', e);
    }
  }, [formData, placeCoords]);

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
      
      // Calculate age
      const todayDate = new Date();
      let age = todayDate.getFullYear() - selectedDate.getFullYear();
      const monthDiff = todayDate.getMonth() - selectedDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && todayDate.getDate() < selectedDate.getDate())) {
        age--;
      }
      
      if (selectedDate < min) {
        newErrors.birthDate = 'Date cannot be before 1900';
      } else if (selectedDate > max) {
        newErrors.birthDate = 'Date cannot be in the future';
      } else if (age < 18) {
        newErrors.birthDate = 'You must be at least 18 years old to use this service';
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
      console.log('[VedicInputPage] Calling get-kundli-data with:', { datetimeForApi, lat: placeCoords.lat, lon: placeCoords.lon });
      
      // Call get-kundli-data edge function (uses birth-details + planet-position APIs)
      const { data: kundliData, error: kundliError } = await supabase.functions.invoke(
        'get-kundli-data',
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
      const deviceId = getDeviceId();

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
            device_id: deviceId,
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
      setKundliId(saveResult.id);

      // Show the name prompt screen
      setIsSubmitting(false);
      setFlowState('name-prompt');

      console.log('[VedicInputPage] Generating free Vedic forecast in background...');

      // Start generating forecast in background
      forecastPromiseRef.current = supabase.functions.invoke(
        'generate-free-vedic-forecast',
        {
          body: {
            kundli_id: saveResult.id,
          },
        }
      ).then((result) => {
        console.log('[VedicInputPage] Forecast ready:', result);
        setForecastReady(true);
        
        if (result.error) {
          console.error('[VedicInputPage] Forecast generation error:', result.error);
        } else if (result.data?.high_demand) {
          toast.warning("We're experiencing high demand. Please try again in a minute.", {
            duration: 6000,
          });
        } else if (result.data?.manual_generation) {
          toast.info('Your Cosmic Brief is being prepared. You\'ll receive it via email shortly.');
        }
        
        return result;
      });

    } catch (error) {
      console.error('[VedicInputPage] Error submitting Vedic form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate Kundli. Please try again.');
      setFlowState('input');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!kundliId || isNavigating) return;
    
    setIsNavigating(true);
    
    // Save name if provided via secure edge function
    if (userName.trim()) {
      try {
        const { data: updateResult, error: updateError } = await supabase.functions.invoke(
          'update-kundli-details',
          {
            body: {
              type: 'update_name',
              kundli_id: kundliId,
              name: userName.trim(),
              device_id: getDeviceId(),
            },
          }
        );
        
        if (updateError || updateResult?.error) {
          console.error('[VedicInputPage] Error saving name:', updateError || updateResult?.error);
        } else {
          console.log('[VedicInputPage] Name saved:', userName);
        }
      } catch (e) {
        console.error('[VedicInputPage] Error saving name:', e);
      }
    }
    
    // Show loading screen
    setFlowState('generating');
    
    // Wait for forecast to complete if not ready
    if (forecastPromiseRef.current) {
      await forecastPromiseRef.current;
    }
    
    // Navigate to results
    localStorage.removeItem(FORM_STORAGE_KEY);
    navigate(`/vedic/results?id=${kundliId}`);
  };

  const handleSkipName = async () => {
    if (!kundliId || isNavigating) return;
    
    setIsNavigating(true);
    
    // If forecast is ready, go directly to results
    if (forecastReady) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      navigate(`/vedic/results?id=${kundliId}`);
      return;
    }
    
    // Otherwise show loading screen while waiting
    setFlowState('generating');
    
    if (forecastPromiseRef.current) {
      await forecastPromiseRef.current;
    }
    
    localStorage.removeItem(FORM_STORAGE_KEY);
    navigate(`/vedic/results?id=${kundliId}`);
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

  // Show name prompt screen
  if (flowState === 'name-prompt') {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md animate-fade-up">
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-gold" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">
                What can we call you?
              </h1>
              <p className="text-cream-muted">
                This is optional, but helps personalize your experience
              </p>
            </div>
            
            <div className="space-y-6">
              <Input
                type="text"
                placeholder="Your name (optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20 text-center text-lg py-6"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSubmit();
                  }
                }}
              />
              
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full group"
                onClick={handleNameSubmit}
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue
                    <Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />
                  </>
                )}
              </Button>
              
              <button
                onClick={handleSkipName}
                disabled={isNavigating}
                className="w-full text-cream-muted hover:text-cream text-sm transition-colors py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? 'Please wait...' : 'Skip for now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show full-screen loading during forecast generation
  if (flowState === 'generating') {
    return <VedicLoadingScreen />;
  }

  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
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
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20 text-left"
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
                    Generating Brief...
                  </>
                ) : (
                  <>
                    Generate my 2026 Brief
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
            <a href="/#/vedic-astrology-explained" className="text-gold hover:underline">What is Vedic Astrology?</a>
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
