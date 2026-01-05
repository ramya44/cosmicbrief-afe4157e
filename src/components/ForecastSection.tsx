import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForecastSectionProps {
  title: string;
  children: ReactNode;
  locked?: boolean;
  className?: string;
  delay?: number;
  icon?: ReactNode;
}

export const ForecastSection = ({
  title,
  children,
  locked = false,
  className,
  delay = 0,
  icon,
}: ForecastSectionProps) => {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8 animate-fade-up',
        locked && 'overflow-hidden',
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="font-display text-xl md:text-2xl text-gold">{title}</h3>
      </div>
      
      <div className={cn(locked && 'blur-lock select-none')}>
        {children}
      </div>

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-midnight/60 backdrop-blur-sm rounded-xl">
          <div className="text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-gold" />
            </div>
            <p className="text-cream/80 text-sm max-w-xs">
              Unlock your full forecast for deeper timing and clarity
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
