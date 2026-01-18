import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  forecastId: string | null;
  guestToken: string | null;
}

export const ShareButton = ({ forecastId, guestToken }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!forecastId || !guestToken) {
      toast.error('Unable to create share link');
      return;
    }

    const shareableUrl = `${window.location.origin}/#/results?forecastId=${encodeURIComponent(forecastId)}&guestToken=${encodeURIComponent(guestToken)}`;
    
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!forecastId || !guestToken) return null;

  return (
    <div className="flex justify-center pt-8 animate-fade-up" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
      <Button 
        variant="heroOutline" 
        size="lg" 
        onClick={handleShare}
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="w-5 h-5" />
            Share my Cosmic Brief
          </>
        )}
      </Button>
    </div>
  );
};
