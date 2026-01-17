import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { BirthChartWheel } from '@/components/BirthChartWheel';
import { SaveProfileDialog } from '@/components/SaveProfileDialog';
import { ArrowLeft, Sparkles, Calendar, Clock, MapPin, Save, Download } from 'lucide-react';
import { toast } from 'sonner';

// Matches the KundliResult from get-kundli-data edge function
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

interface KundliData {
  nakshatra: string;
  nakshatra_id: number;
  nakshatra_pada: number;
  nakshatra_lord: string;
  nakshatra_gender?: string;
  deity?: string;
  ganam?: string;
  birth_symbol?: string;
  animal_sign?: string;
  nadi?: string;
  lucky_color?: string;
  best_direction?: string;
  syllables?: string;
  birth_stone?: string;
  moon_sign: string;
  moon_sign_id: number;
  moon_sign_lord: string;
  sun_sign: string;
  sun_sign_id: number;
  sun_sign_lord: string;
  zodiac_sign?: string;
  ascendant_sign: string;
  ascendant_sign_id: number;
  ascendant_sign_lord: string;
  planetary_positions: PlanetPosition[];
}

interface ChartData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  name?: string;
  email?: string;
  lat: number;
  lon: number;
  birthDateTimeUtc?: string;
  kundliId?: string;
  kundliData: KundliData;
}

// Calculate house number based on whole-sign system
const calculateHouse = (planetSignId: number, ascendantSignId: number): number => {
  return ((planetSignId - ascendantSignId + 12) % 12) + 1;
};

// Get ordinal suffix
const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Group planets by house for the chart
const groupPlanetsByHouse = (
  positions: PlanetPosition[],
  ascendantSignId: number
): Record<number, PlanetPosition[]> => {
  const houses: Record<number, PlanetPosition[]> = {};
  for (let i = 1; i <= 12; i++) {
    houses[i] = [];
  }
  
  positions.forEach(planet => {
    // Skip Ascendant (id 0) from planetary display since it defines houses
    if (planet.id === 0) return;
    const house = calculateHouse(planet.sign_id, ascendantSignId);
    houses[house].push(planet);
  });
  
  return houses;
};

// Get sign name for a house number
const getSignForHouse = (houseNumber: number, ascendantSignId: number): string => {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const signIndex = ((ascendantSignId - 1) + (houseNumber - 1)) % 12;
  return signs[signIndex];
};

// Abbreviate planet names for chart display
const abbreviatePlanet = (name: string): string => {
  const abbr: Record<string, string> = {
    'Sun': 'Su',
    'Moon': 'Mo',
    'Mars': 'Ma',
    'Mercury': 'Me',
    'Jupiter': 'Ju',
    'Venus': 'Ve',
    'Saturn': 'Sa',
    'Rahu': 'Ra',
    'Ketu': 'Ke',
    'Ascendant': 'As',
  };
  return abbr[name] || name.substring(0, 2);
};

// South Indian style chart component
const SouthIndianChart = ({ 
  positions, 
  ascendantSignId 
}: { 
  positions: PlanetPosition[]; 
  ascendantSignId: number;
}) => {
  const houses = groupPlanetsByHouse(positions, ascendantSignId);
  
  // South Indian chart layout - fixed sign positions
  // The chart is a 4x4 grid where corner cells are merged
  const gridLayout = [
    [12, 1, 2, 3],
    [11, null, null, 4],
    [10, null, null, 5],
    [9, 8, 7, 6]
  ];

  return (
    <div className="w-full max-w-md mx-auto aspect-square">
      <div className="grid grid-cols-4 gap-0.5 h-full bg-border/30">
        {gridLayout.flat().map((houseNum, idx) => {
          if (houseNum === null) {
            // Center cells - skip (will be handled by merged cells)
            if (idx === 5) {
              return (
                <div 
                  key={idx} 
                  className="col-span-2 row-span-2 bg-midnight/80 flex items-center justify-center border border-border/30"
                >
                  <div className="text-center">
                    <p className="text-gold text-xs mb-1">Rashi Chart</p>
                    <p className="text-cream-muted text-[10px]">Lagna: {getSignForHouse(1, ascendantSignId)}</p>
                  </div>
                </div>
              );
            }
            return null;
          }

          const housePlanets = houses[houseNum] || [];
          const signName = getSignForHouse(houseNum, ascendantSignId);
          const isAscendant = houseNum === 1;

          return (
            <div
              key={idx}
              className={`
                bg-midnight/60 border border-border/30 p-1 flex flex-col
                ${isAscendant ? 'bg-gold/10 border-gold/40' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-[9px] text-cream-muted">{houseNum}</span>
                <span className="text-[8px] text-cream-muted/70">{signName.substring(0, 3)}</span>
              </div>
              <div className="flex-1 flex flex-wrap content-start gap-0.5">
                {housePlanets.map((planet) => (
                  <span
                    key={planet.id}
                    className={`
                      text-[10px] px-1 rounded
                      ${planet.is_retrograde ? 'text-amber-400' : 'text-cream'}
                    `}
                    title={`${planet.name}${planet.is_retrograde ? ' (R)' : ''}`}
                  >
                    {abbreviatePlanet(planet.name)}
                    {planet.is_retrograde && <sup>R</sup>}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BirthChartPage = () => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem('birth_chart_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('Loaded chart data:', parsed);
        setChartData(parsed);
      } catch (e) {
        console.error('Failed to parse chart data:', e);
        navigate('/get-birth-chart');
      }
    } else {
      navigate('/get-birth-chart');
    }
  }, [navigate]);

  const handleSaveSuccess = () => {
    toast.success('Birth chart saved to your profile!');
    setSaveDialogOpen(false);
  };

  const handleDownloadImage = () => {
    toast.info('Download feature coming soon!');
  };

  if (!chartData) {
    return (
      <div className="relative min-h-screen bg-celestial flex items-center justify-center">
        <StarField />
        <p className="text-cream-muted">Loading...</p>
      </div>
    );
  }

  const { kundliData } = chartData;
  const { planetary_positions, ascendant_sign_id } = kundliData;

  // Filter out Ascendant for the table (id 0), keep only planets
  const planetsForTable = planetary_positions.filter(p => p.id !== 0);

  // Find Sun and Moon for their nakshatra display
  const sunPosition = planetary_positions.find(p => p.name === 'Sun');
  const moonPosition = planetary_positions.find(p => p.name === 'Moon');

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

        <main className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
          {/* Birth Details Summary */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-4">
              Your Vedic Birth Chart
            </h1>
            {chartData.name && (
              <p className="text-gold text-lg mb-2">{chartData.name}</p>
            )}
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

          {/* Beautiful Circular Birth Chart Wheel */}
          <section className="mb-16">
            <BirthChartWheel chartData={kundliData} />
          </section>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {chartData.kundliId && (
              <Button
                onClick={() => setSaveDialogOpen(true)}
                size="lg"
                className="bg-gold hover:bg-gold-light text-midnight font-semibold"
              >
                <Save className="w-5 h-5 mr-2" />
                Save to Profile
              </Button>
            )}
            <Button
              onClick={handleDownloadImage}
              variant="outline"
              size="lg"
              className="border-gold/40 text-gold hover:bg-gold/10"
            >
              <Download className="w-5 h-5 mr-2" />
              Download as Image
            </Button>
          </div>

          {/* Key Details Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-5 text-center">
              <p className="text-cream-muted text-sm mb-1">Ascendant (Lagna)</p>
              <p className="text-cream font-semibold text-xl">{kundliData.ascendant_sign}</p>
              <p className="text-cream-muted text-xs mt-1">Lord: {kundliData.ascendant_sign_lord}</p>
            </div>
            
            <div className="bg-midnight/50 border border-border/30 rounded-xl p-5 text-center">
              <p className="text-cream-muted text-sm mb-1">Moon Sign (Rashi)</p>
              <p className="text-cream font-semibold text-xl">{kundliData.moon_sign}</p>
              <p className="text-cream-muted text-xs mt-1">Lord: {kundliData.moon_sign_lord}</p>
              {moonPosition?.nakshatra && (
                <p className="text-gold/80 text-xs mt-1">in {moonPosition.nakshatra}</p>
              )}
            </div>
            
            <div className="bg-midnight/50 border border-border/30 rounded-xl p-5 text-center">
              <p className="text-cream-muted text-sm mb-1">Sun Sign</p>
              <p className="text-cream font-semibold text-xl">{kundliData.sun_sign}</p>
              <p className="text-cream-muted text-xs mt-1">Lord: {kundliData.sun_sign_lord}</p>
              {sunPosition?.nakshatra && (
                <p className="text-gold/80 text-xs mt-1">in {sunPosition.nakshatra}</p>
              )}
            </div>
            
            <div className="bg-midnight/50 border border-border/30 rounded-xl p-5 text-center">
              <p className="text-cream-muted text-sm mb-1">Birth Nakshatra</p>
              <p className="text-cream font-semibold text-xl">{kundliData.nakshatra}</p>
              <p className="text-cream-muted text-xs mt-1">Pada {kundliData.nakshatra_pada}</p>
              <p className="text-cream-muted text-xs">Lord: {kundliData.nakshatra_lord}</p>
            </div>
          </div>

          {/* 12 House Chart */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gold mb-6 text-center">Rashi Chart (D1)</h2>
            <SouthIndianChart 
              positions={planetary_positions} 
              ascendantSignId={ascendant_sign_id} 
            />
            <p className="text-center text-cream-muted text-xs mt-4">
              South Indian style chart. Houses numbered 1-12 from Ascendant.
              <span className="text-amber-400 ml-2">R = Retrograde</span>
            </p>
          </div>

          {/* Planetary Positions Table */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gold mb-6">Planetary Positions</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-cream font-semibold">Planet</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Sign</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">House</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Nakshatra</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Degree</th>
                    <th className="text-left py-3 px-4 text-cream font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-cream-muted">
                  {planetsForTable.map((planet) => {
                    const house = calculateHouse(planet.sign_id, ascendant_sign_id);
                    return (
                      <tr key={planet.id} className="border-b border-border/30">
                        <td className="py-3 px-4 font-medium text-cream">{planet.name}</td>
                        <td className="py-3 px-4">{planet.sign}</td>
                        <td className="py-3 px-4">{getOrdinal(house)}</td>
                        <td className="py-3 px-4">
                          {planet.nakshatra || '-'}
                          {planet.nakshatra_pada && (
                            <span className="text-cream-muted/60 text-xs ml-1">
                              (Pada {planet.nakshatra_pada})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">{planet.degree.toFixed(2)}°</td>
                        <td className="py-3 px-4">
                          {planet.is_retrograde ? (
                            <span className="text-amber-400">Retrograde</span>
                          ) : (
                            <span className="text-green-400">Direct</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Birth Details */}
          {(kundliData.deity || kundliData.animal_sign || kundliData.lucky_color) && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gold mb-6">Nakshatra Details</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {kundliData.deity && (
                  <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                    <p className="text-cream-muted text-sm">Deity</p>
                    <p className="text-cream font-medium">{kundliData.deity}</p>
                  </div>
                )}
                {kundliData.animal_sign && (
                  <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                    <p className="text-cream-muted text-sm">Animal Symbol</p>
                    <p className="text-cream font-medium">{kundliData.animal_sign}</p>
                  </div>
                )}
                {kundliData.ganam && (
                  <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                    <p className="text-cream-muted text-sm">Ganam</p>
                    <p className="text-cream font-medium">{kundliData.ganam}</p>
                  </div>
                )}
                {kundliData.nadi && (
                  <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                    <p className="text-cream-muted text-sm">Nadi</p>
                    <p className="text-cream font-medium">{kundliData.nadi}</p>
                  </div>
                )}
                {kundliData.lucky_color && (
                  <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                    <p className="text-cream-muted text-sm">Lucky Color</p>
                    <p className="text-cream font-medium">{kundliData.lucky_color}</p>
                  </div>
                )}
                {kundliData.birth_stone && (
                  <div className="bg-midnight/50 border border-border/30 rounded-lg p-4">
                    <p className="text-cream-muted text-sm">Birth Stone</p>
                    <p className="text-cream font-medium">{kundliData.birth_stone}</p>
                  </div>
                )}
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
        {/* Save Profile Dialog */}
        {chartData.kundliId && (
          <SaveProfileDialog
            open={saveDialogOpen}
            onOpenChange={setSaveDialogOpen}
            kundliId={chartData.kundliId}
            defaultName={chartData.name}
            onSuccess={handleSaveSuccess}
          />
        )}
      </div>
    </>
  );
};

export default BirthChartPage;
