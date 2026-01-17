import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { ArrowLeft, Sparkles, Calendar, Clock, MapPin } from 'lucide-react';

interface ChartData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  lat: number;
  lon: number;
  birthDateTimeUtc?: string;
  kundliData: {
    birthDetails?: {
      nakshatra?: { name?: string; pada?: number; lord?: string };
      moonSign?: { name?: string; id?: number; lord?: string };
      sunSign?: { name?: string; id?: number; lord?: string };
      ascendant?: { name?: string; id?: number; lord?: string };
    };
    planetaryPositions?: Array<{
      name: string;
      sign?: { name?: string };
      degree?: number;
      isRetrograde?: boolean;
    }>;
  };
}

const BirthChartPage = () => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('birth_chart_data');
    if (storedData) {
      try {
        setChartData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse chart data:', e);
        navigate('/get-birth-chart');
      }
    } else {
      navigate('/get-birth-chart');
    }
  }, [navigate]);

  if (!chartData) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <p className="text-cream-muted">Loading...</p>
      </div>
    );
  }

  const { birthDetails, planetaryPositions } = chartData.kundliData || {};

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getSimpleLocation = (location: string) => {
    return location.split(',')[0].trim();
  };

  return (
    <>
      <Helmet>
        <title>Your Vedic Birth Chart | Cosmic Brief</title>
        <meta name="description" content="View your personalized Vedic birth chart with planetary positions, houses, and astrological insights." />
      </Helmet>

      <div className="relative min-h-screen bg-celestial">
        <StarField />

        {/* Header */}
        <header className="relative z-20 border-b border-border/30 bg-midnight/80 backdrop-blur-md sticky top-0">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/get-birth-chart" className="text-cream-muted hover:text-cream transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
          {/* Birth Details Summary */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-4">
              Your Vedic Birth Chart
            </h1>
            <div className="flex flex-wrap justify-center gap-4 text-cream-muted text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gold" />
                {formatDate(chartData.birthDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gold" />
                {formatTime(chartData.birthTime)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gold" />
                {getSimpleLocation(chartData.birthPlace)}
              </span>
            </div>
          </div>

          {/* Key Details Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {birthDetails?.ascendant?.name && (
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-5 text-center">
                <p className="text-cream-muted text-sm mb-1">Ascendant (Lagna)</p>
                <p className="text-cream font-semibold text-xl">{birthDetails.ascendant.name}</p>
                {birthDetails.ascendant.lord && (
                  <p className="text-cream-muted text-xs mt-1">Lord: {birthDetails.ascendant.lord}</p>
                )}
              </div>
            )}
            {birthDetails?.moonSign?.name && (
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5 text-center">
                <p className="text-cream-muted text-sm mb-1">Moon Sign (Rashi)</p>
                <p className="text-cream font-semibold text-xl">{birthDetails.moonSign.name}</p>
                {birthDetails.moonSign.lord && (
                  <p className="text-cream-muted text-xs mt-1">Lord: {birthDetails.moonSign.lord}</p>
                )}
              </div>
            )}
            {birthDetails?.sunSign?.name && (
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5 text-center">
                <p className="text-cream-muted text-sm mb-1">Sun Sign</p>
                <p className="text-cream font-semibold text-xl">{birthDetails.sunSign.name}</p>
                {birthDetails.sunSign.lord && (
                  <p className="text-cream-muted text-xs mt-1">Lord: {birthDetails.sunSign.lord}</p>
                )}
              </div>
            )}
            {birthDetails?.nakshatra?.name && (
              <div className="bg-midnight/50 border border-border/30 rounded-xl p-5 text-center">
                <p className="text-cream-muted text-sm mb-1">Nakshatra</p>
                <p className="text-cream font-semibold text-xl">{birthDetails.nakshatra.name}</p>
                {birthDetails.nakshatra.pada && (
                  <p className="text-cream-muted text-xs mt-1">Pada {birthDetails.nakshatra.pada}</p>
                )}
              </div>
            )}
          </div>

          {/* Planetary Positions Table */}
          {planetaryPositions && planetaryPositions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gold mb-6">Planetary Positions</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-cream font-semibold">Planet</th>
                      <th className="text-left py-3 px-4 text-cream font-semibold">Sign</th>
                      <th className="text-left py-3 px-4 text-cream font-semibold">Degree</th>
                      <th className="text-left py-3 px-4 text-cream font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-cream-muted">
                    {planetaryPositions.map((planet, index) => (
                      <tr key={index} className="border-b border-border/30">
                        <td className="py-3 px-4 font-medium text-cream">{planet.name}</td>
                        <td className="py-3 px-4">{planet.sign?.name || '-'}</td>
                        <td className="py-3 px-4">{planet.degree !== undefined ? `${planet.degree.toFixed(2)}°` : '-'}</td>
                        <td className="py-3 px-4">
                          {planet.isRetrograde ? (
                            <span className="text-amber-400">Retrograde</span>
                          ) : (
                            <span className="text-green-400">Direct</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/40 rounded-2xl p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-cream mb-4">
              Want to Know What This Means for 2026?
            </h2>
            <p className="text-cream-muted text-lg mb-6 max-w-2xl mx-auto">
              Your birth chart is just the beginning. Get your personalized 2026 forecast to see which planetary periods are active, what themes are unfolding, and when your key timing windows arrive.
            </p>
            <Link to="/vedic/input">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-midnight font-semibold px-8 py-6 text-lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Your 2026 Cosmic Brief
              </Button>
            </Link>
            <p className="text-cream-muted/60 text-sm mt-4">
              Free personalized forecast. No credit card required.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/30 bg-midnight/50 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4 text-center text-cream-muted text-xs">
            <p>&copy; {new Date().getFullYear()} Cosmic Brief. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <Link to="/privacy" className="hover:text-cream transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-cream transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-cream transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BirthChartPage;
