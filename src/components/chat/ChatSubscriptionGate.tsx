import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle, Clock, Star, Loader2 } from 'lucide-react';

interface ChatSubscriptionGateProps {
  onSubscribe: () => void;
  isLoading?: boolean;
}

export function ChatSubscriptionGate({ onSubscribe, isLoading }: ChatSubscriptionGateProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto px-4 py-8 pb-28 md:pb-8">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-gold" />
          </div>

          <h1 className="font-display text-2xl md:text-3xl text-cream mb-3">
            Meet Maya
          </h1>
          <p className="text-cream/70 mb-8">
            Your personal AI Vedic astrologer with access to your complete birth chart.
            Ask anything about your cosmic path, timing, relationships, career, and more.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-left bg-cream/5 rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-cream font-medium text-sm">Personalized Answers</p>
                <p className="text-cream/60 text-xs">
                  Maya knows your planetary placements, dashas, and transits
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-left bg-cream/5 rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-cream font-medium text-sm">Timing Guidance</p>
                <p className="text-cream/60 text-xs">
                  Get insights on favorable periods for decisions and actions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-left bg-cream/5 rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-cream font-medium text-sm">Unlimited Conversations</p>
                <p className="text-cream/60 text-xs">
                  Chat as much as you like with your personal astrologer
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 rounded-xl p-6 mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-4xl font-display text-gold">$9</span>
              <span className="text-cream/60">/month</span>
            </div>
            <p className="text-cream/50 text-sm">Cancel anytime</p>
          </div>

          {/* Desktop button (hidden on mobile) */}
          <Button
            onClick={onSubscribe}
            disabled={isLoading}
            className="hidden md:flex w-full bg-gold hover:bg-gold-light text-midnight font-semibold py-6 text-lg rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Start Chatting with Maya
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-midnight border-t border-gold/20">
        <Button
          onClick={onSubscribe}
          disabled={isLoading}
          className="w-full bg-gold hover:bg-gold-light text-midnight font-semibold py-6 text-lg rounded-xl shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Start Chatting with Maya
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
