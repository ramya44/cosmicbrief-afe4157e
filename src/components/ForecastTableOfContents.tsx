import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ForecastSection {
  heading: string;
  id: string;
}

interface ForecastTableOfContentsProps {
  sections: ForecastSection[];
  hasPaidForecast: boolean;
  isPaidView: boolean;
  onViewChange: (isPaid: boolean) => void;
}

export const ForecastTableOfContents = ({
  sections,
  hasPaidForecast,
  isPaidView,
  onViewChange,
}: ForecastTableOfContentsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 150; // offset for sticky header

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const element = sectionElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Use scrollIntoView with CSS scroll-margin-top for accurate positioning
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsExpanded(false);
    }
  };

  // Filter out upgrade sections for display
  const displaySections = sections.filter(
    s => !s.heading.toLowerCase().includes('want to know') && 
         !s.heading.toLowerCase().includes('specifics')
  );

  return (
    <div className="bg-midnight/60 border border-border/30 rounded-xl mb-8 overflow-hidden">
      {/* Header with view toggle */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-gold" />
            <span className="text-cream font-medium text-sm">Contents</span>
          </div>
          
          {hasPaidForecast && (
            <div className="flex gap-1 bg-midnight/60 rounded-lg p-1">
              <button
                onClick={() => onViewChange(false)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  !isPaidView 
                    ? "bg-gold text-midnight" 
                    : "text-cream-muted hover:text-cream"
                )}
              >
                Synopsis
              </button>
              <button
                onClick={() => onViewChange(true)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  isPaidView 
                    ? "bg-gold text-midnight" 
                    : "text-cream-muted hover:text-cream"
                )}
              >
                Full Brief
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section links - collapsed by default on mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-cream-muted hover:text-cream transition-colors"
        >
          <span className="text-sm">
            {activeSection 
              ? displaySections.find(s => s.id === activeSection)?.heading || 'Jump to section...'
              : 'Jump to section...'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 space-y-1">
            {displaySections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  activeSection === section.id
                    ? "bg-gold/20 text-gold"
                    : "text-cream-muted hover:text-cream hover:bg-white/5"
                )}
              >
                <span className="text-gold/60 mr-2">{idx + 1}.</span>
                {section.heading}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop - always visible */}
      <div className="hidden md:block p-4 space-y-1">
        {displaySections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              activeSection === section.id
                ? "bg-gold/20 text-gold"
                : "text-cream-muted hover:text-cream hover:bg-white/5"
            )}
          >
            <span className="text-gold/60 mr-2">{idx + 1}.</span>
            {section.heading}
          </button>
        ))}
      </div>
    </div>
  );
};
