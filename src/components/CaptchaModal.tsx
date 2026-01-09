import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';

// Cloudflare Turnstile site key - this should be configured in env
const TURNSTILE_SITE_KEY = '0x4AAAAAABkMYinukE8DzHzQ'; // Test key - replace with real key

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback': () => void;
          'expired-callback': () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (token: string) => void;
}

export const CaptchaModal = ({ isOpen, onClose, onVerify }: CaptchaModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load Turnstile script if not already loaded
    const loadScript = () => {
      return new Promise<void>((resolve) => {
        if (window.turnstile) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const initWidget = async () => {
      setIsLoading(true);
      setError(null);

      await loadScript();

      // Wait a tick for the container to be available
      await new Promise((r) => setTimeout(r, 100));

      if (!containerRef.current || !window.turnstile) {
        setError('Failed to load verification. Please refresh and try again.');
        setIsLoading(false);
        return;
      }

      // Remove existing widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal errors
        }
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            onVerify(token);
          },
          'error-callback': () => {
            setError('Verification failed. Please try again.');
          },
          'expired-callback': () => {
            setError('Verification expired. Please try again.');
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
          theme: 'dark',
        });
        setIsLoading(false);
      } catch {
        setError('Failed to initialize verification.');
        setIsLoading(false);
      }
    };

    initWidget();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [isOpen, onVerify]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-midnight border-gold/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cream">
            <ShieldCheck className="w-5 h-5 text-gold" />
            Quick Verification
          </DialogTitle>
          <DialogDescription className="text-cream-muted">
            Please complete this quick check to continue generating your forecast.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-cream-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading verification...</span>
            </div>
          )}

          <div
            ref={containerRef}
            className={isLoading ? 'hidden' : 'flex justify-center'}
          />

          {error && (
            <div className="mt-4 text-center">
              <p className="text-destructive text-sm mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (widgetIdRef.current && window.turnstile) {
                    window.turnstile.reset(widgetIdRef.current);
                    setError(null);
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
