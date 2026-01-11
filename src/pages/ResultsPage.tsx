import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ForecastSection } from '@/components/ForecastSection';
import { SeasonalMapAccordion } from '@/components/SeasonalMapAccordion';
import { ShareButton } from '@/components/ShareButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForecastStore } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';
import { stripLeadingHeaders } from '@/lib/utils';
import { ArrowLeft, Sparkles, Calendar, Lock, ArrowLeftRight, Target, TrendingUp, Compass, BookOpen, Share2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const deepLinkForecastId = searchParams.get('forecastId') || searchParams.get('id');
  const deepLinkGuestToken = searchParams.get('guestToken') || searchParams.get('guest_token');
  const isDeepLinkPaid = !!deepLinkForecastId;

  const { 
    birthData, 
    freeForecast, 
    freeGuestToken,
    paidForecast, 
    strategicForecast,
    isPaid, 
    isLoading, 
    isStrategicLoading,
    stripeSessionId,
    customerEmail,
    setIsPaid,
    setStrategicForecast,
    setIsStrategicLoading,
    setPaidGuestToken,
    setBirthData,
    setFreeForecast,
    paidGuestToken,
    reset,
  } = useForecastStore();

  const [isRedirecting, setIsRedirecting] = useState(false);

  // Deep-link support: load paid forecast via secure backend function when forecastId is present.
  // CRITICAL: Clear stale cached state before rendering to prevent showing wrong person's report.
  useEffect(() => {
    if (!isDeepLinkPaid) return;
    if (!deepLinkForecastId) return;

    // Guest access requires guest token (by design)
    if (!deepLinkGuestToken) {
      setIsStrategicLoading(false);
      return;
    }

    let cancelled = false;

    const loadPaidForecast = async () => {
      try {
        // Immediately clear any cached state to prevent stale data from rendering
        reset();
        setIsPaid(true);
        setIsStrategicLoading(true);
        setPaidGuestToken(deepLinkGuestToken);

        // Add cache-busting timestamp to prevent any intermediary caching
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-forecast?id=${encodeURIComponent(deepLinkForecastId)}&type=paid&guest_token=${encodeURIComponent(deepLinkGuestToken)}&ts=${Date.now()}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          cache: 'no-store',
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || 'Unable to retrieve forecast');
        }

        if (!cancelled) {
          // Set birth data from the authoritative backend response (overrides any stale localStorage)
          if (json.birthDate && json.birthPlace) {
            setBirthData({
              birthDate: json.birthDate,
              birthTime: json.birthTime || '',
              birthPlace: json.birthPlace,
              name: json.customerName || undefined,
            });
          }
          
          // Set free forecast from backend response (overrides any stale localStorage)
          if (json.freeForecast) {
            setFreeForecast({ forecast: json.freeForecast });
          }
          
          setStrategicForecast(json?.strategicForecast ?? null);
        }
      } catch (e) {
        console.error('Failed to load paid forecast from deep link:', e);
        if (!cancelled) {
          setStrategicForecast(null);
        }
      } finally {
        if (!cancelled) {
          setIsStrategicLoading(false);
        }
      }
    };

    loadPaidForecast();

    return () => {
      cancelled = true;
    };
  }, [isDeepLinkPaid, deepLinkForecastId, deepLinkGuestToken, setIsPaid, setIsStrategicLoading, setPaidGuestToken, setStrategicForecast, setBirthData, setFreeForecast, reset]);

  useEffect(() => {
    if (!isDeepLinkPaid && !birthData && !isLoading) {
      navigate('/input');
    }
  }, [birthData, isLoading, navigate, isDeepLinkPaid]);

  if (isLoading || (!isDeepLinkPaid && !freeForecast)) {
    return <LoadingSpinner />;
  }

  if (isDeepLinkPaid && isStrategicLoading) {
    return <LoadingSpinner />;
  }

  if (isDeepLinkPaid && deepLinkForecastId && !deepLinkGuestToken) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <div className="relative z-10 max-w-md mx-auto px-4 text-center">
          <div className="rounded-2xl border border-border/30 bg-midnight/80 backdrop-blur-sm p-8">
            <h1 className="font-display text-2xl text-cream mb-2">Forecast link incomplete</h1>
            <p className="text-cream-muted">This report link is missing its access token. Please use the full link from your email.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isDeepLinkPaid && deepLinkForecastId && deepLinkGuestToken && !strategicForecast) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <div className="relative z-10 max-w-md mx-auto px-4 text-center">
          <div className="rounded-2xl border border-border/30 bg-midnight/80 backdrop-blur-sm p-8">
            <h1 className="font-display text-2xl text-cream mb-2">We can’t open that report</h1>
            <p className="text-cream-muted">For security, reports require the exact link with its access token.</p>
            <div className="mt-6">
              <Button variant="hero" onClick={() => navigate('/input')}>Create a new forecast</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleUnlock = async () => {
    if (isRedirecting) return;
    
    // Validate we have a free forecast to link to
    if (!freeForecast?.id) {
      toast.error('Forecast data incomplete. Please generate a new forecast.');
      navigate('/input');
      return;
    }
    
    setIsRedirecting(true);
    
    try {
      // Database-first approach: only pass IDs, not full birth data
      // The generate-paid-forecast function will fetch birth data from free_forecasts table
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          freeForecastId: freeForecast.id,
          guestToken: freeGuestToken,
          freeForecastText: freeForecast.forecast, // For Stripe display only (truncated)
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsRedirecting(false);
    }
  };

  

  return (
    <div className="relative min-h-screen bg-celestial">
      <StarField />

      {/* Header */}
      <header className="relative z-20 border-b border-border/30 bg-midnight/80 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/input')}
            className="text-cream-muted hover:text-cream"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Forecast
          </Button>
          
          {!isPaid && (
            <Button 
              variant="hero" 
              size="sm"
              onClick={handleUnlock}
              className="hidden md:flex"
            >
              <Lock className="w-4 h-4 mr-1" />
              Unlock Detailed Analysis
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12 animate-fade-up">
          <p className="text-gold text-sm uppercase tracking-widest mb-2">Your Personalized Reading</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
            2026 Cosmic Brief
          </h1>
          {birthData && (
            <p className="text-cream-muted">
              {birthData.name && <span className="text-cream">{birthData.name} · </span>}
              {(() => {
                const [year, month, day] = birthData.birthDate.split('-').map(Number);
                return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              })()} · {birthData.birthPlace}
            </p>
          )}
        </div>

        {/* Free Forecast - Formatted Sections */}
        {freeForecast && (
          <div className="max-w-3xl mx-auto space-y-8 mb-12">
            {freeForecast.sections ? (
              // Structured JSON sections (new format)
              <div className="space-y-6">
                {[
                  { key: 'who_you_are_right_now', title: 'Who You Are Right Now' },
                  { key: 'whats_happening_in_your_life', title: "What's Happening in Your Life" },
                  { key: 'pivotal_life_theme_2026', title: '2026 Pivotal Life Theme' },
                  { key: 'what_is_becoming_tighter', title: 'What Is Becoming Tighter' },
                ].map((section, index) => {
                  const content = freeForecast.sections?.[section.key as keyof typeof freeForecast.sections];
                  if (!content) return null;
                  return (
                    <div 
                      key={section.key} 
                      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8 animate-fade-up"
                      style={{ animationDelay: `${100 + index * 100}ms`, animationFillMode: 'both' }}
                    >
                      <h3 className="font-display text-xl md:text-2xl text-gold mb-4">{section.title}</h3>
                      <p className="text-cream/70 leading-relaxed text-base md:text-lg whitespace-pre-line">{content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback: plain text for legacy forecasts
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8 animate-fade-up">
                <p className="text-cream/70 leading-relaxed text-lg whitespace-pre-line">
                  {freeForecast.forecast}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Unlock CTA - Only show if not paid */}
        {!isPaid && (
          <>
            {/* Desktop CTA */}
            <div className="hidden md:block max-w-3xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: '700ms', animationFillMode: 'both' }}>
              <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-6 md:p-10 text-center glow-gold overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-gold" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-cream mb-3">
                  Unlock Your Detailed Analysis
                </h2>
                <p className="text-cream-muted mb-4 max-w-md mx-auto text-sm md:text-base">
                  A decision-oriented interpretation with clear timing and priorities, personalized to the exact sky at your birth.
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-cream-muted line-through text-lg">$100</span>
                  <span className="text-gold font-display text-3xl">$20</span>
                </div>
                <Button variant="unlock" size="lg" className="md:text-lg md:px-8 md:py-6" onClick={handleUnlock}>
                  Unlock Detailed Analysis
                  <Sparkles className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>

            {/* Preview of Locked Sections */}
            <div className="max-w-3xl mx-auto space-y-6 mb-24 md:mb-12">
              {/* The Character of 2026 - Short prose */}
              <div 
                className="rounded-xl border border-border/50 bg-midnight/30 p-6 animate-fade-up"
                style={{ animationDelay: '800ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-xl text-cream">The Character of 2026</h3>
                </div>
                <div className="space-y-3 mb-4 blur-[6px] select-none">
                  <div className="h-4 rounded bg-cream/15" style={{ width: '92%' }} />
                  <div className="h-4 rounded bg-cream/12" style={{ width: '78%' }} />
                  <div className="h-4 rounded bg-cream/10" style={{ width: '85%' }} />
                </div>
                <div className="flex justify-center">
                  <Button variant="unlock" size="sm" onClick={handleUnlock} disabled={isRedirecting}>
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Unlock Detailed Analysis
                  </Button>
                </div>
              </div>

              {/* How 2026 Differs - Medium prose */}
              <div 
                className="rounded-xl border border-border/50 bg-midnight/30 p-6 animate-fade-up"
                style={{ animationDelay: '900ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <ArrowLeftRight className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-xl text-cream">How 2026 Differs from 2025</h3>
                </div>
                <div className="space-y-3 mb-4 blur-[6px] select-none">
                  <div className="h-4 rounded bg-cream/14" style={{ width: '95%' }} />
                  <div className="h-4 rounded bg-cream/12" style={{ width: '88%' }} />
                  <div className="h-4 rounded bg-cream/10" style={{ width: '72%' }} />
                  <div className="h-4 rounded bg-cream/12" style={{ width: '90%' }} />
                  <div className="h-4 rounded bg-cream/10" style={{ width: '65%' }} />
                </div>
                <div className="flex justify-center">
                  <Button variant="unlock" size="sm" onClick={handleUnlock} disabled={isRedirecting}>
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Unlock Detailed Analysis
                  </Button>
                </div>
              </div>

              {/* Life-Area Prioritization - Realistic numbered items */}
              <div 
                className="rounded-xl border border-border/50 bg-midnight/30 p-6 animate-fade-up"
                style={{ animationDelay: '1000ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-xl text-cream">Life-Area Prioritization</h3>
                </div>
                <p className="text-cream-muted text-sm mb-4 blur-[4px] select-none">Ranked by strategic importance</p>
                <div className="space-y-4 mb-4">
                  {/* Visible item 1 */}
                  <div className="blur-[5px] select-none">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gold font-display text-lg">#1</span>
                      <span className="text-cream font-medium">Career and contribution</span>
                    </div>
                    <div className="h-4 rounded bg-cream/10" style={{ width: '88%' }} />
                  </div>
                  {/* Visible item 2 */}
                  <div className="blur-[5px] select-none">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gold font-display text-lg">#2</span>
                      <span className="text-cream font-medium">Relationships and boundaries</span>
                    </div>
                    <div className="h-4 rounded bg-cream/10" style={{ width: '75%' }} />
                  </div>
                  {/* Blurred placeholder items */}
                  <div className="blur-[6px] select-none space-y-3">
                    <div className="h-4 rounded bg-cream/8" style={{ width: '70%' }} />
                    <div className="h-4 rounded bg-cream/8" style={{ width: '82%' }} />
                    <div className="h-4 rounded bg-cream/8" style={{ width: '68%' }} />
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button variant="unlock" size="sm" onClick={handleUnlock} disabled={isRedirecting}>
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Unlock Detailed Analysis
                  </Button>
                </div>
              </div>

              {/* The Year in Phases - Longer with phase headers */}
              <div 
                className="rounded-xl border border-border/50 bg-midnight/30 p-6 animate-fade-up"
                style={{ animationDelay: '1100ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-xl text-cream">The Year in Phases</h3>
                </div>
                <div className="space-y-5 mb-4">
                  {/* Phase 1 */}
                  <div className="blur-[5px] select-none">
                    <h4 className="font-display text-lg text-gold mb-2">Early Year</h4>
                    <div className="space-y-2">
                      <div className="h-4 rounded bg-cream/12" style={{ width: '90%' }} />
                      <div className="h-4 rounded bg-cream/10" style={{ width: '76%' }} />
                    </div>
                  </div>
                  {/* Phase 2 */}
                  <div className="blur-[6px] select-none">
                    <h4 className="font-display text-lg text-gold/70 mb-2">Mid-Year</h4>
                    <div className="space-y-2">
                      <div className="h-4 rounded bg-cream/10" style={{ width: '85%' }} />
                      <div className="h-4 rounded bg-cream/8" style={{ width: '70%' }} />
                    </div>
                  </div>
                  {/* Additional phases hint */}
                  <div className="blur-[7px] select-none space-y-2">
                    <div className="h-4 rounded bg-cream/8" style={{ width: '60%' }} />
                    <div className="h-4 rounded bg-cream/6" style={{ width: '80%' }} />
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button variant="unlock" size="sm" onClick={handleUnlock} disabled={isRedirecting}>
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Unlock Detailed Analysis
                  </Button>
                </div>
              </div>

              {/* The Deeper Arc - Longer prose */}
              <div 
                className="rounded-xl border border-border/50 bg-midnight/30 p-6 animate-fade-up"
                style={{ animationDelay: '1200ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-xl text-cream">The Deeper Arc</h3>
                </div>
                <div className="space-y-3 mb-4 blur-[6px] select-none">
                  <div className="h-4 rounded bg-cream/14" style={{ width: '94%' }} />
                  <div className="h-4 rounded bg-cream/12" style={{ width: '87%' }} />
                  <div className="h-4 rounded bg-cream/10" style={{ width: '91%' }} />
                  <div className="h-4 rounded bg-cream/12" style={{ width: '78%' }} />
                  <div className="h-4 rounded bg-cream/10" style={{ width: '84%' }} />
                  <div className="h-4 rounded bg-cream/8" style={{ width: '62%' }} />
                </div>
                <div className="flex justify-center">
                  <Button variant="unlock" size="sm" onClick={handleUnlock} disabled={isRedirecting}>
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Unlock Detailed Analysis
                  </Button>
                </div>
              </div>

              {/* Personal Operating Principles - Medium with italic quotes */}
              <div 
                className="rounded-xl border border-border/50 bg-midnight/30 p-6 animate-fade-up"
                style={{ animationDelay: '1300ms', animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-xl text-cream">Personal Operating Principles</h3>
                </div>
                <p className="text-cream-muted text-sm mb-4 blur-[4px] select-none">Your personal constitution for the year</p>
                <div className="space-y-3 mb-4">
                  <div className="blur-[5px] select-none">
                    <h4 className="text-cream font-medium text-lg italic mb-1">"Move slower to move further"</h4>
                    <div className="h-4 rounded bg-cream/10" style={{ width: '75%' }} />
                  </div>
                  <div className="blur-[6px] select-none space-y-2">
                    <div className="h-4 rounded bg-cream/8" style={{ width: '65%' }} />
                    <div className="h-4 rounded bg-cream/8" style={{ width: '80%' }} />
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button variant="unlock" size="sm" onClick={handleUnlock} disabled={isRedirecting}>
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Unlock Detailed Analysis
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-midnight via-midnight to-transparent">
              <div className="rounded-xl border border-gold/30 bg-midnight/90 backdrop-blur-sm p-4 overflow-hidden">
                <Button variant="unlock" size="lg" className="w-full mb-3" onClick={handleUnlock}>
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock Detailed Analysis
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-cream-muted line-through text-sm">$100</span>
                  <span className="text-gold font-display text-xl">$20</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Strategic Loading State */}
        {isPaid && isStrategicLoading && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="rounded-2xl border border-gold/30 bg-midnight/50 p-8 md:p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Compass className="w-7 h-7 text-gold animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                Generating Your Strategic Year Map...
              </h2>
              <p className="text-cream-muted">
                This deeper analysis takes a moment. We're preparing your personalized guidance. You'll receive an email with a link to your full report.
              </p>
            </div>
          </div>
        )}

        {/* Strategic Forecast - Only show if paid and loaded */}
        {isPaid && strategicForecast && !isStrategicLoading && (
          <div className="max-w-3xl mx-auto space-y-8 mb-16">
            {/* Strategic Title */}
            <div className="text-center py-8 border-t border-b border-gold/30">
              <h2 className="font-display text-3xl md:text-4xl text-cream">
                Detailed Brief for 2026
              </h2>
            </div>

            {/* Strategic Character */}
            <ForecastSection title="The Character of 2026" delay={100} icon={<Target className="w-5 h-5 text-gold" />}>
              <div className="text-cream/90 leading-relaxed space-y-4">
                {stripLeadingHeaders(strategicForecast.strategic_character).split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </ForecastSection>

            {/* Comparison */}
            <ForecastSection title="How 2026 Differs from 2025" delay={200} icon={<ArrowLeftRight className="w-5 h-5 text-gold" />}>
              <div className="text-cream/90 leading-relaxed space-y-4">
                {stripLeadingHeaders(strategicForecast.comparison_to_prior_year).split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </ForecastSection>

            {/* Life Area Prioritization */}
            <ForecastSection title="Life-Area Prioritization" delay={300} icon={<TrendingUp className="w-5 h-5 text-gold" />}>
              <p className="text-cream-muted text-sm mb-4">Ranked by strategic importance</p>
              <div className="space-y-4">
                {strategicForecast.life_area_prioritization
                  .sort((a, b) => a.priority - b.priority)
                  .map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gold font-display text-lg">#{item.priority}</span>
                        <span className="text-cream font-medium">{item.area}</span>
                      </div>
                      <p className="text-cream/70 text-sm">{stripLeadingHeaders(item.explanation)}</p>
                    </div>
                  ))}
              </div>
            </ForecastSection>

            {/* Deeper Arc */}
            <ForecastSection title="The Deeper Arc: Your Past, Present, and Future" delay={400} icon={<Sparkles className="w-5 h-5 text-gold" />}>
              <p className="text-cream/90 leading-relaxed whitespace-pre-line">
                {stripLeadingHeaders(strategicForecast.deeper_arc)}
              </p>
            </ForecastSection>

            {/* The Year in Phases */}
            <ForecastSection title="The Year in Phases" delay={500} icon={<Calendar className="w-5 h-5 text-gold" />}>
              <SeasonalMapAccordion phases={strategicForecast.seasonal_map} />
            </ForecastSection>

            {/* Crossroads Moment - Only show if not empty */}
            {strategicForecast.crossroads_moment && strategicForecast.crossroads_moment.trim() !== '' && (
              <ForecastSection title="When This Year Puts You at a Crossroads" delay={600} icon={<Compass className="w-5 h-5 text-gold" />}>
                <p className="text-cream/90 leading-relaxed">
                  {stripLeadingHeaders(strategicForecast.crossroads_moment)}
                </p>
              </ForecastSection>
            )}

            {/* Operating Principles */}
            <ForecastSection title="Personal Operating Principles for 2026" delay={700} icon={<BookOpen className="w-5 h-5 text-gold" />}>
              <p className="text-cream-muted text-sm mb-4">Your personal constitution for the year</p>
              <div className="space-y-4">
                {strategicForecast.operating_principles.map((principle, index) => (
                  <div key={index}>
                    <h4 className="text-cream font-medium text-lg italic mb-1">"{principle.principle}"</h4>
                    <p className="text-cream/70">{stripLeadingHeaders(principle.meaning)}</p>
                  </div>
                ))}
              </div>
            </ForecastSection>

            {/* Share Button */}
            <ShareButton forecastId={deepLinkForecastId} guestToken={deepLinkGuestToken || paidGuestToken} />

          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border/30">
          <p className="text-muted-foreground text-sm">
            A personalized reading grounded in traditional Indian astrological methods.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ResultsPage;
