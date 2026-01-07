import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StarField } from '@/components/StarField';
import { useForecastStore } from '@/store/forecastStore';
import { generateStrategicForecast } from '@/lib/generateStrategicForecast';
import { Compass, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const GENERATING_STEPS = [
  "Anchoring your birth moment",
  "Establishing your year's underlying rhythm",
  "Identifying where pressure builds and where support appears",
  "Mapping how the year unfolds over time",
  "Finalizing your personal year map",
  "Generate the forecast and display once ready",
];

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'generating' | 'saving' | 'complete' | 'failed' | 'error'>('verifying');
  const [failedEmail, setFailedEmail] = useState<string>('');
  const [messageIndex, setMessageIndex] = useState(0);
  
  const { 
    birthData, 
    freeForecast,
    setBirthData,
    setFreeForecast,
    setIsPaid, 
    setStrategicForecast, 
    setIsStrategicLoading,
    setStripeSessionId,
    setCustomerEmail,
  } = useForecastStore();

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

      let currentBirthData = birthData;
      let currentFreeForecast = freeForecast?.forecast;
      let currentPivotalTheme = freeForecast?.pivotalTheme;
      let currentFreeForecastId = freeForecast?.id;
      let stripeSessionId = sessionId;
      let customerEmail: string | undefined;

      // Always verify payment to get customer email from Stripe
      try {
        console.log('Verifying payment session...');
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
        });

        if (error) {
          console.error('Verify payment error:', error);
          throw new Error(error.message);
        }

        if (data?.success) {
          // Get customer email from Stripe session
          customerEmail = data.birthData?.email;
          
          // If birthData is not in store, restore it from Stripe
          if (!currentBirthData && data.birthData) {
            currentBirthData = data.birthData;
            setBirthData(data.birthData);
            console.log('Birth data restored from Stripe session:', data.birthData);
          }
          
          // Also restore free forecast from Stripe metadata if not in store
          if (!currentFreeForecast && data.freeForecast) {
            currentFreeForecast = data.freeForecast;
            setFreeForecast({ forecast: data.freeForecast });
            console.log('Free forecast restored from Stripe session');
          }
        } else {
          throw new Error('Could not verify payment');
        }
      } catch (error) {
        console.error('Failed to verify payment:', error);
        setStatus('error');
        toast.error('Could not verify payment. Please try again.');
        setTimeout(() => navigate('/input'), 2000);
        return;
      }

      if (!currentBirthData) {
        setStatus('error');
        toast.error('Birth data not found. Please try again.');
        setTimeout(() => navigate('/input'), 2000);
        return;
      }

      // Payment successful - proceed to generate forecast
      setStatus('generating');
      setIsPaid(true);
      setIsStrategicLoading(true);
      setStripeSessionId(stripeSessionId);

      // Store email for potential failure display and account creation
      const forecastEmail = customerEmail || currentBirthData.email || '';
      setFailedEmail(forecastEmail);
      setCustomerEmail(forecastEmail);

      try {
        const result = await generateStrategicForecast(currentBirthData, currentPivotalTheme);
        setStrategicForecast(result.forecast);
        
        // Save both forecasts to database
        setStatus('saving');
        console.log('Saving forecasts to database...');
        
        const { data: saveData, error: saveError } = await supabase.functions.invoke('save-forecast', {
          body: {
            stripeSessionId,
            customerEmail: forecastEmail,
            customerName: currentBirthData.name,
            birthDate: currentBirthData.birthDate,
            birthTime: currentBirthData.birthTime,
            birthTimeUtc: currentBirthData.birthDateTimeUtc,
            birthPlace: currentBirthData.birthPlace,
            freeForecast: currentFreeForecast,
            strategicForecast: result.forecast,
            modelUsed: result.modelUsed,
            generationStatus: 'complete',
            retryCount: result.totalAttempts,
            tokenUsage: result.tokenUsage,
          },
        });

        if (saveError) {
          console.error('Failed to save forecast to database:', saveError);
          // Don't fail the whole flow, just log it
        } else {
          console.log('Forecasts saved to database successfully', saveData);
          
          // Send email with link to the forecast
          if (forecastEmail && saveData?.id) {
            try {
              const { error: emailError } = await supabase.functions.invoke('send-forecast-email', {
                body: {
                  customerEmail: forecastEmail,
                  customerName: currentBirthData.name,
                  forecastId: saveData.id,
                },
              });
              
              if (emailError) {
                console.error('Failed to send forecast email:', emailError);
              } else {
                console.log('Forecast email sent successfully');
              }
            } catch (emailErr) {
              console.error('Error sending forecast email:', emailErr);
            }
          }
        }

        // Update the free forecast with the customer email
        if (currentFreeForecastId && customerEmail) {
          try {
            const { error: updateError } = await supabase.functions.invoke('update-free-forecast-email', {
              body: {
                freeForecastId: currentFreeForecastId,
                customerEmail: customerEmail,
              },
            });
            
            if (updateError) {
              console.error('Failed to update free forecast email:', updateError);
            } else {
              console.log('Free forecast email updated successfully');
            }
          } catch (updateErr) {
            console.error('Error updating free forecast email:', updateErr);
          }
        }
        
        setStatus('complete');
        toast.success('Your Strategic Year Map is ready!');
        
        // Redirect to results after a brief moment
        setTimeout(() => navigate('/results'), 1500);
      } catch (error) {
        console.error('Failed to generate strategic forecast:', error);
        
        // Save failed attempt to database for support follow-up
        try {
          await supabase.functions.invoke('save-forecast', {
            body: {
              stripeSessionId,
              customerEmail: forecastEmail,
              customerName: currentBirthData.name,
              birthDate: currentBirthData.birthDate,
              birthTime: currentBirthData.birthTime,
              birthTimeUtc: currentBirthData.birthDateTimeUtc,
              birthPlace: currentBirthData.birthPlace,
              freeForecast: currentFreeForecast,
              strategicForecast: null,
              generationStatus: 'failed',
              generationError: error instanceof Error ? error.message : 'Unknown error',
              retryCount: 4, // Max attempts (3 primary + 1 fallback)
            },
          });
          console.log('Failed forecast record saved for support follow-up');
        } catch (saveErr) {
          console.error('Failed to save failed forecast record:', saveErr);
        }

        // Notify support team
        try {
          await supabase.functions.invoke('notify-support', {
            body: {
              customerEmail: forecastEmail,
              customerName: currentBirthData.name,
              birthDate: currentBirthData.birthDate,
              birthTime: currentBirthData.birthTime,
              birthPlace: currentBirthData.birthPlace,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              stripeSessionId,
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
  }, [searchParams, birthData, freeForecast, navigate, setBirthData, setFreeForecast, setIsPaid, setStrategicForecast, setIsStrategicLoading, setStripeSessionId, setCustomerEmail]);

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
              <p className="text-cream-muted mb-6">
                This deeper analysis takes a moment. You'll receive an email with a link to your full report.
              </p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                {GENERATING_STEPS.map((step, index) => (
                  <div 
                    key={step}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      index < messageIndex 
                        ? 'text-gold/50' 
                        : index === messageIndex 
                          ? 'text-cream' 
                          : 'text-cream/30'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500 ${
                      index < messageIndex 
                        ? 'bg-gold/50' 
                        : index === messageIndex 
                          ? 'bg-gold animate-pulse' 
                          : 'bg-cream/30'
                    }`} />
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {status === 'saving' && (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle className="w-8 h-8 text-gold" />
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                Saving Your Forecast...
              </h2>
              <p className="text-cream-muted">
                Almost there...
              </p>
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
