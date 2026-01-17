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
}

interface BirthChartWheelProps {
  chartData: KundliData;
}

// Planet symbols and colors
const PLANET_CONFIG: Record<string, { symbol: string; color: string }> = {
  Sun: { symbol: '☉', color: 'hsl(45, 93%, 58%)' },      // Gold
  Moon: { symbol: '☽', color: 'hsl(210, 20%, 80%)' },    // Silver
  Mars: { symbol: '♂', color: 'hsl(0, 72%, 55%)' },      // Red
  Mercury: { symbol: '☿', color: 'hsl(142, 70%, 55%)' }, // Green
  Jupiter: { symbol: '♃', color: 'hsl(48, 96%, 60%)' },  // Yellow
  Venus: { symbol: '♀', color: 'hsl(330, 80%, 70%)' },   // Pink
  Saturn: { symbol: '♄', color: 'hsl(210, 60%, 50%)' },  // Blue
  Rahu: { symbol: '☊', color: 'hsl(270, 60%, 60%)' },    // Purple
  Ketu: { symbol: '☋', color: 'hsl(280, 50%, 50%)' },    // Deep purple
};

// Zodiac signs with their symbols
const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈' },
  { name: 'Taurus', symbol: '♉' },
  { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' },
  { name: 'Leo', symbol: '♌' },
  { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' },
  { name: 'Scorpio', symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' },
  { name: 'Aquarius', symbol: '♒' },
  { name: 'Pisces', symbol: '♓' },
];

// Calculate house number based on whole-sign system
const calculateHouse = (planetSignId: number, ascendantSignId: number): number => {
  return ((planetSignId - ascendantSignId + 12) % 12) + 1;
};

export const BirthChartWheel = ({ chartData }: BirthChartWheelProps) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetPosition | null>(null);

  const { planetary_positions, ascendant_sign_id } = chartData;

  // Filter out Ascendant (id 0) for planetary display
  const planets = useMemo(() => 
    planetary_positions.filter(p => p.id !== 0),
    [planetary_positions]
  );

  // Calculate planet positions on the wheel
  const planetPositions = useMemo(() => {
    return planets.map(planet => {
      // Each sign spans 30 degrees
      // full_degree gives us the absolute position (0-360)
      const angle = planet.full_degree;
      // SVG coordinate system: 0° is at 3 o'clock, we want 0° Aries at top (12 o'clock)
      // So we rotate by -90° and also flip for clockwise direction
      const adjustedAngle = 90 - angle;
      const radians = (adjustedAngle * Math.PI) / 180;
      
      return {
        ...planet,
        angle,
        radians,
      };
    });
  }, [planets]);

  // Chart dimensions
  const size = 600;
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const zodiacRadius = outerRadius - 40;
  const planetRadius = zodiacRadius - 50;
  const innerRadius = planetRadius - 60;

  // Get ordinal suffix
  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Draw house divisions
  const houseDivisions = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x1 = center + Math.cos(angle) * innerRadius;
      const y1 = center + Math.sin(angle) * innerRadius;
      const x2 = center + Math.cos(angle) * outerRadius;
      const y2 = center + Math.sin(angle) * outerRadius;
      lines.push({ x1, y1, x2, y2, house: i + 1 });
    }
    return lines;
  }, [center, innerRadius, outerRadius]);

  // House number positions
  const houseNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 0; i < 12; i++) {
      // Calculate house number based on ascendant
      const houseNum = ((i - (ascendant_sign_id - 1) + 12) % 12) + 1;
      const angle = ((i * 30) + 15 - 90) * (Math.PI / 180);
      const x = center + Math.cos(angle) * (outerRadius - 15);
      const y = center + Math.sin(angle) * (outerRadius - 15);
      numbers.push({ x, y, house: houseNum, signIndex: i });
    }
    return numbers;
  }, [center, outerRadius, ascendant_sign_id]);

  // Zodiac sign positions
  const zodiacPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 12; i++) {
      const angle = ((i * 30) + 15 - 90) * (Math.PI / 180);
      const x = center + Math.cos(angle) * (zodiacRadius - 5);
      const y = center + Math.sin(angle) * (zodiacRadius - 5);
      positions.push({ x, y, ...ZODIAC_SIGNS[i] });
    }
    return positions;
  }, [center, zodiacRadius]);

  // Find Sun and Moon for glassmorphism cards
  const sunPosition = planets.find(p => p.name === 'Sun');
  const moonPosition = planets.find(p => p.name === 'Moon');
  const ascendantPosition = planetary_positions.find(p => p.id === 0);

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
            
            {/* Planet glow filter */}
            <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Gradient for outer ring */}
            <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 93%, 58%)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(45, 93%, 48%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(45, 93%, 58%)" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Outer background circle */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="hsl(222, 47%, 11%)"
            stroke="url(#outerGradient)"
            strokeWidth="2"
          />
          
          {/* Subtle star pattern overlay */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius - 1}
            fill="url(#stars)"
            opacity="0.3"
          />

          {/* Zodiac ring background */}
          <circle
            cx={center}
            cy={center}
            r={zodiacRadius}
            fill="none"
            stroke="hsl(45, 93%, 58%)"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* Inner circle */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="hsl(222, 47%, 8%)"
            stroke="hsl(45, 93%, 58%)"
            strokeWidth="1"
            opacity="0.5"
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
              strokeWidth="1"
              opacity="0.4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          ))}

          {/* House numbers */}
          {houseNumbers.map((pos, i) => (
            <motion.text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(45, 93%, 58%)"
              fontSize="14"
              fontWeight="bold"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
            >
              {pos.house}
            </motion.text>
          ))}

          {/* Zodiac symbols */}
          {zodiacPositions.map((pos, i) => (
            <motion.text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(210, 20%, 70%)"
              fontSize="18"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.03 }}
            >
              {pos.symbol}
            </motion.text>
          ))}

          {/* Planets */}
          {planetPositions.map((planet, i) => {
            const x = center + Math.cos(planet.radians) * planetRadius;
            const y = center - Math.sin(planet.radians) * planetRadius;
            const config = PLANET_CONFIG[planet.name] || { symbol: '?', color: 'white' };
            const isHovered = hoveredPlanet?.id === planet.id;
            const isSelected = selectedPlanet?.id === planet.id;

            return (
              <motion.g
                key={planet.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: isHovered || isSelected ? 1.2 : 1,
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
                filter="url(#planetGlow)"
              >
                {/* Planet glow background */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? 28 : 24}
                  fill={config.color}
                  opacity={isHovered || isSelected ? 0.3 : 0.15}
                />
                
                {/* Planet symbol */}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={config.color}
                  fontSize={isHovered || isSelected ? 26 : 22}
                  fontWeight="bold"
                >
                  {config.symbol}
                </text>

                {/* Planet label - only show on hover/select or for desktop */}
                <motion.text
                  x={x}
                  y={y + 28}
                  textAnchor="middle"
                  fill="hsl(47, 37%, 82%)"
                  fontSize="9"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered || isSelected ? 1 : 0.6 }}
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
              r={40}
              fill="hsl(222, 47%, 11%)"
              stroke="hsl(45, 93%, 58%)"
              strokeWidth="2"
            />
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              fill="hsl(45, 93%, 58%)"
              fontSize="10"
              fontWeight="bold"
            >
              LAGNA
            </text>
            <text
              x={center}
              y={center + 8}
              textAnchor="middle"
              fill="hsl(47, 37%, 82%)"
              fontSize="11"
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

      {/* Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {/* Ascendant Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="bg-gradient-to-br from-gold/10 to-gold/5 backdrop-blur-lg border border-gold/30 rounded-2xl p-5 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-2xl text-gold">↑</span>
          </div>
          <p className="text-cream-muted text-sm mb-1">Ascendant (Lagna)</p>
          <p className="text-cream font-semibold text-xl">{chartData.ascendant_sign}</p>
          {ascendantPosition && (
            <p className="text-gold/80 text-sm mt-1">{ascendantPosition.degree.toFixed(1)}°</p>
          )}
          <p className="text-cream-muted text-xs mt-1">Lord: {chartData.ascendant_sign_lord}</p>
        </motion.div>

        {/* Moon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9 }}
          className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 backdrop-blur-lg border border-slate-400/30 rounded-2xl p-5 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-400/20 flex items-center justify-center">
            <span className="text-2xl" style={{ color: 'hsl(210, 20%, 80%)' }}>☽</span>
          </div>
          <p className="text-cream-muted text-sm mb-1">Moon (Chandra)</p>
          <p className="text-cream font-semibold text-xl">{chartData.moon_sign}</p>
          <p className="text-gold/80 text-sm mt-1">{chartData.nakshatra} (Pada {chartData.nakshatra_pada})</p>
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
          {sunPosition?.nakshatra && (
            <p className="text-gold/80 text-sm mt-1">{sunPosition.nakshatra}</p>
          )}
          {sunPosition && (
            <p className="text-cream-muted text-xs mt-1">{sunPosition.degree.toFixed(1)}°</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
