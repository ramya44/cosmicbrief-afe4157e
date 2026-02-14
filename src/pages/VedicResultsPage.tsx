import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Sparkles, Lock, ChevronRight, User, Share2, Check, Download, Plus } from 'lucide-react';
import { useForecastStore } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';
import { toast } from 'sonner';
import { trackInitiateCheckout } from '@/lib/meta-pixel';
import { ForecastTableOfContents } from '@/components/ForecastTableOfContents';
import { BirthChartWheel } from '@/components/BirthChartWheel';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PlanetPosition {
  id: number;
  name: string;
  sign: string;
  sign_id: number;
  sign_lord: string;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
  nakshatra?: string;
  nakshatra_id?: number;
  nakshatra_pada?: number;
  nakshatra_lord?: string;
}

interface KundliDetails {
  id: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  moon_sign: string | null;
  moon_sign_id?: number | null;
  moon_sign_lord?: string | null;
  sun_sign: string | null;
  sun_sign_id?: number | null;
  sun_sign_lord?: string | null;
  nakshatra: string | null;
  nakshatra_id?: number | null;
  nakshatra_pada?: number | null;
  nakshatra_lord?: string | null;
  ascendant_sign: string | null;
  ascendant_sign_id?: number | null;
  ascendant_sign_lord?: string | null;
  animal_sign?: string | null;
  deity?: string | null;
  planetary_positions?: PlanetPosition[] | null;
  free_vedic_forecast: string | null;
  paid_vedic_forecast: string | null;
  forecast_generated_at: string | null;
  email: string | null;
  shareable_link?: string | null;
  name?: string | null;
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
  key_actions?: string | string[];
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

interface LocationState {
  kundliData?: KundliDetails & { is_owner?: boolean };
  skipLoading?: boolean;
}

interface ZodiacLookup {
  [key: string]: string;
}

const VedicResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const kundliId = searchParams.get('id');
  const isPaidView = searchParams.get('paid') === 'true';
  const locationState = location.state as LocationState | null;

  const [kundli, setKundli] = useState<KundliDetails | null>(locationState?.kundliData || null);
  const [loading, setLoading] = useState(!locationState?.skipLoading);
  const [error, setError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isInlineCTAVisible, setIsInlineCTAVisible] = useState(false);
  const [isOwner, setIsOwner] = useState(locationState?.kundliData?.is_owner || false);
  const [zodiacLookup, setZodiacLookup] = useState<ZodiacLookup>({});
  const inlineCTARef = useRef<HTMLDivElement>(null);

  // Helper to get Western zodiac name
  const getWesternName = (sanskritName: string | null) => {
    if (!sanskritName) return null;
    return zodiacLookup[sanskritName] || sanskritName;
  };

  // Parse JSON forecast helper - defined early for use in useMemo
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
          return parsed as ForecastJson;
        }
        return null;
      }

      return null;
    } catch {
      return null;
    }
  };

  // Generate section IDs for navigation
  const generateSectionId = (heading: string, index: number) => {
    return `section-${index}-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;
  };

  // Get sections with IDs for table of contents
  const getSectionsWithIds = (forecast: ForecastJson | null) => {
    if (!forecast?.sections) return [];
    return forecast.sections
      .filter(s => s?.heading)
      .map((section, idx) => ({
        heading: section.heading,
        id: generateSectionId(section.heading, idx),
      }));
  };

  // Calculate derived values unconditionally (before any returns)
  const hasPaidForecast = useMemo(() => !!kundli?.paid_vedic_forecast, [kundli]);
  const forecastToShow = useMemo(() => {
    // If paid view requested and paid forecast exists and has content, show it
    if (isPaidView && kundli?.paid_vedic_forecast && kundli.paid_vedic_forecast.trim().length > 0) {
      return kundli.paid_vedic_forecast;
    }
    // Otherwise fall back to free forecast
    return kundli?.free_vedic_forecast || null;
  }, [isPaidView, kundli]);
  const parsedForecast = useMemo(() => 
    forecastToShow ? parseJsonForecast(forecastToShow) : null,
    [forecastToShow]
  );
  const sectionsWithIds = useMemo(() => getSectionsWithIds(parsedForecast), [parsedForecast]);

  const handleViewChange = (isPaid: boolean) => {
    if (isPaid) {
      navigate(`/vedic/results?id=${kundliId}&paid=true`);
    } else {
      navigate(`/vedic/results?id=${kundliId}`);
    }
  };

  const handleShare = async () => {
    const shareUrl = kundliId
      ? `${window.location.origin}/#/vedic/results?id=${kundliId}`
      : window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const { setKundliId, setFreeForecast } = useForecastStore();

  const handleNewBirthDetails = () => {
    // Clear stored kundli so user can enter fresh details
    setKundliId(null);
    setFreeForecast(null);
    navigate('/vedic/input');
  };

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
    console.log('[ResultsPage] Effect triggered', {
      hasLocationState: !!locationState,
      skipLoading: locationState?.skipLoading,
      hasKundliData: !!locationState?.kundliData,
      hasPaidForecastInState: !!locationState?.kundliData?.paid_vedic_forecast,
      forecastLengthInState: locationState?.kundliData?.paid_vedic_forecast?.length || 0
    });

    // If we already have data from navigation state, skip fetching
    if (locationState?.skipLoading && locationState?.kundliData) {
      console.log('[ResultsPage] Skipping fetch - using navigation state');
      return;
    }

    const fetchKundli = async () => {
      if (!kundliId) {
        setError('No kundli ID provided');
        setLoading(false);
        return;
      }

      const deviceId = getDeviceId();
      console.log('[ResultsPage] Fetching kundli', { kundliId, deviceId });

      // First try with device_id (owner access)
      let { data, error: fnError } = await supabase.functions.invoke('get-vedic-kundli-details', {
        body: { kundli_id: kundliId, device_id: deviceId },
      });

      console.log('[ResultsPage] Owner access result:', {
        hasData: !!data,
        error: fnError?.message,
        hasPaidForecast: !!data?.paid_vedic_forecast,
        forecastLength: data?.paid_vedic_forecast?.length || 0
      });

      // If not found with device_id, try as shared link
      // Also check data.error since the function returns {error: "Not found"} for access denied
      if (fnError || !data || data.error) {
        console.log('[ResultsPage] Owner access failed, trying shared access');
        const sharedResult = await supabase.functions.invoke('get-vedic-kundli-details', {
          body: { kundli_id: kundliId, shared: true },
        });

        console.log('[ResultsPage] Shared access result:', {
          hasData: !!sharedResult.data,
          error: sharedResult.error?.message,
          hasPaidForecast: !!sharedResult.data?.paid_vedic_forecast,
          forecastLength: sharedResult.data?.paid_vedic_forecast?.length || 0
        });

        if (sharedResult.error || !sharedResult.data || sharedResult.data.error) {
          console.log('[ResultsPage] Shared access also failed:', sharedResult.data?.error);
          setError('Forecast not found');
          setLoading(false);
          return;
        }

        data = sharedResult.data;
      }

      console.log('[ResultsPage] Setting kundli data', {
        hasPaidForecast: !!data.paid_vedic_forecast,
        hasFreeForecast: !!data.free_vedic_forecast,
        paidForecastLength: data.paid_vedic_forecast?.length || 0,
        freeForecastLength: data.free_vedic_forecast?.length || 0
      });

      setKundli(data);
      setIsOwner(data.is_owner || false);
      setLoading(false);
    };

    fetchKundli();
  }, [kundliId, locationState]);

  // Fetch zodiac lookup for Western names
  useEffect(() => {
    const fetchZodiacLookup = async () => {
      const { data: zodiacData } = await supabase
        .from('vedic_zodiac_signs')
        .select('sanskrit_name, western_name');

      if (zodiacData) {
        const lookup: ZodiacLookup = {};
        zodiacData.forEach((z) => {
          lookup[z.sanskrit_name] = z.western_name;
        });
        setZodiacLookup(lookup);
      }
    };

    fetchZodiacLookup();
  }, []);

  const handleUpgrade = async () => {
    if (!kundli) return;

    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-vedic-payment', {
        body: {
          kundli_id: kundli.id,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to start checkout');
        setIsUpgrading(false);
        return;
      }

      if (!data?.url) {
        console.error('No checkout URL in response:', data);
        toast.error(data?.error || 'Failed to start checkout');
        setIsUpgrading(false);
        return;
      }

      // Track checkout initiation
      trackInitiateCheckout({ value: 19.99, currency: 'USD' });

      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout exception:', err);
      toast.error('An error occurred');
      setIsUpgrading(false);
    }
  };

  const handleDownloadPdf = () => {
    // Use browser's print functionality to generate PDF
    const printContent = document.querySelector('.max-w-3xl');
    if (!printContent) {
      toast.error('Unable to generate PDF');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    const forecastContent = printContent.querySelector('.bg-midnight\\/40');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${kundli?.name ? `${kundli.name}'s` : 'Your'} 2026 Cosmic Brief</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Cormorant Garamond', serif;
              line-height: 1.6;
              color: #1a1a2e;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #d4af37;
            }
            
            .header h1 {
              font-size: 28px;
              color: #1a1a2e;
              margin-bottom: 8px;
            }
            
            .header p {
              font-family: 'Inter', sans-serif;
              font-size: 12px;
              color: #666;
            }
            
            h2 {
              font-size: 20px;
              color: #d4af37;
              margin: 30px 0 15px;
              font-weight: 600;
            }
            
            h3 {
              font-size: 18px;
              margin: 20px 0 10px;
            }
            
            h4 {
              font-size: 16px;
              margin: 15px 0 10px;
            }
            
            p {
              margin-bottom: 12px;
              font-size: 14px;
            }
            
            .astrology-note {
              background: #f5f5f5;
              border-left: 3px solid #d4af37;
              padding: 12px 16px;
              margin: 16px 0;
              font-size: 13px;
            }
            
            .astrology-note strong {
              color: #d4af37;
              display: block;
              margin-bottom: 6px;
            }
            
            .period-card {
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
            }
            
            .period-card .date {
              color: #d4af37;
              font-weight: 500;
              font-size: 13px;
            }
            
            .period-card h3 {
              margin: 8px 0 12px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            
            th, td {
              border: 1px solid #e0e0e0;
              padding: 10px;
              text-align: left;
              font-size: 13px;
            }
            
            th {
              background: #f5f5f5;
              color: #d4af37;
              font-weight: 600;
            }
            
            ul {
              margin: 12px 0;
              padding-left: 20px;
            }
            
            li {
              margin-bottom: 6px;
              font-size: 14px;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-family: 'Inter', sans-serif;
              font-size: 11px;
              color: #888;
            }
            
            @media print {
              body { padding: 20px; }
              .period-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${kundli?.name ? `${kundli.name}'s` : 'Your'} 2026 Cosmic Brief</h1>
            <p>
              ${(() => {
                const [year, month, day] = (kundli?.birth_date || '').split('-').map(Number);
                return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              })()}
              ${kundli?.birth_time ? ` • ${(() => {
                const [hours, minutes] = kundli.birth_time.split(':').map(Number);
                const period = hours >= 12 ? 'PM' : 'AM';
                const hour12 = hours % 12 || 12;
                return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
              })()}` : ''}
              • ${kundli?.birth_place.split(',')[0].trim()}
            </p>
          </div>
          ${forecastContent?.innerHTML || ''}
          <div class="footer">
            Generated by Cosmic Brief • cosmicbrief.com
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  // Check if we have enough data for the birth chart
  const hasBirthChartData = kundli &&
    kundli.planetary_positions &&
    kundli.planetary_positions.length > 0 &&
    kundli.ascendant_sign &&
    kundli.ascendant_sign_id &&
    kundli.nakshatra;

  const birthChartData = hasBirthChartData ? {
    nakshatra: kundli.nakshatra!,
    nakshatra_id: kundli.nakshatra_id || 1,
    nakshatra_pada: kundli.nakshatra_pada || 1,
    nakshatra_lord: kundli.nakshatra_lord || '',
    moon_sign: kundli.moon_sign || '',
    moon_sign_id: kundli.moon_sign_id || 1,
    moon_sign_lord: kundli.moon_sign_lord || '',
    sun_sign: kundli.sun_sign || '',
    sun_sign_id: kundli.sun_sign_id || 1,
    sun_sign_lord: kundli.sun_sign_lord || '',
    ascendant_sign: kundli.ascendant_sign!,
    ascendant_sign_id: kundli.ascendant_sign_id!,
    ascendant_sign_lord: kundli.ascendant_sign_lord || '',
    planetary_positions: kundli.planetary_positions!,
    deity: kundli.deity || undefined,
    animal_sign: kundli.animal_sign || undefined,
  } : null;

  const renderJsonForecast = (forecast: ForecastJson, isPaid: boolean) => {
    if (!forecast?.sections || !Array.isArray(forecast.sections)) {
      return <p className="text-cream-muted">Unable to render forecast</p>;
    }

    const elements: React.ReactNode[] = [];

    forecast.sections.forEach((section, sIdx) => {
      if (!section?.heading) return;

      // Check if this is the upgrade section in free forecast
      const isUpgradeSection = section.heading.toLowerCase().includes('want to know') ||
                               section.heading.toLowerCase().includes('specifics');

      if (isUpgradeSection && !isPaid) {
        return; // We'll render our own CTA instead
      }

      const sectionId = generateSectionId(section.heading, sIdx);

      elements.push(
        <section
          key={sIdx}
          id={sectionId}
          className="animate-fade-up scroll-mt-32"
          style={{ animationDelay: `${sIdx * 100}ms` }}
        >
          <h2 className="text-2xl font-bold text-gold mb-6 font-display">{section.heading}</h2>

          <div className="space-y-4">
            {section.content?.map((item, iIdx) => renderContentItem(item, iIdx))}
          </div>
        </section>
      );

      // Add birth chart after the first section (Your Natural Orientation) - only for free forecast
      if (sIdx === 0 && birthChartData && !isPaid) {
        elements.push(
          <section
            key="birth-chart"
            id="birth-chart"
            className="animate-fade-up scroll-mt-32 py-8"
            style={{ animationDelay: '150ms' }}
          >
            <h2 className="text-2xl font-bold text-gold mb-6 font-display text-center">Your Birth Chart</h2>
            <BirthChartWheel chartData={birthChartData} hideDetailCards />
          </section>
        );
      }
    });

    return <div className="space-y-10">{elements}</div>;
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
              <span className="text-gold text-base font-medium">{item.date_range}</span>
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
                  {Array.isArray(item.key_actions) ? (
                    <ul className="text-sm space-y-2">
                      {item.key_actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gold mt-1">•</span>
                          <span>{renderMarkdownText(action)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">{renderMarkdownText(item.key_actions)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'transitions_table':
        // Sort transitions chronologically
        const sortedTransitions = [...(item.transitions || [])].sort((a, b) => {
          const parseDate = (dateStr: string) => {
            const months: Record<string, number> = {
              'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
              'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            const match = dateStr.toLowerCase().match(/([a-z]+)\s*(\d+)/);
            if (match) {
              const month = months[match[1].substring(0, 3)] ?? 0;
              const day = parseInt(match[2], 10);
              return new Date(2026, month, day).getTime();
            }
            return 0;
          };
          return parseDate(a.date) - parseDate(b.date);
        });

        return (
          <div key={key} className="overflow-hidden rounded-xl border border-border/30">
            <table className="w-full">
              <thead className="bg-midnight/60">
                <tr>
                  <th className="px-4 py-3 text-left text-base font-medium text-gold">Date</th>
                  <th className="px-4 py-3 text-left text-base font-medium text-gold">Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {sortedTransitions.map((t, i) => (
                  <tr key={i} className="bg-midnight/20">
                    <td className="px-4 py-3 text-cream font-medium whitespace-nowrap text-base">{t.date}</td>
                    <td className="px-4 py-3 text-cream-muted text-base">{renderMarkdownText(t.significance)}</td>
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

  // Show loading while fetching data
  if (loading) {
    return <LoadingSpinner />;
  }

  // If kundli exists but no forecast, show message and redirect to input
  if (kundli && !kundli.free_vedic_forecast && !kundli.paid_vedic_forecast) {
    return (
      <div className="relative min-h-screen bg-celestial">
        <StarField />
        <div className="relative z-10 container mx-auto px-4 py-12 text-center">
          <p className="text-cream-muted mb-4">No forecast found. Let's generate one for you.</p>
          <Button onClick={() => navigate('/vedic/input')}>Generate Forecast</Button>
        </div>
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


  return (
    <div className="relative min-h-screen bg-celestial">
      <StarField />

      <header className="relative z-20 border-b border-border/30 bg-midnight/80 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-end">
          <div className="flex items-center gap-2">
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
                <h4 className="text-gold font-medium mb-3 text-sm">Vedic Profile</h4>
                <div className="space-y-2.5 text-sm">
                  {kundli.ascendant_sign && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Ascendant</span>
                      <span className="text-cream font-medium">{getWesternName(kundli.ascendant_sign)}</span>
                    </div>
                  )}
                  {kundli.moon_sign && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Moon Sign</span>
                      <span className="text-cream font-medium">{getWesternName(kundli.moon_sign)}</span>
                    </div>
                  )}
                  {kundli.sun_sign && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Sun Sign</span>
                      <span className="text-cream font-medium">{getWesternName(kundli.sun_sign)}</span>
                    </div>
                  )}
                  {kundli.nakshatra && (
                    <div className="flex justify-between">
                      <span className="text-cream-muted">Nakshatra</span>
                      <span className="text-cream font-medium">{kundli.nakshatra}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-gold border-gold/30 hover:bg-gold/10"
                      onClick={() => navigate(`/vedic/profile?id=${kundliId}`)}
                    >
                      View Profile
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-cream-muted hover:text-cream hover:bg-gold/10"
                    onClick={handleNewBirthDetails}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New birth details
                  </Button>
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
            {kundli.name ? `${kundli.name}'s Personalized` : 'Your Personalized'}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
            {isPaidView && hasPaidForecast ? 'Detailed 2026 Cosmic Brief' : '2026 Cosmic Brief'}
          </h1>
          <p className="text-cream-muted font-sans text-sm">
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
            {' · '}{kundli.birth_place.split(',')[0].trim()}
          </p>
          
        </div>

        {forecastToShow ? (
          <div className="max-w-3xl mx-auto">
            {/* Table of Contents - hide toggle for shared views, just show section nav */}
            {parsedForecast && sectionsWithIds.length > 0 && (
              <ForecastTableOfContents
                sections={sectionsWithIds}
                hasPaidForecast={hasPaidForecast}
                isPaidView={isPaidView}
                onViewChange={handleViewChange}
                isSharedView={!isOwner && isPaidView && hasPaidForecast}
              />
            )}

            <div className="bg-midnight/40 md:border md:border-border/30 rounded-none md:rounded-2xl p-4 md:p-10 backdrop-blur-sm -mx-4 md:mx-0">
              {parsedForecast ? (
                renderJsonForecast(parsedForecast, isPaidView && hasPaidForecast)
              ) : (
                <div className="prose prose-invert max-w-none">
                  {renderMarkdownForecast(forecastToShow)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto text-center py-12">
            <p className="text-cream-muted mb-4">
              {isPaidView
                ? "Your paid forecast is still being generated. Please refresh in a moment."
                : "No forecast available yet."}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mr-2">
              Refresh
            </Button>
            {isPaidView && kundli?.free_vedic_forecast && (
              <Button onClick={() => handleViewChange(false)} variant="ghost">
                View Free Forecast
              </Button>
            )}
            {isPaidView && (
              <p className="text-cream-muted/60 text-sm mt-6">
                If your forecast doesn't appear after a few minutes, please contact{' '}
                <a href="mailto:support@cosmicbrief.com" className="text-gold hover:underline">
                  support@cosmicbrief.com
                </a>
              </p>
            )}
          </div>
        )}

        {/* Share button for free forecast */}
        {forecastToShow && !hasPaidForecast && isOwner && (
          <div className="max-w-3xl mx-auto flex justify-center mt-8">
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 font-sans"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share my Cosmic Brief
            </Button>
          </div>
        )}

        {/* Upgrade CTA - Only show on free forecast for owners */}
        {forecastToShow && !hasPaidForecast && isOwner && (
          <div className="max-w-3xl mx-auto">
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
                    "Pivotal themes and action windows"
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
                      <span>Unlock Full Cosmic Brief — $19</span>
                    </span>
                  )}
                </Button>

                <p className="text-cream-muted/60 text-sm mt-4">
                  One-time payment • Instant access
                </p>
              </div>
          </div>
        )}

        {/* Share and Download CTAs - Show for paid forecasts */}
        {forecastToShow && hasPaidForecast && isOwner && (
          <div className="max-w-3xl mx-auto">
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              {kundli.shareable_link && (
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(kundli.shareable_link!);
                    toast.success('Link copied to clipboard!', {
                      description: 'Share your Cosmic Brief with friends and family.',
                    });
                  }}
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 font-sans"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share my Cosmic Brief
                </Button>
              )}
              <Button
                onClick={() => handleDownloadPdf()}
                variant="outline"
                className="border-gold/50 text-gold hover:bg-gold/10 font-sans"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as PDF
              </Button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default VedicResultsPage;
