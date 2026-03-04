import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForecastStore } from '@/store/forecastStore';
import { useChatbot } from '@/hooks/useChatbot';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ChatMessages,
  ChatInput,
  ChatHeader,
  ChatSubscriptionGate,
} from '@/components/chat';
import { BirthDetailsForm, BirthFormData } from '@/components/BirthDetailsForm';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const STRIPE_REDIRECT_KUNDLI_KEY = 'stripe_redirect_kundli';

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { kundliId, birthData, setKundliId, setBirthData, setFreeForecast } = useForecastStore();
  const { isAuthenticated, isLoading: isAuthLoading, openLoginModal, user, refreshKundli, kundli: savedKundli, isKundliLoading } = useAuthContext();
  const [isRecoveringSession, setIsRecoveringSession] = useState(false);
  const [isSubmittingBirthDetails, setIsSubmittingBirthDetails] = useState(false);

  const {
    messages,
    sessions,
    currentSessionId,
    subscriptionStatus,
    isLoading,
    isCheckingSubscription,
    isCreatingSubscription,
    sendMessage,
    loadSession,
    startNewConversation,
    createSubscription,
    checkSubscription,
    openBillingPortal,
  } = useChatbot({ kundliId });

  // Handle subscription success/cancel URL params with session recovery
  useEffect(() => {
    const subscriptionResult = searchParams.get('subscription');
    if (subscriptionResult === 'success') {
      const handleStripeReturn = async () => {
        setIsRecoveringSession(true);
        try {
          // Restore kundliId if it was saved before redirect
          const savedKundliId = localStorage.getItem(STRIPE_REDIRECT_KUNDLI_KEY);
          if (savedKundliId && !kundliId) {
            setKundliId(savedKundliId);
          }
          localStorage.removeItem(STRIPE_REDIRECT_KUNDLI_KEY);

          // Refresh the session to ensure it's valid
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.warn('Could not refresh session after Stripe redirect:', error);
          }

          // Re-check subscription status
          toast.success('Welcome! Your subscription is now active.');
          checkSubscription();
        } catch (err) {
          console.error('Error handling Stripe return:', err);
        } finally {
          setIsRecoveringSession(false);
        }
      };

      handleStripeReturn();
      navigate('/chat', { replace: true });
    } else if (subscriptionResult === 'canceled') {
      // Clean up saved kundliId on cancel too
      localStorage.removeItem(STRIPE_REDIRECT_KUNDLI_KEY);
      toast.info('Subscription checkout was canceled.');
      navigate('/chat', { replace: true });
    }
  }, [searchParams, checkSubscription, navigate, kundliId, setKundliId]);

  // Handle birth details form submission
  const handleBirthDetailsSubmit = async (data: BirthFormData) => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setIsSubmittingBirthDetails(true);
    try {
      // Get timezone for the birth location
      const { data: tzData, error: tzError } = await supabase.functions.invoke('get-timezone', {
        body: {
          lat: data.latitude,
          lon: data.longitude,
          date: data.birthDate,
          time: data.birthTime,
        },
      });

      if (tzError) {
        throw new Error('Failed to get timezone');
      }

      // Save kundli details
      const { data: kundliData, error: saveError } = await supabase.functions.invoke('save-kundli-details', {
        body: {
          name: data.name || null,
          email: data.email || user.email,
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          birth_place: data.birthPlace,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: tzData.timezone,
          user_id: user.id,
        },
      });

      if (saveError || !kundliData?.id) {
        throw new Error('Failed to save birth details');
      }

      // Update the store
      setBirthData({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        birthPlace: data.birthPlace,
        name: data.name,
        email: data.email || user.email,
        lat: data.latitude,
        lon: data.longitude,
      });
      setKundliId(kundliData.id);

      // Refresh kundli in auth context
      await refreshKundli();

      toast.success('Birth details saved!');
    } catch (err) {
      console.error('Error saving birth details:', err);
      toast.error('Failed to save birth details. Please try again.');
    } finally {
      setIsSubmittingBirthDetails(false);
    }
  };

  // Auto-recover kundli for authenticated users who lost their kundliId or birthData
  useEffect(() => {
    if (isAuthenticated && user && savedKundli) {
      // Recover kundliId if missing
      if (!kundliId) {
        setKundliId(savedKundli.id);
      }
      // Recover birthData if missing (even if kundliId exists)
      if (!birthData) {
        setBirthData({
          birthDate: savedKundli.birth_date,
          birthTime: savedKundli.birth_time,
          birthPlace: savedKundli.birth_place,
          name: savedKundli.name || undefined,
          email: savedKundli.email || undefined,
          lat: savedKundli.latitude ?? undefined,
          lon: savedKundli.longitude ?? undefined,
        });
      }
      // Recover forecast if missing
      if (!kundliId && savedKundli.free_vedic_forecast) {
        setFreeForecast({
          forecast: savedKundli.free_vedic_forecast,
          id: savedKundli.id,
          animalSign: savedKundli.animal_sign || undefined,
        });
      }
    }
  }, [isAuthenticated, kundliId, birthData, user, savedKundli, setBirthData, setKundliId, setFreeForecast]);

  // Show loading while checking auth, recovering session, or loading kundli
  if (isAuthLoading || isRecoveringSession || isKundliLoading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // Require authentication to chat with Maya
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="font-display text-xl text-cream mb-3">
            Sign In to Chat with Maya
          </h2>
          <p className="text-cream/70 mb-6">
            Create a free account to unlock personalized astrological guidance
            from Maya, your AI Vedic astrologer.
          </p>
          <button
            onClick={() => openLoginModal({ redirectAfterLogin: '/chat' })}
            className="bg-gold hover:bg-gold-light text-midnight font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Sign In or Create Account
          </button>
        </div>
      </div>
    );
  }

  // If no kundli, show birth details form
  if (!kundliId) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-display text-xl text-cream mb-2">
              Enter Your Birth Details
            </h2>
            <p className="text-cream/70 text-sm">
              Maya needs your birth chart to provide personalized astrological guidance.
            </p>
          </div>

          <BirthDetailsForm
            showName={true}
            showEmail={false}
            onSubmit={handleBirthDetailsSubmit}
            isSubmitting={isSubmittingBirthDetails}
            submitButtonText="Continue to Maya"
            submitButtonIcon={<Sparkles className="w-4 h-4 ml-2" />}
            initialValues={{
              email: user?.email || '',
            }}
          />
        </div>
      </div>
    );
  }

  // Show loading while checking subscription
  if (isCheckingSubscription) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // Show subscription gate if no active subscription
  if (!subscriptionStatus?.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-midnight flex flex-col">
        <ChatSubscriptionGate
          onSubscribe={createSubscription}
          isLoading={isCreatingSubscription}
        />
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      <ChatHeader
        sessions={sessions}
        currentSessionId={currentSessionId || undefined}
        onNewConversation={startNewConversation}
        onSelectSession={loadSession}
        onManageSubscription={openBillingPortal}
        birthData={birthData}
      />

      <ChatMessages messages={messages} isLoading={isLoading} />

      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        disabled={!subscriptionStatus?.hasActiveSubscription}
      />
    </div>
  );
}
