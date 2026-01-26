import { PlanetPosition } from '@/types/kundli';

interface NorthIndianChartProps {
  positions: PlanetPosition[];
  ascendantSignId: number;
}

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
    if (planet.id === 0) return; // Skip Ascendant
    const house = calculateHouse(planet.sign_id, ascendantSignId);
    houses[house].push(planet);
  });

  return houses;
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

// Get sign name for a house number
const getSignForHouse = (houseNumber: number, ascendantSignId: number): string => {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const signIndex = ((ascendantSignId - 1) + (houseNumber - 1)) % 12;
  return signs[signIndex];
};

export const NorthIndianChart = ({ positions, ascendantSignId }: NorthIndianChartProps) => {
  const houses = groupPlanetsByHouse(positions, ascendantSignId);

  // North Indian diamond layout
  // The chart is arranged as a 4x4 grid with diagonal divisions
  // House positions in the diamond (counter-clockwise from top):
  //        [12]  [ 1]  [ 2]
  //   [11]                   [ 3]
  //   [10]                   [ 4]
  //        [ 9]  [ 8/7]  [ 5]
  //              [ 6]

  return (
    <div className="w-full max-w-xl md:max-w-[720px] mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto"
        style={{ maxHeight: '672px' }}
      >
        {/* Outer diamond border */}
        <path
          d="M 200 10 L 390 200 L 200 390 L 10 200 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border/50"
        />

        {/* Inner diamond (center) */}
        <path
          d="M 200 100 L 300 200 L 200 300 L 100 200 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-border/40"
        />

        {/* Diagonal lines from corners to inner diamond */}
        {/* Top to corners */}
        <line x1="200" y1="10" x2="200" y2="100" stroke="currentColor" strokeWidth="1" className="text-border/40" />
        <line x1="200" y1="300" x2="200" y2="390" stroke="currentColor" strokeWidth="1" className="text-border/40" />
        <line x1="10" y1="200" x2="100" y2="200" stroke="currentColor" strokeWidth="1" className="text-border/40" />
        <line x1="300" y1="200" x2="390" y2="200" stroke="currentColor" strokeWidth="1" className="text-border/40" />

        {/* House divisions - connecting outer corners to inner diamond corners */}
        {/* Top-left corner lines */}
        <line x1="105" y1="105" x2="200" y2="100" stroke="currentColor" strokeWidth="1" className="text-border/40" />
        <line x1="105" y1="105" x2="100" y2="200" stroke="currentColor" strokeWidth="1" className="text-border/40" />

        {/* Top-right corner lines */}
        <line x1="295" y1="105" x2="200" y2="100" stroke="currentColor" strokeWidth="1" className="text-border/40" />
        <line x1="295" y1="105" x2="300" y2="200" stroke="currentColor" strokeWidth="1" className="text-border/40" />

        {/* Bottom-right corner lines */}
        <line x1="295" y1="295" x2="200" y2="300" stroke="currentColor" strokeWidth="1" className="text-border/40" />
        <line x1="295" y1="295" x2="300" y2="200" stroke="currentColor" strokeWidth="1" className="text-border/40" />

        {/* Bottom-left corner lines */}
        <line x1="105" y1="295" x2="200" y2="300" stroke="currentColor" strokeWidth="1" className="text-border/40" />
        <line x1="105" y1="295" x2="100" y2="200" stroke="currentColor" strokeWidth="1" className="text-border/40" />

        {/* House 1 - Top center (Ascendant) */}
        <g className="fill-gold/10">
          <polygon points="200,10 295,105 200,100 105,105" className="fill-gold/10 stroke-gold/40" strokeWidth="1" />
        </g>

        {/* House labels and planets */}
        {/* House 1 - Top center */}
        <HouseContent houseNum={1} planets={houses[1]} ascendantSignId={ascendantSignId} x={200} y={55} isAscendant />

        {/* House 12 - Top left */}
        <HouseContent houseNum={12} planets={houses[12]} ascendantSignId={ascendantSignId} x={105} y={105} />

        {/* House 11 - Left upper */}
        <HouseContent houseNum={11} planets={houses[11]} ascendantSignId={ascendantSignId} x={55} y={150} />

        {/* House 10 - Left lower */}
        <HouseContent houseNum={10} planets={houses[10]} ascendantSignId={ascendantSignId} x={55} y={250} />

        {/* House 9 - Bottom left */}
        <HouseContent houseNum={9} planets={houses[9]} ascendantSignId={ascendantSignId} x={105} y={295} />

        {/* House 8 - Bottom center left */}
        <HouseContent houseNum={8} planets={houses[8]} ascendantSignId={ascendantSignId} x={150} y={345} />

        {/* House 7 - Bottom center right */}
        <HouseContent houseNum={7} planets={houses[7]} ascendantSignId={ascendantSignId} x={250} y={345} />

        {/* House 6 - Bottom right */}
        <HouseContent houseNum={6} planets={houses[6]} ascendantSignId={ascendantSignId} x={295} y={295} />

        {/* House 5 - Right lower */}
        <HouseContent houseNum={5} planets={houses[5]} ascendantSignId={ascendantSignId} x={345} y={250} />

        {/* House 4 - Right upper */}
        <HouseContent houseNum={4} planets={houses[4]} ascendantSignId={ascendantSignId} x={345} y={150} />

        {/* House 3 - Top right */}
        <HouseContent houseNum={3} planets={houses[3]} ascendantSignId={ascendantSignId} x={295} y={105} />

        {/* House 2 - Top center right */}
        <HouseContent houseNum={2} planets={houses[2]} ascendantSignId={ascendantSignId} x={250} y={55} />

        {/* Center label */}
        <text x="200" y="195" textAnchor="middle" className="fill-gold text-[10px]">Rashi Chart</text>
        <text x="200" y="210" textAnchor="middle" className="fill-cream-muted text-[8px]">
          Lagna: {getSignForHouse(1, ascendantSignId)}
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

  return (
    <g>
      {/* House number */}
      <text
        x={x - 25}
        y={y - 10}
        className={`text-[9px] ${isAscendant ? 'fill-gold' : 'fill-cream-muted/70'}`}
      >
        {houseNum}
      </text>

      {/* Sign abbreviation */}
      <text
        x={x + 15}
        y={y - 10}
        className="fill-cream-muted/50 text-[8px]"
      >
        {signName.substring(0, 3)}
      </text>

      {/* Planets */}
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        className="text-[10px]"
      >
        {planets.map((planet, idx) => (
          <tspan
            key={planet.id}
            className={planet.is_retrograde ? 'fill-amber-400' : 'fill-cream'}
            dx={idx > 0 ? 3 : 0}
          >
            {abbreviatePlanet(planet.name)}
            {planet.is_retrograde && 'ᴿ'}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export default NorthIndianChart;
