import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StarField } from '@/components/StarField';
import { useForecastStore } from '@/store/forecastStore';
import { generateStrategicForecast } from '@/lib/generateStrategicForecast';
import { Compass, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'generating' | 'complete' | 'error'>('verifying');
  
  const { 
    birthData, 
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

      if (!birthData) {
        setStatus('error');
        toast.error('Birth data not found. Please start over.');
        setTimeout(() => navigate('/input'), 2000);
        return;
      }

      // Payment successful - proceed to generate forecast
      setStatus('generating');
      setIsPaid(true);
      setIsStrategicLoading(true);

      try {
        const strategic = await generateStrategicForecast(birthData);
        setStrategicForecast(strategic);
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
  }, [searchParams, birthData, navigate, setIsPaid, setStrategicForecast, setIsStrategicLoading]);

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
