import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarField } from '@/components/StarField';
import { BirthDetailsForm, BirthFormData } from '@/components/BirthDetailsForm';
import { AnimatedChartLoadingScreen } from '@/components/AnimatedChartLoadingScreen';
import { VedicLoadingScreen } from '@/components/VedicLoadingScreen';
import { useForecastStore } from '@/store/forecastStore';
import { useVedicChart, getBirthDateTimeUtc } from '@/hooks/useVedicChart';
import { useSessionKundli } from '@/hooks/useSessionKundli';
import { getDeviceId } from '@/lib/deviceId';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Calendar, Clock, MapPin, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { trackLead } from '@/lib/meta-pixel';

const FORM_STORAGE_KEY = 'vedic_input_form_data';

type FlowState = 'input' | 'name-prompt' | 'generating';

const VedicInputPage = () => {
  const navigate = useNavigate();
  const { setBirthData, setIsPaid, setStrategicForecast, setKundliId, setKundliData } = useForecastStore();
  const { calculate, isCalculating } = useVedicChart();
  const { isAuthenticated, hasKundli: authHasKundli, kundli, isLoading: authLoading } = useAuth();
  const { hasKundli: sessionHasKundli, kundliId: sessionKundliId, birthData: sessionBirthData, clearKundli } = useSessionKundli();

  const [flowState, setFlowState] = useState<FlowState>('input');

  // Name prompt state
  const [userName, setUserName] = useState('');
  const [localKundliId, setLocalKundliId] = useState<string | null>(null);
  const [forecastReady, setForecastReady] = useState(false);
  const forecastPromiseRef = useRef<Promise<any> | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [submittedFormData, setSubmittedFormData] = useState<BirthFormData | null>(null);
  const [calculatedKundliData, setCalculatedKundliData] = useState<any>(null);

  // Quick generate state for logged-in users
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);

  const handleSubmit = async (data: BirthFormData) => {
    try {
      // Reset paid state for new forecast entry
      setIsPaid(false);
      setStrategicForecast(null);

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
            kundli_data: kundliData,
          },
        }
      );

      if (saveError) {
        throw new Error(saveError.message || 'Failed to save Kundli details');
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
      // Save kundli ID and data to store for cross-page sharing
      setKundliId(saveResult.id);
      setKundliData(kundliData);
      // Set local state for this page's flow
      setLocalKundliId(saveResult.id);
      setSubmittedFormData(data);
      // Save calculated kundli data for animated loading screen
      setCalculatedKundliData(kundliData);

      // Start generating forecast in background
      forecastPromiseRef.current = supabase.functions
        .invoke('generate-free-vedic-forecast', {
          body: {
            kundli_id: saveResult.id,
          },
        })
        .then((result) => {
          setForecastReady(true);

          // Track successful lead generation
          trackLead({ content_name: 'free_vedic_forecast' });

          if (result.data?.high_demand) {
            toast.warning("We're experiencing high demand. Please try again in a minute.", {
              duration: 6000,
            });
          } else if (result.data?.manual_generation) {
            toast.info("Your Cosmic Brief is being prepared. You'll receive it via email shortly.");
          }

          return result;
        });

      // If name is already provided, skip the name prompt
      if (data.name && data.name.trim()) {
        // Name already available, go directly to generating/loading screen
        // AnimatedChartLoadingScreen will handle navigation when ready
        setFlowState('generating');
        return;
      }

      // Show the name prompt screen
      setFlowState('name-prompt');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate Kundli. Please try again.');
      setFlowState('input');
    }
  };

  const handleNameSubmit = async () => {
    if (!localKundliId || isNavigating) return;

    setIsNavigating(true);

    // Save name if provided via secure edge function (don't await - fire and forget)
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
        .catch(() => {
          // Name save errors are non-critical
        });
    }

    // If forecast is already ready and we have kundli data, go directly to results
    if (forecastReady && calculatedKundliData) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      navigate(`/vedic/results?id=${localKundliId}`);
      return;
    }

    // Show animated loading screen - it will handle navigation when ready
    setFlowState('generating');
  };

  const handleSkipName = async () => {
    if (!localKundliId || isNavigating) return;

    setIsNavigating(true);

    // If forecast is already ready and we have kundli data, go directly to results
    if (forecastReady && calculatedKundliData) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      navigate(`/vedic/results?id=${localKundliId}`);
      return;
    }

    // Show animated loading screen - it will handle navigation when ready
    setFlowState('generating');
  };

  // Quick generate for users with existing kundli (authenticated or session)
  const handleQuickGenerate = async () => {
    // Use authenticated kundli ID or session kundli ID
    const kundliIdToUse = isAuthenticated ? kundli?.id : sessionKundliId;
    if (!kundliIdToUse) return;

    setIsQuickGenerating(true);

    try {
      // Reset paid state for new forecast entry
      setIsPaid(false);
      setStrategicForecast(null);

      // Show loading screen
      setFlowState('generating');

      // Generate forecast using existing kundli
      const { data, error } = await supabase.functions.invoke('generate-free-vedic-forecast', {
        body: {
          kundli_id: kundliIdToUse,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate forecast');
      }

      if (data?.high_demand) {
        toast.warning("We're experiencing high demand. Please try again in a minute.", {
          duration: 6000,
        });
      } else if (data?.manual_generation) {
        toast.info("Your Cosmic Brief is being prepared. You'll receive it via email shortly.");
      }

      // Track successful lead generation
      trackLead({ content_name: 'free_vedic_forecast' });

      // Navigate to results
      navigate(`/vedic/results?id=${kundliIdToUse}`);
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
              <p className="text-cream-muted">This is optional, but helps personalize your experience</p>
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

              <Button variant="hero" size="lg" className="w-full group" onClick={handleNameSubmit} disabled={isNavigating}>
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
            navigate(`/vedic/results?id=${localKundliId}`);
          }}
        />
      );
    }
    // Fallback to simple loading screen (e.g., quick generate flow)
    return <VedicLoadingScreen />;
  }

  // Show loading while checking auth for logged-in users
  if (authLoading) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-cream-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine if we have usable kundli data (either from auth or session)
  const hasUsableKundli = (isAuthenticated && authHasKundli && kundli) || (!isAuthenticated && sessionHasKundli && sessionKundliId && sessionBirthData);

  // Get the effective kundli data to display
  const effectiveKundliId = isAuthenticated ? kundli?.id : sessionKundliId;
  const effectiveBirthData = isAuthenticated && kundli ? {
    name: kundli.name,
    birthDate: kundli.birth_date,
    birthTime: kundli.birth_time,
    birthPlace: kundli.birth_place,
  } : sessionBirthData ? {
    name: sessionBirthData.name,
    birthDate: sessionBirthData.birthDate,
    birthTime: sessionBirthData.birthTime,
    birthPlace: sessionBirthData.birthPlace,
  } : null;

  // Simplified view for users with existing kundli (authenticated OR session)
  if (hasUsableKundli && effectiveBirthData && effectiveKundliId) {
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
      // Force re-render with input form
      window.location.reload();
    };

    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-10 animate-fade-up">
              <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Your 2026 Forecast</h1>
              <p className="text-cream-muted">Generate your personalized Vedic astrology brief</p>
            </div>

            {/* Birth Details Display */}
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

            {/* Generate Button */}
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

            {/* Enter different details link */}
            <div className="flex justify-center mt-4 animate-fade-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
              <button
                onClick={handleEnterNewDetails}
                className="text-sm text-cream-muted hover:text-cream transition-colors underline underline-offset-2"
              >
                Enter different birth details
              </button>
            </div>

            <p
              className="text-center text-xs text-muted-foreground mt-8 animate-fade-up"
              style={{ animationDelay: '300ms', animationFillMode: 'both' }}
            >
              <a href="/#/vedic-astrology-explained" className="text-gold hover:underline">
                What is Vedic Astrology?
              </a>
            </p>
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
          {/* Header */}
          <div className="text-center mb-10 animate-fade-up">
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Your Birth Details</h1>
            <p className="text-cream-muted">Enter the moment you arrived into the world</p>
          </div>

          {/* Form */}
          <BirthDetailsForm
            showName={false}
            showEmail
            requireAge18
            storageKey={isAuthenticated ? undefined : FORM_STORAGE_KEY}
            onSubmit={handleSubmit}
            isSubmitting={isCalculating}
            submitButtonText="Generate my 2026 Brief"
            submitButtonIcon={<Sparkles className="w-5 h-5 ml-1 transition-transform group-hover:rotate-12" />}
          />

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
            <a href="/#/vedic-astrology-explained" className="text-gold hover:underline">
              What is Vedic Astrology?
            </a>
            {' · '}
            <a href="/#/privacy" className="text-gold hover:underline">
              Privacy Policy
            </a>
            {' · '}
            <a href="/#/terms" className="text-gold hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VedicInputPage;
