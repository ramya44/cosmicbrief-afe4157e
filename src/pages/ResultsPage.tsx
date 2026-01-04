import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ForecastSection } from '@/components/ForecastSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useForecastStore } from '@/store/forecastStore';
import { ArrowLeft, Sparkles, Calendar, Heart, Zap, Briefcase, Lock } from 'lucide-react';
import { useEffect } from 'react';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { birthData, freeForecast, paidForecast, isPaid, isLoading, setIsPaid } = useForecastStore();

  // Redirect if no data
  useEffect(() => {
    if (!birthData && !isLoading) {
      navigate('/input');
    }
  }, [birthData, isLoading, navigate]);

  if (isLoading || !freeForecast) {
    return <LoadingSpinner />;
  }

  const handleUnlock = () => {
    // In production, this would trigger a payment flow
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
          <p className="text-gold text-sm uppercase tracking-widest mb-2">Your Personalized Forecast</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream mb-4">
            2026 Annual Outlook
          </h1>
          {birthData && (
            <p className="text-cream-muted">
              Based on {new Date(birthData.birthDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {birthData.birthPlace}
            </p>
          )}
        </div>

        {/* Free Sections */}
        <div className="max-w-3xl mx-auto space-y-8 mb-12">
          {/* Overall Theme */}
          <ForecastSection title="Overall Theme of 2026" delay={100}>
            <p className="text-cream/90 leading-relaxed text-lg">
              {freeForecast.overallTheme}
            </p>
          </ForecastSection>

          {/* Best Months */}
          <ForecastSection title="Best Months" delay={200}>
            <div className="flex items-start gap-3 mb-4">
              <Calendar className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
              <p className="text-cream-muted text-sm">Periods of heightened opportunity and flow</p>
            </div>
            <ul className="space-y-3">
              {freeForecast.bestMonths.map((month, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                  <span className="text-cream/90">{month}</span>
                </li>
              ))}
            </ul>
          </ForecastSection>

          {/* Watchful Months */}
          <ForecastSection title="Months to Be Watchful" delay={300}>
            <ul className="space-y-3">
              {freeForecast.watchfulMonths.map((month, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-muted mt-2 flex-shrink-0" />
                  <span className="text-cream/80">{month}</span>
                </li>
              ))}
            </ul>
          </ForecastSection>

          {/* Focus Areas */}
          <ForecastSection title="High-Level Focus Areas" delay={400}>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-gold" />
                  <h4 className="font-display text-lg text-cream">Career</h4>
                </div>
                <p className="text-cream/80 leading-relaxed">{freeForecast.focusAreas.career}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-gold" />
                  <h4 className="font-display text-lg text-cream">Relationships</h4>
                </div>
                <p className="text-cream/80 leading-relaxed">{freeForecast.focusAreas.relationships}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-gold" />
                  <h4 className="font-display text-lg text-cream">Energy</h4>
                </div>
                <p className="text-cream/80 leading-relaxed">{freeForecast.focusAreas.energy}</p>
              </div>
            </div>
          </ForecastSection>
        </div>

        {/* Unlock CTA - Only show if not paid */}
        {!isPaid && (
          <div className="max-w-3xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-8 md:p-10 text-center glow-gold">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-cream mb-3">
                Unlock Your Complete 2026 Forecast
              </h2>
              <p className="text-cream-muted mb-6 max-w-md mx-auto">
                Get quarter-by-quarter guidance, personal timing windows, energy management advice, and more.
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
          {/* Quarter-by-Quarter Guidance */}
          <ForecastSection 
            title="Quarter-by-Quarter Guidance" 
            locked={!isPaid}
            delay={600}
          >
            {isPaid && paidForecast && (
              <div className="space-y-6">
                {Object.entries(paidForecast.quarterlyGuidance).map(([quarter, content]) => (
                  <div key={quarter}>
                    <h4 className="font-display text-lg text-gold mb-2">
                      {quarter === 'q1' ? 'Q1: January – March' :
                       quarter === 'q2' ? 'Q2: April – June' :
                       quarter === 'q3' ? 'Q3: July – September' :
                       'Q4: October – December'}
                    </h4>
                    <p className="text-cream/80 leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>
            )}
            {!isPaid && (
              <p className="text-cream/70">Detailed guidance for each quarter of 2026, including specific focus areas and recommended actions...</p>
            )}
          </ForecastSection>

          {/* Personal Timing Windows */}
          <ForecastSection 
            title="Personal Timing Windows" 
            locked={!isPaid}
            delay={700}
          >
            {isPaid && paidForecast && (
              <ul className="space-y-3">
                {paidForecast.timingWindows.map((window, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                    <span className="text-cream/90">{window}</span>
                  </li>
                ))}
              </ul>
            )}
            {!isPaid && (
              <p className="text-cream/70">Specific dates and periods throughout 2026 when your personal patterns align for maximum opportunity...</p>
            )}
          </ForecastSection>

          {/* Energy Management */}
          <ForecastSection 
            title="Energy Management Advice" 
            locked={!isPaid}
            delay={800}
          >
            {isPaid && paidForecast && (
              <p className="text-cream/90 leading-relaxed">{paidForecast.energyManagement}</p>
            )}
            {!isPaid && (
              <p className="text-cream/70">Personalized guidance on managing your energy throughout the year, including optimal rest periods...</p>
            )}
          </ForecastSection>

          {/* Pattern Warnings */}
          <ForecastSection 
            title="Key Patterns to Watch" 
            locked={!isPaid}
            delay={900}
          >
            {isPaid && paidForecast && (
              <ul className="space-y-3">
                {paidForecast.patternWarnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-muted mt-2 flex-shrink-0" />
                    <span className="text-cream/80">{warning}</span>
                  </li>
                ))}
              </ul>
            )}
            {!isPaid && (
              <p className="text-cream/70">Important patterns and potential challenges to be aware of, with timing and guidance...</p>
            )}
          </ForecastSection>

          {/* Closing Guidance - Only show if paid */}
          {isPaid && paidForecast && (
            <ForecastSection title="Closing Guidance" delay={1000}>
              <p className="text-cream/90 leading-relaxed text-lg italic">
                {paidForecast.closingGuidance}
              </p>
            </ForecastSection>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border/30">
          <p className="text-muted-foreground text-sm">
            Your forecast is based on ancient systems of time and pattern.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ResultsPage;
