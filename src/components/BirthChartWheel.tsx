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

// Planet symbols and colors
const PLANET_CONFIG: Record<string, { symbol: string; color: string; glowColor: string }> = {
  Sun: { symbol: '☉', color: 'hsl(45, 93%, 58%)', glowColor: 'hsl(45, 93%, 58%)' },
  Moon: { symbol: '☽', color: 'hsl(210, 20%, 85%)', glowColor: 'hsl(210, 40%, 70%)' },
  Mars: { symbol: '♂', color: 'hsl(0, 72%, 60%)', glowColor: 'hsl(0, 72%, 50%)' },
  Mercury: { symbol: '☿', color: 'hsl(142, 70%, 60%)', glowColor: 'hsl(142, 70%, 50%)' },
  Jupiter: { symbol: '♃', color: 'hsl(48, 96%, 65%)', glowColor: 'hsl(48, 96%, 55%)' },
  Venus: { symbol: '♀', color: 'hsl(330, 80%, 75%)', glowColor: 'hsl(330, 80%, 65%)' },
  Saturn: { symbol: '♄', color: 'hsl(210, 60%, 60%)', glowColor: 'hsl(210, 60%, 50%)' },
  Rahu: { symbol: '☊', color: 'hsl(270, 60%, 65%)', glowColor: 'hsl(270, 60%, 55%)' },
  Ketu: { symbol: '☋', color: 'hsl(280, 50%, 55%)', glowColor: 'hsl(280, 50%, 45%)' },
  Ascendant: { symbol: 'લ', color: 'hsl(45, 93%, 58%)', glowColor: 'hsl(45, 93%, 48%)' },
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
// In Whole Sign: the sign containing the Ascendant is the 1st house
// sign_id is 1-based (1 = Aries, 2 = Taurus, etc.)
const calculateHouse = (planetSignId: number, ascendantSignId: number): number => {
  // Both IDs are 1-based
  const house = ((planetSignId - ascendantSignId + 12) % 12) + 1;
  return house;
};

export const BirthChartWheel = ({ chartData }: BirthChartWheelProps) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetPosition | null>(null);

  const { planetary_positions, ascendant_sign_id } = chartData;

  // Filter planets (exclude Ascendant from regular planets, we'll show it separately)
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

  // The chart is rotated so that the 1st house (Ascendant's sign) is at the top (12 o'clock)
  // In standard astrology charts, houses go counter-clockwise
  // ascendant_sign_id is 1-based (1 = Aries)
  // Rotation offset: we want the Ascendant's sign to start at -90° (top)
  const chartRotation = 0; // We'll position elements relative to house number

  // Get ordinal suffix
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Calculate angle for a house number (1-12)
  // House 1 is at the top (12 o'clock = -90°), houses go counter-clockwise
  const getHouseAngle = (houseNum: number): number => {
    // House 1 starts at -90° (top), each house spans 30°
    // Going counter-clockwise means subtracting
    return -90 - (houseNum - 1) * 30;
  };

  // Get center angle for a house
  const getHouseCenterAngle = (houseNum: number): number => {
    return getHouseAngle(houseNum) - 15; // Center of the 30° span
  };

  // Calculate planet positions in the wheel based on their HOUSE placement
  const planetPositions = useMemo(() => {
    // Group planets by house to handle multiple planets in same house
    const planetsByHouse: Record<number, PlanetPosition[]> = {};
    
    planets.forEach(planet => {
      const house = calculateHouse(planet.sign_id, ascendant_sign_id);
      if (!planetsByHouse[house]) {
        planetsByHouse[house] = [];
      }
      planetsByHouse[house].push(planet);
    });

    // Sort planets within each house by degree for consistent ordering
    Object.values(planetsByHouse).forEach(housePlanets => {
      housePlanets.sort((a, b) => a.degree - b.degree);
    });

    // Calculate visual positions
    return planets.map(planet => {
      const house = calculateHouse(planet.sign_id, ascendant_sign_id);
      const housePlanets = planetsByHouse[house];
      const indexInHouse = housePlanets.indexOf(planet);
      const totalInHouse = housePlanets.length;

      // Base angle is the center of the house
      const baseAngle = getHouseCenterAngle(house);
      
      // Spread multiple planets within the house
      let offsetAngle = 0;
      if (totalInHouse > 1) {
        const spreadRange = 20; // degrees to spread across
        offsetAngle = (indexInHouse - (totalInHouse - 1) / 2) * (spreadRange / Math.max(totalInHouse - 1, 1));
      }

      const finalAngle = baseAngle + offsetAngle;
      const radians = (finalAngle * Math.PI) / 180;

      return {
        ...planet,
        house,
        angle: finalAngle,
        radians,
        x: center + Math.cos(radians) * planetRadius,
        y: center + Math.sin(radians) * planetRadius,
      };
    });
  }, [planets, ascendant_sign_id, center, planetRadius]);

  // Draw house divisions (12 lines, starting from house 1 at top)
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

  // Nakshatra boundaries (27 divisions, each ~13.33°)
  const nakshatraBoundaries = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 27; i++) {
      // Each nakshatra spans 360/27 = 13.333... degrees
      // Starting from 0° Aries, but we need to rotate based on Ascendant
      const nakshatraAngle = i * (360 / 27);
      // Convert to our chart coordinate system
      // In our system, Ascendant's sign starts at -90°
      const signOffset = (ascendant_sign_id - 1) * 30; // Where Aries is in our chart
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

  // House number positions (placed in outer ring area)
  const houseNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 0; i < 12; i++) {
      const houseNum = i + 1;
      const angle = (getHouseCenterAngle(houseNum) * Math.PI) / 180;
      const x = center + Math.cos(angle) * (outerRadius - 18);
      const y = center + Math.sin(angle) * (outerRadius - 18);
      // Get the zodiac sign for this house
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
      // Get the zodiac sign for this house position
      const signIndex = (ascendant_sign_id - 1 + i) % 12;
      positions.push({ x, y, ...ZODIAC_SIGNS[signIndex], houseNum });
    }
    return positions;
  }, [center, zodiacRadius, ascendant_sign_id]);

  // Find Sun and Moon for glassmorphism cards
  const sunPosition = planets.find(p => p.name === 'Sun');
  const moonPosition = planets.find(p => p.name === 'Moon');

  // Ascendant position for display on the wheel (at house 1 center)
  const ascendantDisplayPos = useMemo(() => {
    const angle = getHouseCenterAngle(1);
    const radians = (angle * Math.PI) / 180;
    // Position it closer to the outer edge
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
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(45, 93%, 58%) 0%, transparent 70%)',
          }}
        />
        
        <svg 
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[600px] h-auto md:w-[600px] md:h-[600px] relative z-10"
          style={{ minWidth: '320px', maxWidth: '600px' }}
        >
          {/* Background */}
          <defs>
            {/* Starry pattern */}
            <pattern id="stars" width="100" height="100" patternUnits="userSpaceOnUse">
              {[...Array(20)].map((_, i) => (
                <circle
                  key={i}
                  cx={Math.random() * 100}
                  cy={Math.random() * 100}
                  r={Math.random() * 0.8 + 0.2}
                  fill="white"
                  opacity={Math.random() * 0.5 + 0.2}
                />
              ))}
            </pattern>
            
            {/* Planet glow filters - one for each planet color */}
            {Object.entries(PLANET_CONFIG).map(([name, config]) => (
              <filter key={name} id={`glow-${name}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feFlood floodColor={config.glowColor} floodOpacity="0.6"/>
                <feComposite in2="coloredBlur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
            
            {/* Generic planet glow */}
            <filter id="planetGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Gradient for outer ring */}
            <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 93%, 58%)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="hsl(45, 93%, 48%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(45, 93%, 58%)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Outer background circle */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="hsl(222, 47%, 11%)"
            stroke="url(#outerGradient)"
            strokeWidth="2.5"
          />
          
          {/* Subtle star pattern overlay */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius - 1}
            fill="url(#stars)"
            opacity="0.3"
          />

          {/* Nakshatra boundaries (very subtle dotted lines) */}
          {nakshatraBoundaries.map((line, i) => (
            <line
              key={`nakshatra-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="hsl(45, 50%, 50%)"
              strokeWidth="0.5"
              strokeDasharray="2,3"
              opacity="0.25"
            />
          ))}

          {/* Zodiac ring background */}
          <circle
            cx={center}
            cy={center}
            r={zodiacRadius}
            fill="none"
            stroke="hsl(45, 93%, 58%)"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {/* Inner circle */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="hsl(222, 47%, 8%)"
            stroke="hsl(45, 93%, 58%)"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* House division lines */}
          {houseDivisions.map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="hsl(45, 93%, 58%)"
              strokeWidth="1.5"
              opacity="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          ))}

          {/* House numbers - larger for mobile readability */}
          {houseNumbers.map((pos, i) => (
            <motion.text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(45, 93%, 58%)"
              fontSize="17"
              fontWeight="bold"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
            >
              {pos.house}
            </motion.text>
          ))}

          {/* Zodiac symbols - larger and more visible */}
          {zodiacPositions.map((pos, i) => (
            <motion.text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(47, 60%, 75%)"
              fontSize="22"
              fontWeight="500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.03 }}
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
                scale: hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 1.15 : 1 
              }}
              transition={{ duration: 0.5, delay: 1.2, scale: { duration: 0.2 } }}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPlanet({
                ...ascendantPosition,
                id: 100,
                name: 'Ascendant',
              })}
              onMouseLeave={() => setHoveredPlanet(null)}
              onClick={() => setSelectedPlanet(
                selectedPlanet?.id === 100 
                  ? null 
                  : { ...ascendantPosition, id: 100, name: 'Ascendant' }
              )}
              filter="url(#glow-Ascendant)"
            >
              <circle
                cx={ascendantDisplayPos.x}
                cy={ascendantDisplayPos.y}
                r={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 24 : 20}
                fill="hsl(45, 93%, 58%)"
                opacity={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 0.35 : 0.2}
              />
              <circle
                cx={ascendantDisplayPos.x}
                cy={ascendantDisplayPos.y}
                r={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 28 : 24}
                fill="none"
                stroke="hsl(45, 93%, 58%)"
                strokeWidth="1"
                opacity={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 0.4 : 0.15}
              />
              <text
                x={ascendantDisplayPos.x}
                y={ascendantDisplayPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(45, 93%, 58%)"
                fontSize={hoveredPlanet?.id === 100 || selectedPlanet?.id === 100 ? 24 : 20}
                fontWeight="bold"
              >
                લ
              </text>
            </motion.g>
          )}

          {/* Planets - positioned by house */}
          {planetPositions.map((planet, i) => {
            const config = PLANET_CONFIG[planet.name] || { symbol: '?', color: 'white', glowColor: 'white' };
            const isHovered = hoveredPlanet?.id === planet.id;
            const isSelected = selectedPlanet?.id === planet.id;

            return (
              <motion.g
                key={planet.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: isHovered || isSelected ? 1.15 : 1,
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: 1 + i * 0.1,
                  scale: { duration: 0.2 }
                }}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPlanet(planet)}
                onMouseLeave={() => setHoveredPlanet(null)}
                onClick={() => setSelectedPlanet(selectedPlanet?.id === planet.id ? null : planet)}
                filter={`url(#glow-${planet.name})`}
              >
                {/* Planet glow halo */}
                <circle
                  cx={planet.x}
                  cy={planet.y}
                  r={isHovered || isSelected ? 26 : 22}
                  fill={config.color}
                  opacity={isHovered || isSelected ? 0.35 : 0.2}
                />
                
                {/* Outer glow ring */}
                <circle
                  cx={planet.x}
                  cy={planet.y}
                  r={isHovered || isSelected ? 30 : 26}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="1"
                  opacity={isHovered || isSelected ? 0.4 : 0.15}
                />
                
                {/* Planet symbol */}
                <text
                  x={planet.x}
                  y={planet.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={config.color}
                  fontSize={isHovered || isSelected ? 26 : 23}
                  fontWeight="bold"
                >
                  {config.symbol}
                </text>

                {/* Planet label */}
                <motion.text
                  x={planet.x}
                  y={planet.y + 30}
                  textAnchor="middle"
                  fill="hsl(47, 37%, 82%)"
                  fontSize="9"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered || isSelected ? 1 : 0.7 }}
                >
                  {planet.sign.substring(0, 3)} {planet.degree.toFixed(0)}°
                </motion.text>
              </motion.g>
            );
          })}

          {/* Center emblem */}
          <motion.g
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <circle
              cx={center}
              cy={center}
              r={45}
              fill="hsl(222, 47%, 11%)"
              stroke="hsl(45, 93%, 58%)"
              strokeWidth="2"
            />
            <text
              x={center}
              y={center - 10}
              textAnchor="middle"
              fill="hsl(45, 93%, 58%)"
              fontSize="11"
              fontWeight="bold"
            >
              LAGNA
            </text>
            <text
              x={center}
              y={center + 10}
              textAnchor="middle"
              fill="hsl(47, 37%, 82%)"
              fontSize="12"
            >
              {chartData.ascendant_sign}
            </text>
          </motion.g>
        </svg>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {hoveredPlanet && !selectedPlanet && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full mt-4 z-20"
            >
              <div className="bg-midnight/90 backdrop-blur-lg border border-gold/30 rounded-xl p-4 shadow-xl min-w-[220px]">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-2xl"
                    style={{ color: PLANET_CONFIG[hoveredPlanet.name]?.color }}
                  >
                    {PLANET_CONFIG[hoveredPlanet.name]?.symbol}
                  </span>
                  <span className="text-cream font-semibold">{hoveredPlanet.name}</span>
                  {hoveredPlanet.is_retrograde && (
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">R</span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-cream-muted">
                    <span className="text-cream">Sign:</span> {hoveredPlanet.sign}
                  </p>
                  <p className="text-cream-muted">
                    <span className="text-cream">Degree:</span> {hoveredPlanet.degree.toFixed(2)}°
                  </p>
                  <p className="text-cream-muted">
                    <span className="text-cream">House:</span> {getOrdinal(calculateHouse(hoveredPlanet.sign_id, ascendant_sign_id))}
                  </p>
                  {hoveredPlanet.nakshatra && (
                    <p className="text-cream-muted">
                      <span className="text-cream">Nakshatra:</span> {hoveredPlanet.nakshatra}
                      {hoveredPlanet.nakshatra_pada && ` (Pada ${hoveredPlanet.nakshatra_pada})`}
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
            <div className="bg-midnight/80 backdrop-blur-lg border border-gold/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-4xl"
                    style={{ color: PLANET_CONFIG[selectedPlanet.name]?.color }}
                  >
                    {PLANET_CONFIG[selectedPlanet.name]?.symbol}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-cream">{selectedPlanet.name}</h3>
                    {selectedPlanet.is_retrograde && (
                      <span className="text-xs text-amber-400">Retrograde</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlanet(null)}
                  className="text-cream-muted hover:text-cream transition-colors text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-midnight/50 rounded-lg p-3">
                  <p className="text-cream-muted text-xs mb-1">Sign</p>
                  <p className="text-cream font-medium">{selectedPlanet.sign}</p>
                </div>
                <div className="bg-midnight/50 rounded-lg p-3">
                  <p className="text-cream-muted text-xs mb-1">Degree</p>
                  <p className="text-cream font-medium">{selectedPlanet.degree.toFixed(2)}°</p>
                </div>
                <div className="bg-midnight/50 rounded-lg p-3">
                  <p className="text-cream-muted text-xs mb-1">House</p>
                  <p className="text-cream font-medium">{getOrdinal(calculateHouse(selectedPlanet.sign_id, ascendant_sign_id))}</p>
                </div>
                <div className="bg-midnight/50 rounded-lg p-3">
                  <p className="text-cream-muted text-xs mb-1">Sign Lord</p>
                  <p className="text-cream font-medium">{selectedPlanet.sign_lord}</p>
                </div>
                {selectedPlanet.nakshatra && (
                  <>
                    <div className="bg-midnight/50 rounded-lg p-3">
                      <p className="text-cream-muted text-xs mb-1">Nakshatra</p>
                      <p className="text-cream font-medium">{selectedPlanet.nakshatra}</p>
                    </div>
                    {selectedPlanet.nakshatra_pada && (
                      <div className="bg-midnight/50 rounded-lg p-3">
                        <p className="text-cream-muted text-xs mb-1">Pada</p>
                        <p className="text-cream font-medium">{selectedPlanet.nakshatra_pada}</p>
                      </div>
                    )}
                    {selectedPlanet.nakshatra_lord && (
                      <div className="bg-midnight/50 rounded-lg p-3">
                        <p className="text-cream-muted text-xs mb-1">Nakshatra Lord</p>
                        <p className="text-cream font-medium">{selectedPlanet.nakshatra_lord}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism Cards - 4 cards now including Birth Nakshatra */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
        {/* Ascendant Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="bg-gradient-to-br from-gold/10 to-gold/5 backdrop-blur-lg border border-gold/30 rounded-2xl p-5 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-2xl text-gold">લ</span>
          </div>
          <p className="text-cream-muted text-sm mb-1">Ascendant (Lagna)</p>
          <p className="text-cream font-semibold text-xl">{chartData.ascendant_sign}</p>
          {ascendantPosition && (
            <p className="text-gold/80 text-sm mt-1">{ascendantPosition.degree.toFixed(1)}°</p>
          )}
          <p className="text-cream-muted text-xs mt-1">Lord: {chartData.ascendant_sign_lord}</p>
        </motion.div>

        {/* Birth Nakshatra Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.85 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-lg border border-purple-400/30 rounded-2xl p-5 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-400/20 flex items-center justify-center">
            <span className="text-2xl" style={{ color: 'hsl(270, 60%, 70%)' }}>✧</span>
          </div>
          <p className="text-cream-muted text-sm mb-1">Birth Nakshatra</p>
          <p className="text-cream font-semibold text-xl">{chartData.nakshatra}</p>
          <p className="text-purple-300/80 text-sm mt-1">Pada {chartData.nakshatra_pada}</p>
          <p className="text-cream-muted text-xs mt-1">Lord: {chartData.nakshatra_lord}</p>
        </motion.div>

        {/* Moon Card - without nakshatra */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9 }}
          className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 backdrop-blur-lg border border-slate-400/30 rounded-2xl p-5 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-400/20 flex items-center justify-center">
            <span className="text-2xl" style={{ color: 'hsl(210, 20%, 85%)' }}>☽</span>
          </div>
          <p className="text-cream-muted text-sm mb-1">Moon (Chandra)</p>
          <p className="text-cream font-semibold text-xl">{chartData.moon_sign}</p>
          {moonPosition && (
            <p className="text-slate-300/80 text-sm mt-1">{moonPosition.degree.toFixed(1)}°</p>
          )}
          <p className="text-cream-muted text-xs mt-1">Lord: {chartData.moon_sign_lord}</p>
        </motion.div>

        {/* Sun Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
          className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-lg border border-amber-400/30 rounded-2xl p-5 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-400/20 flex items-center justify-center">
            <span className="text-2xl" style={{ color: 'hsl(45, 93%, 58%)' }}>☉</span>
          </div>
          <p className="text-cream-muted text-sm mb-1">Sun (Surya)</p>
          <p className="text-cream font-semibold text-xl">{chartData.sun_sign}</p>
          {sunPosition && (
            <p className="text-gold/80 text-sm mt-1">{sunPosition.degree.toFixed(1)}°</p>
          )}
          <p className="text-cream-muted text-xs mt-1">Lord: {chartData.sun_sign_lord}</p>
        </motion.div>
      </div>
    </div>
  );
};
