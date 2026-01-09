import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StarField } from '@/components/StarField';
import { useForecastStore } from '@/store/forecastStore';
import { Compass, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';
import type { User } from '@supabase/supabase-js';

const GENERATING_STEPS = [
  "Anchoring your moment",
  "Reading the rhythm",
  "Mapping pressure and support",
  "Tracing the arc",
  "Weaving your year map",
];

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'generating' | 'complete' | 'failed' | 'error'>('verifying');
  const [failedEmail, setFailedEmail] = useState<string>('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const { 
    birthData, 
    freeForecast,
    freeGuestToken,
    setIsPaid, 
    setStrategicForecast, 
    setIsStrategicLoading,
    setStripeSessionId,
    setCustomerEmail,
  } = useForecastStore();

  // Detect logged-in user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  // Advance through generating steps every 12 seconds (no loop)
  useEffect(() => {
    if (status !== 'generating') return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, GENERATING_STEPS.length - 1));
    }, 12000);
    
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        toast.error('Invalid payment session');
        setTimeout(() => navigate('/results'), 2000);
        return;
      }

      // Must have birth data in store (set during input flow)
      if (!birthData || !birthData.birthDateTimeUtc || !birthData.lat || !birthData.lon) {
        setStatus('error');
        toast.error('Birth data not found. Please try again.');
        setTimeout(() => navigate('/input'), 2000);
        return;
      }

      // Start generation immediately - the secure endpoint handles payment verification
      setStatus('generating');
      setIsPaid(true);
      setIsStrategicLoading(true);
      setStripeSessionId(sessionId);

      try {
        // Single secure call that verifies payment AND generates forecast
        const { data, error } = await supabase.functions.invoke('generate-paid-forecast', {
          body: {
            sessionId,
            birthDateTimeUtc: birthData.birthDateTimeUtc,
            lat: birthData.lat,
            lon: birthData.lon,
            name: birthData.name,
            pivotalTheme: freeForecast?.pivotalTheme,
            freeForecast: freeForecast?.forecast,
            freeForecastId: freeForecast?.id,
            guestToken: freeGuestToken,
            deviceId: getDeviceId(),
          },
        });

        if (error) {
          console.error('Generate paid forecast error:', error);
          throw new Error(error.message || 'Failed to generate forecast');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to generate forecast');
        }

        // Success - store the forecast
        setStrategicForecast(data.forecast);
        
        // Extract customer email from forecast for display
        if (data.customerEmail) {
          setCustomerEmail(data.customerEmail);
          setFailedEmail(data.customerEmail);
        }

        // Send confirmation email if we have an email and forecast ID
        if (data.forecastId) {
          try {
            await supabase.functions.invoke('send-forecast-email', {
              body: {
                customerEmail: data.customerEmail || birthData.email,
                customerName: birthData.name,
                forecastId: data.forecastId,
              },
            });
            console.log('Forecast email sent successfully');
          } catch (emailErr) {
            console.error('Error sending forecast email:', emailErr);
            // Don't fail the whole flow for email errors
          }
        }
        
        setStatus('complete');
        toast.success('Your Strategic Year Map is ready!');
        
        // Redirect to results after a brief moment
        setTimeout(() => navigate('/results'), 1500);

      } catch (error) {
        console.error('Failed to generate strategic forecast:', error);
        
        // Extract email for failure display
        const forecastEmail = birthData.email || '';
        setFailedEmail(forecastEmail);

        // Notify support team about the failure
        try {
          await supabase.functions.invoke('notify-support', {
            body: {
              customerEmail: forecastEmail,
              customerName: birthData.name,
              birthDate: birthData.birthDate,
              birthTime: birthData.birthTime,
              birthPlace: birthData.birthPlace,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              stripeSessionId: sessionId,
              totalAttempts: 4,
            },
          });
          console.log('Support team notified');
        } catch (notifyErr) {
          console.error('Failed to notify support:', notifyErr);
        }

        setStatus('failed');
      } finally {
        setIsStrategicLoading(false);
      }
    };

    processPayment();
  }, [searchParams, birthData, freeForecast, navigate, setIsPaid, setStrategicForecast, setIsStrategicLoading, setStripeSessionId, setCustomerEmail]);

  return (
    <div className="relative min-h-screen bg-celestial flex items-center justify-center">
      <StarField />
      
      <div className="relative z-10 max-w-md mx-auto px-4 text-center">
        <div className="rounded-2xl border border-gold/30 bg-midnight/80 backdrop-blur-sm p-8 md:p-10">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle className="w-8 h-8 text-gold" />
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                Payment Confirmed!
              </h2>
              <p className="text-cream-muted">
                Verifying your purchase...
              </p>
            </>
          )}

          {status === 'generating' && (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Compass className="w-8 h-8 text-gold animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                Generating your Strategic Forecast
              </h2>
              <p className="text-cream/50 text-sm mb-6">
                You'll receive an email with your full report.
              </p>
              <p className="font-display text-lg italic text-cream tracking-wide mb-6">
                <span key={messageIndex} className="animate-fade-in">
                  {GENERATING_STEPS[messageIndex]}...
                </span>
              </p>
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {GENERATING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      index <= messageIndex
                        ? 'bg-gold'
                        : 'bg-gold/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {status === 'complete' && (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gold" />
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                Your Forecast is Ready!
              </h2>
              <p className="text-cream-muted">
                Redirecting you to your results...
              </p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                We're Completing Your Forecast Manually
              </h2>
              <p className="text-cream-muted mb-4">
                We encountered a temporary issue while generating your Strategic Year Map. Don't worry — your payment is confirmed.
              </p>
              <div className="bg-midnight/60 rounded-lg p-4 mb-4 border border-gold/20">
                <div className="flex items-center justify-center gap-2 text-gold mb-2">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Check your inbox</span>
                </div>
                <p className="text-cream-muted text-sm">
                  Our team has been notified and will email your complete forecast to{' '}
                  <span className="text-cream font-medium">{failedEmail || 'your email'}</span>{' '}
                  within 24 hours.
                </p>
              </div>
              <p className="text-cream-muted text-sm">
                Questions? Contact{' '}
                <a href="mailto:support@yourdomain.com" className="text-gold hover:underline">
                  support@yourdomain.com
                </a>
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-destructive text-2xl">!</span>
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                Something went wrong
              </h2>
              <p className="text-cream-muted">
                Redirecting you back...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
