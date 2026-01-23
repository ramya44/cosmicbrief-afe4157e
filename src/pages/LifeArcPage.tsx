import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { BirthDetailsForm, BirthFormData } from '@/components/BirthDetailsForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSessionKundli } from '@/hooks/useSessionKundli';
import { useForecastStore } from '@/store/forecastStore';
import { useVedicChart, getBirthDateTimeUtc } from '@/hooks/useVedicChart';
import { getDeviceId } from '@/lib/deviceId';
import {
  Loader2,
  Sparkles,
  Heart,
  Baby,
  Briefcase,
  TrendingUp,
  Plane,
  Home,
  Flower2,
  Activity,
  GraduationCap,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FlowState = 'input' | 'loading' | 'results';

interface LifeEventWindow {
  category: string;
  displayName: string;
  specific_event: string;
  period: string;
  maha_dasha: string;
  antar_dasha: string;
  start_date: string;
  end_date: string;
  age_at_start: number;
  age_at_end?: number;
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
  probability: number;
  nature: 'positive' | 'challenging' | 'transformative' | 'mixed';
  reasons: string[];
  guidance: string;
  rating: number;
}

interface LifeArcReport {
  type: string;
  user_age: number;
  birth_date: string;
  past: {
    education_career: LifeEventWindow[];
    relationship_windows: LifeEventWindow[];
    children_windows: LifeEventWindow[];
    major_transformations: LifeEventWindow[];
  };
  future: {
    marriage_windows: LifeEventWindow[];
    children_windows: LifeEventWindow[];
    wealth_windows: LifeEventWindow[];
    career_breakthrough_windows: LifeEventWindow[];
    travel_relocation_windows: LifeEventWindow[];
    home_property_windows: LifeEventWindow[];
    spirituality_windows: LifeEventWindow[];
    health_focus_windows: LifeEventWindow[];
  };
  current_period: {
    maha_dasha: string;
    antar_dasha: string;
    period_theme: string;
    active_areas: string[];
  };
  summary: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  marriage: <Heart className="w-5 h-5" />,
  children: <Baby className="w-5 h-5" />,
  career: <Briefcase className="w-5 h-5" />,
  wealth: <TrendingUp className="w-5 h-5" />,
  travel_foreign: <Plane className="w-5 h-5" />,
  home_property: <Home className="w-5 h-5" />,
  spirituality: <Flower2 className="w-5 h-5" />,
  health: <Activity className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  transformation: <Sparkles className="w-5 h-5" />,
};

const intensityColors: Record<string, string> = {
  low: 'bg-cream-muted/20 text-cream-muted',
  moderate: 'bg-blue-500/20 text-blue-300',
  high: 'bg-gold/20 text-gold',
  very_high: 'bg-green-500/20 text-green-300',
};

const natureColors: Record<string, string> = {
  positive: 'text-green-400',
  challenging: 'text-orange-400',
  transformative: 'text-purple-400',
  mixed: 'text-blue-400',
};

const EventCard = ({ event, isPast = false }: { event: LifeEventWindow; isPast?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const icon = categoryIcons[event.category] || <Sparkles className="w-5 h-5" />;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={cn('p-2 rounded-lg', intensityColors[event.intensity])}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium', natureColors[event.nature])}>
              {event.nature.charAt(0).toUpperCase() + event.nature.slice(1)}
            </span>
            <span className="text-xs text-cream-muted">
              {isPast
                ? `Age ${event.age_at_start}${event.age_at_end ? `-${event.age_at_end}` : ''}`
                : `Age ${event.age_at_start}`}
            </span>
          </div>
          <p className="text-cream text-sm leading-relaxed">{event.specific_event}</p>
          <p className="text-cream-muted text-xs mt-1">
            {formatDate(event.start_date)} - {formatDate(event.end_date)} ({event.period})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-gold text-sm font-medium">{event.probability}%</div>
            <div className="text-cream-muted text-xs">match</div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-cream-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cream-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30">
          <div className="mt-3 space-y-3">
            {event.reasons.length > 0 && (
              <div>
                <p className="text-xs text-gold mb-1">Why this window:</p>
                <ul className="text-xs text-cream-muted space-y-1">
                  {event.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gold">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!isPast && event.guidance && (
              <div>
                <p className="text-xs text-gold mb-1">Guidance:</p>
                <p className="text-xs text-cream-muted">{event.guidance}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const WindowSection = ({
  title,
  icon,
  windows,
  isPast = false,
}: {
  title: string;
  icon: React.ReactNode;
  windows: LifeEventWindow[];
  isPast?: boolean;
  emptyMessage: string;
}) => {
  if (windows.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-gold">{icon}</div>
        <h3 className="font-display text-lg text-cream">{title}</h3>
        <span className="text-xs text-cream-muted bg-white/10 px-2 py-0.5 rounded-full">
          {windows.length} window{windows.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {windows.map((window, i) => (
          <EventCard key={i} event={window} isPast={isPast} />
        ))}
      </div>
    </div>
  );
};

const LifeArcPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasKundli: authHasKundli, kundli, isLoading: authLoading } = useAuth();
  const { hasKundli: sessionHasKundli, birthData: sessionBirthData } = useSessionKundli();
  const { setKundliId, setKundliData, setBirthData } = useForecastStore();
  const { calculate } = useVedicChart();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [report, setReport] = useState<LifeArcReport | null>(null);
  const [activeTab, setActiveTab] = useState<'past' | 'future'>('future');
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);

  // Determine if we have usable kundli data (either from auth or session)
  const hasUsableKundli = (isAuthenticated && authHasKundli && kundli) ||
    (!isAuthenticated && sessionHasKundli && sessionBirthData);

  // Get the effective birth data
  const effectiveBirthDate = isAuthenticated && authHasKundli && kundli
    ? kundli.birth_date
    : sessionBirthData?.birthDate;
  const effectiveBirthTime = isAuthenticated && authHasKundli && kundli
    ? kundli.birth_time
    : sessionBirthData?.birthTime;
  const effectiveBirthPlace = isAuthenticated && authHasKundli && kundli
    ? kundli.birth_place
    : sessionBirthData?.birthPlace;
  const effectiveLatitude = isAuthenticated && authHasKundli && kundli
    ? kundli.latitude
    : sessionBirthData?.lat;
  const effectiveLongitude = isAuthenticated && authHasKundli && kundli
    ? kundli.longitude
    : sessionBirthData?.lon;

  const handleSubmit = async (data: BirthFormData) => {
    setFlowState('loading');

    try {
      // Get UTC datetime
      const birthDateTimeUtc = await getBirthDateTimeUtc({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Calculate kundli data
      const kundliData = await calculate({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // Save kundli to database for cross-page sharing
      const deviceId = getDeviceId();
      const { data: saveResult } = await supabase.functions.invoke('save-birth-chart', {
        body: {
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          birth_place: data.birthPlace,
          birth_time_utc: birthDateTimeUtc,
          latitude: data.latitude,
          longitude: data.longitude,
          email: data.email,
          name: data.name || null,
          device_id: deviceId,
          kundli_data: kundliData,
        },
      });

      // Save to Zustand store for cross-page sharing
      if (saveResult?.id) {
        setKundliId(saveResult.id);
        setKundliData(kundliData);
        setBirthData({
          birthDate: data.birthDate,
          birthTime: data.birthTime,
          birthPlace: data.birthPlace,
          name: data.name,
          email: data.email,
          lat: data.latitude,
          lon: data.longitude,
          birthDateTimeUtc,
        });
      }

      // Call get-life-arc
      const { data: responseData, error } = await supabase.functions.invoke('get-life-arc', {
        body: {
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          latitude: data.latitude,
          longitude: data.longitude,
          years_ahead: 15,
          report_type: 'life_arc_report',
        },
      });

      if (error || responseData?.error) {
        throw new Error(error?.message || responseData?.error || 'Failed to generate life arc');
      }

      setReport(responseData as LifeArcReport);
      setFlowState('results');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setFlowState('input');
    }
  };

  const handleStartOver = () => {
    setFlowState('input');
    setReport(null);
  };

  // Quick generate for users with kundli data
  const handleQuickGenerate = async () => {
    if (!hasUsableKundli || !effectiveBirthDate || !effectiveBirthTime ||
        effectiveLatitude === undefined || effectiveLongitude === undefined) {
      toast.error('Birth chart data not found. Please try again.');
      return;
    }

    setIsQuickGenerating(true);
    toast.info('Generating your Life Arc...');

    try {
      const { data, error } = await supabase.functions.invoke('get-life-arc', {
        body: {
          birth_date: effectiveBirthDate,
          birth_time: effectiveBirthTime,
          latitude: effectiveLatitude,
          longitude: effectiveLongitude,
          years_ahead: 15,
          report_type: 'life_arc_report',
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate life arc');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setReport(data as LifeArcReport);
      setFlowState('results');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsQuickGenerating(false);
    }
  };

  // Results view
  if (flowState === 'results' && report) {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 min-h-screen px-4 py-8 md:py-16">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 animate-fade-up">
              <button
                onClick={handleStartOver}
                className="inline-flex items-center gap-2 text-cream-muted hover:text-cream mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Start over
              </button>

              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6 glow-gold">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>

              <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Your Life Arc</h1>

              <p className="text-cream-muted max-w-xl mx-auto">{report.summary}</p>
            </div>

            {/* Current Period Card */}
            <div
              className="rounded-xl border border-gold/30 bg-gold/5 backdrop-blur-sm p-6 mb-8 animate-fade-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-gold font-medium">Current Period</span>
              </div>
              <p className="text-cream mb-2">
                <span className="text-gold">{report.current_period.maha_dasha}</span> Maha Dasha,{' '}
                <span className="text-gold">{report.current_period.antar_dasha}</span> Antar Dasha
              </p>
              <p className="text-cream-muted text-sm mb-3">{report.current_period.period_theme}</p>
              {report.current_period.active_areas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {report.current_period.active_areas.map((area, i) => (
                    <span key={i} className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
              <button
                onClick={() => setActiveTab('future')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all',
                  activeTab === 'future'
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-white/5 text-cream-muted border border-border/30 hover:bg-white/10'
                )}
              >
                Future Windows
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all',
                  activeTab === 'past'
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-white/5 text-cream-muted border border-border/30 hover:bg-white/10'
                )}
              >
                Past (Validation)
              </button>
            </div>

            {/* Content */}
            <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
              {activeTab === 'future' ? (
                <>
                  <WindowSection
                    title="Marriage & Relationships"
                    icon={<Heart className="w-5 h-5" />}
                    windows={report.future.marriage_windows}
                    emptyMessage="No strong marriage windows detected in the next 15 years"
                  />
                  <WindowSection
                    title="Children & Family"
                    icon={<Baby className="w-5 h-5" />}
                    windows={report.future.children_windows}
                    emptyMessage="No strong children windows detected"
                  />
                  <WindowSection
                    title="Wealth Accumulation"
                    icon={<TrendingUp className="w-5 h-5" />}
                    windows={report.future.wealth_windows}
                    emptyMessage="No strong wealth windows detected"
                  />
                  <WindowSection
                    title="Career Breakthroughs"
                    icon={<Briefcase className="w-5 h-5" />}
                    windows={report.future.career_breakthrough_windows}
                    emptyMessage="No strong career windows detected"
                  />
                  <WindowSection
                    title="Travel & Relocation"
                    icon={<Plane className="w-5 h-5" />}
                    windows={report.future.travel_relocation_windows}
                    emptyMessage="No major travel windows detected"
                  />
                  <WindowSection
                    title="Home & Property"
                    icon={<Home className="w-5 h-5" />}
                    windows={report.future.home_property_windows}
                    emptyMessage="No strong property windows detected"
                  />
                  <WindowSection
                    title="Spirituality & Growth"
                    icon={<Flower2 className="w-5 h-5" />}
                    windows={report.future.spirituality_windows}
                    emptyMessage="No strong spiritual windows detected"
                  />
                  <WindowSection
                    title="Health Focus Periods"
                    icon={<Activity className="w-5 h-5" />}
                    windows={report.future.health_focus_windows}
                    emptyMessage="No major health focus periods detected"
                  />
                </>
              ) : (
                <>
                  <div className="mb-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-300">
                      These are periods from your past where the planetary alignments indicated significant life events.
                      Compare these with your actual experiences to validate the accuracy of your chart analysis.
                    </p>
                  </div>
                  <WindowSection
                    title="Education & Career"
                    icon={<GraduationCap className="w-5 h-5" />}
                    windows={report.past.education_career}
                    isPast
                    emptyMessage="No significant education/career periods detected"
                  />
                  <WindowSection
                    title="Relationship Windows"
                    icon={<Heart className="w-5 h-5" />}
                    windows={report.past.relationship_windows}
                    isPast
                    emptyMessage="No significant relationship windows detected"
                  />
                  <WindowSection
                    title="Children Windows"
                    icon={<Baby className="w-5 h-5" />}
                    windows={report.past.children_windows}
                    isPast
                    emptyMessage="No significant children windows detected"
                  />
                  <WindowSection
                    title="Major Transformations"
                    icon={<Sparkles className="w-5 h-5" />}
                    windows={report.past.major_transformations}
                    isPast
                    emptyMessage="No major transformations detected"
                  />
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
              <Button variant="outline" onClick={() => navigate('/')} className="font-[Inter]">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth loading view
  if (authLoading) {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-6" />
            <h2 className="font-display text-2xl text-cream mb-2">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Generation loading view
  if (flowState === 'loading') {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-6" />
            <h2 className="font-display text-2xl text-cream mb-2">Analyzing Your Life Arc</h2>
            <p className="text-cream-muted">Calculating planetary windows across your lifetime...</p>
          </div>
        </div>
      </div>
    );
  }

  // User with kundli data - simplified view
  if (hasUsableKundli && effectiveBirthDate && effectiveBirthTime && effectiveBirthPlace) {
    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          <div className="w-full max-w-md text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6 glow-gold">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>

            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Life Arc</h1>

            <p className="text-cream-muted mb-8">
              Discover your optimal windows for marriage, children, career breakthroughs, and major life events based on
              your birth chart.
            </p>

            <div className="p-6 rounded-xl bg-midnight/50 border border-gold/20 mb-8 text-left">
              <p className="text-cream text-sm mb-3">Your birth details:</p>
              <div className="space-y-1 text-cream-muted text-sm">
                <p>
                  <span className="text-gold">Date:</span> {effectiveBirthDate}
                </p>
                <p>
                  <span className="text-gold">Time:</span> {effectiveBirthTime}
                </p>
                <p>
                  <span className="text-gold">Place:</span> {effectiveBirthPlace}
                </p>
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full mb-4"
              onClick={handleQuickGenerate}
              disabled={isQuickGenerating}
            >
              {isQuickGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Life Arc
                </>
              )}
            </Button>

            <Button variant="ghost" onClick={() => navigate('/')} className="text-cream-muted hover:text-cream">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Input form view (for non-logged-in users)
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
      <StarField />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6 glow-gold">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-3">Life Arc</h1>
            <p className="text-cream-muted">
              Discover your optimal windows for marriage, children, career breakthroughs, and major life events
            </p>
          </div>

          {/* Form */}
          <BirthDetailsForm
            showName
            showEmail
            requireAge18={false}
            onSubmit={handleSubmit}
            isSubmitting={flowState === 'loading'}
            submitButtonText="Generate My Life Arc"
            submitButtonIcon={<Sparkles className="w-5 h-5 ml-2" />}
          />

          {/* Back link */}
          <div
            className="text-center mt-8 animate-fade-up"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            <Button variant="ghost" onClick={() => navigate('/')} className="text-cream-muted hover:text-cream">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeArcPage;
