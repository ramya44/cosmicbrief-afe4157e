import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
  preview: string;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  status: string;
  currentPeriodEnd: string | null;
}

interface UseChatbotOptions {
  kundliId: string | null;
}

export function useChatbot({ kundliId }: UseChatbotOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!kundliId) {
      setIsCheckingSubscription(false);
      return;
    }

    try {
      setIsCheckingSubscription(true);
      const { data, error } = await supabase.functions.invoke('get-chatbot-subscription-status', {
        body: { kundli_id: kundliId },
      });

      if (error) throw error;

      setSubscriptionStatus(data);
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        status: 'inactive',
        currentPeriodEnd: null,
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  }, [kundliId]);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    if (!kundliId || !subscriptionStatus?.hasActiveSubscription) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-chat-history', {
        body: { kundli_id: kundliId },
      });

      if (error) throw error;

      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [kundliId, subscriptionStatus?.hasActiveSubscription]);

  // Load messages for a session
  const loadSession = useCallback(async (sessionId: string) => {
    if (!kundliId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-chat-history', {
        body: { kundli_id: kundliId, session_id: sessionId },
      });

      if (error) throw error;

      setMessages(data.messages || []);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error('Failed to load session:', err);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [kundliId]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!kundliId || !subscriptionStatus?.hasActiveSubscription) return;

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-maya', {
        body: {
          kundli_id: kundliId,
          message: content,
          session_id: currentSessionId || undefined,
        },
      });

      if (error) {
        // Handle rate limit
        if (error.message?.includes('Rate limit')) {
          toast.error('You\'ve reached the limit of 30 messages per hour. Please try again later.');
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          return;
        }
        throw error;
      }

      // Update session ID if new
      if (data.session_id && data.session_id !== currentSessionId) {
        setCurrentSessionId(data.session_id);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh sessions list
      loadSessions();
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  }, [kundliId, currentSessionId, subscriptionStatus?.hasActiveSubscription, loadSessions]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  // Create subscription (redirect to Stripe)
  const createSubscription = useCallback(async () => {
    if (!kundliId) {
      toast.error('Please generate your birth chart first');
      return;
    }

    try {
      setIsCreatingSubscription(true);
      const { data, error } = await supabase.functions.invoke('create-chatbot-subscription', {
        body: { kundli_id: kundliId },
      });

      if (error) throw error;

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      console.error('Failed to create subscription:', err);
      toast.error('Failed to start subscription. Please try again.');
    } finally {
      setIsCreatingSubscription(false);
    }
  }, [kundliId]);

  // Open billing portal for subscription management
  const openBillingPortal = useCallback(async () => {
    if (!kundliId) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: { kundli_id: kundliId },
      });

      if (error) throw error;

      if (data?.portal_url) {
        window.location.href = data.portal_url;
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      toast.error('Failed to open subscription management. Please try again.');
    }
  }, [kundliId]);

  // Check subscription on mount and when kundliId changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Load sessions when subscription is active
  useEffect(() => {
    if (subscriptionStatus?.hasActiveSubscription) {
      loadSessions();
    }
  }, [subscriptionStatus?.hasActiveSubscription, loadSessions]);

  return {
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
  };
}
