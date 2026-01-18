import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { PlaceAutocomplete, PlaceSelection } from '@/components/PlaceAutocomplete';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForecastStore } from '@/store/forecastStore';
import { convertBirthTimeToUtc } from '@/lib/convertBirthTimeToUtc';
import { getDeviceId } from '@/lib/deviceId';
import { validateBirthForm, isFormValid, MIN_DATE } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Calendar, Clock, MapPin, Check, X, Loader2, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

const FORM_STORAGE_KEY = 'birth_chart_form_data';

interface SavedFormData {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  placeCoords: { lat: number; lon: number } | null;
  deviceId: string;
}

const BirthChartInputPage = () => {
  const navigate = useNavigate();
  const { setBirthData } = useForecastStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });
  const [placeCoords, setPlaceCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved form data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
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
    } catch {
      // Ignore localStorage errors
    }
  }, [formData, placeCoords]);

  const today = new Date().toISOString().split('T')[0];

  const validateForm = () => {
    const newErrors = validateBirthForm(formData, {
      requireAge18: false,
      hasPlaceCoords: !!placeCoords,
    });
    setErrors(newErrors);
    return isFormValid(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !placeCoords) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert birth time to UTC
      let birthDateTimeUtc: string | undefined;
      try {
        birthDateTimeUtc = await convertBirthTimeToUtc(
          formData.birthDate,
          formData.birthTime,
          placeCoords.lat,
          placeCoords.lon
        );
      } catch {
        // Continue with local time if UTC conversion fails
      }

      const datetimeForApi = birthDateTimeUtc || `${formData.birthDate}T${formData.birthTime}:00`;
      
      // Call get-kundli-data edge function
      const { data: kundliData, error: kundliError } = await supabase.functions.invoke(
        'get-kundli-data',
        {
          body: {
            datetime: datetimeForApi,
            latitude: placeCoords.lat,
            longitude: placeCoords.lon,
            ayanamsa: 1,
          },
        }
      );
      
      if (kundliError) {
        throw new Error(kundliError.message || 'Failed to fetch birth chart data');
      }

      if (kundliData?.error) {
        throw new Error(kundliData.error);
      }

      // Save birth chart to database (lightweight, no dasha periods)
      let kundliId: string | undefined;
      try {
        const { data: saveResult, error: saveError } = await supabase.functions.invoke(
          'save-birth-chart',
          {
            body: {
              birth_date: formData.birthDate,
              birth_time: formData.birthTime,
              birth_place: formData.birthPlace,
              birth_time_utc: birthDateTimeUtc || undefined,
              latitude: placeCoords.lat,
              longitude: placeCoords.lon,
              email: formData.email.trim(),
              name: formData.name.trim() || undefined,
              device_id: getDeviceId(),
              kundli_data: kundliData,
            },
          }
        );

        if (!saveError && saveResult?.id) {
          kundliId = saveResult.id;
        }
        // Continue even if save fails - DB save is optional for viewing chart
      } catch {
        // Continue anyway - saving to DB is optional for viewing the chart
      }

      // Store data for birth chart page
      const chartData = {
        name: formData.name.trim() || undefined,
        email: formData.email.trim(),
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        birthPlace: formData.birthPlace,
        lat: placeCoords.lat,
        lon: placeCoords.lon,
        birthDateTimeUtc,
        kundliId,
        kundliData,
      };
      
      // Store in session storage for the results page
      sessionStorage.setItem('birth_chart_data', JSON.stringify(chartData));
      
      // Clear form storage
      localStorage.removeItem(FORM_STORAGE_KEY);
      
      // Navigate to birth chart page
      navigate('/birth-chart');

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate birth chart. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <>
      <Helmet>
        <title>Get Your Free Vedic Birth Chart | Cosmic Brief</title>
        <meta name="description" content="Generate your free Vedic birth chart (Kundali). See your planetary positions, houses, and astrological profile based on ancient Jyotish calculations." />
        <link rel="canonical" href="https://cosmicbrief.app/#/get-birth-chart" />
      </Helmet>

      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-up">
              <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">
                Your Birth Chart
              </h1>
              <p className="text-cream-muted">
                Enter your birth details to generate your Vedic birth chart
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
              {/* Name (Optional) */}
              <div 
                className="space-y-2 animate-fade-up"
                style={{ animationDelay: '100ms', animationFillMode: 'both' }}
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

              {/* Email (Required) */}
              <div 
                className="space-y-2 animate-fade-up"
                style={{ animationDelay: '150ms', animationFillMode: 'both' }}
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
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div 
                className="space-y-2 animate-fade-up"
                style={{ animationDelay: '200ms', animationFillMode: 'both' }}
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
                {errors.birthDate && (
                  <p className="text-sm text-destructive">{errors.birthDate}</p>
                )}
              </div>

              {/* Time of Birth */}
              <div 
                className="space-y-2 animate-fade-up"
                style={{ animationDelay: '250ms', animationFillMode: 'both' }}
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
                style={{ animationDelay: '300ms', animationFillMode: 'both' }}
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

              {/* Submit Button */}
              <div 
                className="pt-4 animate-fade-up"
                style={{ animationDelay: '350ms', animationFillMode: 'both' }}
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
                      Generating Chart...
                    </>
                  ) : (
                    <>
                      Generate my Vedic Birth Chart
                      <Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <p 
              className="text-center text-xs text-muted-foreground mt-8 animate-fade-up"
              style={{ animationDelay: '400ms', animationFillMode: 'both' }}
            >
              Your information is used only to generate your birth chart.
            </p>
            <p 
              className="text-center text-xs text-muted-foreground mt-3 animate-fade-up"
              style={{ animationDelay: '450ms', animationFillMode: 'both' }}
            >
              <a href="/#/vedic-astrology-explained" className="text-gold hover:underline">What is Vedic Astrology?</a>
              {' · '}
              <a href="/#/privacy" className="text-gold hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BirthChartInputPage;
