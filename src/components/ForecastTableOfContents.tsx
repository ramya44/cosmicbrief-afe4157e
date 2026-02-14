import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, List } from 'lucide-react';
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
  isSharedView?: boolean;
}

export const ForecastTableOfContents = ({
  sections,
  hasPaidForecast,
  isPaidView,
  onViewChange,
  isSharedView = false,
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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsExpanded(false);
    }
  };

  // Filter out upgrade sections for display
  const displaySections = sections.filter(
    s => !s.heading.toLowerCase().includes('want to know') && 
         !s.heading.toLowerCase().includes('specifics')
  );

  // Build navigation items with Synopsis/Full Brief as clickable sections
  const buildNavItems = () => {
    const items: { label: string; id: string | null; type: 'section' | 'view-toggle'; isPaid?: boolean }[] = [];

    // For shared views, just show section navigation without toggles
    if (isSharedView) {
      displaySections.forEach((section) => {
        items.push({
          label: section.heading,
          id: section.id,
          type: 'section',
        });
      });
      return items;
    }

    // Add Synopsis as first item (links to free view)
    items.push({
      label: 'Synopsis',
      id: null,
      type: 'view-toggle',
      isPaid: false,
    });

    // If in Synopsis view, show Synopsis sections
    if (!isPaidView) {
      displaySections.forEach((section) => {
        items.push({
          label: section.heading,
          id: section.id,
          type: 'section',
        });
      });
    }

    // Add Full Brief if user has paid
    if (hasPaidForecast) {
      items.push({
        label: 'Full Cosmic Brief',
        id: null,
        type: 'view-toggle',
        isPaid: true,
      });

      // If in Full Brief view, show Full Brief sections
      if (isPaidView) {
        displaySections.forEach((section) => {
          items.push({
            label: section.heading,
            id: section.id,
            type: 'section',
          });
        });
      }
    }

    return items;
  };

  const navItems = buildNavItems();

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.type === 'view-toggle') {
      onViewChange(item.isPaid || false);
    } else if (item.id) {
      scrollToSection(item.id);
    }
  };

  const getActiveItem = () => {
    if (activeSection) return activeSection;
    return isPaidView ? 'full-brief' : 'synopsis';
  };

  return (
    <div className="bg-midnight/60 border border-border/30 rounded-xl mb-8 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-gold" />
          <span className="text-cream font-medium text-sm">Contents</span>
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
              : isPaidView ? 'Full Cosmic Brief' : 'Synopsis'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 space-y-1">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  item.type === 'view-toggle' && "font-medium",
                  item.type === 'view-toggle' && item.isPaid === isPaidView
                    ? "bg-gold/20 text-gold"
                    : item.type === 'section' && activeSection === item.id
                    ? "bg-gold/20 text-gold"
                    : "text-cream-muted hover:text-cream hover:bg-white/5",
                  item.type === 'section' && !isSharedView && "pl-6"
                )}
              >
                {item.type === 'section' && (
                  <span className="text-gold/60 mr-2">•</span>
                )}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop - always visible */}
      <div className="hidden md:block p-4 space-y-1">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleItemClick(item)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              item.type === 'view-toggle' && "font-medium",
              item.type === 'view-toggle' && item.isPaid === isPaidView
                ? "bg-gold/20 text-gold"
                : item.type === 'section' && activeSection === item.id
                ? "bg-gold/20 text-gold"
                : "text-cream-muted hover:text-cream hover:bg-white/5",
              item.type === 'section' && !isSharedView && "pl-6"
            )}
          >
            {item.type === 'section' && !isSharedView && (
              <span className="text-gold/60 mr-2">•</span>
            )}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
