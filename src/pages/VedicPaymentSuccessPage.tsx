import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { StarField } from '@/components/StarField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VedicPaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const kundliId = searchParams.get('kundli_id');

  const [status, setStatus] = useState<'generating' | 'success' | 'error' | 'manual'>('generating');
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
        const { data, error } = await supabase.functions.invoke('generate-paid-vedic-forecast', {
          body: { session_id: sessionId, kundli_id: kundliId },
        });

        clearInterval(progressInterval);

        if (error) {
          console.error('Generation error:', error);
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

        if (data?.forecast) {
          setProgress(100);
          setStatus('success');
          toast.success('Your complete forecast is ready!');
          
          // Navigate to results with paid flag
          setTimeout(() => {
            navigate(`/vedic/results?id=${kundliId}&paid=true`);
          }, 1500);
        } else {
          setStatus('error');
          toast.error('Failed to generate forecast');
        }
      } catch (err) {
        clearInterval(progressInterval);
        console.error('Error:', err);
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
            <LoadingSpinner />
            <h1 className="font-display text-3xl md:text-4xl text-cream mt-8 mb-4">
              Generating Your Complete 2026 Forecast
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
