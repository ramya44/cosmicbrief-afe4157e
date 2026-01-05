import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ForecastSection } from '@/components/ForecastSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForecastStore } from '@/store/forecastStore';
import { generateStrategicForecast } from '@/lib/generateStrategicForecast';
import { ArrowLeft, Sparkles, Calendar, Heart, Zap, Briefcase, Lock, DollarSign, ArrowLeftRight, Target, TrendingUp, Scale, Compass, BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { 
    birthData, 
    freeForecast, 
    paidForecast, 
    strategicForecast,
    isPaid, 
    isLoading, 
    isStrategicLoading,
    setIsPaid,
    setStrategicForecast,
    setIsStrategicLoading
  } = useForecastStore();

  useEffect(() => {
    if (!birthData && !isLoading) {
      navigate('/input');
    }
  }, [birthData, isLoading, navigate]);

  if (isLoading || !freeForecast) {
    return <LoadingSpinner />;
  }

  const handleUnlock = async () => {
    if (!birthData) return;
    
    setIsPaid(true);
    setIsStrategicLoading(true);
    
    try {
      const strategic = await generateStrategicForecast(birthData);
      setStrategicForecast(strategic);
      toast.success('Your Strategic Year Map is ready!');
    } catch (error) {
      console.error('Failed to generate strategic forecast:', error);
      toast.error('Failed to generate strategic forecast. Please try again.');
    } finally {
      setIsStrategicLoading(false);
    }
  };

  const quarterLabels = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
  const quarterKeys = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

  return (
    <div className="relative min-h-screen bg-celestial">
      <StarField />

      {/* Header */}
      <header className="relative z-20 border-b border-border/30 bg-midnight/80 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/input')}
            className="text-cream-muted hover:text-cream"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Forecast
          </Button>
          
          {!isPaid && (
            <Button 
              variant="hero" 
              size="sm"
              onClick={handleUnlock}
            >
              <Lock className="w-4 h-4 mr-1" />
              Unlock Strategic Year Map
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12 animate-fade-up">
          <p className="text-gold text-sm uppercase tracking-widest mb-2">Your Personalized Reading</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
            {freeForecast.year} Annual Forecast
          </h1>
          {birthData && (
            <p className="text-cream-muted">
              {birthData.name && <span className="text-cream">{birthData.name} · </span>}
              {new Date(birthData.birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {birthData.birthPlace}
            </p>
          )}
        </div>

        {/* Free Sections */}
        <div className="max-w-3xl mx-auto space-y-8 mb-12">
          {/* Summary - Character of the Year */}
          <ForecastSection title="Character of the Year" delay={100}>
            <p className="text-cream/90 leading-relaxed text-lg">
              {freeForecast.summary}
            </p>
          </ForecastSection>

          {/* Comparison to Prior Year */}
          <ForecastSection title="How 2026 Differs from 2025" delay={200}>
            <div className="flex items-start gap-3 mb-4">
              <ArrowLeftRight className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
              <p className="text-cream-muted text-sm">Key contrasts between this year and last</p>
            </div>
            <p className="text-cream/90 leading-relaxed">
              {freeForecast.comparisonToPriorYear}
            </p>
          </ForecastSection>

          {/* Themed Sections */}
          <ForecastSection title="Career and Contribution" delay={300}>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-gold" />
            </div>
            <p className="text-cream/90 leading-relaxed">{freeForecast.sections.careerAndContribution}</p>
          </ForecastSection>

          <ForecastSection title="Money and Resources" delay={400}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-gold" />
            </div>
            <p className="text-cream/90 leading-relaxed">{freeForecast.sections.moneyAndResources}</p>
          </ForecastSection>

          <ForecastSection title="Relationships and Boundaries" delay={500}>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-gold" />
            </div>
            <p className="text-cream/90 leading-relaxed">{freeForecast.sections.relationshipsAndBoundaries}</p>
          </ForecastSection>

          <ForecastSection title="Energy and Wellbeing" delay={600}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-gold" />
            </div>
            <p className="text-cream/90 leading-relaxed">{freeForecast.sections.energyAndWellbeing}</p>
          </ForecastSection>
        </div>

        {/* Unlock CTA - Only show if not paid */}
        {!isPaid && (
          <div className="max-w-3xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: '700ms', animationFillMode: 'both' }}>
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-8 md:p-10 text-center glow-gold">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-cream mb-3">
                Unlock Your Strategic Year Map
              </h2>
              <p className="text-cream-muted mb-6 max-w-md mx-auto">
                Get a decision-oriented strategic interpretation: quarterly maps, life-area priorities, key trade-offs, and personal operating principles.
              </p>
              <Button variant="unlock" size="xl" onClick={handleUnlock}>
                Unlock Strategic Year Map
                <Sparkles className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Strategic Loading State */}
        {isPaid && isStrategicLoading && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="rounded-2xl border border-gold/30 bg-midnight/50 p-8 md:p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Compass className="w-7 h-7 text-gold animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h2 className="font-display text-2xl text-cream mb-3">
                Generating Your Strategic Year Map...
              </h2>
              <p className="text-cream-muted">
                This deeper analysis takes a moment. Please wait while we craft your personalized strategic guidance.
              </p>
            </div>
          </div>
        )}

        {/* Strategic Forecast - Only show if paid and loaded */}
        {isPaid && strategicForecast && !isStrategicLoading && (
          <div className="max-w-3xl mx-auto space-y-8 mb-16">
            {/* Strategic Title */}
            <div className="text-center py-8 border-t border-b border-gold/30">
              <p className="text-gold text-sm uppercase tracking-widest mb-2">Premium Strategic Analysis</p>
              <h2 className="font-display text-3xl md:text-4xl text-cream">
                Strategic Year Map
              </h2>
            </div>

            {/* Strategic Character */}
            <ForecastSection title="The Strategic Character of 2026" delay={100}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-gold" />
              </div>
              <p className="text-cream/90 leading-relaxed whitespace-pre-line">
                {strategicForecast.strategic_character}
              </p>
            </ForecastSection>

            {/* Comparison */}
            <ForecastSection title="How 2026 Differs from 2025" delay={200}>
              <div className="flex items-center gap-2 mb-3">
                <ArrowLeftRight className="w-4 h-4 text-gold" />
              </div>
              <p className="text-cream/90 leading-relaxed whitespace-pre-line">
                {strategicForecast.comparison_to_prior_year}
              </p>
            </ForecastSection>

            {/* Life Area Prioritization */}
            <ForecastSection title="Life-Area Prioritization" delay={300}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span className="text-cream-muted text-sm">Ranked by strategic importance</span>
              </div>
              <div className="space-y-4">
                {strategicForecast.life_area_prioritization
                  .sort((a, b) => a.priority - b.priority)
                  .map((item, index) => (
                    <div key={index} className="border-l-2 border-gold/30 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gold font-display text-lg">#{item.priority}</span>
                        <span className="text-cream font-medium">{item.area}</span>
                      </div>
                      <p className="text-cream/70 text-sm">{item.explanation}</p>
                    </div>
                  ))}
              </div>
            </ForecastSection>

            {/* Quarterly Map */}
            <ForecastSection title="Quarter-by-Quarter Strategic Map" delay={400}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-gold" />
              </div>
              <div className="space-y-6">
                {quarterKeys.map((key, index) => {
                  const quarter = strategicForecast.quarterly_map[key];
                  return (
                    <div key={key} className="border border-border/30 rounded-lg p-4 bg-midnight/30">
                      <h4 className="font-display text-lg text-gold mb-3">{quarterLabels[index]}</h4>
                      <div className="grid gap-2 text-sm">
                        <div><span className="text-cream-muted">Focus:</span> <span className="text-cream">{quarter.focus}</span></div>
                        <div><span className="text-cream-muted">Push:</span> <span className="text-cream">{quarter.push}</span></div>
                        <div><span className="text-cream-muted">Protect:</span> <span className="text-cream">{quarter.protect}</span></div>
                        <div><span className="text-cream-muted">Avoid:</span> <span className="text-cream">{quarter.avoid}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ForecastSection>

            {/* Key Trade-offs */}
            <ForecastSection title="Key Trade-Offs and Tensions" delay={500}>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-4 h-4 text-gold" />
              </div>
              <div className="space-y-4">
                {strategicForecast.key_tradeoffs.map((tradeoff, index) => (
                  <div key={index} className="border-l-2 border-gold/30 pl-4">
                    <h4 className="font-display text-cream mb-1">{tradeoff.tension}</h4>
                    <p className="text-cream/70 text-sm">{tradeoff.explanation}</p>
                  </div>
                ))}
              </div>
            </ForecastSection>

            {/* Counterfactual Paths */}
            <ForecastSection title="If–Then Scenarios" delay={600}>
              <div className="flex items-center gap-2 mb-4">
                <Compass className="w-4 h-4 text-gold" />
                <span className="text-cream-muted text-sm">Plausible paths through the year</span>
              </div>
              <div className="space-y-4">
                {strategicForecast.counterfactual_paths.map((path, index) => (
                  <div key={index} className="border border-border/30 rounded-lg p-4 bg-midnight/30">
                    <h4 className="font-display text-gold mb-2">{path.path}</h4>
                    <p className="text-cream/80 text-sm">{path.description}</p>
                  </div>
                ))}
              </div>
            </ForecastSection>

            {/* Operating Principles */}
            <ForecastSection title="Personal Operating Principles for 2026" delay={700}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-gold" />
                <span className="text-cream-muted text-sm">Your personal constitution for the year</span>
              </div>
              <div className="space-y-4">
                {strategicForecast.operating_principles.map((principle, index) => (
                  <div key={index} className="border-l-2 border-gold/50 pl-4">
                    <h4 className="font-display text-cream text-lg italic">"{principle.principle}"</h4>
                    <p className="text-cream/70 text-sm mt-1">{principle.meaning}</p>
                  </div>
                ))}
              </div>
            </ForecastSection>

            {/* Deeper Arc */}
            <ForecastSection title="The Deeper Arc" delay={800}>
              <p className="text-cream/90 leading-relaxed text-lg italic whitespace-pre-line">
                {strategicForecast.deeper_arc}
              </p>
            </ForecastSection>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border/30">
          <p className="text-muted-foreground text-sm">
            A personalized reading blending Jyotish and BaZi traditions.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ResultsPage;
