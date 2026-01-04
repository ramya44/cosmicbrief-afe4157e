import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ForecastSection } from '@/components/ForecastSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForecastStore } from '@/store/forecastStore';
import { ArrowLeft, Sparkles, Calendar, Heart, Zap, Briefcase, Lock, DollarSign, ArrowLeftRight } from 'lucide-react';
import { useEffect } from 'react';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { birthData, freeForecast, paidForecast, isPaid, isLoading, setIsPaid } = useForecastStore();

  useEffect(() => {
    if (!birthData && !isLoading) {
      navigate('/input');
    }
  }, [birthData, isLoading, navigate]);

  if (isLoading || !freeForecast) {
    return <LoadingSpinner />;
  }

  const handleUnlock = () => {
    setIsPaid(true);
  };

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
              Unlock Full Forecast
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
                Unlock Your Complete Reading
              </h2>
              <p className="text-cream-muted mb-6 max-w-md mx-auto">
                Discover your strong months, periods requiring measured attention, and the deeper arc of your year.
              </p>
              <Button variant="unlock" size="xl" onClick={handleUnlock}>
                Unlock Full Forecast
                <Sparkles className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Locked/Unlocked Sections */}
        <div className="max-w-3xl mx-auto space-y-8 mb-16">
          {/* Strong Months */}
          <ForecastSection 
            title="Strong Months in 2026" 
            locked={!isPaid}
            delay={800}
          >
            {isPaid && paidForecast && (
              <div className="space-y-4">
                {paidForecast.strongMonths.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-display text-lg text-gold">{entry.month}</span>
                      <p className="text-cream/80 mt-1">{entry.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isPaid && (
              <p className="text-cream/70">Four carefully selected months where conditions align in your favor, with specific guidance for each...</p>
            )}
          </ForecastSection>

          {/* Measured Attention Months */}
          <ForecastSection 
            title="Measured Attention Months" 
            locked={!isPaid}
            delay={900}
          >
            {isPaid && paidForecast && (
              <div className="space-y-4">
                {paidForecast.measuredAttentionMonths.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gold-muted mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-display text-lg text-cream">{entry.month}</span>
                      <p className="text-cream/70 mt-1">{entry.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isPaid && (
              <p className="text-cream/70">Three periods where slowing down and extra discernment serve you well...</p>
            )}
          </ForecastSection>

          {/* Closing Arc - Only show if paid */}
          {isPaid && paidForecast && (
            <ForecastSection title="The Deeper Arc" delay={1000}>
              <p className="text-cream/90 leading-relaxed text-lg italic">
                {paidForecast.closingArc}
              </p>
            </ForecastSection>
          )}
        </div>

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
