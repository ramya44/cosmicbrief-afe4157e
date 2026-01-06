import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StarField } from '@/components/StarField';
import { useForecastStore } from '@/store/forecastStore';
import { generateStrategicForecast } from '@/lib/generateStrategicForecast';
import { Compass, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'generating' | 'saving' | 'complete' | 'error'>('verifying');
  
  const { 
    birthData, 
    freeForecast,
    setBirthData,
    setFreeForecast,
    setIsPaid, 
    setStrategicForecast, 
    setIsStrategicLoading 
  } = useForecastStore();

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

      try {
        const strategic = await generateStrategicForecast(currentBirthData, currentPivotalTheme);
        setStrategicForecast(strategic);
        
        // Save both forecasts to database
        setStatus('saving');
        console.log('Saving forecasts to database...');
        
        const { error: saveError } = await supabase.functions.invoke('save-forecast', {
          body: {
            stripeSessionId,
            customerEmail: customerEmail || currentBirthData.email,
            customerName: currentBirthData.name,
            birthDate: currentBirthData.birthDate,
            birthTime: currentBirthData.birthTime,
            birthPlace: currentBirthData.birthPlace,
            freeForecast: currentFreeForecast,
            strategicForecast: strategic,
          },
        });

        if (saveError) {
          console.error('Failed to save forecast to database:', saveError);
          // Don't fail the whole flow, just log it
        } else {
          console.log('Forecasts saved to database successfully');
        }
        
        setStatus('complete');
        toast.success('Your Strategic Year Map is ready!');
        
        // Redirect to results after a brief moment
        setTimeout(() => navigate('/results'), 1500);
      } catch (error) {
        console.error('Failed to generate strategic forecast:', error);
        toast.error('Failed to generate forecast. Please try again.');
        setStatus('error');
        setTimeout(() => navigate('/results'), 2000);
      } finally {
        setIsStrategicLoading(false);
      }
    };

    processPayment();
  }, [searchParams, birthData, freeForecast, navigate, setBirthData, setFreeForecast, setIsPaid, setStrategicForecast, setIsStrategicLoading]);

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
                Generating Your Strategic Year Map...
              </h2>
              <p className="text-cream-muted">
                This deeper analysis takes a moment. Please wait while we craft your personalized strategic guidance.
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
