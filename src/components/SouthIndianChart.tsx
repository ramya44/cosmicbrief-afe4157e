import { PlanetPosition } from '@/types/kundli';

interface SouthIndianChartProps {
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

export const SouthIndianChart = ({ positions, ascendantSignId }: SouthIndianChartProps) => {
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
    <div className="w-full max-w-xl mx-auto aspect-square">
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

export default SouthIndianChart;
