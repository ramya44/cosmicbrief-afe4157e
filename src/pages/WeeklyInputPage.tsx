import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarField } from '@/components/StarField';
import { BirthDetailsForm, BirthFormData } from '@/components/BirthDetailsForm';
import { AnimatedChartLoadingScreen } from '@/components/AnimatedChartLoadingScreen';
import { VedicLoadingScreen } from '@/components/VedicLoadingScreen';
import { useForecastStore, KundliData } from '@/store/forecastStore';
import { useVedicChart, getBirthDateTimeUtc } from '@/hooks/useVedicChart';
import { useSessionKundli } from '@/hooks/useSessionKundli';
import { getDeviceId } from '@/lib/deviceId';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Calendar, Clock, MapPin, Loader2, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const FORM_STORAGE_KEY = 'weekly_input_form_data';

type FlowState = 'input' | 'name-prompt' | 'generating';

const WeeklyInputPage = () => {
  const navigate = useNavigate();
  const { setBirthData, setKundliId, setKundliData, setWeeklyForecast, weeklyForecast, kundliId: storeKundliId } = useForecastStore();
  const { calculate, isCalculating } = useVedicChart();
  const { hasKundli: sessionHasKundli, kundliId: sessionKundliId, birthData: sessionBirthData, clearKundli } = useSessionKundli();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [userName, setUserName] = useState('');
  const [localKundliId, setLocalKundliId] = useState<string | null>(null);
  const [forecastReady, setForecastReady] = useState(false);
  const forecastPromiseRef = useRef<Promise<any> | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [submittedFormData, setSubmittedFormData] = useState<BirthFormData | null>(null);
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedKundliData, setCalculatedKundliData] = useState<KundliData | null>(null);

  // Redirect to results if user already has a weekly forecast in this session
  // But not if they're actively entering new details (forceShowForm)
  useEffect(() => {
    if (storeKundliId && weeklyForecast && flowState === 'input' && !forceShowForm && !isCalculating) {
      navigate(`/weekly/results?id=${storeKundliId}`, { replace: true });
    }
  }, [storeKundliId, weeklyForecast, flowState, forceShowForm, isCalculating, navigate]);

  const handleSubmit = async (data: BirthFormData) => {
    setIsSubmitting(true);
    try {
      // Clear any previous weekly forecast to prevent stale data showing
      setWeeklyForecast(null);

      // Get UTC datetime
      const birthDateTimeUtc = await getBirthDateTimeUtc({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Calculate kundli data
      const kundliData = await calculate({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Store for animated loading screen
      setCalculatedKundliData(kundliData);

      // Save to database via save-kundli-details edge function
      const deviceId = getDeviceId();

      const { data: saveResult, error: saveError } = await supabase.functions.invoke(
        'save-kundli-details',
        {
          body: {
            birth_date: data.birthDate,
            birth_time: data.birthTime,
            birth_place: data.birthPlace,
            birth_time_utc: birthDateTimeUtc,
            latitude: data.latitude,
            longitude: data.longitude,
            email: data.email,
            device_id: deviceId,
            marketing_consent: data.marketingConsent ?? true,
            kundli_data: kundliData,
          },
        }
      );

      if (saveError) {
        throw new Error(saveError.message || 'Failed to save details');
      }

      if (saveResult?.error) {
        throw new Error(saveResult.error);
      }

      // Store birth data in store
      const fullBirthData = {
        ...data,
        lat: data.latitude,
        lon: data.longitude,
        birthDateTimeUtc,
      };

      setBirthData(fullBirthData);
      setKundliId(saveResult.id);
      setKundliData(kundliData);
      setLocalKundliId(saveResult.id);
      setSubmittedFormData(data);

      // Start generating weekly forecast in background
      forecastPromiseRef.current = supabase.functions
        .invoke('generate-weekly-forecast', {
          body: { kundli_id: saveResult.id },
        })
        .then((result) => {
          if (result.error) {
            console.error('Weekly forecast error:', result.error);
            toast.error(result.error.message || 'Failed to generate weekly forecast');
            return result;
          }
          setForecastReady(true);
          if (result.data?.forecast) {
            setWeeklyForecast({
              forecast: result.data.forecast,
              week_start: result.data.week_start,
              week_end: result.data.week_end,
              dasha_summary: result.data.dasha_summary,
            });
          } else if (result.data?.error) {
            console.error('Weekly forecast data error:', result.data.error);
            toast.error(result.data.error);
          }
          return result;
        })
        .catch((err) => {
          console.error('Weekly forecast exception:', err);
          toast.error(err.message || 'Failed to generate weekly forecast');
        });

      // If name is already provided, skip the name prompt
      if (data.name && data.name.trim()) {
        setFlowState('generating');
        return;
      }

      setFlowState('name-prompt');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate forecast. Please try again.');
      setFlowState('input');
      setIsSubmitting(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!localKundliId || isNavigating) return;

    setIsNavigating(true);

    // Save name if provided
    if (userName.trim()) {
      supabase.functions
        .invoke('update-kundli-details', {
          body: {
            type: 'update_name',
            kundli_id: localKundliId,
            name: userName.trim(),
            device_id: getDeviceId(),
          },
        })
        .catch(() => {});
    }

    if (forecastReady) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      navigate(`/weekly/results?id=${localKundliId}`);
      return;
    }

    setFlowState('generating');
  };

  const handleSkipName = async () => {
    if (!localKundliId || isNavigating) return;

    setIsNavigating(true);

    if (forecastReady) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      navigate(`/weekly/results?id=${localKundliId}`);
      return;
    }

    setFlowState('generating');
  };

  // Quick generate for users with existing kundli
  const handleQuickGenerate = async () => {
    if (!sessionKundliId) return;

    setIsQuickGenerating(true);

    try {
      setFlowState('generating');

      const { data, error } = await supabase.functions.invoke('generate-weekly-forecast', {
        body: { kundli_id: sessionKundliId },
      });

      if (error) {
        // Try to get the response body from FunctionsHttpError
        let errorMessage = error.message || 'Unknown error';
        if (error.context) {
          try {
            const responseText = await error.context.text?.();
            console.error('Error response body:', responseText);
            if (responseText) {
              const parsed = JSON.parse(responseText);
              errorMessage = parsed.error || parsed.message || responseText;
            }
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
        }
        console.error('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('Response error:', data.error);
        throw new Error(data.error);
      }

      if (data?.forecast) {
        setWeeklyForecast({
          forecast: data.forecast,
          week_start: data.week_start,
          week_end: data.week_end,
          dasha_summary: data.dasha_summary,
        });
      }

      navigate(`/weekly/results?id=${sessionKundliId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate forecast. Please try again.');
      setFlowState('input');
    } finally {
      setIsQuickGenerating(false);
    }
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
              <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">What can we call you?</h1>
              <p className="text-cream-muted">This is optional, but helps personalize your forecast</p>
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
                  if (e.key === 'Enter') handleNameSubmit();
                }}
              />

              <Button variant="hero" size="lg" className="w-full group" onClick={handleNameSubmit} disabled={isNavigating}>
                {isNavigating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              <button
                onClick={handleSkipName}
                disabled={isNavigating}
                className="w-full text-cream-muted hover:text-cream text-sm transition-colors py-2 disabled:opacity-50"
              >
                {isNavigating ? 'Please wait...' : 'Skip for now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show animated chart loading during forecast generation
  if (flowState === 'generating') {
    // If we have calculated kundli data, show animated chart
    if (calculatedKundliData) {
      return (
        <AnimatedChartLoadingScreen
          kundliData={calculatedKundliData}
          forecastReady={forecastReady}
          onComplete={() => {
            localStorage.removeItem(FORM_STORAGE_KEY);
            navigate(`/weekly/results?id=${localKundliId}`);
          }}
        />
      );
    }
    // Fallback to simple loading screen (e.g., quick generate flow)
    return <VedicLoadingScreen />;
  }

  // Check for existing session kundli (but not while submitting new details)
  const hasUsableKundli = sessionHasKundli && sessionKundliId && sessionBirthData && !forceShowForm && !isSubmitting;
  const effectiveBirthData = sessionBirthData;

  // Simplified view for users with existing kundli
  if (hasUsableKundli && effectiveBirthData && sessionKundliId) {
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return dateStr;
      }
    };

    const handleEnterNewDetails = () => {
      clearKundli();
      setWeeklyForecast(null);
      localStorage.removeItem(FORM_STORAGE_KEY);
      setForceShowForm(true);
    };

    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md">
            <div className="text-center mb-10 animate-fade-up">
              <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Your Week Ahead</h1>
              <p className="text-cream-muted">Get your personalized weekly Vedic insights</p>
            </div>

            <div
              className="bg-secondary/30 border border-gold/20 rounded-lg p-6 mb-8 animate-fade-up"
              style={{ animationDelay: '100ms', animationFillMode: 'both' }}
            >
              <h2 className="text-gold text-sm font-medium mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Birth Details
              </h2>
              <div className="space-y-3 text-sm">
                {effectiveBirthData.name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-cream">{effectiveBirthData.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-cream">{formatDate(effectiveBirthData.birthDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-cream">{effectiveBirthData.birthTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-cream">{effectiveBirthData.birthPlace}</span>
                </div>
              </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <Button
                variant="hero"
                size="lg"
                className="w-full group"
                onClick={handleQuickGenerate}
                disabled={isQuickGenerating}
              >
                {isQuickGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Get My Weekly Brief
                    <Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-center mt-4 animate-fade-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
              <button
                onClick={handleEnterNewDetails}
                className="text-sm text-cream-muted hover:text-cream transition-colors underline underline-offset-2"
              >
                Enter different birth details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
      <StarField />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 animate-fade-up">
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Your Week Ahead</h1>
            <p className="text-cream-muted">Enter your birth details for personalized weekly insights</p>
          </div>

          <BirthDetailsForm
            showName={false}
            showEmail
            requireAge18
            storageKey={FORM_STORAGE_KEY}
            onSubmit={handleSubmit}
            isSubmitting={isCalculating}
            submitButtonText="Get My Weekly Brief"
            submitButtonIcon={<Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />}
          />

          <p
            className="text-center text-xs text-muted-foreground mt-8 animate-fade-up"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            First week free, then $5/month for weekly forecasts.
          </p>
          <p
            className="text-center text-xs text-muted-foreground mt-3 animate-fade-up"
            style={{ animationDelay: '350ms', animationFillMode: 'both' }}
          >
            <a href="/vedic-astrology-explained" className="text-gold hover:underline">
              What is Vedic Astrology?
            </a>
            {' · '}
            <a href="/2026" className="text-gold hover:underline">
              Get Your 2026 Yearly Forecast
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyInputPage;
