import { PlanetPosition } from '@/types/kundli';

interface NorthIndianChartProps {
  positions: PlanetPosition[];
  ascendantSignId: number;
}

// Planet configuration with symbols and colors
const PLANET_CONFIG: Record<string, { symbol: string; color: string; abbr: string }> = {
  Sun: { symbol: '☉', color: '#FCD34D', abbr: 'Su' },
  Moon: { symbol: '☽', color: '#E5E7EB', abbr: 'Mo' },
  Mars: { symbol: '♂', color: '#DC2626', abbr: 'Ma' },
  Mercury: { symbol: '☿', color: '#10B981', abbr: 'Me' },
  Jupiter: { symbol: '♃', color: '#FBBF24', abbr: 'Ju' },
  Venus: { symbol: '♀', color: '#EC4899', abbr: 'Ve' },
  Saturn: { symbol: '♄', color: '#3B82F6', abbr: 'Sa' },
  Rahu: { symbol: '☊', color: '#A855F7', abbr: 'Ra' },
  Ketu: { symbol: '☋', color: '#A855F7', abbr: 'Ke' },
  Ascendant: { symbol: 'લ', color: '#FCD34D', abbr: 'As' },
};

// Calculate house number based on whole-sign system
const calculateHouse = (planetSignId: number, ascendantSignId: number): number => {
  return ((planetSignId - ascendantSignId + 12) % 12) + 1;
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

// Zodiac symbols
const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

export const NorthIndianChart = ({ positions, ascendantSignId }: NorthIndianChartProps) => {
  const houses = groupPlanetsByHouse(positions, ascendantSignId);

  return (
    <div className="w-full max-w-xl md:max-w-[720px] mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto"
        style={{ maxHeight: '672px' }}
      >
        <defs>
          {/* Background gradient */}
          <radialGradient id="northBgGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>

          {/* Glow filters for planets */}
          {Object.entries(PLANET_CONFIG).map(([name, config]) => (
            <filter key={name} id={`north-glow-${name}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feFlood floodColor={config.color} floodOpacity="0.6"/>
              <feComposite in2="coloredBlur" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Background fill */}
        <polygon
          points="200,10 390,200 200,390 10,200"
          fill="url(#northBgGradient)"
        />

        {/* Outer diamond border */}
        <path
          d="M 200 10 L 390 200 L 200 390 L 10 200 Z"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.4"
        />

        {/* Inner diamond (center) */}
        <path
          d="M 200 100 L 300 200 L 200 300 L 100 200 Z"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1"
          opacity="0.25"
        />

        {/* Diagonal lines from corners to inner diamond */}
        <line x1="200" y1="10" x2="200" y2="100" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="200" y1="300" x2="200" y2="390" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="10" y1="200" x2="100" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="300" y1="200" x2="390" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />

        {/* House divisions */}
        <line x1="105" y1="105" x2="200" y2="100" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="105" y1="105" x2="100" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="295" y1="105" x2="200" y2="100" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="295" y1="105" x2="300" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="295" y1="295" x2="200" y2="300" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="295" y1="295" x2="300" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="105" y1="295" x2="200" y2="300" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="105" y1="295" x2="100" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />

        {/* House 1 highlight (Ascendant) */}
        <polygon points="200,10 295,105 200,100 105,105" fill="#FCD34D" opacity="0.08" />

        {/* House contents */}
        <HouseContent houseNum={1} planets={houses[1]} ascendantSignId={ascendantSignId} x={200} y={55} isAscendant />
        <HouseContent houseNum={2} planets={houses[2]} ascendantSignId={ascendantSignId} x={152} y={55} />
        <HouseContent houseNum={3} planets={houses[3]} ascendantSignId={ascendantSignId} x={55} y={152} />
        <HouseContent houseNum={4} planets={houses[4]} ascendantSignId={ascendantSignId} x={55} y={200} />
        <HouseContent houseNum={5} planets={houses[5]} ascendantSignId={ascendantSignId} x={55} y={248} />
        <HouseContent houseNum={6} planets={houses[6]} ascendantSignId={ascendantSignId} x={152} y={345} />
        <HouseContent houseNum={7} planets={houses[7]} ascendantSignId={ascendantSignId} x={200} y={345} />
        <HouseContent houseNum={8} planets={houses[8]} ascendantSignId={ascendantSignId} x={248} y={345} />
        <HouseContent houseNum={9} planets={houses[9]} ascendantSignId={ascendantSignId} x={345} y={248} />
        <HouseContent houseNum={10} planets={houses[10]} ascendantSignId={ascendantSignId} x={345} y={200} />
        <HouseContent houseNum={11} planets={houses[11]} ascendantSignId={ascendantSignId} x={345} y={152} />
        <HouseContent houseNum={12} planets={houses[12]} ascendantSignId={ascendantSignId} x={248} y={55} />

        {/* Center emblem */}
        <circle cx="200" cy="200" r="35" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
        <text x="200" y="195" textAnchor="middle" fill="#f59e0b" fontSize="20" fontFamily="serif" style={{ fontVariantEmoji: 'text' }}>
          {ZODIAC_SYMBOLS[getSignForHouse(1, ascendantSignId)] || '♎'}
        </text>
        <text x="200" y="215" textAnchor="middle" fill="#9CA3AF" fontSize="8">
          {getSignForHouse(1, ascendantSignId)}
        </text>
      </svg>
    </div>
  );
};

// Helper component for house content in SVG
const HouseContent = ({
  houseNum,
  planets,
  ascendantSignId,
  x,
  y,
  isAscendant = false
}: {
  houseNum: number;
  planets: PlanetPosition[];
  ascendantSignId: number;
  x: number;
  y: number;
  isAscendant?: boolean;
}) => {
  const signName = getSignForHouse(houseNum, ascendantSignId);
  const signSymbol = ZODIAC_SYMBOLS[signName] || '';

  // Calculate positions for multiple planets
  const getPlanetOffset = (index: number, total: number) => {
    if (total === 1) return { dx: 0, dy: 0 };
    if (total === 2) return { dx: index === 0 ? -12 : 12, dy: 0 };
    if (total === 3) {
      const offsets = [{ dx: 0, dy: -10 }, { dx: -12, dy: 8 }, { dx: 12, dy: 8 }];
      return offsets[index];
    }
    // 4+ planets - grid layout
    const col = index % 2;
    const row = Math.floor(index / 2);
    return { dx: col === 0 ? -10 : 10, dy: row * 16 - 8 };
  };

  return (
    <g>
      {/* House number - small, in corner */}
      <text
        x={x - 20}
        y={y - 15}
        fontSize="9"
        fill={isAscendant ? '#FCD34D' : '#6B7280'}
        fontWeight={isAscendant ? 'bold' : 'normal'}
      >
        {houseNum}
      </text>

      {/* Sign symbol - small, opposite corner */}
      <text
        x={x + 18}
        y={y - 15}
        fontSize="10"
        fill="#6B7280"
        opacity="0.6"
        style={{ fontVariantEmoji: 'text' }}
      >
        {signSymbol}
      </text>

      {/* Planets with symbols and colors */}
      {planets.map((planet, idx) => {
        const config = PLANET_CONFIG[planet.name] || { symbol: '?', color: '#FFFFFF', abbr: '?' };
        const offset = getPlanetOffset(idx, planets.length);

        return (
          <g key={planet.id} filter={`url(#north-glow-${planet.name})`}>
            {/* Planet background glow */}
            <circle
              cx={x + offset.dx}
              cy={y + offset.dy}
              r="11"
              fill={config.color}
              opacity="0.15"
            />
            {/* Planet symbol */}
            <text
              x={x + offset.dx}
              y={y + offset.dy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="bold"
              fill={config.color}
              style={{ fontFamily: 'serif' }}
            >
              {config.symbol}
            </text>
            {/* Abbreviation below symbol */}
            <text
              x={x + offset.dx}
              y={y + offset.dy + 14}
              textAnchor="middle"
              fontSize="6"
              fill={config.color}
              opacity="0.8"
            >
              {config.abbr}
              {planet.is_retrograde && 'ᴿ'}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default NorthIndianChart;
