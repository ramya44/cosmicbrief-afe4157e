import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Sparkles, Lock, ChevronRight, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
interface KundliDetails {
  id: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  moon_sign: string | null;
  sun_sign: string | null;
  nakshatra: string | null;
  ascendant_sign: string | null;
  free_vedic_forecast: string | null;
  paid_vedic_forecast: string | null;
  forecast_generated_at: string | null;
  email: string | null;
}

interface ForecastSection {
  heading: string;
  content: ContentItem[];
}

interface ContentItem {
  type: string;
  text?: string;
  label?: string;
  items?: string[];
  date_range?: string;
  title?: string;
  what_happening?: string;
  astrology?: string;
  key_actions?: string;
  transitions?: { date: string; significance: string }[];
  quarter?: string;
  question?: string;
  guidance?: string;
}

interface ForecastJson {
  title: string;
  subtitle: string;
  sections: ForecastSection[];
}

const VedicResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kundliId = searchParams.get('id');
  const isPaidView = searchParams.get('paid') === 'true';

  const [kundli, setKundli] = useState<KundliDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isInlineCTAVisible, setIsInlineCTAVisible] = useState(false);
  const inlineCTARef = useRef<HTMLDivElement>(null);

  // Track when inline CTA is visible to hide sticky CTA
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInlineCTAVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (inlineCTARef.current) {
      observer.observe(inlineCTARef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchKundli = async () => {
      if (!kundliId) {
        setError('No kundli ID provided');
        setLoading(false);
        return;
      }

      const deviceId = getDeviceId();

      const { data, error: fnError } = await supabase.functions.invoke('get-vedic-kundli-details', {
        body: { kundli_id: kundliId, device_id: deviceId },
      });

      if (fnError) {
        setError('Failed to load your forecast');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Forecast not found');
        setLoading(false);
        return;
      }

      setKundli(data);
      setLoading(false);
    };

    fetchKundli();
  }, [kundliId]);

  const handleUpgrade = async () => {
    if (!kundli) return;
    
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-vedic-payment', {
        body: { 
          kundli_id: kundli.id,
          email: kundli.email 
        },
      });

      if (error || !data?.url) {
        toast.error('Failed to start checkout');
        setIsUpgrading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      toast.error('An error occurred');
      setIsUpgrading(false);
    }
  };

  const parseJsonForecast = (text: string): ForecastJson | null => {
    if (!text) return null;
    
    try {
      let cleaned = text.trim();
      
      // Try to extract JSON from markdown code blocks first
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1].trim();
      }
      
      // Try to parse as JSON
      if (cleaned.startsWith('{')) {
        const parsed = JSON.parse(cleaned);
        
        // Validate structure
        if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
          console.log('[VedicResultsPage] Successfully parsed JSON with', parsed.sections.length, 'sections');
          return parsed as ForecastJson;
        } else {
          console.log('[VedicResultsPage] Parsed JSON but missing sections:', Object.keys(parsed || {}));
          return null;
        }
      }
      
      console.log('[VedicResultsPage] Not JSON format, first 50 chars:', cleaned.substring(0, 50));
      return null;
    } catch (e) {
      console.error('[VedicResultsPage] JSON parse error:', e);
      return null;
    }
  };

  const renderJsonForecast = (forecast: ForecastJson, isPaid: boolean) => {
    if (!forecast?.sections || !Array.isArray(forecast.sections)) {
      console.error('[VedicResultsPage] Invalid forecast structure:', forecast);
      return <p className="text-cream-muted">Unable to render forecast</p>;
    }

    return (
      <div className="space-y-10">
        {forecast.sections.map((section, sIdx) => {
          if (!section?.heading) return null;
          
          // Check if this is the upgrade section in free forecast
          const isUpgradeSection = section.heading.toLowerCase().includes('want to know') || 
                                   section.heading.toLowerCase().includes('specifics');
          
          if (isUpgradeSection && !isPaid) {
            return null; // We'll render our own CTA instead
          }

          return (
            <section key={sIdx} className="animate-fade-up" style={{ animationDelay: `${sIdx * 100}ms` }}>
              <h2 className="text-2xl font-bold text-gold mb-6 font-display">{section.heading}</h2>
              
              <div className="space-y-4">
                {section.content?.map((item, iIdx) => renderContentItem(item, iIdx))}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  const renderContentItem = (item: ContentItem, key: number) => {
    switch (item.type) {
      case 'paragraph':
        return (
          <p key={key} className="text-cream-muted leading-relaxed text-lg font-serif">
            {renderMarkdownText(item.text || '')}
          </p>
        );
      
      case 'astrology_note':
        return (
          <div key={key} className="bg-midnight/60 border border-gold/20 rounded-lg p-4 mt-4">
            <p className="text-gold text-sm font-medium mb-2">{item.label || 'The Astrology:'}</p>
            <p className="text-cream-muted text-sm">{renderMarkdownText(item.text || '')}</p>
          </div>
        );
      
      case 'benefits_list':
        return (
          <ul key={key} className="space-y-2 my-4">
            {item.items?.map((listItem, i) => (
              <li key={i} className="flex items-start gap-3 text-cream-muted">
                <ChevronRight className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                <span>{renderMarkdownText(listItem)}</span>
              </li>
            ))}
          </ul>
        );
      
      case 'period':
        return (
          <div key={key} className="bg-midnight/40 border border-border/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-gold text-sm font-medium">{item.date_range}</span>
            </div>
            <h3 className="text-xl font-semibold text-cream mb-4">{item.title}</h3>
            <div className="space-y-4 text-cream-muted font-serif">
              <p className="leading-relaxed">{renderMarkdownText(item.what_happening || '')}</p>
              {item.astrology && (
                <div className="bg-midnight/60 border border-gold/20 rounded-lg p-4">
                  <p className="text-gold text-sm font-medium mb-2">The Astrology:</p>
                  <p className="text-sm">{renderMarkdownText(item.astrology)}</p>
                </div>
              )}
              {item.key_actions && (
                <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                  <p className="text-gold text-sm font-medium mb-2">Key Actions:</p>
                  <p className="text-sm">{renderMarkdownText(item.key_actions)}</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'transitions_table':
        return (
          <div key={key} className="overflow-hidden rounded-xl border border-border/30">
            <table className="w-full">
              <thead className="bg-midnight/60">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gold">Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {item.transitions?.map((t, i) => (
                  <tr key={i} className="bg-midnight/20">
                    <td className="px-4 py-3 text-cream font-medium whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 text-cream-muted text-sm">{renderMarkdownText(t.significance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'theme':
        return (
          <div key={key} className="bg-midnight/40 border border-border/30 rounded-xl p-5 mb-4">
            <h4 className="text-lg font-semibold text-cream mb-2">{renderMarkdownText(item.title || '')}</h4>
            <p className="text-cream-muted font-serif">{renderMarkdownText(item.text || '')}</p>
          </div>
        );
      
      case 'decision':
        return (
          <div key={key} className="bg-midnight/40 border border-border/30 rounded-xl p-5 mb-4">
            <span className="text-gold text-base font-medium">{item.quarter}</span>
            <h4 className="text-lg font-semibold text-cream mt-2 mb-3">{renderMarkdownText(item.question || '')}</h4>
            <p className="text-cream-muted font-serif">{renderMarkdownText(item.guidance || '')}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderMarkdownText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-cream">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderMarkdownForecast = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (const line of lines) {
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-xl font-semibold text-cream mt-8 mb-4">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-2xl font-bold text-gold mt-10 mb-4 font-display">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <p key={key++} className="font-semibold text-cream-muted my-2">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={key++} className="text-cream-muted ml-4 my-1 font-serif">
            {line.replace('- ', '')}
          </li>
        );
      } else if (line.startsWith('---')) {
        elements.push(<hr key={key++} className="border-border/30 my-8" />);
      } else if (line.trim()) {
        elements.push(
          <p key={key++} className="text-cream-muted leading-relaxed my-3 text-lg font-serif">
            {renderMarkdownText(line)}
          </p>
        );
      }
    }

    return elements;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !kundli) {
    return (
      <div className="relative min-h-screen bg-celestial">
        <StarField />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center">
          <p className="text-cream-muted mb-4">{error || 'Something went wrong'}</p>
          <Button onClick={() => navigate('/vedic/input')}>Try Again</Button>
        </div>
      </div>
    );
  }

  const hasPaidForecast = !!kundli.paid_vedic_forecast;
  const forecastToShow = (isPaidView && hasPaidForecast) ? kundli.paid_vedic_forecast : kundli.free_vedic_forecast;
  const parsedForecast = forecastToShow ? parseJsonForecast(forecastToShow) : null;

  return (
    <div className="relative min-h-screen bg-celestial">
      <StarField />

      <header className="relative z-20 border-b border-border/30 bg-midnight/80 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vedic/input')}
            className="text-cream-muted hover:text-cream"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {hasPaidForecast && (
              <div className="flex gap-2">
                <Button
                  variant={!isPaidView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(`/vedic/results?id=${kundliId}`)}
                  className={!isPaidView ? "bg-gold text-midnight font-sans" : "text-cream-muted font-sans"}
                >
                  Synopsis
                </Button>
                <Button
                  variant={isPaidView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(`/vedic/results?id=${kundliId}&paid=true`)}
                  className={isPaidView ? "bg-gold text-midnight font-sans" : "text-cream-muted font-sans"}
                >
                  Full Cosmic Brief
                </Button>
              </div>
            )}
            
            {/* Profile Icon with Astrology Details Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-cream-muted hover:text-cream hover:bg-gold/10"
                >
                  <User className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-64 bg-midnight border-gold/30 p-4"
                align="end"
              >
                <h4 className="text-gold font-medium mb-3 text-sm">Your Vedic Profile</h4>
                <div className="space-y-2.5 text-sm">
                  {kundli.ascendant_sign && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Ascendant</span>
                      <span className="text-cream font-medium">{kundli.ascendant_sign}</span>
                    </div>
                  )}
                  {kundli.moon_sign && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Moon Sign</span>
                      <span className="text-cream font-medium">{kundli.moon_sign}</span>
                    </div>
                  )}
                  {kundli.sun_sign && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Sun Sign</span>
                      <span className="text-cream font-medium">{kundli.sun_sign}</span>
                    </div>
                  )}
                  {kundli.nakshatra && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Nakshatra</span>
                      <span className="text-cream font-medium">{kundli.nakshatra}</span>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12 animate-fade-up">
          <p className="text-gold text-sm uppercase tracking-widest mb-2 font-sans">
            {isPaidView && hasPaidForecast ? 'Your Complete Reading' : 'Your Personalized Reading'}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
            {isPaidView && hasPaidForecast ? 'Complete 2026 Forecast' : '2026 Cosmic Brief'}
          </h1>
          <p className="text-cream-muted font-sans">
            {(() => {
              const [year, month, day] = kundli.birth_date.split('-').map(Number);
              return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            })()}
            {kundli.birth_time && (() => {
              const [hours, minutes] = kundli.birth_time.split(':').map(Number);
              const period = hours >= 12 ? 'PM' : 'AM';
              const hour12 = hours % 12 || 12;
              return ` · ${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
            })()}
            {' · '}{kundli.birth_place}
          </p>
          
        </div>

        {forecastToShow ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-midnight/40 md:border md:border-border/30 rounded-none md:rounded-2xl p-4 md:p-10 backdrop-blur-sm -mx-4 md:mx-0">
              {parsedForecast ? (
                renderJsonForecast(parsedForecast, isPaidView && hasPaidForecast)
              ) : (
                <div className="prose prose-invert max-w-none">
                  {renderMarkdownForecast(forecastToShow)}
                </div>
              )}
            </div>

            {/* Upgrade CTA - Only show on free forecast */}
            {!hasPaidForecast && (
              <div ref={inlineCTARef} className="mt-12 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 rounded-2xl p-6 md:p-8 text-center overflow-hidden mx-0">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-gold" />
                  </div>
                </div>
                
                <h3 className="text-xl md:text-2xl font-display text-cream mb-3">
                  Want the Complete 2026 Roadmap?
                </h3>
                
                <p className="text-cream-muted mb-6 max-w-lg mx-auto text-sm md:text-base">
                  Get month-by-month guidance, specific timing for key decisions, 
                  and detailed analysis of every transition point in your year ahead.
                </p>

                <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
                  {[
                    "Month-by-month breakdown with exact dates",
                    "8-12 key transition points explained",
                    "Quarterly decision guidance",
                    "Pivotal themes and action windows",
                    "Complete pratyantardasha timing"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-cream-muted text-sm md:text-base">
                      <ChevronRight className="w-4 h-4 text-gold flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="bg-gold hover:bg-gold-light text-midnight font-semibold px-4 md:px-8 py-5 md:py-6 text-base md:text-lg rounded-xl w-full md:w-auto min-w-0 font-sans"
                >
                  {isUpgrading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin mr-2" />
                      <span>Loading...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Lock className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span>Unlock Full Cosmic Brief —</span>
                      <span className="line-through text-midnight/50 mx-1">$99</span>
                      <span>$59</span>
                    </span>
                  )}
                </Button>

                <p className="text-cream-muted/60 text-sm mt-4">
                  One-time payment • Instant access
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="text-cream-muted mt-4">Generating your forecast...</p>
          </div>
        )}
      </main>

      {/* Sticky Mobile CTA - Only show on free forecast when inline CTA is not visible */}
      {!hasPaidForecast && forecastToShow && !isInlineCTAVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-midnight/95 backdrop-blur-md border-t border-gold/30 p-4">
          <Button 
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full bg-gold hover:bg-gold-light text-midnight font-semibold py-5 text-base rounded-xl font-sans"
          >
            {isUpgrading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin mr-2" />
                <span>Loading...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Lock className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Unlock Full Cosmic Brief —</span>
                <span className="line-through text-midnight/50 mx-1">$99</span>
                <span>$59</span>
              </span>
            )}
          </Button>
        </div>
      )}
      
      {/* Bottom padding to account for sticky CTA on mobile */}
      {!hasPaidForecast && forecastToShow && <div className="h-20 md:hidden" />}
    </div>
  );
};

export default VedicResultsPage;
