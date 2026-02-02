import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarField } from '@/components/StarField';

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
  moon_sign: string;
  moon_sign_id: number;
  moon_sign_lord: string;
  sun_sign: string;
  sun_sign_id: number;
  sun_sign_lord: string;
  ascendant_sign: string;
  ascendant_sign_id: number;
  ascendant_sign_lord: string;
  planetary_positions: PlanetPosition[];
  deity?: string;
  animal_sign?: string;
}

interface AnimatedChartLoadingScreenProps {
  kundliData: KundliData;
  forecastReady: boolean;
  onComplete?: () => void;
}

// Planet configurations
const PLANET_CONFIG: Record<string, { symbol: string; color: string; description: string }> = {
  Ascendant: { symbol: 'લ', color: '#FCD34D', description: 'Your rising sign shapes how the world sees you' },
  Sun: { symbol: '☉', color: '#FCD34D', description: 'Your core identity and life purpose' },
  Moon: { symbol: '☽', color: '#E5E7EB', description: 'Your emotional nature and inner world' },
  Mars: { symbol: '♂', color: '#DC2626', description: 'Your drive, ambition, and courage' },
  Mercury: { symbol: '☿', color: '#10B981', description: 'Your communication and intellect' },
  Jupiter: { symbol: '♃', color: '#FBBF24', description: 'Your wisdom, growth, and good fortune' },
  Venus: { symbol: '♀', color: '#EC4899', description: 'Your love, beauty, and values' },
  Saturn: { symbol: '♄', color: '#3B82F6', description: 'Your discipline, karma, and life lessons' },
  Rahu: { symbol: '☊', color: '#A855F7', description: 'Your desires and future growth direction' },
  Ketu: { symbol: '☋', color: '#A855F7', description: 'Your past mastery and spiritual gifts' },
};

// Reveal order - most important/interesting first
const REVEAL_ORDER = ['Ascendant', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];

// Zodiac signs
const ZODIAC_SIGNS = [
  { name: 'Aries', vedic: 'Mesha', symbol: '♈' },
  { name: 'Taurus', vedic: 'Vrishabha', symbol: '♉' },
  { name: 'Gemini', vedic: 'Mithuna', symbol: '♊' },
  { name: 'Cancer', vedic: 'Karka', symbol: '♋' },
  { name: 'Leo', vedic: 'Simha', symbol: '♌' },
  { name: 'Virgo', vedic: 'Kanya', symbol: '♍' },
  { name: 'Libra', vedic: 'Tula', symbol: '♎' },
  { name: 'Scorpio', vedic: 'Vrishchika', symbol: '♏' },
  { name: 'Sagittarius', vedic: 'Dhanu', symbol: '♐' },
  { name: 'Capricorn', vedic: 'Makara', symbol: '♑' },
  { name: 'Aquarius', vedic: 'Kumbha', symbol: '♒' },
  { name: 'Pisces', vedic: 'Meena', symbol: '♓' },
];

// Calculate house number
const calculateHouse = (planetSignId: number, ascendantSignId: number): number => {
  const house = ((planetSignId - ascendantSignId + 12) % 12) + 1;
  return house;
};

export const AnimatedChartLoadingScreen = ({
  kundliData,
  forecastReady,
  onComplete
}: AnimatedChartLoadingScreenProps) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showForecastReady, setShowForecastReady] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const { planetary_positions, ascendant_sign_id } = kundliData;

  // Filter and sort planets for reveal
  const planets = useMemo(() =>
    planetary_positions.filter(p => p.id !== 100 && p.name !== 'Ascendant'),
    [planetary_positions]
  );

  const ascendantPosition = useMemo(() =>
    planetary_positions.find(p => p.id === 100 || p.name === 'Ascendant'),
    [planetary_positions]
  );

  // Create ordered list for reveal (Ascendant first, then planets)
  const revealItems = useMemo(() => {
    const items: { name: string; planet?: PlanetPosition; sign: string }[] = [];

    // Add Ascendant first
    if (ascendantPosition) {
      items.push({
        name: 'Ascendant',
        planet: ascendantPosition,
        sign: kundliData.ascendant_sign
      });
    }

    // Add planets in reveal order
    REVEAL_ORDER.slice(1).forEach(planetName => {
      const planet = planets.find(p => p.name === planetName);
      if (planet) {
        items.push({ name: planetName, planet, sign: planet.sign });
      }
    });

    return items;
  }, [planets, ascendantPosition, kundliData.ascendant_sign]);

  // Current item being revealed
  const currentItem = revealItems[revealedCount - 1];
  const currentConfig = currentItem ? PLANET_CONFIG[currentItem.name] : null;

  // Reveal planets one by one
  useEffect(() => {
    if (revealedCount >= revealItems.length) {
      setAnimationComplete(true);
      return;
    }

    const delay = revealedCount === 0 ? 1000 : 2500; // First item faster, then 2.5s each
    const timer = setTimeout(() => {
      setRevealedCount(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [revealedCount, revealItems.length]);

  // Handle forecast ready state
  useEffect(() => {
    if (forecastReady && animationComplete) {
      setShowForecastReady(true);
      // Wait a moment before navigating
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    } else if (forecastReady && !animationComplete) {
      // Forecast ready before animation complete - speed up
      // We'll let animation continue but show ready state when done
    }
  }, [forecastReady, animationComplete, onComplete]);

  // Handle animation complete but forecast not ready
  useEffect(() => {
    if (animationComplete && forecastReady) {
      setShowForecastReady(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [animationComplete, forecastReady, onComplete]);

  // Chart dimensions
  const size = 500;
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const zodiacRadius = outerRadius - 40;
  const planetRadius = zodiacRadius - 50;
  const innerRadius = planetRadius - 55;

  // Calculate planet positions
  const getHouseAngle = (houseNum: number): number => -90 - (houseNum - 1) * 30;
  const getHouseCenterAngle = (houseNum: number): number => getHouseAngle(houseNum) - 15;

  const planetPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; house: number }> = {};

    // Ascendant position
    const ascAngle = getHouseCenterAngle(1);
    const ascRadians = (ascAngle * Math.PI) / 180;
    positions['Ascendant'] = {
      x: center + Math.cos(ascRadians) * (planetRadius + 25),
      y: center + Math.sin(ascRadians) * (planetRadius + 25),
      house: 1,
    };

    // Planet positions
    const planetsByHouse: Record<number, PlanetPosition[]> = {};
    planets.forEach(planet => {
      const house = calculateHouse(planet.sign_id, ascendant_sign_id);
      if (!planetsByHouse[house]) planetsByHouse[house] = [];
      planetsByHouse[house].push(planet);
    });

    planets.forEach(planet => {
      const house = calculateHouse(planet.sign_id, ascendant_sign_id);
      const housePlanets = planetsByHouse[house];
      const indexInHouse = housePlanets.indexOf(planet);
      const totalInHouse = housePlanets.length;

      const baseAngle = getHouseCenterAngle(house);
      let offsetAngle = 0;

      if (totalInHouse > 1) {
        const spread = Math.min(20, 8 * totalInHouse);
        offsetAngle = (indexInHouse - (totalInHouse - 1) / 2) * (spread / totalInHouse);
      }

      const finalAngle = baseAngle + offsetAngle;
      const radians = (finalAngle * Math.PI) / 180;

      positions[planet.name] = {
        x: center + Math.cos(radians) * planetRadius,
        y: center + Math.sin(radians) * planetRadius,
        house,
      };
    });

    return positions;
  }, [planets, ascendant_sign_id, center, planetRadius]);

  // House divisions
  const houseDivisions = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 12; i++) {
      const houseNum = i + 1;
      const angle = (getHouseAngle(houseNum) * Math.PI) / 180;
      lines.push({
        x1: center + Math.cos(angle) * innerRadius,
        y1: center + Math.sin(angle) * innerRadius,
        x2: center + Math.cos(angle) * outerRadius,
        y2: center + Math.sin(angle) * outerRadius,
      });
    }
    return lines;
  }, [center, innerRadius, outerRadius]);

  // Zodiac positions
  const zodiacPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 12; i++) {
      const houseNum = i + 1;
      const angle = (getHouseCenterAngle(houseNum) * Math.PI) / 180;
      const signIndex = (ascendant_sign_id - 1 + i) % 12;
      positions.push({
        x: center + Math.cos(angle) * (zodiacRadius - 5),
        y: center + Math.sin(angle) * (zodiacRadius - 5),
        ...ZODIAC_SIGNS[signIndex],
      });
    }
    return positions;
  }, [center, zodiacRadius, ascendant_sign_id]);

  return (
    <div className="relative min-h-screen bg-celestial flex flex-col items-center justify-start overflow-y-auto">
      <StarField />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mx-auto pt-8 pb-12 sm:pt-16 sm:justify-center sm:min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-2">
            Mapping Your Birth Chart
          </h2>
          <p className="text-cream/60 text-sm">
            Discovering the celestial blueprint of your birth
          </p>
        </motion.div>

        {/* Animated Chart */}
        <div className="relative mb-6">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[400px] h-auto"
          >
            <defs>
              <radialGradient id="loadingBgGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </radialGradient>
              {Object.entries(PLANET_CONFIG).map(([name, config]) => (
                <filter key={name} id={`loading-glow-${name}`} x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feFlood floodColor={config.color} floodOpacity="0.6"/>
                  <feComposite in2="coloredBlur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              ))}
            </defs>

            {/* Background circle */}
            <motion.circle
              cx={center}
              cy={center}
              r={outerRadius}
              fill="url(#loadingBgGradient)"
              stroke="#8B7355"
              strokeWidth="1"
              strokeOpacity="0.3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Inner circle */}
            <motion.circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="url(#loadingBgGradient)"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeOpacity="0.2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />

            {/* House divisions */}
            {houseDivisions.map((line, i) => (
              <motion.line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeOpacity="0.15"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.15 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.02 }}
              />
            ))}

            {/* Zodiac symbols */}
            {zodiacPositions.map((pos, i) => (
              <motion.text
                key={i}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#b8a070"
                fontSize="14"
                fontFamily="serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.02 }}
              >
                {pos.symbol}
              </motion.text>
            ))}

            {/* Center emblem */}
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <circle
                cx={center}
                cy={center}
                r={40}
                fill="url(#loadingBgGradient)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeOpacity="0.6"
              />
              <text
                x={center}
                y={center}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f59e0b"
                fontSize="28"
                fontFamily="serif"
              >
                {ZODIAC_SIGNS.find(z => z.vedic === kundliData.ascendant_sign)?.symbol || '♎'}
              </text>
            </motion.g>

            {/* Revealed planets */}
            {revealItems.slice(0, revealedCount).map((item, index) => {
              const config = PLANET_CONFIG[item.name];
              const pos = planetPositions[item.name];
              if (!pos || !config) return null;

              return (
                <motion.g
                  key={item.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  filter={`url(#loading-glow-${item.name})`}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={22}
                    fill={config.color}
                    opacity={0.15}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={26}
                    fill="none"
                    stroke={config.color}
                    strokeWidth="1.5"
                    opacity={0.3}
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FFFFFF"
                    fontSize="22"
                    fontWeight="bold"
                  >
                    {config.symbol}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Current planet info card */}
        <div className="h-32 flex items-center justify-center w-full max-w-md">
          <AnimatePresence mode="wait">
            {currentItem && currentConfig && !showForecastReady && (
              <motion.div
                key={currentItem.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-midnight/60 backdrop-blur-lg border border-gold/20 rounded-xl p-4 w-full"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-2xl"
                    style={{ color: currentConfig.color }}
                  >
                    {currentConfig.symbol}
                  </span>
                  <div>
                    <span className="text-cream font-semibold">{currentItem.name}</span>
                    <span className="text-cream/60 mx-2">in</span>
                    <span className="text-gold font-medium">{currentItem.sign}</span>
                  </div>
                </div>
                <p className="text-cream/70 text-sm italic">
                  {currentConfig.description}
                </p>
              </motion.div>
            )}

            {showForecastReady && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-cream mb-1">Your Forecast is Ready!</h3>
                <p className="text-cream/60 text-sm">Revealing your cosmic insights...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1.5 mt-4">
          {revealItems.map((_, index) => (
            <motion.div
              key={index}
              className="w-2 h-2 rounded-full"
              initial={{ backgroundColor: 'rgba(217, 168, 73, 0.2)' }}
              animate={{
                backgroundColor: index < revealedCount
                  ? 'rgba(217, 168, 73, 1)'
                  : 'rgba(217, 168, 73, 0.2)'
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
