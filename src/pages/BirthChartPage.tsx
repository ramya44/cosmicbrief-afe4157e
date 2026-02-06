import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from '@/lib/deviceId';
import { Button } from '@/components/ui/button';
import { StarField } from '@/components/StarField';
import { BirthChartWheel } from '@/components/BirthChartWheel';
import { NorthIndianChart } from '@/components/NorthIndianChart';
import { SouthIndianChart } from '@/components/SouthIndianChart';
import { useForecastStore } from '@/store/forecastStore';
import { Sparkles, Calendar, Clock, MapPin, Share2 } from 'lucide-react';
import { toast } from 'sonner';

type ChartStyle = 'western' | 'north-indian' | 'south-indian';

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

const BirthChartPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kundliIdFromUrl = searchParams.get('id');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('western');
  const { clearSession } = useForecastStore();

  const handleNewBirthDetails = () => {
    // Clear session storage
    sessionStorage.removeItem('birth_chart_data');
    // Clear Zustand store
    clearSession();
    // Navigate to input page
    navigate('/get-birth-chart');
  };

  useEffect(() => {
    const loadData = async () => {
      // First try to load from URL parameter (shared link)
      if (kundliIdFromUrl) {
        try {
          const deviceId = getDeviceId();
          // Try as owner first, then as shared
          let { data } = await supabase.functions.invoke('get-vedic-kundli-details', {
            body: { kundli_id: kundliIdFromUrl, device_id: deviceId },
          });

          if (!data) {
            // Try as shared link
            const sharedResult = await supabase.functions.invoke('get-vedic-kundli-details', {
              body: { kundli_id: kundliIdFromUrl, shared: true },
            });
            data = sharedResult.data;
          }

          if (data && data.planetary_positions) {
            setChartData({
              birthDate: data.birth_date,
              birthTime: data.birth_time,
              birthPlace: data.birth_place,
              name: data.name,
              email: data.email,
              lat: 0,
              lon: 0,
              kundliId: data.id,
              kundliData: {
                nakshatra: data.nakshatra || '',
                nakshatra_id: data.nakshatra_id || 1,
                nakshatra_pada: data.nakshatra_pada || 1,
                nakshatra_lord: data.nakshatra_lord || '',
                moon_sign: data.moon_sign || '',
                moon_sign_id: data.moon_sign_id || 1,
                moon_sign_lord: data.moon_sign_lord || '',
                sun_sign: data.sun_sign || '',
                sun_sign_id: data.sun_sign_id || 1,
                sun_sign_lord: data.sun_sign_lord || '',
                ascendant_sign: data.ascendant_sign || '',
                ascendant_sign_id: data.ascendant_sign_id || 1,
                ascendant_sign_lord: data.ascendant_sign_lord || '',
                planetary_positions: data.planetary_positions,
                animal_sign: data.animal_sign,
                deity: data.deity,
              },
            });
            setLoading(false);
            return;
          }
        } catch {
          // Fall through to sessionStorage
        }
      }

      // Fall back to sessionStorage
      const storedData = sessionStorage.getItem('birth_chart_data');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setChartData(parsed);
        } catch {
          navigate('/get-birth-chart');
        }
      } else {
        navigate('/get-birth-chart');
      }
      setLoading(false);
    };

    loadData();
  }, [navigate, kundliIdFromUrl]);

  const handleShare = async () => {
    // Build shareable URL with kundliId
    const shareUrl = chartData?.kundliId
      ? `${window.location.origin}/#/birth-chart?id=${chartData.kundliId}`
      : window.location.href;

    const shareData = {
      title: 'My Vedic Birth Chart | Cosmic Brief',
      text: `Check out my Vedic birth chart - ${kundliData?.ascendant_sign} Ascendant, ${kundliData?.moon_sign} Moon`,
      url: shareUrl,
    };

    // Check if native share is available (iOS/mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed - ignore
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading || !chartData) {
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

          {/* Chart Style Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setChartStyle('western')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartStyle === 'western'
                  ? 'bg-gold text-midnight'
                  : 'bg-secondary/50 text-cream-muted hover:bg-secondary hover:text-cream border border-border/30'
              }`}
            >
              Western
            </button>
            <button
              onClick={() => setChartStyle('north-indian')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartStyle === 'north-indian'
                  ? 'bg-gold text-midnight'
                  : 'bg-secondary/50 text-cream-muted hover:bg-secondary hover:text-cream border border-border/30'
              }`}
            >
              North Indian
            </button>
            <button
              onClick={() => setChartStyle('south-indian')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                chartStyle === 'south-indian'
                  ? 'bg-gold text-midnight'
                  : 'bg-secondary/50 text-cream-muted hover:bg-secondary hover:text-cream border border-border/30'
              }`}
            >
              South Indian
            </button>
          </div>

          {/* Birth Chart */}
          <section className="mb-16">
            {chartStyle === 'western' && (
              <BirthChartWheel chartData={kundliData} />
            )}
            {chartStyle === 'north-indian' && (
              <NorthIndianChart
                positions={planetary_positions}
                ascendantSignId={ascendant_sign_id}
              />
            )}
            {chartStyle === 'south-indian' && (
              <SouthIndianChart
                positions={planetary_positions}
                ascendantSignId={ascendant_sign_id}
              />
            )}
          </section>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              className="border-gold/40 text-gold hover:bg-gold/10"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
          </div>
          <div className="flex justify-center mb-16">
            <button
              onClick={handleNewBirthDetails}
              className="text-sm text-cream-muted hover:text-cream transition-colors underline underline-offset-2"
            >
              Enter different birth details
            </button>
          </div>



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
