import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonPhase {
  what_matters: string;
  lean_into: string;
  protect: string;
  watch_for: string;
}

interface SeasonalMapAccordionProps {
  phases: SeasonPhase[];
}

const seasonLabels = ['Early Year', 'Mid-Year', 'Late Year', 'Year End'];

// Determine which phase is "current" based on the date
function getCurrentPhaseIndex(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  
  if (month < 3) return 0;      // Jan-Mar: Early Year
  if (month < 6) return 1;      // Apr-Jun: Mid-Year
  if (month < 9) return 2;      // Jul-Sep: Late Year
  return 3;                      // Oct-Dec: Year End
}

export const SeasonalMapAccordion = ({ phases }: SeasonalMapAccordionProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set initial expanded index based on device
  useEffect(() => {
    if (isMobile) {
      // On mobile, expand current phase
      setExpandedIndex(getCurrentPhaseIndex());
    } else {
      // On desktop, expand first phase
      setExpandedIndex(0);
    }
  }, [isMobile]);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {phases.map((season, index) => {
        const isExpanded = expandedIndex === index;
        
        return (
          <div 
            key={index}
            className={cn(
              "rounded-lg border transition-all duration-300",
              isExpanded 
                ? "border-gold/30 bg-gold/5" 
                : "border-border/30 bg-transparent hover:border-border/50"
            )}
          >
            {/* Accordion Header */}
            <button
              onClick={() => handleToggle(index)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex-1">
                <h4 className="font-display text-lg text-gold">{seasonLabels[index]}</h4>
                {/* Show "what matters" preview when collapsed */}
                {!isExpanded && (
                  <p className="text-cream/70 text-sm mt-1 line-clamp-2">
                    {season.what_matters}
                  </p>
                )}
              </div>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 text-cream/50 transition-transform duration-300 flex-shrink-0 ml-4",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Accordion Content */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <h5 className="text-cream font-medium text-lg mb-1">What matters</h5>
                  <p className="text-cream/70">{season.what_matters}</p>
                </div>
                <div>
                  <h5 className="text-cream font-medium text-lg mb-1">Lean into</h5>
                  <p className="text-cream/70">{season.lean_into}</p>
                </div>
                <div>
                  <h5 className="text-cream font-medium text-lg mb-1">Protect</h5>
                  <p className="text-cream/70">{season.protect}</p>
                </div>
                <div>
                  <h5 className="text-cream font-medium text-lg mb-1">Watch for</h5>
                  <p className="text-cream/70">{season.watch_for}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
