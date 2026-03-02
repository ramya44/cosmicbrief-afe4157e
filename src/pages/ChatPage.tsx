import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForecastStore } from '@/store/forecastStore';
import { useChatbot } from '@/hooks/useChatbot';
import {
  ChatMessages,
  ChatInput,
  ChatHeader,
  ChatSubscriptionGate,
} from '@/components/chat';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { kundliId } = useForecastStore();

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

  // Handle subscription success/cancel URL params
  useEffect(() => {
    const subscriptionResult = searchParams.get('subscription');
    if (subscriptionResult === 'success') {
      toast.success('Welcome! Your subscription is now active.');
      checkSubscription();
      // Clean up URL
      navigate('/chat', { replace: true });
    } else if (subscriptionResult === 'canceled') {
      toast.info('Subscription checkout was canceled.');
      navigate('/chat', { replace: true });
    }
  }, [searchParams, checkSubscription, navigate]);

  // If no kundli, prompt user to generate their chart first
  if (!kundliId) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="font-display text-xl text-cream mb-3">
            Generate Your Chart First
          </h2>
          <p className="text-cream/70 mb-6">
            Maya needs your birth chart to provide personalized guidance.
            Generate your free cosmic brief to get started.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-gold hover:bg-gold-light text-midnight font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Generate Free Cosmic Brief
          </button>
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
