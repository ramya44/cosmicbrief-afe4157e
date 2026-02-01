import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { StarField } from '@/components/StarField';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackPurchase } from '@/lib/meta-pixel';

const VedicPaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const kundliId = searchParams.get('kundli_id');

  const [status, setStatus] = useState<'generating' | 'success' | 'error' | 'manual' | 'timeout'>('generating');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const generateForecast = async () => {
      if (!sessionId || !kundliId) {
        toast.error('Missing payment information');
        navigate('/vedic/input');
        return;
      }

      // Animate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95));
      }, 1500);

      try {
        // Race between the API call and a 120 second timeout
        // Claude generation can take 60-90s, so we give it 2 minutes
        const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
          setTimeout(() => resolve({ timeout: true }), 120000);
        });

        const apiPromise = supabase.functions.invoke('generate-paid-vedic-forecast', {
          body: { session_id: sessionId, kundli_id: kundliId },
        });

        const result = await Promise.race([apiPromise, timeoutPromise]);

        clearInterval(progressInterval);

        // Check if we hit the timeout
        if ('timeout' in result) {
          console.log('[PaymentSuccess] Request timed out after 120s');
          setProgress(100);
          setStatus('timeout');
          return;
        }

        const { data, error } = result;

        if (error) {
          console.log('[PaymentSuccess] Error from edge function:', error);
          setStatus('error');
          toast.error('Failed to generate your forecast');
          return;
        }

        if (data?.manual_generation) {
          // Generation failed but we'll handle it manually
          setProgress(100);
          setStatus('manual');
          return;
        }

        // NEW: Handle "processing" status - poll for completion
        if (data?.status === 'processing') {
          console.log('[PaymentSuccess] Generation started in background, polling for completion');

          // Poll every 5 seconds for up to 3 minutes
          const maxPolls = 36; // 36 * 5s = 180s = 3 minutes
          let pollCount = 0;

          const pollForCompletion = async (): Promise<boolean> => {
            pollCount++;
            console.log(`[PaymentSuccess] Polling attempt ${pollCount}/${maxPolls}`);

            const deviceId = (await import('@/lib/deviceId')).getDeviceId();
            let { data: kundliData } = await supabase.functions.invoke('get-vedic-kundli-details', {
              body: { kundli_id: kundliId, device_id: deviceId },
            });

            // Try shared access if owner access failed
            if (!kundliData) {
              const sharedResult = await supabase.functions.invoke('get-vedic-kundli-details', {
                body: { kundli_id: kundliId, shared: true },
              });
              kundliData = sharedResult.data;
            }

            if (kundliData?.paid_vedic_forecast) {
              console.log('[PaymentSuccess] Forecast ready!', { length: kundliData.paid_vedic_forecast.length });
              return true;
            }

            return false;
          };

          // Start polling
          const pollInterval = setInterval(async () => {
            try {
              const isReady = await pollForCompletion();
              if (isReady) {
                clearInterval(pollInterval);
                clearInterval(progressInterval);
                setProgress(100);
                setStatus('success');
                toast.success('Your complete forecast is ready!');
                trackPurchase({ value: 19.99, currency: 'USD' });

                // Navigate after a short delay
                setTimeout(() => {
                  navigate(`/vedic/results?id=${kundliId}&paid=true`);
                }, 1000);
              } else if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                clearInterval(progressInterval);
                setProgress(100);
                setStatus('timeout');
              }
            } catch (pollError) {
              console.error('[PaymentSuccess] Polling error:', pollError);
            }
          }, 5000);

          return; // Exit the main flow, polling will handle navigation
        }

        if (data?.forecast) {
          setProgress(100);
          setStatus('success');
          toast.success('Your complete forecast is ready!');

          // Track successful purchase
          trackPurchase({ value: 19.99, currency: 'USD' });

          // Fetch the full kundli data before navigating to avoid loading screen
          const deviceId = (await import('@/lib/deviceId')).getDeviceId();
          console.log('[PaymentSuccess] Fetching kundli with device_id:', deviceId);

          let { data: kundliData, error: ownerError } = await supabase.functions.invoke('get-vedic-kundli-details', {
            body: { kundli_id: kundliId, device_id: deviceId },
          });

          console.log('[PaymentSuccess] Owner access result:', {
            hasData: !!kundliData,
            error: ownerError?.message,
            hasPaidForecast: !!kundliData?.paid_vedic_forecast
          });

          // If owner access failed (device_id mismatch), fall back to shared access
          if (!kundliData) {
            console.log('[PaymentSuccess] Owner access failed, trying shared access');
            const sharedResult = await supabase.functions.invoke('get-vedic-kundli-details', {
              body: { kundli_id: kundliId, shared: true },
            });
            kundliData = sharedResult.data;
            console.log('[PaymentSuccess] Shared access result:', {
              hasData: !!kundliData,
              hasPaidForecast: !!kundliData?.paid_vedic_forecast
            });
          }

          // Navigate to results with paid flag and pass full data via state
          setTimeout(() => {
            // If we have kundliData, merge in the fresh forecast
            // If not, create a minimal object with just the forecast (page will re-fetch other details)
            const stateData = kundliData
              ? { ...kundliData, paid_vedic_forecast: data.forecast }
              : { id: kundliId, paid_vedic_forecast: data.forecast };

            console.log('[PaymentSuccess] Navigating with state:', {
              hasKundliData: !!kundliData,
              skipLoading: !!kundliData,
              hasPaidForecast: !!stateData.paid_vedic_forecast,
              forecastLength: stateData.paid_vedic_forecast?.length || 0
            });

            navigate(`/vedic/results?id=${kundliId}&paid=true`, {
              state: {
                kundliData: stateData,
                skipLoading: !!kundliData
              }
            });
          }, 1000);
        } else {
          setStatus('error');
          toast.error('Failed to generate forecast');
        }
      } catch {
        clearInterval(progressInterval);
        setStatus('error');
        toast.error('An error occurred');
      }
    };

    generateForecast();
  }, [sessionId, kundliId, navigate]);

  const phrases = [
    "Mapping your cosmic blueprint...",
    "Calculating pratyantardasha timing...",
    "Analyzing planetary alignments...",
    "Synthesizing your year ahead...",
    "Crafting personalized guidance...",
    "Preparing your complete roadmap...",
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % phrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-celestial flex items-center justify-center">
      <StarField />

      <div className="relative z-10 text-center px-4">
        {status === 'generating' && (
          <>
            <div className="relative w-20 h-20 mb-8 mx-auto">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-gold/20"></div>
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin"></div>
              {/* Inner glow */}
              <div className="absolute inset-4 rounded-full bg-gold/10 animate-pulse"></div>
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-4">
              Generating Your Detailed 2026 Cosmic Brief
            </h1>
            <p className="text-cream-muted text-lg mb-8 animate-fade-up">
              {phrases[phraseIndex]}
            </p>
            <div className="w-64 mx-auto bg-midnight/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-cream-muted/60 text-sm mt-4">
              This may take up to 2 minutes
            </p>
            <p className="text-cream-muted/60 text-sm mt-2">
              A copy will also be emailed to you
            </p>
          </>
        )}

        {status === 'success' && (
          <div className="animate-fade-up">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-cream mb-2">Your Forecast is Ready!</h1>
            <p className="text-cream-muted">Redirecting you now...</p>
          </div>
        )}

        {status === 'manual' && (
          <div className="animate-fade-up max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-cream mb-4">Your Cosmic Brief is Being Prepared</h1>
            <p className="text-cream-muted mb-4">
              Our team is manually crafting your personalized forecast. You'll receive it via email within 24 hours.
            </p>
            <p className="text-cream-muted/80 text-sm mb-6">
              Questions? Contact us at{' '}
              <a href="mailto:support@cosmicbrief.com" className="text-gold hover:underline">
                support@cosmicbrief.com
              </a>
            </p>
            <button
              onClick={() => navigate(`/vedic/results?id=${kundliId}`)}
              className="px-6 py-2 bg-gold text-midnight rounded-lg font-medium hover:bg-gold-light transition-colors"
            >
              View Free Preview
            </button>
          </div>
        )}

        {status === 'timeout' && (
          <div className="animate-fade-up max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-cream mb-4">Almost There!</h1>
            <p className="text-cream-muted mb-4">
              Your detailed forecast is being finalized. It will be emailed to you shortly, or you can check your results page in a moment.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(`/vedic/results?id=${kundliId}&paid=true`)}
                className="px-6 py-2 bg-gold text-midnight rounded-lg font-medium hover:bg-gold-light transition-colors"
              >
                Check My Forecast
              </button>
              <p className="text-cream-muted/60 text-sm">
                If it's not ready yet, refresh the page in 30 seconds
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-fade-up max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-cream mb-4">Your Cosmic Brief is Being Prepared</h1>
            <p className="text-cream-muted mb-4">
              Our team is manually crafting your personalized forecast. You'll receive it via email within 24 hours.
            </p>
            <p className="text-cream-muted/80 text-sm mb-6">
              Questions? Contact us at{' '}
              <a href="mailto:support@cosmicbrief.com" className="text-gold hover:underline">
                support@cosmicbrief.com
              </a>
            </p>
            <button
              onClick={() => navigate(`/vedic/results?id=${kundliId}`)}
              className="px-6 py-2 bg-gold text-midnight rounded-lg font-medium hover:bg-gold-light transition-colors"
            >
              View Free Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VedicPaymentSuccessPage;
