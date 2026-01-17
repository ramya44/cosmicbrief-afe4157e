import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface BirthChartWheelProps {
  chartData: KundliData;
}

// Refined planet colors - vibrant focal points
const PLANET_CONFIG: Record<string, { symbol: string; color: string; glowColor: string }> = {
  Sun: { symbol: '☉', color: '#FCD34D', glowColor: '#FCD34D' },           // Bright gold
  Moon: { symbol: '☽', color: '#E5E7EB', glowColor: '#E5E7EB' },          // Silver/white
  Mars: { symbol: '♂', color: '#DC2626', glowColor: '#DC2626' },          // Red
  Mercury: { symbol: '☿', color: '#10B981', glowColor: '#10B981' },       // Green
  Jupiter: { symbol: '♃', color: '#FBBF24', glowColor: '#FBBF24' },       // Yellow-gold
  Venus: { symbol: '♀', color: '#EC4899', glowColor: '#EC4899' },         // Pink
  Saturn: { symbol: '♄', color: '#3B82F6', glowColor: '#3B82F6' },        // Blue
  Rahu: { symbol: '☊', color: '#A855F7', glowColor: '#A855F7' },          // Purple
  Ketu: { symbol: '☋', color: '#A855F7', glowColor: '#A855F7' },          // Purple
  Ascendant: { symbol: 'લ', color: '#FCD34D', glowColor: '#FCD34D' },     // Gold
};

// Zodiac signs with their symbols
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

// Calculate house number using Whole Sign system
const calculateHouse = (planetSignId: number, ascendantSignId: number): number => {
  const house = ((planetSignId - ascendantSignId + 12) % 12) + 1;
  return house;
};

export const BirthChartWheel = ({ chartData }: BirthChartWheelProps) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { planetary_positions, ascendant_sign_id } = chartData;

  // Filter planets (exclude Ascendant from regular planets)
  const planets = useMemo(() => 
    planetary_positions.filter(p => p.id !== 100 && p.name !== 'Ascendant'),
    [planetary_positions]
  );

  // Find the Ascendant position for display
  const ascendantPosition = useMemo(() => 
    planetary_positions.find(p => p.id === 100 || p.name === 'Ascendant'),
    [planetary_positions]
  );

  // Chart dimensions
  const size = 600;
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const zodiacRadius = outerRadius - 45;
  const planetRadius = zodiacRadius - 55;
  const innerRadius = planetRadius - 65;
  const nakshatraRadius = outerRadius - 8;

  // Get ordinal suffix
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Calculate angle for a house number (1-12)
  const getHouseAngle = (houseNum: number): number => {
    return -90 - (houseNum - 1) * 30;
  };

  // Get center angle for a house
  const getHouseCenterAngle = (houseNum: number): number => {
    return getHouseAngle(houseNum) - 15;
  };

  // Calculate planet positions in the wheel based on their HOUSE placement
  // Priority order for visibility when planets overlap
  const PLANET_PRIORITY: Record<string, number> = {
    'Sun': 1,
    'Moon': 2,
    'Mars': 3,
    'Mercury': 4,
    'Jupiter': 5,
    'Venus': 6,
    'Saturn': 7,
    'Rahu': 8,
    'Ketu': 9,
  };

  // Calculate planet positions with smart collision detection
  const planetPositions = useMemo(() => {
    const planetsByHouse: Record<number, PlanetPosition[]> = {};
    
    // Group planets by house
    planets.forEach(planet => {
      const house = calculateHouse(planet.sign_id, ascendant_sign_id);
      if (!planetsByHouse[house]) {
        planetsByHouse[house] = [];
      }
      planetsByHouse[house].push(planet);
    });

    // Sort planets within each house by priority (most important first)
    Object.values(planetsByHouse).forEach(housePlanets => {
      housePlanets.sort((a, b) => {
        const priorityA = PLANET_PRIORITY[a.name] || 10;
        const priorityB = PLANET_PRIORITY[b.name] || 10;
        return priorityA - priorityB;
      });
    });

    // Minimum spacing in pixels (adjusted for mobile)
    const minSpacing = 50;
    const radialOffset = 28; // How much to offset inward/outward

    return planets.map(planet => {
      const house = calculateHouse(planet.sign_id, ascendant_sign_id);
      const housePlanets = planetsByHouse[house];
      const indexInHouse = housePlanets.indexOf(planet);
      const totalInHouse = housePlanets.length;

      const baseAngle = getHouseCenterAngle(house);
      
      let offsetAngle = 0;
      let radiusOffset = 0;

      if (totalInHouse === 1) {
        // Single planet - center it
        offsetAngle = 0;
        radiusOffset = 0;
      } else if (totalInHouse === 2) {
        // Two planets - spread horizontally within house
        const angleSpread = 12;
        offsetAngle = indexInHouse === 0 ? -angleSpread / 2 : angleSpread / 2;
        radiusOffset = 0;
      } else if (totalInHouse === 3) {
        // Three planets - triangle arrangement
        if (indexInHouse === 0) {
          offsetAngle = 0;
          radiusOffset = radialOffset; // Top priority moves outward
        } else if (indexInHouse === 1) {
          offsetAngle = -10;
          radiusOffset = -radialOffset / 2; // Move inward left
        } else {
          offsetAngle = 10;
          radiusOffset = -radialOffset / 2; // Move inward right
        }
      } else if (totalInHouse === 4) {
        // Four planets - diamond/square arrangement
        const patterns = [
          { angle: 0, radius: radialOffset },      // Top (outward)
          { angle: -12, radius: 0 },               // Left (middle)
          { angle: 12, radius: 0 },                // Right (middle)
          { angle: 0, radius: -radialOffset },     // Bottom (inward)
        ];
        offsetAngle = patterns[indexInHouse].angle;
        radiusOffset = patterns[indexInHouse].radius;
      } else {
        // 5+ planets - staggered arc with radial variation
        const maxAngleSpread = 22;
        const angleStep = maxAngleSpread / Math.max(totalInHouse - 1, 1);
        offsetAngle = (indexInHouse - (totalInHouse - 1) / 2) * angleStep;
        
        // Alternate between inner and outer radius
        if (indexInHouse % 3 === 0) {
          radiusOffset = radialOffset; // Outer
        } else if (indexInHouse % 3 === 1) {
          radiusOffset = 0; // Middle
        } else {
          radiusOffset = -radialOffset; // Inner
        }
      }

      const finalAngle = baseAngle + offsetAngle;
      const radians = (finalAngle * Math.PI) / 180;
      const adjustedRadius = planetRadius + radiusOffset;

      return {
        ...planet,
        house,
        angle: finalAngle,
        radians,
        radiusOffset,
        x: center + Math.cos(radians) * adjustedRadius,
        y: center + Math.sin(radians) * adjustedRadius,
      };
    });
  }, [planets, ascendant_sign_id, center, planetRadius]);

  // Draw house divisions
  const houseDivisions = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 12; i++) {
      const houseNum = i + 1;
      const angle = (getHouseAngle(houseNum) * Math.PI) / 180;
      const x1 = center + Math.cos(angle) * innerRadius;
      const y1 = center + Math.sin(angle) * innerRadius;
      const x2 = center + Math.cos(angle) * outerRadius;
      const y2 = center + Math.sin(angle) * outerRadius;
      lines.push({ x1, y1, x2, y2, house: houseNum });
    }
    return lines;
  }, [center, innerRadius, outerRadius]);

  // Nakshatra boundaries (27 divisions)
  const nakshatraBoundaries = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 27; i++) {
      const nakshatraAngle = i * (360 / 27);
      const signOffset = (ascendant_sign_id - 1) * 30;
      const chartAngle = -90 - (nakshatraAngle - signOffset);
      const radians = (chartAngle * Math.PI) / 180;
      
      const x1 = center + Math.cos(radians) * (zodiacRadius + 5);
      const y1 = center + Math.sin(radians) * (zodiacRadius + 5);
      const x2 = center + Math.cos(radians) * nakshatraRadius;
      const y2 = center + Math.sin(radians) * nakshatraRadius;
      lines.push({ x1, y1, x2, y2 });
    }
    return lines;
  }, [center, zodiacRadius, nakshatraRadius, ascendant_sign_id]);

  // House number positions
  const houseNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 0; i < 12; i++) {
      const houseNum = i + 1;
      const angle = (getHouseCenterAngle(houseNum) * Math.PI) / 180;
      const x = center + Math.cos(angle) * (outerRadius - 18);
      const y = center + Math.sin(angle) * (outerRadius - 18);
      const signIndex = (ascendant_sign_id - 1 + i) % 12;
      numbers.push({ x, y, house: houseNum, signIndex });
    }
    return numbers;
  }, [center, outerRadius, ascendant_sign_id]);

  // Zodiac sign symbol positions
  const zodiacPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 12; i++) {
      const houseNum = i + 1;
      const angle = (getHouseCenterAngle(houseNum) * Math.PI) / 180;
      const x = center + Math.cos(angle) * (zodiacRadius - 8);
      const y = center + Math.sin(angle) * (zodiacRadius - 8);
      const signIndex = (ascendant_sign_id - 1 + i) % 12;
      positions.push({ x, y, ...ZODIAC_SIGNS[signIndex], houseNum });
    }
    return positions;
  }, [center, zodiacRadius, ascendant_sign_id]);

  // Find Sun and Moon for glassmorphism cards
  const sunPosition = planets.find(p => p.name === 'Sun');
  const moonPosition = planets.find(p => p.name === 'Moon');

  // Ascendant position for display on the wheel
  const ascendantDisplayPos = useMemo(() => {
    const angle = getHouseCenterAngle(1);
    const radians = (angle * Math.PI) / 180;
    const radius = planetRadius + 30;
    return {
      x: center + Math.cos(radians) * radius,
      y: center + Math.sin(radians) * radius,
    };
  }, [center, planetRadius]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Main Chart */}
      <div className="relative">
        {/* Subtle background glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #FCD34D 0%, transparent 60%)',
          }}
        />
        
        <svg 
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[600px] h-auto md:w-[600px] md:h-[600px] relative z-10"
          style={{ minWidth: '320px', maxWidth: '600px' }}
        >
          <defs>
            {/* Radial gradient for background depth */}
            <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </radialGradient>

            {/* Zodiac ring subtle background */}
            <radialGradient id="zodiacRingBg" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1a2332" />
            </radialGradient>

            {/* Starry pattern - subtle */}
            <pattern id="stars" width="100" height="100" patternUnits="userSpaceOnUse">
              {[...Array(15)].map((_, i) => (
                <circle
                  key={i}
                  cx={Math.random() * 100}
                  cy={Math.random() * 100}
                  r={Math.random() * 0.6 + 0.1}
                  fill="white"
                  opacity={Math.random() * 0.3 + 0.1}
                />
              ))}
            </pattern>
            
            {/* Enhanced planet glow filters with drop shadow and inner glow */}
            {Object.entries(PLANET_CONFIG).map(([name, config]) => (
              <filter key={name} id={`glow-${name}`} x="-150%" y="-150%" width="400%" height="400%">
                {/* Drop shadow */}
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.4)" />
                {/* Outer glow */}
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feFlood floodColor={config.glowColor} floodOpacity="0.5"/>
                <feComposite in2="coloredBlur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}

            {/* Hover glow filter - 50% more intense */}
            {Object.entries(PLANET_CONFIG).map(([name, config]) => (
              <filter key={`hover-${name}`} id={`glow-hover-${name}`} x="-150%" y="-150%" width="400%" height="400%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.5)" />
                <feGaussianBlur stdDeviation="9" result="coloredBlur"/>
                <feFlood floodColor={config.glowColor} floodOpacity="0.75"/>
                <feComposite in2="coloredBlur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
            
            {/* Subtle outer ring gradient */}
            <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B7355" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#8B7355" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B7355" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Outer background circle with radial gradient */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="url(#bgGradient)"
            stroke="url(#outerGradient)"
            strokeWidth="1.5"
          />
          
          {/* Subtle star pattern overlay */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius - 1}
            fill="url(#stars)"
            opacity="0.25"
          />

          {/* Nakshatra boundaries - very subtle */}
          {nakshatraBoundaries.map((line, i) => (
            <line
              key={`nakshatra-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#8B7355"
              strokeWidth="0.5"
              strokeDasharray="2,4"
              opacity="0.2"
            />
          ))}

          {/* Zodiac ring background - subtle separation */}
          <circle
            cx={center}
            cy={center}
            r={zodiacRadius}
            fill="none"
            stroke="#8B7355"
            strokeWidth="1"
            opacity="0.15"
          />

          {/* Inner circle */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="url(#bgGradient)"
            stroke="#f59e0b"
            strokeWidth="1"
            opacity="0.15"
          />

          {/* House division lines - reduced to 15% opacity */}
          {houseDivisions.map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#f59e0b"
              strokeWidth="1"
              opacity="0.15"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
            />
          ))}

          {/* House numbers - visible gold at 60% opacity */}
          {houseNumbers.map((pos, i) => (
            <motion.text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f59e0b"
              fontSize="18"
              fontWeight="600"
              className="select-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.03 }}
            >
              {pos.house}
            </motion.text>
          ))}

          {/* Zodiac symbols - muted brass/gold at 40% opacity */}
          {zodiacPositions.map((pos, i) => (
            <motion.text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#b8a070"
              fontSize="16"
              fontWeight="500"
              fontFamily="serif"
              className="select-none"
              style={{ 
                opacity: 0.6,
                // Force text rendering to prevent emoji colorization
                fontVariantEmoji: 'text',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.02 }}
            >
              {pos.symbol}
            </motion.text>
          ))}

          {/* Ascendant marker (લ symbol) - with hover interactivity */}
          {ascendantPosition && (
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 1.1 : 1 
              }}
              transition={{ duration: 0.2, delay: 1 }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => {
                setHoveredPlanet({
                  ...ascendantPosition,
                  id: 100,
                  name: 'Ascendant',
                });
                setTooltipPos({ x: ascendantDisplayPos.x, y: ascendantDisplayPos.y });
              }}
              onMouseLeave={() => {
                setHoveredPlanet(null);
                setTooltipPos(null);
              }}
              onClick={() => setSelectedPlanet(
                selectedPlanet?.id === 100 
                  ? null 
                  : { ...ascendantPosition, id: 100, name: 'Ascendant' }
              )}
              filter={hoveredPlanet?.id === 100 ? "url(#glow-hover-Ascendant)" : "url(#glow-Ascendant)"}
            >
              {/* Inner glow circle */}
              <circle
                cx={ascendantDisplayPos.x}
                cy={ascendantDisplayPos.y}
                r={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 26 : 24}
                fill="#FCD34D"
                opacity={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 0.25 : 0.15}
              />
              {/* Outer ring */}
              <circle
                cx={ascendantDisplayPos.x}
                cy={ascendantDisplayPos.y}
                r={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 30 : 28}
                fill="none"
                stroke="#FCD34D"
                strokeWidth="1.5"
                opacity={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 0.35 : 0.2}
              />
              {/* Symbol - crisp white */}
              <text
                x={ascendantDisplayPos.x}
                y={ascendantDisplayPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontSize={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 26 : 24}
                fontWeight="bold"
                className="select-none"
              >
                લ
              </text>
            </motion.g>
          )}

          {/* Planets - vibrant focal points */}
          {planetPositions.map((planet, i) => {
            const config = PLANET_CONFIG[planet.name] || { symbol: '?', color: '#FFFFFF', glowColor: '#FFFFFF' };
            const isHovered = hoveredPlanet?.id === planet.id;
            const isSelected = selectedPlanet?.id === planet.id;
            const isActive = isHovered || isSelected;

            return (
              <motion.g
                key={planet.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ 
                  duration: 0.2,
                  delay: 0.8 + i * 0.08,
                  scale: { duration: 0.2, ease: 'easeInOut' }
                }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => {
                  setHoveredPlanet(planet);
                  setTooltipPos({ x: planet.x, y: planet.y });
                }}
                onMouseLeave={() => {
                  setHoveredPlanet(null);
                  setTooltipPos(null);
                }}
                onClick={() => setSelectedPlanet(selectedPlanet?.id === planet.id ? null : planet)}
                filter={isActive ? `url(#glow-hover-${planet.name})` : `url(#glow-${planet.name})`}
              >
                {/* Inner glow - 20% opacity, matches planet color */}
                <circle
                  cx={planet.x}
                  cy={planet.y}
                  r={isActive ? 28 : 25}
                  fill={config.color}
                  opacity={isActive ? 0.25 : 0.15}
                  style={{ transition: 'all 0.2s ease-in-out' }}
                />
                
                {/* Outer ring */}
                <circle
                  cx={planet.x}
                  cy={planet.y}
                  r={isActive ? 32 : 29}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="1.5"
                  opacity={isActive ? 0.4 : 0.2}
                  style={{ transition: 'all 0.2s ease-in-out' }}
                />
                
                {/* Planet symbol - crisp white */}
                <text
                  x={planet.x}
                  y={planet.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
                  fontSize={isActive ? 28 : 25}
                  fontWeight="bold"
                  className="select-none"
                  style={{ transition: 'font-size 0.2s ease-in-out' }}
                >
                  {config.symbol}
                </text>

                {/* Degree label - muted gray, smaller, 70% opacity */}
                <text
                  x={planet.x}
                  y={planet.y + 32}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="7"
                  opacity={isActive ? 0.9 : 0.7}
                  className="select-none"
                  style={{ transition: 'opacity 0.2s ease-in-out' }}
                >
                  {planet.sign.substring(0, 3)} {planet.degree.toFixed(0)}°
                </text>
              </motion.g>
            );
          })}

          {/* Center emblem - zodiac symbol with sign name */}
          <motion.g
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <circle
              cx={center}
              cy={center}
              r={48}
              fill="url(#bgGradient)"
              stroke="#f59e0b"
              strokeWidth="1.5"
              opacity="0.8"
            />
            {/* Large zodiac symbol - lookup by Vedic name */}
            <text
              x={center}
              y={center - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f59e0b"
              fontSize="32"
              fontFamily="serif"
              fontWeight="normal"
              className="select-none"
              style={{ fontVariantEmoji: 'text' }}
            >
              {ZODIAC_SIGNS.find(z => z.vedic === chartData.ascendant_sign)?.symbol || '♎'}
            </text>
            {/* Small sign name below */}
            <text
              x={center}
              y={center + 28}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="10"
              fontWeight="500"
              opacity="0.8"
              className="select-none"
            >
              {chartData.ascendant_sign}
            </text>
          </motion.g>
        </svg>

        {/* Tooltip on hover - positioned near the planet */}
        <AnimatePresence>
          {hoveredPlanet && !selectedPlanet && tooltipPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 pointer-events-none"
              style={{
                left: `${(tooltipPos.x / 600) * 100}%`,
                top: `${(tooltipPos.y / 600) * 100}%`,
                transform: 'translate(-50%, -130%)',
              }}
            >
              <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-[#8B7355]/30 rounded-xl p-3 shadow-2xl min-w-[170px]">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-lg"
                    style={{ color: PLANET_CONFIG[hoveredPlanet.name]?.color }}
                  >
                    {PLANET_CONFIG[hoveredPlanet.name]?.symbol}
                  </span>
                  <span className="text-white font-semibold text-sm">{hoveredPlanet.name}</span>
                  {hoveredPlanet.is_retrograde && (
                    <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">R</span>
                  )}
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-[#9CA3AF]">
                    <span className="text-[#E5E7EB]">Sign:</span> {hoveredPlanet.sign}
                  </p>
                  <p className="text-[#9CA3AF]">
                    <span className="text-[#E5E7EB]">Degree:</span> {hoveredPlanet.degree.toFixed(2)}°
                  </p>
                  <p className="text-[#9CA3AF]">
                    <span className="text-[#E5E7EB]">House:</span> {getOrdinal(calculateHouse(hoveredPlanet.sign_id, ascendant_sign_id))}
                  </p>
                  {hoveredPlanet.nakshatra && (
                    <p className="text-[#9CA3AF]">
                      <span className="text-[#E5E7EB]">Nakshatra:</span> {hoveredPlanet.nakshatra}
                      {hoveredPlanet.nakshatra_pada && ` (P${hoveredPlanet.nakshatra_pada})`}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Planet Details Panel */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-xl overflow-hidden"
          >
            <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-[#8B7355]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-4xl"
                    style={{ color: PLANET_CONFIG[selectedPlanet.name]?.color }}
                  >
                    {PLANET_CONFIG[selectedPlanet.name]?.symbol}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedPlanet.name}</h3>
                    {selectedPlanet.is_retrograde && (
                      <span className="text-xs text-amber-400">Retrograde</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlanet(null)}
                  className="text-[#9CA3AF] hover:text-white transition-colors text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1e293b]/50 rounded-lg p-3">
                  <p className="text-[#9CA3AF] text-xs mb-1">Sign</p>
                  <p className="text-white font-medium">{selectedPlanet.sign}</p>
                </div>
                <div className="bg-[#1e293b]/50 rounded-lg p-3">
                  <p className="text-[#9CA3AF] text-xs mb-1">Degree</p>
                  <p className="text-white font-medium">{selectedPlanet.degree.toFixed(2)}°</p>
                </div>
                <div className="bg-[#1e293b]/50 rounded-lg p-3">
                  <p className="text-[#9CA3AF] text-xs mb-1">House</p>
                  <p className="text-white font-medium">{getOrdinal(calculateHouse(selectedPlanet.sign_id, ascendant_sign_id))}</p>
                </div>
                <div className="bg-[#1e293b]/50 rounded-lg p-3">
                  <p className="text-[#9CA3AF] text-xs mb-1">Sign Lord</p>
                  <p className="text-white font-medium">{selectedPlanet.sign_lord}</p>
                </div>
                {selectedPlanet.nakshatra && (
                  <>
                    <div className="bg-[#1e293b]/50 rounded-lg p-3">
                      <p className="text-[#9CA3AF] text-xs mb-1">Nakshatra</p>
                      <p className="text-white font-medium">{selectedPlanet.nakshatra}</p>
                    </div>
                    {selectedPlanet.nakshatra_pada && (
                      <div className="bg-[#1e293b]/50 rounded-lg p-3">
                        <p className="text-[#9CA3AF] text-xs mb-1">Pada</p>
                        <p className="text-white font-medium">{selectedPlanet.nakshatra_pada}</p>
                      </div>
                    )}
                    {selectedPlanet.nakshatra_lord && (
                      <div className="bg-[#1e293b]/50 rounded-lg p-3">
                        <p className="text-[#9CA3AF] text-xs mb-1">Nakshatra Lord</p>
                        <p className="text-white font-medium">{selectedPlanet.nakshatra_lord}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism Cards - mobile optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl">
        {/* Ascendant Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="bg-gradient-to-br from-[#FCD34D]/10 to-[#FCD34D]/5 backdrop-blur-lg border border-[#FCD34D]/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-[#FCD34D]/15 flex items-center justify-center">
            <span className="text-lg sm:text-2xl text-[#FCD34D]">લ</span>
          </div>
          <p className="text-[#9CA3AF] text-xs sm:text-sm mb-0.5 sm:mb-1">Ascendant (Lagna)</p>
          <p className="text-white font-semibold text-base sm:text-xl">{chartData.ascendant_sign}</p>
          {ascendantPosition && (
            <p className="text-[#FCD34D]/70 text-xs sm:text-sm mt-0.5 sm:mt-1">{ascendantPosition.degree.toFixed(1)}°</p>
          )}
          <p className="text-[#9CA3AF] text-[10px] sm:text-xs mt-0.5 sm:mt-1">Lord: {chartData.ascendant_sign_lord}</p>
        </motion.div>

        {/* Birth Nakshatra Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-gradient-to-br from-[#10B981]/10 to-[#10B981]/5 backdrop-blur-lg border border-[#10B981]/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-[#10B981]/15 flex items-center justify-center">
            <span className="text-lg sm:text-2xl text-[#10B981]">✧</span>
          </div>
          <p className="text-[#9CA3AF] text-xs sm:text-sm mb-0.5 sm:mb-1">Birth Nakshatra</p>
          <p className="text-white font-semibold text-base sm:text-xl">{chartData.nakshatra}</p>
          <p className="text-[#10B981]/70 text-xs sm:text-sm mt-0.5 sm:mt-1">Pada {chartData.nakshatra_pada}</p>
          <p className="text-[#9CA3AF] text-[10px] sm:text-xs mt-0.5 sm:mt-1">Lord: {chartData.nakshatra_lord}</p>
        </motion.div>

        {/* Moon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="bg-gradient-to-br from-[#E5E7EB]/10 to-[#E5E7EB]/5 backdrop-blur-lg border border-[#E5E7EB]/15 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-[#E5E7EB]/15 flex items-center justify-center">
            <span className="text-lg sm:text-2xl text-[#E5E7EB]" style={{ fontFamily: 'serif' }}>☽</span>
          </div>
          <p className="text-[#9CA3AF] text-xs sm:text-sm mb-0.5 sm:mb-1">Moon (Chandra)</p>
          <p className="text-white font-semibold text-base sm:text-xl">{chartData.moon_sign}</p>
          {moonPosition && (
            <p className="text-[#E5E7EB]/70 text-xs sm:text-sm mt-0.5 sm:mt-1">{moonPosition.degree.toFixed(1)}°</p>
          )}
          <p className="text-[#9CA3AF] text-[10px] sm:text-xs mt-0.5 sm:mt-1">Lord: {chartData.moon_sign_lord}</p>
        </motion.div>

        {/* Sun Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
          className="bg-gradient-to-br from-[#FCD34D]/10 to-[#FCD34D]/5 backdrop-blur-lg border border-[#FCD34D]/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-[#FCD34D]/15 flex items-center justify-center">
            <span className="text-lg sm:text-2xl text-[#FCD34D]" style={{ fontFamily: 'serif' }}>☉</span>
          </div>
          <p className="text-[#9CA3AF] text-xs sm:text-sm mb-0.5 sm:mb-1">Sun (Surya)</p>
          <p className="text-white font-semibold text-base sm:text-xl">{chartData.sun_sign}</p>
          {sunPosition && (
            <p className="text-[#FCD34D]/70 text-xs sm:text-sm mt-0.5 sm:mt-1">{sunPosition.degree.toFixed(1)}°</p>
          )}
          <p className="text-[#9CA3AF] text-[10px] sm:text-xs mt-0.5 sm:mt-1">Lord: {chartData.sun_sign_lord}</p>
        </motion.div>
      </div>
    </div>
  );
};
