import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarField } from '@/components/StarField';
import { PlaceAutocomplete, PlaceSelection } from '@/components/PlaceAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { convertBirthTimeToUtc } from '@/lib/convertBirthTimeToUtc';
import { getDeviceId } from '@/lib/deviceId';
import { Calendar, Clock, ArrowLeft, User, Mail, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type FlowState = 'input' | 'submitting' | 'confirmed';

const WeeklyHoroscopePage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    email: '',
    name: '',
  });
  const [placeCoords, setPlaceCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flowState, setFlowState] = useState<FlowState>('input');

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
        newErrors.birthDate = 'You must be at least 18 years old';
      }
    }
    if (!formData.birthTime) {
      newErrors.birthTime = 'Please enter your birth time';
    }
    if (!formData.birthPlace.trim()) {
      newErrors.birthPlace = 'Please enter your birth place';
    } else if (!placeCoords) {
      newErrors.birthPlace = 'Please select a location from the dropdown';
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
    
    if (!validateForm() || !placeCoords) {
      return;
    }

    setFlowState('submitting');

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
      } catch (error) {
        console.error('[WeeklyHoroscope] Error converting to UTC:', error);
      }

      const datetimeForApi = birthDateTimeUtc || `${formData.birthDate}T${formData.birthTime}:00`;
      
      // Get kundli data
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

      if (kundliError || kundliData?.error) {
        throw new Error(kundliError?.message || kundliData?.error || 'Failed to fetch Kundli data');
      }

      // Save birth chart via save-birth-chart
      const deviceId = getDeviceId();
      const { data: saveResult, error: saveError } = await supabase.functions.invoke(
        'save-birth-chart',
        {
          body: {
            birth_date: formData.birthDate,
            birth_time: formData.birthTime,
            birth_place: formData.birthPlace,
            birth_time_utc: birthDateTimeUtc,
            latitude: placeCoords.lat,
            longitude: placeCoords.lon,
            email: formData.email,
            name: formData.name.trim() || null,
            device_id: deviceId,
            kundli_data: kundliData,
          },
        }
      );

      if (saveError || saveResult?.error) {
        throw new Error(saveError?.message || saveResult?.error || 'Failed to save birth chart');
      }

      // Subscribe to weekly horoscope
      const { error: subscribeError } = await supabase
        .from('weekly_horoscope_subscribers')
        .insert({
          email: formData.email,
          name: formData.name.trim() || null,
          kundli_id: saveResult.id,
        });

      if (subscribeError) {
        // Check if already subscribed
        if (subscribeError.code === '23505') {
          // Unique violation - already subscribed
          toast.info('You\'re already subscribed to weekly horoscopes!');
        } else {
          console.error('[WeeklyHoroscope] Subscribe error:', subscribeError);
          throw new Error('Failed to subscribe');
        }
      }

      setFlowState('confirmed');
      
    } catch (error) {
      console.error('[WeeklyHoroscope] Error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setFlowState('input');
    }
  };

  const handlePlaceSelect = (place: PlaceSelection) => {
    setPlaceCoords({ lat: place.lat, lon: place.lon });
  };

  const handlePlaceChange = (value: string) => {
    setFormData({ ...formData, birthPlace: value });
    setPlaceCoords(null);
  };

  // Confirmation screen
  if (flowState === 'confirmed') {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />
        
        {/* Back button */}
        <div className="absolute top-6 left-6 z-20">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="text-cream-muted hover:text-cream font-[Inter]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-4">
              You're All Set!
            </h1>
            
            <p className="text-cream-muted text-lg mb-8">
              Starting this Sunday, you'll receive your personalized weekly horoscope in your inbox at <span className="text-gold">{formData.email}</span>
            </p>

            <div className="p-6 rounded-xl bg-midnight/50 border border-gold/20 mb-8">
              <p className="text-cream-muted text-sm">
                Every week, we'll analyze planetary transits against your birth chart to give you personalized cosmic guidance.
              </p>
            </div>

            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="font-[Inter]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
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
          className="text-cream-muted hover:text-cream font-[Inter]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">
              Weekly Horoscope
            </h1>
            <p className="text-cream-muted">
              Get personalized weekly cosmic guidance delivered every Sunday
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 overflow-visible pb-8">
            {/* Name */}
            <div className="space-y-2 animate-fade-up" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
              <Label htmlFor="name" className="text-cream flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                Name <span className="text-cream-muted text-xs">(optional)</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                disabled={flowState === 'submitting'}
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
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
                disabled={flowState === 'submitting'}
              />
              {errors.birthDate && (
                <p className="text-sm text-destructive">{errors.birthDate}</p>
              )}
            </div>

            {/* Time of Birth */}
            <div className="space-y-2 animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
              <Label htmlFor="birthTime" className="text-cream flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                Time of Birth
              </Label>
              <Input
                id="birthTime"
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
                disabled={flowState === 'submitting'}
              />
              {errors.birthTime && (
                <p className="text-sm text-destructive">{errors.birthTime}</p>
              )}
            </div>

            {/* Place of Birth */}
            <div className="space-y-2 animate-fade-up relative z-30" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <Label htmlFor="birthPlace" className="text-cream flex items-center gap-2">
                Place of Birth
              </Label>
              <PlaceAutocomplete
                value={formData.birthPlace}
                onChange={handlePlaceChange}
                onPlaceSelect={handlePlaceSelect}
                placeholder="City, Country"
                className="bg-secondary/50 border-border/50 text-cream placeholder:text-muted-foreground focus:border-gold/50 focus:ring-gold/20"
              />
              {placeCoords && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Location confirmed
                </p>
              )}
              {errors.birthPlace && (
                <p className="text-sm text-destructive">{errors.birthPlace}</p>
              )}
            </div>

            {/* Email - Last field */}
            <div className="space-y-2 animate-fade-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
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
                disabled={flowState === 'submitting'}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 animate-fade-up relative z-10" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full group"
                disabled={flowState === 'submitting'}
              >
                {flowState === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe to Weekly Horoscope
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHoroscopePage;
