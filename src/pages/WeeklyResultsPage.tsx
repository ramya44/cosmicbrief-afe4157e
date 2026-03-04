import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { useForecastStore } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles,
  Loader2,
  Calendar,
  CalendarPlus,
  ChevronRight,
  Crown,
  RefreshCw,
  // Domain icons
  Swords,        // Power & Position
  TrendingUp,    // Money & Risk
  Heart,         // Love & Intimacy
  Users,         // Allies & Influence
  Lightbulb,     // Focus & Creation
  Eye,           // Inner Signal
} from 'lucide-react';
import { toast } from 'sonner';

// Generate ICS file content for a calendar event
function generateICSContent(
  title: string,
  date: string,
  description: string,
  year: number
): string {
  // Parse date like "Feb 19" into a proper date
  const months: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };

  const [monthStr, dayStr] = date.split(' ');
  const month = months[monthStr] || '01';
  const day = dayStr.padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Create unique ID
  const uid = `${dateStr}-${Date.now()}@cosmicbrief.com`;

  // Escape special characters in description
  const escapedDesc = description
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cosmic Brief//Weekly Forecast//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
SUMMARY:${title}
DESCRIPTION:${escapedDesc}
END:VEVENT
END:VCALENDAR`;
}

// Download ICS file
function downloadCalendarEvent(
  title: string,
  date: string,
  description: string,
  weekStart: string
) {
  // Get year from weekStart (format: "2026-02-17")
  const year = parseInt(weekStart.split('-')[0]) || new Date().getFullYear();

  const icsContent = generateICSContent(title, date, description, year);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success('Calendar event downloaded');
}

interface DomainContent {
  best_days: string[];
  signal: string;
  context: string;
  do_this: string[];
  avoid: string;
}

interface WeeklyForecastContent {
  week_focus: {
    headline: string;
    explanation: string;
  };
  power_position: DomainContent;
  money_risk: DomainContent;
  love_intimacy: DomainContent;
  allies_influence: DomainContent;
  focus_creation: DomainContent;
  inner_signal: DomainContent;
  week_avoid: string[];
}

const SignalBadge = ({ signal }: { signal: string }) => {
  // Signal styles organized by domain
  const colors: Record<string, string> = {
    // Power & Position - amber/orange tones
    'Authority Window': 'bg-amber-500/30 text-amber-300 border-amber-400/50',
    'Bold Visibility': 'bg-orange-500/30 text-orange-300 border-orange-400/50',
    'Strategic Leverage': 'bg-amber-600/30 text-amber-200 border-amber-500/50',
    'Boundary Setting': 'bg-red-500/30 text-red-300 border-red-400/50',
    'Leadership Opening': 'bg-yellow-500/30 text-yellow-300 border-yellow-400/50',
    // Money & Risk - green tones
    'Precision Timing': 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50',
    'Strategic Bet': 'bg-green-500/30 text-green-300 border-green-400/50',
    'Negotiation Edge': 'bg-teal-500/30 text-teal-300 border-teal-400/50',
    'Capital Move': 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50',
    'Contract Window': 'bg-lime-500/30 text-lime-300 border-lime-400/50',
    // Love & Intimacy - pink/rose tones
    'Deepening Window': 'bg-pink-500/30 text-pink-300 border-pink-400/50',
    'Repair Opening': 'bg-rose-500/30 text-rose-300 border-rose-400/50',
    'Attraction Surge': 'bg-fuchsia-500/30 text-fuchsia-300 border-fuchsia-400/50',
    'Vulnerability Edge': 'bg-pink-600/30 text-pink-200 border-pink-500/50',
    'Emotional Bridge': 'bg-rose-600/30 text-rose-200 border-rose-500/50',
    // Allies & Influence - blue tones
    'Alliance Building': 'bg-blue-500/30 text-blue-300 border-blue-400/50',
    'Strategic Introduction': 'bg-sky-500/30 text-sky-300 border-sky-400/50',
    'Circle Expansion': 'bg-cyan-500/30 text-cyan-300 border-cyan-400/50',
    'Group Momentum': 'bg-blue-600/30 text-blue-200 border-blue-500/50',
    'Visibility Boost': 'bg-indigo-500/30 text-indigo-300 border-indigo-400/50',
    // Focus & Creation - purple tones
    'Deep Work Window': 'bg-purple-500/30 text-purple-300 border-purple-400/50',
    'Creative Surge': 'bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-500/50',
    'Strategic Clarity': 'bg-violet-500/30 text-violet-300 border-violet-400/50',
    'Output Mode': 'bg-purple-600/30 text-purple-200 border-purple-500/50',
    'Mental Sharpness': 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50',
    // Inner Signal - violet/slate tones
    'Intuition Peak': 'bg-violet-600/30 text-violet-200 border-violet-500/50',
    'Processing Time': 'bg-slate-500/30 text-slate-300 border-slate-400/50',
    'Release Window': 'bg-gray-500/30 text-gray-300 border-gray-400/50',
    'Reflection Mode': 'bg-zinc-500/30 text-zinc-300 border-zinc-400/50',
    'Inner Knowing': 'bg-violet-500/30 text-violet-300 border-violet-400/50',
  };

  const defaultStyle = 'bg-gold/20 text-gold border-gold/40';

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${colors[signal] || defaultStyle}`}>
      {signal}
    </span>
  );
};

// Convert day name (Mon, Tue, etc.) to actual date based on week start
function getDayDate(dayName: string, weekStart: string): { dateStr: string; fullDate: string } {
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };

  const startDate = new Date(weekStart);
  const startDayOfWeek = startDate.getDay();
  const targetDayOfWeek = dayMap[dayName] ?? 0;

  // Calculate days to add from week start
  let daysToAdd = targetDayOfWeek - startDayOfWeek;
  if (daysToAdd < 0) daysToAdd += 7;

  const targetDate = new Date(startDate);
  targetDate.setDate(targetDate.getDate() + daysToAdd);

  const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fullDate = targetDate.toISOString().split('T')[0];

  return { dateStr, fullDate };
}

// Editorial domain section component
const DomainSection = ({
  title,
  icon: Icon,
  iconColor,
  domain,
  weekStart,
  calendarPrefix,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  domain: DomainContent | undefined;
  weekStart: string;
  calendarPrefix: string;
}) => {
  if (!domain) return null;

  // Convert day names to dates
  const daysWithDates = domain.best_days?.map(day => {
    const { dateStr } = getDayDate(day, weekStart);
    return `${day} (${dateStr})`;
  }) || [];

  const bestDaysText = daysWithDates.length > 1
    ? `Best Days: ${daysWithDates.join(', ')}`
    : `Best Day: ${daysWithDates[0] || 'TBD'}`;

  // Get the first best day's date for calendar
  const firstDayDate = domain.best_days?.[0]
    ? getDayDate(domain.best_days[0], weekStart).dateStr
    : 'Mon';

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-cream text-xl font-semibold flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </h2>
        <button
          onClick={() => downloadCalendarEvent(
            `${calendarPrefix}: ${domain.signal}`,
            firstDayDate,
            `${domain.context}\n\nDo this:\n${domain.do_this?.join('\n')}\n\nAvoid: ${domain.avoid}`,
            weekStart
          )}
          className="p-1.5 rounded hover:bg-gold/10 transition-colors group flex items-center gap-1 text-cream/40 hover:text-gold text-xs"
          title="Add to calendar"
        >
          <CalendarPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add to Cal</span>
        </button>
      </div>

      {/* Best Days + Signal */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-gold font-medium text-sm">{bestDaysText}</span>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gold/20 text-gold border border-gold/30">
          {domain.signal}
        </span>
      </div>

      {/* Context */}
      <p className="text-cream/80 leading-relaxed mb-4">{domain.context}</p>

      {/* Do This */}
      <div className="mb-3">
        <p className="text-cream/50 text-sm font-medium mb-2">Do this:</p>
        <ul className="space-y-1.5">
          {domain.do_this?.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <span className="text-cream/90 text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avoid */}
      <p className="text-cream/50 text-sm">
        <span className="font-medium">Avoid:</span>{' '}
        <span className="text-cream/70">{domain.avoid}</span>
      </p>

      {/* Divider */}
      <div className="border-b border-border/30 mt-8" />
    </div>
  );
};

const WeeklyResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kundliId = searchParams.get('id');

  const { weeklyForecast, setWeeklyForecast, weeklySubscription } = useForecastStore();
  const [isLoading, setIsLoading] = useState(!weeklyForecast);
  const [forecast, setForecast] = useState<WeeklyForecastContent | null>(null);
  const [weekDates, setWeekDates] = useState({ start: '', end: '' });
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!kundliId) {
      navigate('/weekly/input');
      return;
    }

    // If we already have the forecast in store, use it
    if (weeklyForecast?.forecast) {
      setForecast(weeklyForecast.forecast as WeeklyForecastContent);
      setWeekDates({
        start: weeklyForecast.week_start,
        end: weeklyForecast.week_end,
      });
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch from database
    const fetchForecast = async () => {
      try {
        const { data, error } = await supabase
          .from('personalized_weekly_forecasts')
          .select('*')
          .eq('kundli_id', kundliId)
          .order('week_start', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) {
          // No forecast found, generate one
          const { data: genResult, error: genError } = await supabase.functions.invoke(
            'generate-weekly-forecast',
            { body: { kundli_id: kundliId } }
          );

          if (genError) {
            throw new Error(genError.message);
          }

          if (genResult?.error) {
            throw new Error(genResult.error);
          }

          setForecast(genResult.forecast as WeeklyForecastContent);
          setWeekDates({
            start: genResult.week_start,
            end: genResult.week_end,
          });
          setWeeklyForecast({
            forecast: genResult.forecast,
            week_start: genResult.week_start,
            week_end: genResult.week_end,
            dasha_summary: genResult.dasha_summary,
          });
        } else {
          setForecast(data.forecast_content as WeeklyForecastContent);
          setWeekDates({
            start: data.week_start,
            end: data.week_end,
          });
          setWeeklyForecast({
            forecast: data.forecast_content,
            week_start: data.week_start,
            week_end: data.week_end,
            dasha_summary: null,
          });
        }
      } catch (error) {
        toast.error('Failed to load forecast');
        navigate('/weekly/input');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [kundliId, weeklyForecast, navigate, setWeeklyForecast]);

  const handleSubscribe = async () => {
    if (!kundliId) return;

    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-weekly-subscription', {
        body: { kundli_id: kundliId },
      });

      if (error) throw new Error(error.message);

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      toast.error('Failed to start subscription. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleStartOver = () => {
    setWeeklyForecast(null);
    navigate('/weekly/input');
  };

  const formatWeekHeader = () => {
    if (!weekDates.start || !weekDates.end) return 'Your Week Ahead';

    const startDate = new Date(weekDates.start);
    const endDate = new Date(weekDates.end);

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', formatOptions);
    const endStr = endDate.toLocaleDateString('en-US', formatOptions);

    return `Your Week: ${startStr} – ${endStr}`;
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
          <p className="text-cream-muted">Loading your weekly forecast...</p>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <p className="text-cream-muted mb-4">No forecast available</p>
          <Button variant="hero" onClick={() => navigate('/weekly/input')}>
            Generate New Forecast
          </Button>
        </div>
      </div>
    );
  }

  const isTrial = weeklySubscription?.status === 'trial';

  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden">
      <StarField />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-gold" />
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-cream mb-2">{formatWeekHeader()}</h1>
          {isTrial && (
            <p className="text-gold text-sm">
              Free trial · Subscribe for weekly forecasts
            </p>
          )}
          <button
            onClick={handleStartOver}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-cream/50 hover:text-cream transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Enter different birth details
          </button>
        </div>

        {/* Week Focus */}
        <div className="bg-secondary/50 border border-gold/30 rounded-xl p-6 mb-10">
          <p className="text-cream/50 text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            This Week's Focus
          </p>
          <h2 className="text-gold text-2xl font-display mb-3">
            {forecast.week_focus?.headline || 'Your Week Ahead'}
          </h2>
          <p className="text-cream/90 leading-relaxed">
            {forecast.week_focus?.explanation}
          </p>
        </div>

        {/* 6 Life Domains */}
        <DomainSection
          title="Power & Position"
          icon={Swords}
          iconColor="text-amber-400"
          domain={forecast.power_position}
          weekStart={weekDates.start}
          calendarPrefix="Power"
        />

        <DomainSection
          title="Money & Risk"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          domain={forecast.money_risk}
          weekStart={weekDates.start}
          calendarPrefix="Money"
        />

        <DomainSection
          title="Love & Intimacy"
          icon={Heart}
          iconColor="text-pink-400"
          domain={forecast.love_intimacy}
          weekStart={weekDates.start}
          calendarPrefix="Love"
        />

        <DomainSection
          title="Allies & Influence"
          icon={Users}
          iconColor="text-blue-400"
          domain={forecast.allies_influence}
          weekStart={weekDates.start}
          calendarPrefix="Allies"
        />

        <DomainSection
          title="Focus & Creation"
          icon={Lightbulb}
          iconColor="text-purple-400"
          domain={forecast.focus_creation}
          weekStart={weekDates.start}
          calendarPrefix="Focus"
        />

        <DomainSection
          title="Inner Signal"
          icon={Eye}
          iconColor="text-violet-400"
          domain={forecast.inner_signal}
          weekStart={weekDates.start}
          calendarPrefix="Inner"
        />

        {/* What to Avoid This Week */}
        {forecast.week_avoid && forecast.week_avoid.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-orange-400 text-lg font-medium mb-4">What to Avoid This Week</h2>
            <ul className="space-y-2">
              {forecast.week_avoid.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-cream/80 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Subscription CTA */}
        {isTrial && (
          <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-cream font-medium">Keep the insights coming</h3>
                <p className="text-cream-muted text-sm">Get your weekly forecast every Sunday night</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                variant="hero"
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe for $5/month
                    <Sparkles className="w-5 h-5 ml-1" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
          </div>
        )}

        {/* Yearly Forecast Upsell */}
        <div className="text-center border-t border-border/30 pt-8">
          <p className="text-cream-muted mb-4">Want the bigger picture?</p>
          <Button
            variant="outline"
            onClick={() => navigate('/2026')}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            Get Your 2026 Yearly Forecast
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyResultsPage;
