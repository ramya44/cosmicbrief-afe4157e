import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { BirthDetailsForm, BirthFormData } from '@/components/BirthDetailsForm';
import { useVedicChart, getBirthDateTimeUtc } from '@/hooks/useVedicChart';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Check, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type FlowState = 'loading' | 'input' | 'submitting' | 'confirmed' | 'already_subscribed';

const WeeklyHoroscopePage = () => {
  const navigate = useNavigate();
  const { calculate, isCalculating } = useVedicChart();
  const { isAuthenticated, hasKundli, kundli, user, isLoading: authLoading } = useAuth();

  const [flowState, setFlowState] = useState<FlowState>('loading');

  // Check subscription status for logged-in users
  useEffect(() => {
    const checkSubscription = async () => {
      if (authLoading) return;

      if (isAuthenticated && hasKundli && kundli) {
        // Check if already subscribed
        const { data: existingSub } = await supabase
          .from('weekly_horoscope_subscribers')
          .select('id')
          .eq('kundli_id', kundli.id)
          .single();

        if (existingSub) {
          setFlowState('already_subscribed');
        } else {
          setFlowState('input');
        }
      } else {
        setFlowState('input');
      }
    };

    checkSubscription();
  }, [authLoading, isAuthenticated, hasKundli, kundli]);

  // Subscribe using existing kundli (for logged-in users)
  const handleQuickSubscribe = async () => {
    if (!kundli || !user) return;

    setFlowState('submitting');

    try {
      const { error: subscribeError } = await supabase.from('weekly_horoscope_subscribers').insert({
        email: user.email || kundli.email,
        name: kundli.name || null,
        kundli_id: kundli.id,
      });

      if (subscribeError) {
        if (subscribeError.code === '23505') {
          toast.info("You're already subscribed to weekly horoscopes!");
          setFlowState('already_subscribed');
        } else {
          throw new Error('Failed to subscribe');
        }
      } else {
        setFlowState('confirmed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setFlowState('input');
    }
  };

  // Full form submit (for non-logged-in users)
  const handleSubmit = async (data: BirthFormData) => {
    setFlowState('submitting');

    try {
      // Get UTC datetime
      const birthDateTimeUtc = await getBirthDateTimeUtc({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Get kundli data
      const kundliData = await calculate({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Save birth chart via save-birth-chart
      const deviceId = getDeviceId();
      const { data: saveResult, error: saveError } = await supabase.functions.invoke('save-birth-chart', {
        body: {
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          birth_place: data.birthPlace,
          birth_time_utc: birthDateTimeUtc,
          latitude: data.latitude,
          longitude: data.longitude,
          email: data.email,
          name: data.name || null,
          device_id: deviceId,
          kundli_data: kundliData,
        },
      });

      if (saveError || saveResult?.error) {
        throw new Error(saveError?.message || saveResult?.error || 'Failed to save birth chart');
      }

      // Subscribe to weekly horoscope
      const { error: subscribeError } = await supabase.from('weekly_horoscope_subscribers').insert({
        email: data.email,
        name: data.name || null,
        kundli_id: saveResult.id,
      });

      if (subscribeError) {
        if (subscribeError.code === '23505') {
          toast.info("You're already subscribed to weekly horoscopes!");
        } else {
          throw new Error('Failed to subscribe');
        }
      }

      setFlowState('confirmed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setFlowState('input');
    }
  };

  // Loading state
  if (flowState === 'loading' || authLoading) {
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

  // Already subscribed state
  if (flowState === 'already_subscribed') {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
              <Check className="w-10 h-10 text-green-400" />
            </div>

            <h1 className="font-display text-3xl md:text-4xl text-cream mb-4">You're Subscribed!</h1>

            <p className="text-cream-muted text-lg mb-8">
              You're already receiving personalized weekly horoscopes every Monday.
            </p>

            <div className="p-6 rounded-xl bg-midnight/50 border border-gold/20 mb-8">
              <p className="text-cream-muted text-sm">
                Every week, we analyze planetary transits against your birth chart to give you personalized cosmic
                guidance.
              </p>
            </div>

            <Button variant="outline" onClick={() => navigate('/')} className="font-[Inter]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (flowState === 'confirmed') {
    const displayEmail = isAuthenticated && user?.email ? user.email : '';
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md text-center animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
              <Check className="w-10 h-10 text-green-400" />
            </div>

            <h1 className="font-display text-3xl md:text-4xl text-cream mb-4">You're All Set!</h1>

            <p className="text-cream-muted text-lg mb-8">
              Starting this Monday, you'll receive your personalized weekly horoscope in your inbox
              {displayEmail && (
                <>
                  {' '}
                  at <span className="text-gold">{displayEmail}</span>
                </>
              )}
            </p>

            <div className="p-6 rounded-xl bg-midnight/50 border border-gold/20 mb-8">
              <p className="text-cream-muted text-sm">
                Every week, we'll analyze planetary transits against your birth chart to give you personalized cosmic
                guidance.
              </p>
            </div>

            <Button variant="outline" onClick={() => navigate('/')} className="font-[Inter]">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in user with kundli - simple subscribe flow
  if (isAuthenticated && hasKundli && kundli) {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-gold" />
            </div>

            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Weekly Horoscope</h1>

            <p className="text-cream-muted mb-8">
              Get personalized weekly cosmic guidance delivered every Monday based on your birth chart.
            </p>

            <div className="p-6 rounded-xl bg-midnight/50 border border-gold/20 mb-8">
              <p className="text-cream text-sm mb-2">Your email:</p>
              <p className="text-gold">{user?.email || kundli.email}</p>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full mb-4"
              onClick={handleQuickSubscribe}
              disabled={flowState === 'submitting'}
            >
              {flowState === 'submitting' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                'Subscribe to Weekly Horoscope'
              )}
            </Button>

            <Button variant="ghost" onClick={() => navigate('/')} className="text-cream-muted hover:text-cream">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Non-logged-in user - full form
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
      <StarField />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Weekly Horoscope</h1>
            <p className="text-cream-muted">Get personalized weekly cosmic guidance delivered every Monday</p>
          </div>

          {/* Form */}
          <BirthDetailsForm
            showName
            showEmail
            requireAge18
            onSubmit={handleSubmit}
            isSubmitting={flowState === 'submitting' || isCalculating}
            submitButtonText="Subscribe to Weekly Horoscope"
          />
        </div>
      </div>
    </div>
  );
};

export default WeeklyHoroscopePage;
