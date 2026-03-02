import { PlanetPosition } from '@/types/kundli';

interface SouthIndianChartProps {
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

// Zodiac symbols
const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
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

export const SouthIndianChart = ({ positions, ascendantSignId }: SouthIndianChartProps) => {
  const houses = groupPlanetsByHouse(positions, ascendantSignId);

  // South Indian chart SVG-based layout
  // Grid positions for houses (x, y, width, height)
  const housePositions: Record<number, { x: number; y: number; w: number; h: number }> = {
    // Top row
    7:  { x: 0, y: 0, w: 100, h: 100 },
    8:  { x: 100, y: 0, w: 100, h: 100 },
    9:  { x: 200, y: 0, w: 100, h: 100 },
    10: { x: 300, y: 0, w: 100, h: 100 },
    // Second row
    6:  { x: 0, y: 100, w: 100, h: 100 },
    11: { x: 300, y: 100, w: 100, h: 100 },
    // Third row
    5:  { x: 0, y: 200, w: 100, h: 100 },
    12: { x: 300, y: 200, w: 100, h: 100 },
    // Bottom row
    4:  { x: 0, y: 300, w: 100, h: 100 },
    3:  { x: 100, y: 300, w: 100, h: 100 },
    2:  { x: 200, y: 300, w: 100, h: 100 },
    1:  { x: 300, y: 300, w: 100, h: 100 },
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-auto">
        <defs>
          {/* Background gradient */}
          <radialGradient id="southBgGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>

          {/* Glow filters for planets */}
          {Object.entries(PLANET_CONFIG).map(([name, config]) => (
            <filter key={name} id={`south-glow-${name}`} x="-50%" y="-50%" width="200%" height="200%">
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

        {/* Background */}
        <rect x="0" y="0" width="400" height="400" fill="url(#southBgGradient)" />

        {/* Outer border */}
        <rect
          x="0" y="0" width="400" height="400"
          fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.4"
        />

        {/* Grid lines */}
        <line x1="100" y1="0" x2="100" y2="400" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="200" y1="0" x2="200" y2="400" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="300" y1="0" x2="300" y2="400" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="0" y1="100" x2="400" y2="100" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="0" y1="200" x2="400" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
        <line x1="0" y1="300" x2="400" y2="300" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />

        {/* Center box border */}
        <rect
          x="100" y="100" width="200" height="200"
          fill="#0f172a" stroke="#f59e0b" strokeWidth="1" opacity="0.3"
        />

        {/* House 1 highlight (Ascendant) */}
        <rect x="300" y="300" width="100" height="100" fill="#FCD34D" opacity="0.08" />

        {/* Render houses */}
        {Object.entries(housePositions).map(([houseNum, pos]) => {
          const house = parseInt(houseNum);
          const housePlanets = houses[house] || [];
          const signName = getSignForHouse(house, ascendantSignId);
          const signSymbol = ZODIAC_SYMBOLS[signName] || '';
          const isAscendant = house === 1;

          return (
            <g key={house}>
              {/* House number */}
              <text
                x={pos.x + 8}
                y={pos.y + 14}
                fontSize="10"
                fill={isAscendant ? '#FCD34D' : '#6B7280'}
                fontWeight={isAscendant ? 'bold' : 'normal'}
              >
                {house}
              </text>

              {/* Sign symbol */}
              <text
                x={pos.x + pos.w - 8}
                y={pos.y + 14}
                textAnchor="end"
                fontSize="12"
                fill="#6B7280"
                opacity="0.6"
                style={{ fontVariantEmoji: 'text' }}
              >
                {signSymbol}
              </text>

              {/* Planets */}
              {housePlanets.map((planet, idx) => {
                const config = PLANET_CONFIG[planet.name] || { symbol: '?', color: '#FFFFFF', abbr: '?' };
                const total = housePlanets.length;

                // Calculate position within house
                let offsetX = 0;
                let offsetY = 0;

                if (total === 1) {
                  offsetX = 0;
                  offsetY = 0;
                } else if (total === 2) {
                  offsetX = idx === 0 ? -18 : 18;
                  offsetY = 0;
                } else if (total === 3) {
                  const offsets = [{ x: 0, y: -15 }, { x: -18, y: 12 }, { x: 18, y: 12 }];
                  offsetX = offsets[idx].x;
                  offsetY = offsets[idx].y;
                } else {
                  // Grid for 4+ planets
                  const col = idx % 2;
                  const row = Math.floor(idx / 2);
                  offsetX = col === 0 ? -15 : 15;
                  offsetY = row * 22 - 10;
                }

                const cx = pos.x + pos.w / 2 + offsetX;
                const cy = pos.y + pos.h / 2 + offsetY + 5;

                return (
                  <g key={planet.id} filter={`url(#south-glow-${planet.name})`}>
                    {/* Planet background glow */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill={config.color}
                      opacity="0.15"
                    />
                    {/* Planet symbol */}
                    <text
                      x={cx}
                      y={cy + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      fontWeight="bold"
                      fill={config.color}
                      style={{ fontFamily: 'serif' }}
                    >
                      {config.symbol}
                    </text>
                    {/* Abbreviation below */}
                    <text
                      x={cx}
                      y={cy + 16}
                      textAnchor="middle"
                      fontSize="7"
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
        })}

        {/* Center emblem */}
        <circle cx="200" cy="200" r="40" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
        <text x="200" y="193" textAnchor="middle" fill="#f59e0b" fontSize="24" fontFamily="serif" style={{ fontVariantEmoji: 'text' }}>
          {ZODIAC_SYMBOLS[getSignForHouse(1, ascendantSignId)] || '♎'}
        </text>
        <text x="200" y="215" textAnchor="middle" fill="#9CA3AF" fontSize="9">
          {getSignForHouse(1, ascendantSignId)}
        </text>
      </svg>
    </div>
  );
};

export default SouthIndianChart;
