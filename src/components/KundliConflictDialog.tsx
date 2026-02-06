import { format, parse } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { UserKundli } from '@/hooks/useAuth';
import type { BirthData } from '@/store/forecastStore';

interface KundliConflictDialogProps {
  open: boolean;
  savedKundli: UserKundli;
  sessionBirthData: BirthData | null;
  onResolve: (choice: 'keep-saved' | 'use-current') => void;
  onClose: () => void;
}

function formatBirthDate(dateStr: string): string {
  try {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function formatBirthTime(timeStr: string): string {
  try {
    // Handle various time formats
    let date: Date;
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      date = new Date();
      date.setHours(hours, minutes, 0, 0);
    } else {
      return timeStr;
    }
    return format(date, 'h:mm a');
  } catch {
    return timeStr;
  }
}

export const KundliConflictDialog = ({
  open,
  savedKundli,
  sessionBirthData,
  onResolve,
  onClose,
}: KundliConflictDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-midnight border-gold/30 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gold font-display text-xl">
            You already have saved birth details
          </DialogTitle>
          <DialogDescription className="text-cream/80">
            Your account has different birth details than your current session. Which would you like to use?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4">
          {/* Saved Kundli */}
          <div className="bg-celestial/30 border border-gold/20 rounded-lg p-4">
            <div className="text-xs font-medium text-gold uppercase tracking-wide mb-3">
              Saved
            </div>
            <div className="space-y-2 text-cream">
              <div>
                <div className="text-sm text-cream/60">Date</div>
                <div className="font-medium">{formatBirthDate(savedKundli.birth_date)}</div>
              </div>
              <div>
                <div className="text-sm text-cream/60">Time</div>
                <div className="font-medium">{formatBirthTime(savedKundli.birth_time)}</div>
              </div>
              <div>
                <div className="text-sm text-cream/60">Place</div>
                <div className="font-medium text-sm leading-tight">{savedKundli.birth_place}</div>
              </div>
            </div>
          </div>

          {/* Session Kundli */}
          <div className="bg-celestial/30 border border-gold/20 rounded-lg p-4">
            <div className="text-xs font-medium text-gold uppercase tracking-wide mb-3">
              Current Session
            </div>
            {sessionBirthData ? (
              <div className="space-y-2 text-cream">
                <div>
                  <div className="text-sm text-cream/60">Date</div>
                  <div className="font-medium">{formatBirthDate(sessionBirthData.birthDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-cream/60">Time</div>
                  <div className="font-medium">{formatBirthTime(sessionBirthData.birthTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-cream/60">Place</div>
                  <div className="font-medium text-sm leading-tight">{sessionBirthData.birthPlace}</div>
                </div>
              </div>
            ) : (
              <div className="text-cream/60 text-sm">No birth details in session</div>
            )}
          </div>
        </div>

        <p className="text-sm text-cream/60 mb-4">
          Which birth details would you like to use going forward?
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onResolve('keep-saved')}
            className="flex-1 border-gold/30 text-cream hover:bg-gold/10 hover:text-cream"
          >
            Keep Saved Details
          </Button>
          <Button
            onClick={() => onResolve('use-current')}
            className="flex-1 bg-gold hover:bg-gold-light text-midnight font-medium"
          >
            Use Current Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
