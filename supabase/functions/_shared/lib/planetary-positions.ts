/**
 * Shared planetary position formatting utilities for Vedic forecast generation.
 * Used by both free and paid forecast edge functions.
 */

// Vedic to Western sign name mapping
export const VEDIC_TO_WESTERN: Record<string, string> = {
  "Mesha": "Aries",
  "Vrishabha": "Taurus",
  "Mithuna": "Gemini",
  "Karka": "Cancer",
  "Simha": "Leo",
  "Kanya": "Virgo",
  "Tula": "Libra",
  "Vrishchika": "Scorpio",
  "Dhanu": "Sagittarius",
  "Makara": "Capricorn",
  "Kumbha": "Aquarius",
  "Meena": "Pisces",
};

// Sign lords for both Vedic and Western names
export const SIGN_LORDS: Record<string, string> = {
  // Western names
  "Aries": "Mars",
  "Taurus": "Venus",
  "Gemini": "Mercury",
  "Cancer": "Moon",
  "Leo": "Sun",
  "Virgo": "Mercury",
  "Libra": "Venus",
  "Scorpio": "Mars",
  "Sagittarius": "Jupiter",
  "Capricorn": "Saturn",
  "Aquarius": "Saturn",
  "Pisces": "Jupiter",
  // Vedic names
  "Mesha": "Mars",
  "Vrishabha": "Venus",
  "Mithuna": "Mercury",
  "Karka": "Moon",
  "Simha": "Sun",
  "Kanya": "Mercury",
  "Tula": "Venus",
  "Vrishchika": "Mars",
  "Dhanu": "Jupiter",
  "Makara": "Saturn",
  "Kumbha": "Saturn",
  "Meena": "Jupiter",
};

// Zodiac sign order (1-indexed to match sign_id)
export const ZODIAC_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Planet to ruled signs mapping
const PLANET_RULERSHIPS: Record<string, string[]> = {
  "Sun": ["Leo"],
  "Moon": ["Cancer"],
  "Mars": ["Aries", "Scorpio"],
  "Mercury": ["Gemini", "Virgo"],
  "Jupiter": ["Sagittarius", "Pisces"],
  "Venus": ["Taurus", "Libra"],
  "Saturn": ["Capricorn", "Aquarius"],
  "Rahu": [], // Shadow planet, no traditional rulership
  "Ketu": [], // Shadow planet, no traditional rulership
};

export interface PlanetaryPosition {
  name: string;
  sign: string;
  sign_id: number;
  degree?: number;
  full_degree?: number;
  is_retrograde?: boolean;
}

export interface FormatOptions {
  includeRulership?: boolean;
  includeDegree?: boolean;
  includeRetrograde?: boolean;
  useWesternSigns?: boolean;
}

/**
 * Converts a Vedic sign name to its Western equivalent.
 * Returns the original if already Western or not found.
 */
export function toWesternSign(sign: string): string {
  return VEDIC_TO_WESTERN[sign] || sign;
}

/**
 * Gets the ruling planet for a given sign (works with both Vedic and Western names).
 */
export function getSignLord(sign: string): string {
  return SIGN_LORDS[sign] || "Unknown";
}

/**
 * Calculates which house a planet occupies based on its sign and the ascendant sign.
 * Returns house number 1-12.
 */
export function calculateHouseFromAscendant(planetSignId: number, ascendantSignId: number): number {
  let house = planetSignId - ascendantSignId + 1;
  if (house <= 0) house += 12;
  return house;
}

/**
 * Returns ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Gets which houses a planet rules from the given ascendant.
 * Returns array of house numbers (1-12).
 */
export function getRuledHouses(planetName: string, ascendantSign: string): number[] {
  const ruledSigns = PLANET_RULERSHIPS[planetName] || [];
  if (ruledSigns.length === 0) return [];

  // Normalize ascendant to Western name
  const westernAscendant = toWesternSign(ascendantSign);
  const ascendantIndex = ZODIAC_ORDER.indexOf(westernAscendant);
  if (ascendantIndex === -1) return [];

  const houses: number[] = [];
  for (const ruledSign of ruledSigns) {
    const signIndex = ZODIAC_ORDER.indexOf(ruledSign);
    if (signIndex !== -1) {
      let house = signIndex - ascendantIndex + 1;
      if (house <= 0) house += 12;
      houses.push(house);
    }
  }

  return houses.sort((a, b) => a - b);
}

/**
 * Generates rulership information text for a planet.
 * Returns formatted string like " (rules 1st, 4th)" or empty string if no rulerships.
 */
export function addRulershipInfo(planetName: string, ascendantSign: string | undefined): string {
  if (!ascendantSign) return "";
  
  const ruledHouses = getRuledHouses(planetName, ascendantSign);
  if (ruledHouses.length === 0) return "";

  const houseText = ruledHouses.map(h => getOrdinal(h)).join(", ");
  return ` (rules ${houseText})`;
}

/**
 * The key planets to include in the LLM prompt.
 */
export const KEY_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];

/**
 * Formats planetary positions for the LLM prompt.
 * 
 * @param positions - Array of planetary positions from kundli data
 * @param ascendantSign - The ascendant sign (Vedic or Western name)
 * @param ascendantSignId - The sign ID of the ascendant (1-12)
 * @param options - Formatting options
 * @returns Formatted string of planetary positions
 * 
 * @example
 * // Free forecast (default options)
 * formatPlanetaryPositionsForPrompt(positions, "Libra", 7);
 * // Returns:
 * // - Sun in Capricorn (4th house) (rules 11th)
 * // - Moon in Pisces (6th house) (rules 10th)
 * 
 * @example
 * // Paid forecast (with all options)
 * formatPlanetaryPositionsForPrompt(positions, "Libra", 7, {
 *   includeRulership: true,
 *   includeDegree: true,
 *   includeRetrograde: true,
 *   useWesternSigns: true
 * });
 * // Returns:
 * // - Sun in Capricorn (4th house) at 15.3° (rules 11th)
 * // - Moon in Pisces (6th house) [R] at 22.7° (rules 10th)
 */
export function formatPlanetaryPositionsForPrompt(
  positions: PlanetaryPosition[],
  ascendantSign: string,
  ascendantSignId: number,
  options: FormatOptions = {}
): string {
  const {
    includeRulership = true,
    includeDegree = false,
    includeRetrograde = false,
    useWesternSigns = true,
  } = options;

  return positions
    .filter((p) => p.name !== "Ascendant" && KEY_PLANETS.includes(p.name))
    .map((p) => {
      const sign = useWesternSigns ? toWesternSign(p.sign) : p.sign;
      const house = calculateHouseFromAscendant(p.sign_id, ascendantSignId);
      const houseText = `(${getOrdinal(house)} house)`;
      
      let line = `- ${p.name} in ${sign} ${houseText}`;
      
      // Add retrograde indicator
      if (includeRetrograde && p.is_retrograde) {
        line += " [R]";
      }
      
      // Add degree
      if (includeDegree && p.degree !== undefined) {
        line += ` at ${p.degree.toFixed(1)}°`;
      }
      
      // Add rulership info
      if (includeRulership) {
        line += addRulershipInfo(p.name, ascendantSign);
      }
      
      return line;
    })
    .join("\n");
}

/**
 * Formats the ascendant information for the LLM prompt.
 */
export function formatAscendantForPrompt(
  ascendantSign: string,
  ascendantDegree?: number,
  options: { useWesternSigns?: boolean } = {}
): string {
  const { useWesternSigns = true } = options;
  const sign = useWesternSigns ? toWesternSign(ascendantSign) : ascendantSign;
  const lord = getSignLord(sign);
  
  let text = `**Ascendant:** ${sign}`;
  if (ascendantDegree !== undefined) {
    text += ` at ${ascendantDegree.toFixed(1)}°`;
  }
  text += `\n**Ascendant Lord:** ${lord}`;
  
  return text;
}

/**
 * Finds the ascendant lord's position from the planetary positions array.
 */
export function getAscendantLordPosition(
  positions: PlanetaryPosition[],
  ascendantSign: string,
  ascendantSignId: number,
  options: { useWesternSigns?: boolean } = {}
): string | undefined {
  const { useWesternSigns = true } = options;
  const lord = getSignLord(ascendantSign);
  const lordPosition = positions.find((p) => p.name === lord);
  
  if (!lordPosition) return undefined;
  
  const sign = useWesternSigns ? toWesternSign(lordPosition.sign) : lordPosition.sign;
  const house = calculateHouseFromAscendant(lordPosition.sign_id, ascendantSignId);
  
  return `${sign} (${getOrdinal(house)} house)`;
}
