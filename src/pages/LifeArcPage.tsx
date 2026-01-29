import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { BirthDetailsForm, BirthFormData } from '@/components/BirthDetailsForm';
import { LifeArcLoadingScreen } from '@/components/LifeArcLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSessionKundli } from '@/hooks/useSessionKundli';
import { useForecastStore } from '@/store/forecastStore';
import { useVedicChart, getBirthDateTimeUtc } from '@/hooks/useVedicChart';
import { getDeviceId } from '@/lib/deviceId';
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  Calendar,
  Heart,
  Briefcase,
  Baby,
  Wallet,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

type FlowState = 'input' | 'loading' | 'results';

// Types for comprehensive Life Arc response
interface DimensionScore {
  score: number;
  nature: 'positive' | 'challenging' | 'neutral' | 'building';
}

interface TimelineEntry {
  yearRange: string;
  ageRange: string;
  ageStart: number;
  ageEnd: number;
  mahaDasha: string;
  bhukti: string;
  dimensions: {
    career: DimensionScore;
    love: DimensionScore;
    children: DimensionScore;
    wealth: DimensionScore;
    health: DimensionScore;
  };
  astrologicalReason: string;
  sadeSatiActive: boolean;
  yogasActive: string[];
  doshasActive: string[];
  interpretations?: {
    career: string | null;
    love: string | null;
    children: string | null;
    wealth: string | null;
    health: string | null;
  };
}

interface LifeArcPatterns {
  career?: string;
  love?: string;
  children?: string;
  wealth?: string;
  health?: string;
}

interface CurrentPeriod {
  headline: string;
  description: string;
  guidance: string;
}

interface LifeArcData {
  summary: {
    lagnaSign: string;
    moonSign: string;
    birthYear: number;
    currentAge: number;
    overview: string;
  };
  timeline: TimelineEntry[];
  pastTimeline: TimelineEntry[];
  futureTimeline: TimelineEntry[];
  patterns: LifeArcPatterns;
  currentPeriod: CurrentPeriod | null;
}

interface LifeArcResponse {
  status: string;
  data?: LifeArcData;
  birth_details?: {
    birth_date: string;
    birth_time: string;
    latitude: number;
    longitude: number;
  };
  error?: string;
  message?: string;
}

// Get nature color for table cells
const getNatureColor = (nature: string) => {
  switch (nature) {
    case 'positive':
      return 'bg-green-500/10 text-green-300';
    case 'building':
      return 'bg-blue-500/10 text-blue-300';
    case 'challenging':
      return 'bg-amber-500/10 text-amber-300';
    default:
      return 'bg-cream/5 text-cream-muted';
  }
};

// Timeline Row Component
const TimelineRow = ({ entry, isCurrentPeriod }: { entry: TimelineEntry; isCurrentPeriod: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const interp = entry.interpretations;

  return (
    <>
      <tr
        className={`border-b border-border/20 cursor-pointer hover:bg-cream/5 transition-colors ${
          isCurrentPeriod ? 'bg-gold/10' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-2 text-sm">
          <div className="font-medium text-cream">{entry.yearRange}</div>
          <div className="text-xs text-cream-muted">Ages {entry.ageRange}</div>
          {isCurrentPeriod && (
            <span className="text-xs px-1.5 py-0.5 bg-gold/20 text-gold rounded mt-1 inline-block">
              Now
            </span>
          )}
        </td>
        <td className={`py-3 px-2 text-xs ${getNatureColor(entry.dimensions.career.nature)}`}>
          {interp?.career || '—'}
        </td>
        <td className={`py-3 px-2 text-xs ${getNatureColor(entry.dimensions.love.nature)}`}>
          {interp?.love || '—'}
        </td>
        <td className={`py-3 px-2 text-xs ${getNatureColor(entry.dimensions.children.nature)}`}>
          {interp?.children || '—'}
        </td>
        <td className={`py-3 px-2 text-xs ${getNatureColor(entry.dimensions.wealth.nature)}`}>
          {interp?.wealth || '—'}
        </td>
        <td className={`py-3 px-2 text-xs ${getNatureColor(entry.dimensions.health.nature)}`}>
          {interp?.health || '—'}
        </td>
        <td className="py-3 px-2 text-xs text-cream-muted">
          <div className="flex items-center gap-1">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/20 bg-midnight/50">
          <td colSpan={7} className="py-3 px-4">
            <div className="text-xs text-cream-muted space-y-1">
              <p>
                <span className="text-gold">Period:</span> {entry.mahaDasha}-{entry.bhukti}
              </p>
              <p>
                <span className="text-gold">Context:</span> {entry.astrologicalReason}
              </p>
              {entry.sadeSatiActive && (
                <p className="text-amber-400">Sade Sati Active - period of growth through challenges</p>
              )}
              {entry.yogasActive.length > 0 && (
                <p>
                  <span className="text-gold">Active Patterns:</span> {entry.yogasActive.join(', ')}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Patterns Summary Component
const PatternsSummary = ({ patterns }: { patterns: LifeArcPatterns }) => {
  const patternItems = [
    { key: 'career', label: 'Career', icon: Briefcase, value: patterns.career },
    { key: 'love', label: 'Love & Marriage', icon: Heart, value: patterns.love },
    { key: 'children', label: 'Children', icon: Baby, value: patterns.children },
    { key: 'wealth', label: 'Wealth', icon: Wallet, value: patterns.wealth },
    { key: 'health', label: 'Health', icon: Activity, value: patterns.health },
  ];

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 backdrop-blur-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-gold" />
        <h3 className="font-display text-lg text-cream">Life Arc Patterns</h3>
      </div>
      <div className="space-y-3">
        {patternItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
              <div>
                <span className="text-cream font-medium text-sm">{item.label}:</span>
                <span className="text-cream-muted text-sm ml-2">{item.value || 'Pattern analysis pending'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Current Period Component
const CurrentPeriodSection = ({ currentPeriod }: { currentPeriod: CurrentPeriod }) => {
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 backdrop-blur-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gold" />
        <h3 className="font-display text-lg text-cream">Current Life Chapter</h3>
      </div>
      <h4 className="text-xl text-cream font-medium mb-2">{currentPeriod.headline}</h4>
      <p className="text-cream-muted mb-4">{currentPeriod.description}</p>
      {currentPeriod.guidance && (
        <div className="bg-midnight/50 rounded-lg p-4">
          <p className="text-sm text-cream">
            <span className="text-gold font-medium">Guidance: </span>
            {currentPeriod.guidance}
          </p>
        </div>
      )}
    </div>
  );
};

// Main Page Component
export default function LifeArcPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasKundli: authHasKundli, kundli, isLoading: authLoading } = useAuth();
  const { hasKundli: sessionHasKundli, birthData: sessionBirthData } = useSessionKundli();
  const { setKundliId, setKundliData, setBirthData } = useForecastStore();
  const { calculate } = useVedicChart();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [response, setResponse] = useState<LifeArcResponse | null>(null);
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const [showNewDetailsForm, setShowNewDetailsForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'past' | 'future'>('future');

  // Determine if we have usable kundli data
  const hasUsableKundli =
    (isAuthenticated && authHasKundli && kundli) || (!isAuthenticated && sessionHasKundli && sessionBirthData);

  // Get the effective birth data
  const effectiveBirthDate = isAuthenticated && authHasKundli && kundli ? kundli.birth_date : sessionBirthData?.birthDate;
  const effectiveBirthTime = isAuthenticated && authHasKundli && kundli ? kundli.birth_time : sessionBirthData?.birthTime;
  const effectiveBirthPlace =
    isAuthenticated && authHasKundli && kundli ? kundli.birth_place : sessionBirthData?.birthPlace;
  const effectiveLatitude = isAuthenticated && authHasKundli && kundli ? kundli.latitude : sessionBirthData?.lat;
  const effectiveLongitude = isAuthenticated && authHasKundli && kundli ? kundli.longitude : sessionBirthData?.lon;

  const handleSubmit = async (data: BirthFormData) => {
    setFlowState('loading');

    try {
      const birthDateTimeUtc = await getBirthDateTimeUtc({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      const kundliData = await calculate({
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        latitude: data.latitude,
        longitude: data.longitude,
      });

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

      const { data: responseData, error } = await supabase.functions.invoke('get-life-arc', {
        body: {
          birth_date: data.birthDate,
          birth_time: data.birthTime,
          latitude: data.latitude,
          longitude: data.longitude,
          kundli_id: saveResult?.id,
        },
      });

      if (error || responseData?.error) {
        throw new Error(error?.message || responseData?.error || 'Failed to generate life arc');
      }

      setResponse(responseData as LifeArcResponse);
      setFlowState('results');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setFlowState('input');
    }
  };

  const handleStartOver = () => {
    setFlowState('input');
    setResponse(null);
    setShowNewDetailsForm(false);
  };

  const handleChangeDetails = () => {
    setShowNewDetailsForm(true);
  };

  const handleQuickGenerate = async () => {
    if (
      !hasUsableKundli ||
      !effectiveBirthDate ||
      !effectiveBirthTime ||
      effectiveLatitude === undefined ||
      effectiveLongitude === undefined
    ) {
      toast.error('Birth chart data not found. Please try again.');
      return;
    }

    setFlowState('loading');
    setIsQuickGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-life-arc', {
        body: {
          birth_date: effectiveBirthDate,
          birth_time: effectiveBirthTime,
          latitude: effectiveLatitude,
          longitude: effectiveLongitude,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate life arc');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResponse(data as LifeArcResponse);
      setFlowState('results');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setFlowState('input');
    } finally {
      setIsQuickGenerating(false);
    }
  };

  // Loading screen
  if (flowState === 'loading') {
    return <LifeArcLoadingScreen />;
  }

  // Results view
  if (flowState === 'results' && response?.status === 'success' && response.data) {
    const { data } = response;
    const currentAge = data.summary.currentAge;

    // Find current period in timeline
    const currentPeriodEntry = data.timeline.find(
      (entry) => entry.ageStart <= currentAge && entry.ageEnd >= currentAge
    );

    return (
      <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
        <StarField />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-cream-muted hover:text-cream transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              New Reading
            </Button>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">Complete Life Arc</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-2">Your Life Timeline</h1>
            <p className="text-cream-muted">
              {data.summary.lagnaSign} Rising | {data.summary.moonSign} Moon | Age {currentAge}
            </p>
          </div>

          {/* Overview */}
          {data.summary.overview && (
            <div className="rounded-xl border border-border/30 bg-midnight/30 backdrop-blur-sm p-6 mb-8">
              <p className="text-cream-muted leading-relaxed whitespace-pre-line">{data.summary.overview}</p>
            </div>
          )}

          {/* Current Period */}
          {data.currentPeriod && <CurrentPeriodSection currentPeriod={data.currentPeriod} />}

          {/* Patterns Summary */}
          {data.patterns && Object.keys(data.patterns).length > 0 && <PatternsSummary patterns={data.patterns} />}

          {/* Timeline Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'past'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-midnight/30 text-cream-muted hover:text-cream border border-border/30'
              }`}
              onClick={() => setActiveTab('past')}
            >
              The Past ({data.pastTimeline?.length || 0})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'future'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-midnight/30 text-cream-muted hover:text-cream border border-border/30'
              }`}
              onClick={() => setActiveTab('future')}
            >
              The Future ({data.futureTimeline?.length || 0})
            </button>
          </div>

          {/* Timeline Table */}
          <div className="rounded-xl border border-border/30 bg-midnight/30 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border/30 bg-midnight/50">
                    <th className="py-3 px-2 text-left text-xs font-medium text-gold uppercase tracking-wider w-24">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Period
                      </div>
                    </th>
                    <th className="py-3 px-2 text-left text-xs font-medium text-gold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        Career
                      </div>
                    </th>
                    <th className="py-3 px-2 text-left text-xs font-medium text-gold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        Love
                      </div>
                    </th>
                    <th className="py-3 px-2 text-left text-xs font-medium text-gold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Baby className="w-3 h-3" />
                        Children
                      </div>
                    </th>
                    <th className="py-3 px-2 text-left text-xs font-medium text-gold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Wealth
                      </div>
                    </th>
                    <th className="py-3 px-2 text-left text-xs font-medium text-gold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Health
                      </div>
                    </th>
                    <th className="py-3 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'past' ? data.pastTimeline : data.futureTimeline)?.map((entry, index) => (
                    <TimelineRow
                      key={`${entry.yearRange}-${index}`}
                      entry={entry}
                      isCurrentPeriod={
                        currentPeriodEntry?.yearRange === entry.yearRange &&
                        currentPeriodEntry?.mahaDasha === entry.mahaDasha
                      }
                    />
                  ))}
                  {((activeTab === 'past' ? data.pastTimeline : data.futureTimeline)?.length || 0) === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-cream-muted">
                        No {activeTab} periods available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Birth Details */}
          {response.birth_details && (
            <div className="mt-8 p-4 rounded-xl border border-border/30 bg-midnight/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm text-cream-muted">
                  <span className="text-gold">Birth Details:</span> {response.birth_details.birth_date} at{' '}
                  {response.birth_details.birth_time}
                </div>
                <Button variant="ghost" size="sm" onClick={handleChangeDetails}>
                  Change Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Input view
  return (
    <div className="relative min-h-screen bg-celestial overflow-hidden font-sans">
      <StarField />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-cream-muted hover:text-cream transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-medium">Life Arc</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-cream mb-2">Your Complete Life Timeline</h1>
          <p className="text-cream-muted">
            A comprehensive map of your past, present, and future across career, love, children, wealth, and health.
          </p>
        </div>

        {/* Quick Generate or Form */}
        {hasUsableKundli && !showNewDetailsForm && !authLoading ? (
          <div className="rounded-xl border border-border/30 bg-midnight/30 backdrop-blur-sm p-6 text-center">
            <p className="text-cream mb-4">
              Generate your Life Arc using your saved birth details:
              <br />
              <span className="text-gold">
                {effectiveBirthDate} at {effectiveBirthTime}
              </span>
              {effectiveBirthPlace && <span className="text-cream-muted"> in {effectiveBirthPlace}</span>}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleQuickGenerate}
                disabled={isQuickGenerating}
                className="bg-gold hover:bg-gold/90 text-midnight"
              >
                {isQuickGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate My Life Arc
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleChangeDetails}>
                Use Different Birth Details
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-midnight/30 backdrop-blur-sm p-6">
            <BirthDetailsForm
              onSubmit={handleSubmit}
              isSubmitting={flowState === 'loading'}
              submitLabel="Generate Life Arc"
            />
          </div>
        )}
      </div>
    </div>
  );
}
