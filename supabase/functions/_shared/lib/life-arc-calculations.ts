/**
 * Life Arc Calculations
 * Vedic astrology calculations for Life Arc feature
 */

// Sign order matching vedic-calculator.ts
const SIGN_ORDER = [
  "Mesha",      // 0 - Aries
  "Vrishabha",  // 1 - Taurus
  "Mithuna",    // 2 - Gemini
  "Karka",      // 3 - Cancer
  "Simha",      // 4 - Leo
  "Kanya",      // 5 - Virgo
  "Tula",       // 6 - Libra
  "Vrishchika", // 7 - Scorpio
  "Dhanu",      // 8 - Sagittarius
  "Makara",     // 9 - Capricorn
  "Kumbha",     // 10 - Aquarius
  "Meena",      // 11 - Pisces
];

// ============================================
// HOUSE CALCULATIONS
// ============================================

/**
 * Calculate which house a planet occupies from a reference point.
 * Uses whole-sign house system.
 *
 * @param planetSign - The sign the planet is in (Vedic name)
 * @param referenceSign - The reference sign (usually Lagna, Moon, or Venus)
 * @returns House number (1-12)
 *
 * @example
 * // Lagna in Kanya (Virgo), Mars in Vrishabha (Taurus)
 * getHouseFromReference("Vrishabha", "Kanya") // → 9
 */
export function getHouseFromReference(planetSign: string, referenceSign: string): number {
  const planetIndex = SIGN_ORDER.indexOf(planetSign);
  const referenceIndex = SIGN_ORDER.indexOf(referenceSign);

  if (planetIndex === -1 || referenceIndex === -1) {
    throw new Error(`Invalid sign name: ${planetIndex === -1 ? planetSign : referenceSign}`);
  }

  const house = ((planetIndex - referenceIndex + 12) % 12) + 1;
  return house;
}

/**
 * Get the sign at a specific house from a reference sign.
 *
 * @param referenceSign - The reference sign (1st house)
 * @param houseNumber - The house number (1-12)
 * @returns The sign at that house
 */
export function getSignAtHouse(referenceSign: string, houseNumber: number): string {
  const referenceIndex = SIGN_ORDER.indexOf(referenceSign);

  if (referenceIndex === -1) {
    throw new Error(`Invalid sign name: ${referenceSign}`);
  }

  const signIndex = (referenceIndex + houseNumber - 1) % 12;
  return SIGN_ORDER[signIndex];
}

/**
 * Get list of signs aspected by a planet.
 *
 * @param planetSign - The sign the planet is in
 * @param aspectHouses - Array of house numbers the planet aspects (from itself)
 * @returns Array of signs that are aspected
 *
 * @example
 * // Jupiter aspects 5th, 7th, 9th from itself
 * getAspectedSigns("Mesha", [5, 7, 9]) // → ["Simha", "Tula", "Dhanu"]
 */
export function getAspectedSigns(planetSign: string, aspectHouses: number[]): string[] {
  const planetIndex = SIGN_ORDER.indexOf(planetSign);

  if (planetIndex === -1) {
    throw new Error(`Invalid sign name: ${planetSign}`);
  }

  return aspectHouses.map((house) => {
    const aspectedIndex = (planetIndex + house - 1) % 12;
    return SIGN_ORDER[aspectedIndex];
  });
}

// ============================================
// MANGAL DOSHA (KUJA DOSHA)
// ============================================

export interface MangalDoshaResult {
  present: boolean;
  fromLagna: { present: boolean; house: number };
  fromMoon: { present: boolean; house: number };
  fromVenus: { present: boolean; house: number };
  severityScore: number; // 0-3 (how many reference points show dosha)
}

/**
 * Calculate Mangal Dosha.
 * Mangal Dosha exists if Mars is in 1st, 2nd, 4th, 7th, 8th, or 12th house
 * from Lagna, Moon, or Venus.
 *
 * @param marsSign - Sign where Mars is placed
 * @param lagnaSign - Ascendant sign
 * @param moonSign - Moon sign
 * @param venusSign - Venus sign
 */
export function calculateMangalDosha(
  marsSign: string,
  lagnaSign: string,
  moonSign: string,
  venusSign: string
): MangalDoshaResult {
  const doshaHouses = [1, 2, 4, 7, 8, 12];

  const marsFromLagna = getHouseFromReference(marsSign, lagnaSign);
  const marsFromMoon = getHouseFromReference(marsSign, moonSign);
  const marsFromVenus = getHouseFromReference(marsSign, venusSign);

  const fromLagna = doshaHouses.includes(marsFromLagna);
  const fromMoon = doshaHouses.includes(marsFromMoon);
  const fromVenus = doshaHouses.includes(marsFromVenus);

  return {
    present: fromLagna || fromMoon || fromVenus,
    fromLagna: { present: fromLagna, house: marsFromLagna },
    fromMoon: { present: fromMoon, house: marsFromMoon },
    fromVenus: { present: fromVenus, house: marsFromVenus },
    severityScore: [fromLagna, fromMoon, fromVenus].filter(Boolean).length,
  };
}

// ============================================
// MANGAL DOSHA CANCELLATIONS
// ============================================

export type MangalDoshaCancellation =
  | "mars_in_own_sign"
  | "mars_exalted"
  | "mars_in_friendly_sign"
  | "mars_conjunct_jupiter"
  | "jupiter_aspects_mars"
  | "mars_conjunct_venus"
  | "venus_aspects_mars"
  | "mars_in_9th_from_lagna";

export interface ChartForCancellation {
  mars: { sign: string };
  jupiter: { sign: string };
  venus: { sign: string };
  lagna: { sign: string };
}

/**
 * Check for conditions that cancel or reduce Mangal Dosha.
 *
 * @param chart - Object containing planetary positions
 * @returns Array of cancellation reasons
 */
export function getMangalDoshaCancellations(chart: ChartForCancellation): MangalDoshaCancellation[] {
  const cancellations: MangalDoshaCancellation[] = [];
  const marsSign = chart.mars.sign;

  // 1. Mars in own sign (Aries or Scorpio)
  if (marsSign === "Mesha" || marsSign === "Vrishchika") {
    cancellations.push("mars_in_own_sign");
  }

  // 2. Mars in exaltation (Capricorn)
  if (marsSign === "Makara") {
    cancellations.push("mars_exalted");
  }

  // 3. Mars in signs of friends (Sun, Moon, Jupiter)
  // Sun rules: Simha | Moon rules: Karka | Jupiter rules: Dhanu, Meena
  const friendlySigns = ["Simha", "Karka", "Dhanu", "Meena"];
  if (friendlySigns.includes(marsSign)) {
    cancellations.push("mars_in_friendly_sign");
  }

  // 4. Mars conjunct Jupiter (same sign)
  if (marsSign === chart.jupiter.sign) {
    cancellations.push("mars_conjunct_jupiter");
  }

  // 5. Jupiter aspects Mars (Jupiter aspects 5th, 7th, 9th from itself)
  const jupiterAspects = getAspectedSigns(chart.jupiter.sign, [5, 7, 9]);
  if (jupiterAspects.includes(marsSign)) {
    cancellations.push("jupiter_aspects_mars");
  }

  // 6. Mars conjunct Venus (same sign) - benefic influence
  if (marsSign === chart.venus.sign) {
    cancellations.push("mars_conjunct_venus");
  }

  // 7. Venus aspects Mars (Venus has only 7th aspect)
  const venusAspects = getAspectedSigns(chart.venus.sign, [7]);
  if (venusAspects.includes(marsSign)) {
    cancellations.push("venus_aspects_mars");
  }

  // 8. Mars in 9th house from Lagna (dharmic placement)
  const marsHouseFromLagna = getHouseFromReference(marsSign, chart.lagna.sign);
  if (marsHouseFromLagna === 9) {
    cancellations.push("mars_in_9th_from_lagna");
  }

  return cancellations;
}

// ============================================
// KAAL SARP DOSHA
// ============================================

export interface KaalSarpResult {
  present: boolean;
  type: string | null;
  planetsBetweenAxis: string[];
  planetsOutsideAxis: string[];
}

export interface PlanetsForKaalSarp {
  sun: { sign: string };
  moon: { sign: string };
  mars: { sign: string };
  mercury: { sign: string };
  jupiter: { sign: string };
  venus: { sign: string };
  saturn: { sign: string };
  rahu: { sign: string };
  ketu: { sign: string };
  lagna: { sign: string };
}

/**
 * Calculate Kaal Sarp Dosha.
 * Kaal Sarp exists if all 7 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
 * are hemmed between Rahu and Ketu.
 */
export function calculateKaalSarp(planets: PlanetsForKaalSarp): KaalSarpResult {
  const rahuIndex = SIGN_ORDER.indexOf(planets.rahu.sign);
  const ketuIndex = SIGN_ORDER.indexOf(planets.ketu.sign);

  const planetsToCheck = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as const;

  // Check if a planet is between Rahu and Ketu (going forward in zodiac)
  const isBetweenRahuKetu = (planetSign: string): boolean => {
    const planetIndex = SIGN_ORDER.indexOf(planetSign);

    if (rahuIndex < ketuIndex) {
      return planetIndex > rahuIndex && planetIndex < ketuIndex;
    } else {
      // Rahu is after Ketu in zodiac order (wraps around)
      return planetIndex > rahuIndex || planetIndex < ketuIndex;
    }
  };

  const planetsBetween: string[] = [];
  const planetsOutside: string[] = [];

  for (const planet of planetsToCheck) {
    const planetSign = planets[planet].sign;

    // Check if conjunct Rahu or Ketu (on the axis)
    if (planetSign === planets.rahu.sign || planetSign === planets.ketu.sign) {
      // Conjunct counts as on the axis, which breaks the yoga
      if (!planetsOutside.includes(planet)) {
        planetsOutside.push(planet);
      }
    } else if (isBetweenRahuKetu(planetSign)) {
      planetsBetween.push(planet);
    } else {
      planetsOutside.push(planet);
    }
  }

  const present = planetsOutside.length === 0;

  // Determine type if present (based on Rahu's house from Lagna)
  let kaalSarpType: string | null = null;
  if (present) {
    const rahuHouseFromLagna = getHouseFromReference(planets.rahu.sign, planets.lagna.sign);
    const typeNames: Record<number, string> = {
      1: "Anant",
      2: "Kulik",
      3: "Vasuki",
      4: "Shankhpal",
      5: "Padma",
      6: "Mahapadma",
      7: "Takshak",
      8: "Karkotak",
      9: "Shankhachur",
      10: "Ghatak",
      11: "Vishdhar",
      12: "Sheshnag",
    };
    kaalSarpType = typeNames[rahuHouseFromLagna] || "Unknown";
  }

  return {
    present,
    type: kaalSarpType,
    planetsBetweenAxis: planetsBetween,
    planetsOutsideAxis: planetsOutside,
  };
}

// ============================================
// SADE SATI (SATURN TRANSIT OVER MOON)
// ============================================

export interface SaturnTransit {
  sign: string;
  start: string;
  end: string;
}

export interface SadeSatiPeriod {
  number: number;
  start: string;
  end: string;
  risingSign: string;
  peakStart?: string;
  settingSign: string;
  ageStart: number;
  ageEnd: number;
}

// Saturn transit data (sidereal/Vedic) - extend as needed
const SATURN_TRANSITS: SaturnTransit[] = [
  { sign: "Makara", start: "1990-03-20", end: "1993-03-05" },
  { sign: "Kumbha", start: "1993-03-05", end: "1995-06-01" },
  { sign: "Meena", start: "1995-06-01", end: "1998-04-17" },
  { sign: "Mesha", start: "1998-04-17", end: "2000-06-06" },
  { sign: "Vrishabha", start: "2000-06-06", end: "2002-07-22" },
  { sign: "Mithuna", start: "2002-07-22", end: "2004-09-05" },
  { sign: "Karka", start: "2004-09-05", end: "2006-10-31" },
  { sign: "Simha", start: "2006-10-31", end: "2009-09-09" },
  { sign: "Kanya", start: "2009-09-09", end: "2011-11-14" },
  { sign: "Tula", start: "2011-11-14", end: "2014-11-02" },
  { sign: "Vrishchika", start: "2014-11-02", end: "2017-01-26" },
  { sign: "Dhanu", start: "2017-01-26", end: "2020-01-23" },
  { sign: "Makara", start: "2020-01-23", end: "2022-04-28" },
  { sign: "Kumbha", start: "2022-04-28", end: "2025-03-29" },
  { sign: "Meena", start: "2025-03-29", end: "2027-06-02" },
  { sign: "Mesha", start: "2027-06-02", end: "2029-08-08" },
  { sign: "Vrishabha", start: "2029-08-08", end: "2032-04-28" },
  { sign: "Mithuna", start: "2032-04-28", end: "2034-07-13" },
  { sign: "Karka", start: "2034-07-13", end: "2036-08-27" },
  { sign: "Simha", start: "2036-08-27", end: "2039-10-22" },
  { sign: "Kanya", start: "2039-10-22", end: "2041-12-15" },
  { sign: "Tula", start: "2041-12-15", end: "2044-02-07" },
  { sign: "Vrishchika", start: "2044-02-07", end: "2046-04-17" },
  { sign: "Dhanu", start: "2046-04-17", end: "2049-06-21" },
  { sign: "Makara", start: "2049-06-21", end: "2052-02-23" },
];

/**
 * Calculate Sade Sati periods based on Moon sign.
 * Sade Sati occurs when Saturn transits 12th, 1st, and 2nd from Moon sign (~7.5 years).
 *
 * @param moonSign - Moon sign (Vedic name)
 * @param birthYear - Year of birth
 */
export function calculateSadeSatiPeriods(moonSign: string, birthYear: number): SadeSatiPeriod[] {
  const moonIndex = SIGN_ORDER.indexOf(moonSign);

  if (moonIndex === -1) {
    throw new Error(`Invalid moon sign: ${moonSign}`);
  }

  // Signs that trigger Sade Sati
  const sign12th = SIGN_ORDER[(moonIndex - 1 + 12) % 12]; // 12th from Moon (start)
  const sign1st = SIGN_ORDER[moonIndex]; // Moon sign (peak)
  const sign2nd = SIGN_ORDER[(moonIndex + 1) % 12]; // 2nd from Moon (end)

  const sadeSatiPeriods: SadeSatiPeriod[] = [];
  let currentPeriod: Partial<SadeSatiPeriod> | null = null;
  let periodNumber = 0;

  for (const transit of SATURN_TRANSITS) {
    if (transit.sign === sign12th && !currentPeriod) {
      // Starting a new Sade Sati period
      periodNumber++;
      currentPeriod = {
        number: periodNumber,
        start: transit.start,
        risingSign: transit.sign,
      };
    } else if (transit.sign === sign1st && currentPeriod) {
      // Peak phase
      currentPeriod.peakStart = transit.start;
    } else if (transit.sign === sign2nd && currentPeriod) {
      // Ending the Sade Sati period
      currentPeriod.end = transit.end;
      currentPeriod.settingSign = transit.sign;

      const startYear = parseInt(currentPeriod.start!.slice(0, 4));
      const endYear = parseInt(transit.end.slice(0, 4));

      currentPeriod.ageStart = startYear - birthYear;
      currentPeriod.ageEnd = endYear - birthYear;

      sadeSatiPeriods.push(currentPeriod as SadeSatiPeriod);
      currentPeriod = null;
    }
  }

  return sadeSatiPeriods;
}

// ============================================
// PITRA DOSHA
// ============================================

export interface PitraDoshaResult {
  present: boolean;
  sunConjunctRahu: boolean;
  sunConjunctKetu: boolean;
  sunConjunctSaturn: boolean;
  notes: string;
}

/**
 * Calculate Pitra Dosha.
 * Pitra Dosha: Sun afflicted by Rahu, Ketu, or Saturn (conjunction).
 */
export function calculatePitraDosha(
  sunSign: string,
  rahuSign: string,
  ketuSign: string,
  saturnSign: string
): PitraDoshaResult {
  const sunWithRahu = sunSign === rahuSign;
  const sunWithKetu = sunSign === ketuSign;
  const sunWithSaturn = sunSign === saturnSign;

  const present = sunWithRahu || sunWithKetu || sunWithSaturn;

  return {
    present,
    sunConjunctRahu: sunWithRahu,
    sunConjunctKetu: sunWithKetu,
    sunConjunctSaturn: sunWithSaturn,
    notes: present ? "Sun afflicted by nodes or Saturn" : "Sun unafflicted",
  };
}

// ============================================
// GURU CHANDAL DOSHA
// ============================================

export interface GuruChandalResult {
  present: boolean;
  jupiterWithRahu: boolean;
  jupiterWithKetu: boolean;
}

/**
 * Calculate Guru Chandal Dosha.
 * Guru Chandal: Jupiter conjunct Rahu or Ketu.
 */
export function calculateGuruChandal(
  jupiterSign: string,
  rahuSign: string,
  ketuSign: string
): GuruChandalResult {
  const withRahu = jupiterSign === rahuSign;
  const withKetu = jupiterSign === ketuSign;

  return {
    present: withRahu || withKetu,
    jupiterWithRahu: withRahu,
    jupiterWithKetu: withKetu,
  };
}

// ============================================
// KEMDRUM DOSHA
// ============================================

export interface KemdrumResult {
  present: boolean;
  sign12thFromMoon: string;
  sign2ndFromMoon: string;
  planetIn12th: string | null;
  planetIn2nd: string | null;
  cancelledBy: string | null;
}

export interface PlanetsForKemdrum {
  moon: { sign: string };
  sun: { sign: string };
  mars: { sign: string };
  mercury: { sign: string };
  jupiter: { sign: string };
  venus: { sign: string };
  saturn: { sign: string };
}

/**
 * Calculate Kemdrum Dosha.
 * Kemdrum Dosha: No planets in 2nd or 12th from Moon.
 * (Excludes Rahu, Ketu, and Moon itself)
 */
export function calculateKemdrum(planets: PlanetsForKemdrum): KemdrumResult {
  const moonIndex = SIGN_ORDER.indexOf(planets.moon.sign);

  if (moonIndex === -1) {
    throw new Error(`Invalid moon sign: ${planets.moon.sign}`);
  }

  const sign12th = SIGN_ORDER[(moonIndex - 1 + 12) % 12];
  const sign2nd = SIGN_ORDER[(moonIndex + 1) % 12];

  const planetsToCheck = ["sun", "mars", "mercury", "jupiter", "venus", "saturn"] as const;

  let planetIn12th: string | null = null;
  let planetIn2nd: string | null = null;

  for (const planet of planetsToCheck) {
    if (planets[planet].sign === sign12th && !planetIn12th) {
      planetIn12th = planet;
    }
    if (planets[planet].sign === sign2nd && !planetIn2nd) {
      planetIn2nd = planet;
    }
  }

  const present = planetIn12th === null && planetIn2nd === null;

  return {
    present,
    sign12thFromMoon: sign12th,
    sign2ndFromMoon: sign2nd,
    planetIn12th,
    planetIn2nd,
    cancelledBy: planetIn12th || planetIn2nd,
  };
}

// ============================================
// YOGAS (POSITIVE COMBINATIONS)
// ============================================

export interface Yoga {
  name: string;
  present: boolean;
  indication: string;
  strength?: string;
  planets?: string[];
}

export interface PlanetsForYogas {
  sun: { sign: string };
  moon: { sign: string };
  mars: { sign: string };
  mercury: { sign: string };
  jupiter: { sign: string };
  venus: { sign: string };
  saturn: { sign: string };
}

/**
 * Calculate key positive yogas in a chart.
 */
export function calculateYogas(planets: PlanetsForYogas, lagnaSign: string): Yoga[] {
  const yogas: Yoga[] = [];

  // 1. Gaja Kesari Yoga: Jupiter in kendra (1, 4, 7, 10) from Moon
  const jupiterFromMoon = getHouseFromReference(planets.jupiter.sign, planets.moon.sign);
  if ([1, 4, 7, 10].includes(jupiterFromMoon)) {
    yogas.push({
      name: "Gaja Kesari",
      present: true,
      indication: "Wisdom, reputation, prosperity",
      strength: [1, 4, 7].includes(jupiterFromMoon) ? "full" : "partial",
    });
  }

  // 2. Budhaditya Yoga: Sun and Mercury conjunct
  if (planets.sun.sign === planets.mercury.sign) {
    yogas.push({
      name: "Budhaditya",
      present: true,
      indication: "Intelligence, communication skills, success in education",
    });
  }

  // 3. Chandra-Mangal Yoga: Moon and Mars conjunct
  if (planets.moon.sign === planets.mars.sign) {
    yogas.push({
      name: "Chandra Mangal",
      present: true,
      indication: "Wealth through courage and initiative",
    });
  }

  // 4. Hamsa Yoga: Jupiter in kendra in own/exalted sign
  const jupiterHouse = getHouseFromReference(planets.jupiter.sign, lagnaSign);
  const jupiterStrong = ["Dhanu", "Meena", "Karka"].includes(planets.jupiter.sign); // Own or exalted
  if ([1, 4, 7, 10].includes(jupiterHouse) && jupiterStrong) {
    yogas.push({
      name: "Hamsa",
      present: true,
      indication: "Righteous, learned, blessed life",
    });
  }

  // 5. Malavya Yoga: Venus in kendra in own/exalted sign
  const venusHouse = getHouseFromReference(planets.venus.sign, lagnaSign);
  const venusStrong = ["Vrishabha", "Tula", "Meena"].includes(planets.venus.sign); // Own or exalted
  if ([1, 4, 7, 10].includes(venusHouse) && venusStrong) {
    yogas.push({
      name: "Malavya",
      present: true,
      indication: "Luxury, beauty, artistic success, happy marriage",
    });
  }

  // 6. Sasa Yoga: Saturn in kendra in own/exalted sign
  const saturnHouse = getHouseFromReference(planets.saturn.sign, lagnaSign);
  const saturnStrong = ["Makara", "Kumbha", "Tula"].includes(planets.saturn.sign); // Own or exalted
  if ([1, 4, 7, 10].includes(saturnHouse) && saturnStrong) {
    yogas.push({
      name: "Sasa",
      present: true,
      indication: "Authority, leadership, success later in life",
    });
  }

  // 7. Ruchaka Yoga: Mars in kendra in own/exalted sign
  const marsHouse = getHouseFromReference(planets.mars.sign, lagnaSign);
  const marsStrong = ["Mesha", "Vrishchika", "Makara"].includes(planets.mars.sign); // Own or exalted
  if ([1, 4, 7, 10].includes(marsHouse) && marsStrong) {
    yogas.push({
      name: "Ruchaka",
      present: true,
      indication: "Courage, leadership, military/athletic success",
    });
  }

  // 8. Bhadra Yoga: Mercury in kendra in own/exalted sign
  const mercuryHouse = getHouseFromReference(planets.mercury.sign, lagnaSign);
  const mercuryStrong = ["Mithuna", "Kanya"].includes(planets.mercury.sign); // Own (also exalted in Kanya)
  if ([1, 4, 7, 10].includes(mercuryHouse) && mercuryStrong) {
    yogas.push({
      name: "Bhadra",
      present: true,
      indication: "Intelligence, business acumen, communication mastery",
    });
  }

  // 9. 10th House Stellium (3+ planets in 10th house)
  const planetsIn10th: string[] = [];
  const planetNames = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as const;

  for (const planetName of planetNames) {
    const planetHouse = getHouseFromReference(planets[planetName].sign, lagnaSign);
    if (planetHouse === 10) {
      planetsIn10th.push(planetName);
    }
  }

  if (planetsIn10th.length >= 3) {
    yogas.push({
      name: "10th House Stellium",
      present: true,
      planets: planetsIn10th,
      indication: "Exceptional career potential, public recognition, authority",
    });
  }

  return yogas;
}

// ============================================
// SIGN LORDS
// ============================================

const SIGN_LORDS: Record<string, string> = {
  Mesha: "Mars",
  Vrishabha: "Venus",
  Mithuna: "Mercury",
  Karka: "Moon",
  Simha: "Sun",
  Kanya: "Mercury",
  Tula: "Venus",
  Vrishchika: "Mars",
  Dhanu: "Jupiter",
  Makara: "Saturn",
  Kumbha: "Saturn",
  Meena: "Jupiter",
};

/**
 * Get the planetary lord of a sign.
 */
export function getSignLord(sign: string): string {
  const lord = SIGN_LORDS[sign];
  if (!lord) {
    throw new Error(`Invalid sign name: ${sign}`);
  }
  return lord;
}

// ============================================
// BHUKTIS (ANTARDASHAS / SUB-PERIODS)
// ============================================

// Dasha lengths in years (Vimshottari system - 120 year cycle)
const DASHA_YEARS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

// Vimshottari dasha sequence
const DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

export interface Bhukti {
  planet: string;
  start: string;
  end: string;
}

/**
 * Calculate sub-periods (bhuktis/antardashas) within a Maha Dasha.
 * Bhuktis follow the same sequence as Maha Dashas, starting from the Maha Dasha lord.
 *
 * @param mahaDashaPlanet - The planet ruling the Maha Dasha
 * @param mahaDashaStart - Start date (YYYY-MM-DD)
 * @param mahaDashaEnd - End date (YYYY-MM-DD) - used for reference only
 */
export function calculateBhuktis(
  mahaDashaPlanet: string,
  mahaDashaStart: string,
  _mahaDashaEnd: string
): Bhukti[] {
  const startIndex = DASHA_SEQUENCE.indexOf(mahaDashaPlanet);
  if (startIndex === -1) {
    throw new Error(`Invalid Maha Dasha planet: ${mahaDashaPlanet}`);
  }

  // Reorder sequence starting from Maha Dasha lord
  const orderedSequence = [...DASHA_SEQUENCE.slice(startIndex), ...DASHA_SEQUENCE.slice(0, startIndex)];

  // Total years in this Maha Dasha
  const mahaDashaYears = DASHA_YEARS[mahaDashaPlanet];
  const totalDashaDays = mahaDashaYears * 365.25;

  // Total of all dasha years (120 years)
  const totalAllYears = Object.values(DASHA_YEARS).reduce((sum, years) => sum + years, 0);

  const startDate = new Date(mahaDashaStart);
  const bhuktis: Bhukti[] = [];
  let currentDate = startDate;

  for (const bhuktiPlanet of orderedSequence) {
    // Bhukti length = (Maha Dasha years * Bhukti planet years) / 120 * 365.25 days
    const bhuktiDays = (mahaDashaYears * DASHA_YEARS[bhuktiPlanet] / totalAllYears) * 365.25;

    const endDate = new Date(currentDate.getTime() + bhuktiDays * 24 * 60 * 60 * 1000);

    bhuktis.push({
      planet: bhuktiPlanet,
      start: formatDateString(currentDate),
      end: formatDateString(endDate),
    });

    currentDate = endDate;
  }

  return bhuktis;
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ============================================
// CHILDREN TIMING INDICATORS
// ============================================

export interface ChildrenIndicators {
  fifthHouseFromLagna: string;
  fifthHouseFromMoon: string;
  fifthLord: string;
  fifthLordSign: string | null;
  planetsIn5thFromLagna: string[];
  planetsIn5thFromMoon: string[];
  jupiterHouseFromLagna: number;
  jupiterHouseFromMoon: number;
  rahuIn5th: boolean;
  ketuIn5thFromMoon: boolean;
  challenges: string[];
  strengths: string[];
}

export interface PlanetsForChildren {
  sun: { sign: string };
  moon: { sign: string };
  mars: { sign: string };
  mercury: { sign: string };
  jupiter: { sign: string };
  venus: { sign: string };
  saturn: { sign: string };
  rahu: { sign: string };
  ketu: { sign: string };
}

/**
 * Analyze 5th house and Jupiter for children timing indicators.
 *
 * @param planets - Planetary positions
 * @param lagnaSign - Ascendant sign
 * @param moonSign - Moon sign
 */
export function calculateChildrenIndicators(
  planets: PlanetsForChildren,
  lagnaSign: string,
  moonSign: string
): ChildrenIndicators {
  const lagnaIndex = SIGN_ORDER.indexOf(lagnaSign);
  const moonIndex = SIGN_ORDER.indexOf(moonSign);

  if (lagnaIndex === -1 || moonIndex === -1) {
    throw new Error(`Invalid sign: ${lagnaIndex === -1 ? lagnaSign : moonSign}`);
  }

  const fifthFromLagna = SIGN_ORDER[(lagnaIndex + 4) % 12];
  const fifthFromMoon = SIGN_ORDER[(moonIndex + 4) % 12];

  // 5th lord from Lagna
  const fifthLord = getSignLord(fifthFromLagna);

  // Find planets in 5th house
  const planetsIn5thFromLagna: string[] = [];
  const planetsIn5thFromMoon: string[] = [];

  const planetNames = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"] as const;

  for (const planetName of planetNames) {
    if (planets[planetName].sign === fifthFromLagna) {
      planetsIn5thFromLagna.push(planetName);
    }
    if (planets[planetName].sign === fifthFromMoon) {
      planetsIn5thFromMoon.push(planetName);
    }
  }

  // Jupiter's position (Putrakaraka - significator of children)
  const jupiterHouseFromLagna = getHouseFromReference(planets.jupiter.sign, lagnaSign);
  const jupiterHouseFromMoon = getHouseFromReference(planets.jupiter.sign, moonSign);

  // Get 5th lord's sign
  const fifthLordKey = fifthLord.toLowerCase() as keyof PlanetsForChildren;
  const fifthLordSign = planets[fifthLordKey]?.sign || null;

  // Build indicators
  const indicators: ChildrenIndicators = {
    fifthHouseFromLagna: fifthFromLagna,
    fifthHouseFromMoon: fifthFromMoon,
    fifthLord,
    fifthLordSign,
    planetsIn5thFromLagna,
    planetsIn5thFromMoon,
    jupiterHouseFromLagna,
    jupiterHouseFromMoon,
    rahuIn5th: planetsIn5thFromLagna.includes("rahu"),
    ketuIn5thFromMoon: planetsIn5thFromMoon.includes("ketu"),
    challenges: [],
    strengths: [],
  };

  // Flag challenges
  if (planetsIn5thFromLagna.includes("rahu")) {
    indicators.challenges.push("Rahu in 5th - unconventional path to children, possible delays");
  }
  if (planetsIn5thFromMoon.includes("ketu")) {
    indicators.challenges.push("Ketu in 5th from Moon - karmic children themes, initial detachment");
  }
  if (planetsIn5thFromLagna.includes("saturn")) {
    indicators.challenges.push("Saturn in 5th - delays but eventual stability");
  }

  // Flag strengths
  if (jupiterHouseFromLagna === 5) {
    indicators.strengths.push("Jupiter in 5th - strong children indicator");
  }
  if ([1, 5, 9].includes(jupiterHouseFromMoon)) {
    indicators.strengths.push("Jupiter in trine from Moon - protected children karma");
  }
  if (planetsIn5thFromLagna.includes("jupiter")) {
    indicators.strengths.push("Jupiter directly in 5th house - auspicious for children");
  }
  if (planetsIn5thFromLagna.includes("venus")) {
    indicators.strengths.push("Venus in 5th - potential for daughters, creative children");
  }

  return indicators;
}

// ============================================
// LIFE EVENT CATEGORIES (12 Houses)
// ============================================

export const LIFE_EVENT_CATEGORIES: Record<number, { name: string; keywords: string[] }> = {
  1: { name: "Personal Growth", keywords: ["identity", "appearance", "initiative", "new starts"] },
  2: { name: "Finances & Family", keywords: ["finances", "speech", "values", "family wealth"] },
  3: { name: "Communication & Learning", keywords: ["siblings", "communication", "short trips", "skills"] },
  4: { name: "Home & Foundations", keywords: ["mother", "property", "vehicles", "education", "inner peace"] },
  5: { name: "Creativity & Romance", keywords: ["children", "creativity", "romance", "speculation", "intelligence"] },
  6: { name: "Health & Wellness", keywords: ["health", "daily routines", "service", "self-improvement"] },
  7: { name: "Relationships", keywords: ["spouse", "business partner", "contracts", "public dealings"] },
  8: { name: "Deep Change", keywords: ["transformation", "inheritance", "research", "personal evolution"] },
  9: { name: "Expansion & Travel", keywords: ["luck", "higher education", "travel abroad", "purpose"] },
  10: { name: "Career & Achievement", keywords: ["career", "reputation", "authority", "achievements", "public image"] },
  11: { name: "Goals & Community", keywords: ["income", "friends", "networking", "aspirations", "social circles"] },
  12: { name: "Rest & Reflection", keywords: ["retreat", "travel abroad", "spirituality", "healing", "inner work"] },
};

// ============================================
// 5 LIFE DIMENSIONS (for comprehensive timeline)
// ============================================

/**
 * Maps the 5 key life dimensions to their relevant houses.
 * Each dimension draws from multiple houses for a complete picture.
 */
export const LIFE_DIMENSIONS = {
  career: {
    name: "Career",
    primaryHouses: [10],      // 10th house is primary for career
    secondaryHouses: [6, 2],  // 6th (work), 2nd (income from work)
    planets: ["Sun", "Saturn", "Mars"], // Career significators
  },
  love: {
    name: "Love & Marriage",
    primaryHouses: [7],       // 7th house is primary for marriage
    secondaryHouses: [5, 1],  // 5th (romance), 1st (self in relationships)
    planets: ["Venus", "Jupiter", "Moon"], // Relationship significators
  },
  children: {
    name: "Children",
    primaryHouses: [5],       // 5th house is primary for children
    secondaryHouses: [9, 2],  // 9th (grandchildren), 2nd (family)
    planets: ["Jupiter", "Moon", "Venus"], // Progeny significators
  },
  wealth: {
    name: "Wealth",
    primaryHouses: [2, 11],   // 2nd (accumulated), 11th (gains)
    secondaryHouses: [9, 5],  // 9th (fortune), 5th (speculation)
    planets: ["Jupiter", "Venus", "Mercury"], // Wealth significators
  },
  health: {
    name: "Health",
    primaryHouses: [1, 6],    // 1st (vitality), 6th (disease/wellness)
    secondaryHouses: [8, 12], // 8th (longevity), 12th (hospitalization)
    planets: ["Sun", "Moon", "Mars"], // Health significators
  },
} as const;

export type LifeDimension = keyof typeof LIFE_DIMENSIONS;

/**
 * A single entry in the comprehensive life timeline.
 * Represents one dasha-bhukti period with scores for all 5 dimensions.
 */
export interface TimelineEntry {
  // Period identification
  yearRange: string;         // e.g., "1989-1993"
  ageRange: string;          // e.g., "0-4"
  ageStart: number;
  ageEnd: number;
  mahaDasha: string;
  bhukti: string;

  // Dimension scores (0-100, higher = more activated)
  dimensions: {
    career: { score: number; nature: "positive" | "challenging" | "neutral" | "building" };
    love: { score: number; nature: "positive" | "challenging" | "neutral" | "building" };
    children: { score: number; nature: "positive" | "challenging" | "neutral" | "building" };
    wealth: { score: number; nature: "positive" | "challenging" | "neutral" | "building" };
    health: { score: number; nature: "positive" | "challenging" | "neutral" | "building" };
  };

  // Astrological context
  astrologicalReason: string; // e.g., "Jupiter Dasha - natural benefic"
  sadeSatiActive: boolean;
  yogasActive: string[];
  doshasActive: string[];
}

/**
 * Life arc patterns summary - overall trajectory for each dimension
 */
export interface LifeArcPattern {
  dimension: string;
  phases: { ageRange: string; label: string }[];
}

/**
 * Comprehensive Life Arc result with full timeline
 */
export interface ComprehensiveLifeArcResult {
  // Summary
  summary: {
    lagnaSign: string;
    moonSign: string;
    birthYear: number;
    currentAge: number;
  };

  // Chart signature
  chartSignature: {
    doshas: {
      mangalDosha: MangalDoshaResult;
      kaalSarp: KaalSarpResult;
      guruChandal: GuruChandalResult;
      pitraDosha: PitraDoshaResult;
      kemdrum: KemdrumResult;
    };
    yogas: Yoga[];
    sadeSatiPeriods: SadeSatiPeriod[];
  };

  // Full timeline (past + future)
  timeline: TimelineEntry[];

  // Separated for convenience
  pastTimeline: TimelineEntry[];
  futureTimeline: TimelineEntry[];

  // Overall patterns
  patterns: LifeArcPattern[];
}

// ============================================
// HOUSE RULERSHIP FUNCTIONS
// ============================================

/**
 * Get which houses a planet rules from a given lagna sign.
 * Each planet rules 1 or 2 signs in the zodiac.
 *
 * @param planet - Planet name (e.g., "Mars", "Venus")
 * @param lagnaSign - Ascendant sign (Vedic name)
 * @returns Array of house numbers (1-12) the planet rules
 */
export function getHousesRuledBy(planet: string, lagnaSign: string): number[] {
  const housesRuled: number[] = [];
  const lagnaIndex = SIGN_ORDER.indexOf(lagnaSign);

  if (lagnaIndex === -1) {
    throw new Error(`Invalid lagna sign: ${lagnaSign}`);
  }

  // Find all signs ruled by this planet
  for (const [sign, lord] of Object.entries(SIGN_LORDS)) {
    if (lord === planet) {
      const signIndex = SIGN_ORDER.indexOf(sign);
      const house = ((signIndex - lagnaIndex + 12) % 12) + 1;
      housesRuled.push(house);
    }
  }

  return housesRuled.sort((a, b) => a - b);
}

/**
 * Get planetary aspects (houses aspected from a planet's position).
 * All planets aspect the 7th from themselves.
 * Mars also aspects 4th and 8th.
 * Jupiter also aspects 5th and 9th.
 * Saturn also aspects 3rd and 10th.
 */
export function getPlanetaryAspects(planet: string): number[] {
  const baseAspect = [7]; // All planets aspect 7th

  switch (planet) {
    case "Mars":
      return [4, 7, 8];
    case "Jupiter":
      return [5, 7, 9];
    case "Saturn":
      return [3, 7, 10];
    case "Rahu":
      return [5, 7, 9]; // Rahu aspects like Jupiter
    case "Ketu":
      return [5, 7, 9]; // Ketu aspects like Jupiter
    default:
      return baseAspect;
  }
}

/**
 * Get houses aspected by a planet from its current sign.
 *
 * @param planet - Planet name
 * @param planetSign - Sign the planet is in
 * @param lagnaSign - Ascendant sign
 * @returns Array of houses (1-12) that the planet aspects
 */
export function getAspectedHouses(planet: string, planetSign: string, lagnaSign: string): number[] {
  const planetHouse = getHouseFromReference(planetSign, lagnaSign);
  const aspectOffsets = getPlanetaryAspects(planet);

  return aspectOffsets.map((offset) => ((planetHouse - 1 + offset) % 12) + 1);
}

// ============================================
// LIFE EVENT WINDOW TYPES
// ============================================

export interface LifeEventWindow {
  // Timing
  startDate: string;
  endDate: string;
  ageAtStart: number;
  ageAtEnd: number;

  // Dasha info
  mahaDasha: string;
  bhukti: string;

  // Event details
  house: number;
  category: string;
  score: number; // 0-100 activation strength
  nature: "positive" | "challenging" | "transformative" | "neutral";

  // Influences
  yogasActive: string[];
  transitInfluences: string[];
  doshaInfluences: string[];

  // Interpretation
  headline: string;
  description: string;
  guidance: string;
}

export interface DashaBhuktiPeriod {
  mahaDasha: string;
  bhukti: string;
  startDate: string;
  endDate: string;
  ageAtStart: number;
  ageAtEnd: number;
}

export interface HouseScores {
  [house: number]: {
    score: number;
    nature: "positive" | "challenging" | "transformative" | "neutral";
    reasons: string[];
  };
}

// ============================================
// PERIOD SCORING ALGORITHM
// ============================================

export interface ChartForScoring {
  planets: {
    sun: { sign: string };
    moon: { sign: string };
    mars: { sign: string };
    mercury: { sign: string };
    jupiter: { sign: string };
    venus: { sign: string };
    saturn: { sign: string };
    rahu: { sign: string };
    ketu: { sign: string };
  };
  lagnaSign: string;
  moonSign: string;
}

/**
 * Score a dasha/bhukti period for all 12 houses.
 * Higher scores indicate stronger activation of that life area.
 *
 * @param dashaLord - The Maha Dasha planet
 * @param bhuktiLord - The Bhukti (antardasha) planet
 * @param chart - Chart data with planetary positions
 * @returns Object with scores for each house
 */
export function scorePeriodForHouses(
  dashaLord: string,
  bhuktiLord: string,
  chart: ChartForScoring
): HouseScores {
  const scores: HouseScores = {};

  // Initialize all houses
  for (let h = 1; h <= 12; h++) {
    scores[h] = { score: 0, nature: "neutral", reasons: [] };
  }

  const lagnaSign = chart.lagnaSign;
  const dashaLordSign = chart.planets[dashaLord.toLowerCase() as keyof typeof chart.planets]?.sign;
  const bhuktiLordSign = chart.planets[bhuktiLord.toLowerCase() as keyof typeof chart.planets]?.sign;

  if (!dashaLordSign || !bhuktiLordSign) {
    return scores;
  }

  // Layer 1: Dasha Lord's house rulership (+3.0 per house)
  const dashaHousesRuled = getHousesRuledBy(dashaLord, lagnaSign);
  for (const house of dashaHousesRuled) {
    scores[house].score += 3.0;
    scores[house].reasons.push(`${dashaLord} rules this house`);
  }

  // Layer 1b: Dasha Lord's placement (+2.0)
  const dashaLordHouse = getHouseFromReference(dashaLordSign, lagnaSign);
  scores[dashaLordHouse].score += 2.0;
  scores[dashaLordHouse].reasons.push(`${dashaLord} placed here`);

  // Layer 1c: Dasha Lord's aspects (+1.0)
  const dashaAspectedHouses = getAspectedHouses(dashaLord, dashaLordSign, lagnaSign);
  for (const house of dashaAspectedHouses) {
    scores[house].score += 1.0;
    scores[house].reasons.push(`${dashaLord} aspects this house`);
  }

  // Layer 2: Bhukti Lord (weighted 0.6x)
  const bhuktiWeight = 0.6;

  const bhuktiHousesRuled = getHousesRuledBy(bhuktiLord, lagnaSign);
  for (const house of bhuktiHousesRuled) {
    scores[house].score += 3.0 * bhuktiWeight;
    scores[house].reasons.push(`${bhuktiLord} (bhukti) rules this house`);
  }

  const bhuktiLordHouse = getHouseFromReference(bhuktiLordSign, lagnaSign);
  scores[bhuktiLordHouse].score += 2.0 * bhuktiWeight;
  scores[bhuktiLordHouse].reasons.push(`${bhuktiLord} (bhukti) placed here`);

  const bhuktiAspectedHouses = getAspectedHouses(bhuktiLord, bhuktiLordSign, lagnaSign);
  for (const house of bhuktiAspectedHouses) {
    scores[house].score += 1.0 * bhuktiWeight;
    scores[house].reasons.push(`${bhuktiLord} (bhukti) aspects this house`);
  }

  // Determine nature based on planets and houses
  // More balanced approach - each planet has positive qualities
  const expansivePlanets = ["Jupiter", "Venus"]; // Natural benefics - ease and growth
  const dynamicPlanets = ["Mars", "Sun"]; // Action-oriented energy
  const structuringPlanets = ["Saturn", "Mercury"]; // Discipline and intellect
  const karmicPlanets = ["Rahu", "Ketu"]; // Transformation and destiny
  const nurturingPlanets = ["Moon"]; // Emotional and intuitive

  for (let h = 1; h <= 12; h++) {
    if (scores[h].score > 0) {
      // Houses 8 and 12 are transformative (spiritual growth, endings/beginnings)
      const transformativeHouses = [8, 12];
      // House 6 is about service, health, daily work - active energy
      const activeHouses = [6, 3, 10];
      // Houses for relationships, wealth, creativity - opportunity
      const opportunityHouses = [2, 5, 7, 11];

      if (transformativeHouses.includes(h)) {
        scores[h].nature = "transformative";
      } else if (expansivePlanets.includes(dashaLord) || expansivePlanets.includes(bhuktiLord)) {
        scores[h].nature = "positive";
      } else if (opportunityHouses.includes(h)) {
        scores[h].nature = "positive";
      } else if (karmicPlanets.includes(dashaLord) && karmicPlanets.includes(bhuktiLord)) {
        // Only mark as transformative if BOTH are karmic planets
        scores[h].nature = "transformative";
      } else if (activeHouses.includes(h) || dynamicPlanets.includes(dashaLord)) {
        scores[h].nature = "neutral"; // Dynamic/active, but not negative
      } else {
        scores[h].nature = "neutral";
      }
    }
  }

  return scores;
}

/**
 * Apply Sade Sati overlay to house scores.
 * Sade Sati is Saturn's transit - a period of maturation, discipline, and building foundations.
 */
export function applySadeSatiOverlay(
  scores: HouseScores,
  inSadeSati: boolean
): HouseScores {
  if (!inSadeSati) return scores;

  scores[6].score += 2.0;
  scores[6].reasons.push("Sade Sati active - focus on health and daily routines");
  // Keep nature as-is, don't force negative

  scores[1].score += 1.5;
  scores[1].reasons.push("Sade Sati active - personal growth and maturity");
  scores[1].nature = "transformative";

  scores[10].score += 0.5; // Slight boost, not reduction - career building
  scores[10].reasons.push("Sade Sati active - building career foundations");
  // Keep nature as-is

  return scores;
}

/**
 * Apply yoga activation to period scores.
 */
export function applyYogaActivation(
  scores: HouseScores,
  yogas: Yoga[],
  dashaLord: string,
  bhuktiLord: string
): { scores: HouseScores; activeYogas: string[] } {
  const activeYogas: string[] = [];

  // Map yogas to relevant houses
  const yogaHouseMap: Record<string, number[]> = {
    "Gaja Kesari": [1, 9, 11], // Wisdom, fortune, gains
    "Budhaditya": [4, 5, 9], // Education, intelligence, higher learning
    "Chandra Mangal": [2, 11], // Wealth, gains
    "Hamsa": [1, 9], // Self, dharma
    "Malavya": [4, 7], // Comforts, marriage
    "Sasa": [10], // Authority, career
    "Ruchaka": [3, 10], // Courage, career
    "Bhadra": [3, 10], // Communication, career
    "10th House Stellium": [10], // Strong career focus
  };

  for (const yoga of yogas) {
    if (!yoga.present) continue;

    // Check if dasha or bhukti lord activates this yoga
    const yogaPlanets = yoga.planets || [];
    const yogaActivated = yogaPlanets.includes(dashaLord.toLowerCase()) ||
      yogaPlanets.includes(bhuktiLord.toLowerCase()) ||
      yoga.name.toLowerCase().includes(dashaLord.toLowerCase()) ||
      yoga.name.toLowerCase().includes(bhuktiLord.toLowerCase());

    if (yogaActivated) {
      activeYogas.push(yoga.name);
      const relevantHouses = yogaHouseMap[yoga.name] || [];
      for (const house of relevantHouses) {
        scores[house].score += 1.5;
        scores[house].reasons.push(`${yoga.name} yoga activated`);
        if (scores[house].nature === "neutral") {
          scores[house].nature = "positive";
        }
      }
    }
  }

  return { scores, activeYogas };
}

/**
 * Apply dosha influences to period scores.
 * Note: Doshas are not inherently negative - they indicate areas requiring awareness.
 */
export function applyDoshaInfluences(
  scores: HouseScores,
  mangalDosha: MangalDoshaResult,
  guruChandal: GuruChandalResult,
  kaalSarp: KaalSarpResult,
  dashaLord: string
): { scores: HouseScores; doshaInfluences: string[] } {
  const doshaInfluences: string[] = [];

  // Mangal Dosha - Mars energy in relationships (passion, drive)
  if (mangalDosha.present && mangalDosha.severityScore > 1) {
    if (dashaLord === "Mars" && scores[7].score > 3) {
      // Only note it, don't change nature - Mars can bring passion to relationships
      scores[7].reasons.push("Mars energy active in partnerships");
      doshaInfluences.push("Mangal Dosha");
    }
  }

  // Guru Chandal - unconventional wisdom path (can be innovative, not negative)
  if (guruChandal.present && dashaLord === "Jupiter") {
    scores[5].reasons.push("Unconventional creative expression");
    scores[9].reasons.push("Non-traditional spiritual/educational path");
    doshaInfluences.push("Guru Chandal");
    // Don't force transformative - let the natural logic apply
  }

  // Kaal Sarp - karmic intensity (don't override all natures)
  if (kaalSarp.present) {
    doshaInfluences.push(`Kaal Sarp (${kaalSarp.type})`);
    // Only note the influence, don't change natures wholesale
    // Kaal Sarp can bring focused determination and destiny fulfillment
  }

  return { scores, doshaInfluences };
}

// ============================================
// MILESTONE DETECTION
// ============================================

export interface DetectedMilestone {
  type: "education" | "career" | "relationship" | "transformation" | "health" | "travel" | "children";
  subtype?: string;
  period: DashaBhuktiPeriod;
  house: number;
  score: number;
  description: string;
}

/**
 * Find the strongest period for given houses within an age range.
 */
export function findStrongestPeriod(
  periods: DashaBhuktiPeriod[],
  houseScores: Map<string, HouseScores>,
  targetHouses: number[],
  ageRange: [number, number]
): { period: DashaBhuktiPeriod; score: number; house: number } | null {
  let bestMatch: { period: DashaBhuktiPeriod; score: number; house: number } | null = null;

  for (const period of periods) {
    // Check if period overlaps with age range
    if (period.ageAtEnd < ageRange[0] || period.ageAtStart > ageRange[1]) {
      continue;
    }

    const periodKey = `${period.mahaDasha}-${period.bhukti}`;
    const scores = houseScores.get(periodKey);

    if (!scores) continue;

    for (const house of targetHouses) {
      const houseScore = scores[house]?.score || 0;
      if (!bestMatch || houseScore > bestMatch.score) {
        bestMatch = { period, score: houseScore, house };
      }
    }
  }

  return bestMatch;
}

/**
 * Detect past milestones based on universal life patterns.
 */
export function detectPastMilestones(
  periods: DashaBhuktiPeriod[],
  houseScores: Map<string, HouseScores>,
  currentAge: number,
  sadeSatiPeriods: SadeSatiPeriod[]
): DetectedMilestone[] {
  const milestones: DetectedMilestone[] = [];
  const scoreThreshold = 3.0;

  // 1. Education period (ages 15-22)
  if (currentAge > 15) {
    const eduResult = findStrongestPeriod(periods, houseScores, [4, 5, 9], [15, Math.min(22, currentAge)]);
    if (eduResult && eduResult.score >= scoreThreshold) {
      milestones.push({
        type: "education",
        period: eduResult.period,
        house: eduResult.house,
        score: eduResult.score,
        description: "Educational foundation or major learning phase",
      });
    }
  }

  // 2. Career start (ages 20-28)
  if (currentAge > 20) {
    const careerResult = findStrongestPeriod(periods, houseScores, [10], [20, Math.min(28, currentAge)]);
    if (careerResult && careerResult.score >= scoreThreshold) {
      milestones.push({
        type: "career",
        period: careerResult.period,
        house: careerResult.house,
        score: careerResult.score,
        description: "Career establishment or significant professional shift",
      });
    }
  }

  // 3. First relationship/marriage (ages 18-35)
  if (currentAge > 18) {
    const relResult = findStrongestPeriod(periods, houseScores, [7], [18, Math.min(35, currentAge)]);
    if (relResult && relResult.score >= scoreThreshold) {
      milestones.push({
        type: "relationship",
        period: relResult.period,
        house: relResult.house,
        score: relResult.score,
        description: "Significant partnership or relationship development",
      });
    }
  }

  // 4. Past Sade Sati periods
  for (const sadeSati of sadeSatiPeriods) {
    if (sadeSati.ageEnd <= currentAge && sadeSati.ageStart >= 0) {
      const matchingPeriod = periods.find(
        (p) => p.ageAtStart <= sadeSati.ageStart && p.ageAtEnd >= sadeSati.ageEnd
      );

      if (matchingPeriod) {
        milestones.push({
          type: "transformation",
          subtype: "sade_sati",
          period: matchingPeriod,
          house: 1, // Self-transformation
          score: 5.0,
          description: `Sade Sati period (ages ${sadeSati.ageStart}-${sadeSati.ageEnd}) - major life transformation`,
        });
      }
    }
  }

  // Sort by age and take top 5
  return milestones
    .sort((a, b) => a.period.ageAtStart - b.period.ageAtStart)
    .slice(0, 5);
}

// ============================================
// FUTURE WINDOW GENERATION
// ============================================

/**
 * Generate future life event windows.
 */
export function generateFutureWindows(
  periods: DashaBhuktiPeriod[],
  houseScores: Map<string, HouseScores>,
  currentAge: number,
  yogas: Yoga[],
  sadeSatiPeriods: SadeSatiPeriod[]
): {
  shortTerm: LifeEventWindow[];
  mediumTerm: LifeEventWindow[];
  longTerm: LifeEventWindow[];
} {
  const shortTerm: LifeEventWindow[] = [];
  const mediumTerm: LifeEventWindow[] = [];
  const longTerm: LifeEventWindow[] = [];

  const currentYear = new Date().getFullYear();

  for (const period of periods) {
    // Only future periods
    if (period.ageAtEnd <= currentAge) continue;

    const periodKey = `${period.mahaDasha}-${period.bhukti}`;
    const scores = houseScores.get(periodKey);
    if (!scores) continue;

    // Check Sade Sati overlap (shared across all windows from this period)
    const transitInfluences: string[] = [];
    for (const ss of sadeSatiPeriods) {
      if (period.ageAtStart <= ss.ageEnd && period.ageAtEnd >= ss.ageStart) {
        if (ss.peakStart) {
          transitInfluences.push("Sade Sati Peak");
        } else {
          transitInfluences.push("Sade Sati Active");
        }
      }
    }

    // Determine active yogas (shared across all windows from this period)
    const yogasActive: string[] = [];
    for (const yoga of yogas) {
      if (yoga.present && yoga.planets?.some(
        (p) => p.toLowerCase() === period.mahaDasha.toLowerCase() ||
          p.toLowerCase() === period.bhukti.toLowerCase()
      )) {
        yogasActive.push(yoga.name);
      }
    }

    // Generate windows for ALL significantly activated houses (not just the highest)
    // This ensures we have diverse windows for the selection algorithm to choose from
    const activatedHouses: { house: number; score: number }[] = [];
    for (let h = 1; h <= 12; h++) {
      if (scores[h].score >= 2.5) {
        activatedHouses.push({ house: h, score: scores[h].score });
      }
    }

    // If no houses meet threshold, skip this period
    if (activatedHouses.length === 0) continue;

    // Create a window for each activated house
    for (const { house, score } of activatedHouses) {
      const eventWindow: LifeEventWindow = {
        startDate: period.startDate,
        endDate: period.endDate,
        ageAtStart: period.ageAtStart,
        ageAtEnd: period.ageAtEnd,
        mahaDasha: period.mahaDasha,
        bhukti: period.bhukti,
        house: house,
        category: LIFE_EVENT_CATEGORIES[house]?.name || "Unknown",
        score: Math.min(100, Math.round(score * 10)),
        nature: scores[house].nature,
        yogasActive,
        transitInfluences,
        doshaInfluences: [], // Will be filled by caller
        headline: "",
        description: "",
        guidance: "",
      };

      // Categorize by time horizon
      const yearsFromNow = period.ageAtStart - currentAge;
      if (yearsFromNow <= 3) {
        shortTerm.push(eventWindow);
      } else if (yearsFromNow <= 10) {
        mediumTerm.push(eventWindow);
      } else if (yearsFromNow <= 20) {
        longTerm.push(eventWindow);
      }
    }
  }

  // Select diverse windows across life categories
  // PRIORITY ORDER: Relationships first, then personal/wealth, career last
  // This ensures balanced life guidance, not just career-focused
  const selectDiverseWindows = (windows: LifeEventWindow[], maxCount: number): LifeEventWindow[] => {
    if (windows.length <= maxCount) return windows.sort((a, b) => b.score - a.score);

    // Ordered array ensures relationships and personal areas get priority
    // Career is intentionally lower so it doesn't dominate the results
    const categoryPriority: [string, number[]][] = [
      ["relationships", [7]],      // Marriage, partnerships - highest priority
      ["children_romance", [5]],   // Romance, creativity, children
      ["wealth", [2, 11]],         // Finances, income, gains
      ["health", [6]],             // Health, wellness
      ["home", [4]],               // Home, family, property
      ["growth", [9, 12]],         // Spirituality, higher learning, travel
      ["self", [1, 3, 8]],         // Identity, courage, transformation
      ["career", [10]],            // Career - lower priority to avoid dominance
    ];

    const selected: LifeEventWindow[] = [];
    const usedCategories = new Set<string>();

    // First pass: pick best window from each category in priority order
    for (const [category, houses] of categoryPriority) {
      if (selected.length >= maxCount) break;

      const categoryWindows = windows
        .filter(w => houses.includes(w.house) && !selected.includes(w))
        .sort((a, b) => b.score - a.score);

      if (categoryWindows.length > 0) {
        selected.push(categoryWindows[0]);
        usedCategories.add(category);
      }
    }

    // Second pass: fill remaining slots with highest scoring windows not yet selected
    const remaining = windows
      .filter(w => !selected.includes(w))
      .sort((a, b) => b.score - a.score);

    for (const w of remaining) {
      if (selected.length >= maxCount) break;
      selected.push(w);
    }

    // Sort final selection by score (keeps high-relevance items at top)
    return selected.sort((a, b) => b.score - a.score);
  };

  return {
    shortTerm: selectDiverseWindows(shortTerm, 6),
    mediumTerm: selectDiverseWindows(mediumTerm, 4),
    longTerm: selectDiverseWindows(longTerm, 3),
  };
}

// ============================================
// BHUKTI PERIOD GENERATOR
// ============================================

/**
 * Generate all dasha-bhukti periods from birth to a specified end year.
 * This is the foundational calculation for the life timeline.
 */
export function generateAllBhuktis(
  moonLongitude: number,
  birthYear: number,
  endYear: number
): DashaBhuktiPeriod[] {
  const allBhuktis: DashaBhuktiPeriod[] = [];
  const maxYears = endYear - birthYear;

  // Calculate nakshatra and starting dasha
  const nakshatraSpan = 13.333333;
  const nakshatraNum = Math.floor(moonLongitude / nakshatraSpan);
  const nakshatraProgress = (moonLongitude % nakshatraSpan) / nakshatraSpan;

  const nakshatraToLord: Record<number, string> = {
    0: "Ketu", 1: "Venus", 2: "Sun", 3: "Moon", 4: "Mars", 5: "Rahu",
    6: "Jupiter", 7: "Saturn", 8: "Mercury", 9: "Ketu", 10: "Venus", 11: "Sun",
    12: "Moon", 13: "Mars", 14: "Rahu", 15: "Jupiter", 16: "Saturn", 17: "Mercury",
    18: "Ketu", 19: "Venus", 20: "Sun", 21: "Moon", 22: "Mars", 23: "Rahu",
    24: "Jupiter", 25: "Saturn", 26: "Mercury",
  };

  const startingLord = nakshatraToLord[nakshatraNum % 27] || "Ketu";
  const startIndex = DASHA_SEQUENCE.indexOf(startingLord);

  // First dasha remaining portion
  const firstDashaYears = DASHA_YEARS[startingLord];
  const remainingYears = firstDashaYears * (1 - nakshatraProgress);

  // Build birth date
  const birthDateStr = `${birthYear}-01-01`;
  let currentDashaDate = new Date(birthDateStr);
  let totalYears = 0;

  // Generate enough cycles to cover maxYears
  const cyclesNeeded = Math.ceil(maxYears / 120) + 1;

  for (let cycle = 0; cycle < cyclesNeeded && totalYears < maxYears; cycle++) {
    for (let i = 0; i < 9 && totalYears < maxYears; i++) {
      const dashaIndex = (startIndex + i) % 9;
      const mahaDasha = DASHA_SEQUENCE[dashaIndex];
      let mahaYears = DASHA_YEARS[mahaDasha];

      if (cycle === 0 && i === 0) {
        mahaYears = remainingYears;
      }

      const mahaEndDate = new Date(currentDashaDate.getTime() + mahaYears * 365.25 * 24 * 60 * 60 * 1000);

      // Calculate bhuktis within this maha dasha
      const bhuktis = calculateBhuktis(mahaDasha, formatDateString(currentDashaDate), formatDateString(mahaEndDate));

      for (const bhukti of bhuktis) {
        const startYear = parseInt(bhukti.start.slice(0, 4));
        const endYear = parseInt(bhukti.end.slice(0, 4));
        const ageAtStart = startYear - birthYear;
        const ageAtEnd = endYear - birthYear;

        // Only include periods within our range
        if (ageAtEnd >= 0 && ageAtStart <= maxYears) {
          allBhuktis.push({
            mahaDasha,
            bhukti: bhukti.planet,
            startDate: bhukti.start,
            endDate: bhukti.end,
            ageAtStart,
            ageAtEnd,
          });
        }
      }

      currentDashaDate = mahaEndDate;
      totalYears += mahaYears;
    }
  }

  return allBhuktis;
}

// ============================================
// MAIN LIFE ARC DATA GENERATOR
// ============================================

export interface LifeArcResult {
  summary: {
    lagnaSign: string;
    moonSign: string;
    currentAge: number;
    currentDasha: { maha: string; bhukti: string };
  };
  chartSignature: {
    doshas: {
      mangalDosha: MangalDoshaResult;
      kaalSarp: KaalSarpResult;
      guruChandal: GuruChandalResult;
      pitraDosha: PitraDoshaResult;
      kemdrum: KemdrumResult;
    };
    yogas: Yoga[];
    sadeSatiPeriods: SadeSatiPeriod[];
  };
  pastMilestones: DetectedMilestone[];
  futureWindows: {
    shortTerm: LifeEventWindow[];
    mediumTerm: LifeEventWindow[];
    longTerm: LifeEventWindow[];
  };
  currentPeriod: {
    dasha: string;
    bhukti: string;
    startDate: string;
    endDate: string;
    activeHouses: { house: number; category: string; score: number }[];
    theme: string;
    yogasActive: string[];
    transitInfluences: string[];
  };
}

export interface PlanetPositionsForLifeArc {
  sun: { sign: string };
  moon: { sign: string; fullDegree: number };
  mars: { sign: string };
  mercury: { sign: string };
  jupiter: { sign: string };
  venus: { sign: string };
  saturn: { sign: string };
  rahu: { sign: string };
  ketu: { sign: string };
}

/**
 * Main function to generate Life Arc data.
 */
export function generateLifeArcData(
  planets: PlanetPositionsForLifeArc,
  lagnaSign: string,
  moonSign: string,
  birthDate: string,
  birthYear: number
): LifeArcResult {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentAge = currentYear - birthYear;

  // Convert planets for various calculations
  const planetsForKaalSarp: PlanetsForKaalSarp = {
    sun: { sign: planets.sun.sign },
    moon: { sign: planets.moon.sign },
    mars: { sign: planets.mars.sign },
    mercury: { sign: planets.mercury.sign },
    jupiter: { sign: planets.jupiter.sign },
    venus: { sign: planets.venus.sign },
    saturn: { sign: planets.saturn.sign },
    rahu: { sign: planets.rahu.sign },
    ketu: { sign: planets.ketu.sign },
    lagna: { sign: lagnaSign },
  };

  const planetsForYogas: PlanetsForYogas = {
    sun: { sign: planets.sun.sign },
    moon: { sign: planets.moon.sign },
    mars: { sign: planets.mars.sign },
    mercury: { sign: planets.mercury.sign },
    jupiter: { sign: planets.jupiter.sign },
    venus: { sign: planets.venus.sign },
    saturn: { sign: planets.saturn.sign },
  };

  const planetsForKemdrum: PlanetsForKemdrum = {
    moon: { sign: planets.moon.sign },
    sun: { sign: planets.sun.sign },
    mars: { sign: planets.mars.sign },
    mercury: { sign: planets.mercury.sign },
    jupiter: { sign: planets.jupiter.sign },
    venus: { sign: planets.venus.sign },
    saturn: { sign: planets.saturn.sign },
  };

  const chartForScoring: ChartForScoring = {
    planets: {
      sun: { sign: planets.sun.sign },
      moon: { sign: planets.moon.sign },
      mars: { sign: planets.mars.sign },
      mercury: { sign: planets.mercury.sign },
      jupiter: { sign: planets.jupiter.sign },
      venus: { sign: planets.venus.sign },
      saturn: { sign: planets.saturn.sign },
      rahu: { sign: planets.rahu.sign },
      ketu: { sign: planets.ketu.sign },
    },
    lagnaSign,
    moonSign,
  };

  // 1. Calculate all doshas
  const mangalDosha = calculateMangalDosha(
    planets.mars.sign,
    lagnaSign,
    moonSign,
    planets.venus.sign
  );

  const kaalSarp = calculateKaalSarp(planetsForKaalSarp);

  const guruChandal = calculateGuruChandal(
    planets.jupiter.sign,
    planets.rahu.sign,
    planets.ketu.sign
  );

  const pitraDosha = calculatePitraDosha(
    planets.sun.sign,
    planets.rahu.sign,
    planets.ketu.sign,
    planets.saturn.sign
  );

  const kemdrum = calculateKemdrum(planetsForKemdrum);

  // 2. Calculate all yogas
  const yogas = calculateYogas(planetsForYogas, lagnaSign);

  // 3. Calculate Sade Sati periods
  const sadeSatiPeriods = calculateSadeSatiPeriods(moonSign, birthYear);

  // 4. Calculate all dasha/bhukti periods
  const birthDateObj = new Date(birthDate);
  const moonLongitude = planets.moon.fullDegree;

  // Use Vimshottari dasha calculation
  const allBhuktis: DashaBhuktiPeriod[] = [];
  let dashaStartDate = new Date(birthDate);

  // Calculate nakshatra and starting dasha
  const nakshatraSpan = 13.333333;
  const nakshatraNum = Math.floor(moonLongitude / nakshatraSpan);
  const nakshatraProgress = (moonLongitude % nakshatraSpan) / nakshatraSpan;

  const nakshatraToLord: Record<number, string> = {
    0: "Ketu", 1: "Venus", 2: "Sun", 3: "Moon", 4: "Mars", 5: "Rahu",
    6: "Jupiter", 7: "Saturn", 8: "Mercury", 9: "Ketu", 10: "Venus", 11: "Sun",
    12: "Moon", 13: "Mars", 14: "Rahu", 15: "Jupiter", 16: "Saturn", 17: "Mercury",
    18: "Ketu", 19: "Venus", 20: "Sun", 21: "Moon", 22: "Mars", 23: "Rahu",
    24: "Jupiter", 25: "Saturn", 26: "Mercury",
  };

  const startingLord = nakshatraToLord[nakshatraNum % 27] || "Ketu";
  const startIndex = DASHA_SEQUENCE.indexOf(startingLord);

  // First dasha remaining portion
  const firstDashaYears = DASHA_YEARS[startingLord];
  const remainingYears = firstDashaYears * (1 - nakshatraProgress);

  // Build all dasha-bhukti periods for 120 years
  let currentDashaDate = new Date(birthDate);
  let totalYears = 0;

  for (let i = 0; i < 9 && totalYears < 120; i++) {
    const dashaIndex = (startIndex + i) % 9;
    const mahaDasha = DASHA_SEQUENCE[dashaIndex];
    let mahaYears = DASHA_YEARS[mahaDasha];

    if (i === 0) {
      mahaYears = remainingYears;
    }

    const mahaEndDate = new Date(currentDashaDate.getTime() + mahaYears * 365.25 * 24 * 60 * 60 * 1000);

    // Calculate bhuktis within this maha dasha
    const bhuktis = calculateBhuktis(mahaDasha, formatDateString(currentDashaDate), formatDateString(mahaEndDate));

    for (const bhukti of bhuktis) {
      const startYear = parseInt(bhukti.start.slice(0, 4));
      const endYear = parseInt(bhukti.end.slice(0, 4));

      allBhuktis.push({
        mahaDasha,
        bhukti: bhukti.planet,
        startDate: bhukti.start,
        endDate: bhukti.end,
        ageAtStart: startYear - birthYear,
        ageAtEnd: endYear - birthYear,
      });
    }

    currentDashaDate = mahaEndDate;
    totalYears += mahaYears;
  }

  // 5. Score each bhukti period for each house
  const houseScores = new Map<string, HouseScores>();

  for (const period of allBhuktis) {
    const periodKey = `${period.mahaDasha}-${period.bhukti}`;
    let scores = scorePeriodForHouses(period.mahaDasha, period.bhukti, chartForScoring);

    // Check if in Sade Sati
    const inSadeSati = sadeSatiPeriods.some(
      (ss) => period.ageAtStart <= ss.ageEnd && period.ageAtEnd >= ss.ageStart
    );
    scores = applySadeSatiOverlay(scores, inSadeSati);

    // Apply yoga activation
    const { scores: yogaScores, activeYogas } = applyYogaActivation(
      scores,
      yogas,
      period.mahaDasha,
      period.bhukti
    );
    scores = yogaScores;

    // Apply dosha influences
    const { scores: doshaScores } = applyDoshaInfluences(
      scores,
      mangalDosha,
      guruChandal,
      kaalSarp,
      period.mahaDasha
    );
    scores = doshaScores;

    houseScores.set(periodKey, scores);
  }

  // 6. Detect past milestones
  const pastMilestones = detectPastMilestones(allBhuktis, houseScores, currentAge, sadeSatiPeriods);

  // 7. Generate future windows
  const futureWindows = generateFutureWindows(allBhuktis, houseScores, currentAge, yogas, sadeSatiPeriods);

  // 8. Get current period info
  const currentPeriodData = allBhuktis.find(
    (p) => p.ageAtStart <= currentAge && p.ageAtEnd >= currentAge
  );

  let currentPeriod = {
    dasha: "Unknown",
    bhukti: "Unknown",
    startDate: "",
    endDate: "",
    activeHouses: [] as { house: number; category: string; score: number }[],
    theme: "",
    yogasActive: [] as string[],
    transitInfluences: [] as string[],
  };

  if (currentPeriodData) {
    const periodKey = `${currentPeriodData.mahaDasha}-${currentPeriodData.bhukti}`;
    const scores = houseScores.get(periodKey);

    const activeHouses: { house: number; category: string; score: number }[] = [];
    if (scores) {
      for (let h = 1; h <= 12; h++) {
        if (scores[h].score >= 2.0) {
          activeHouses.push({
            house: h,
            category: LIFE_EVENT_CATEGORIES[h]?.name || "Unknown",
            score: Math.round(scores[h].score * 10),
          });
        }
      }
      activeHouses.sort((a, b) => b.score - a.score);
    }

    // Check Sade Sati
    const transitInfluences: string[] = [];
    const inCurrentSadeSati = sadeSatiPeriods.some(
      (ss) => currentAge >= ss.ageStart && currentAge <= ss.ageEnd
    );
    if (inCurrentSadeSati) {
      transitInfluences.push("Sade Sati Active");
    }

    // Check active yogas
    const { activeYogas } = applyYogaActivation(
      scores || ({} as HouseScores),
      yogas,
      currentPeriodData.mahaDasha,
      currentPeriodData.bhukti
    );

    // Determine theme
    const topHouse = activeHouses[0]?.house;
    const theme = topHouse
      ? `Focus on ${LIFE_EVENT_CATEGORIES[topHouse]?.name || "life changes"}`
      : "General life period";

    currentPeriod = {
      dasha: currentPeriodData.mahaDasha,
      bhukti: currentPeriodData.bhukti,
      startDate: currentPeriodData.startDate,
      endDate: currentPeriodData.endDate,
      activeHouses: activeHouses.slice(0, 3),
      theme,
      yogasActive: activeYogas,
      transitInfluences,
    };
  }

  return {
    summary: {
      lagnaSign,
      moonSign,
      currentAge,
      currentDasha: { maha: currentPeriod.dasha, bhukti: currentPeriod.bhukti },
    },
    chartSignature: {
      doshas: {
        mangalDosha,
        kaalSarp,
        guruChandal,
        pitraDosha,
        kemdrum,
      },
      yogas,
      sadeSatiPeriods,
    },
    pastMilestones,
    futureWindows,
    currentPeriod,
  };
}

// ============================================
// COMPREHENSIVE LIFE ARC GENERATOR
// ============================================

/**
 * Calculate dimension score from house scores.
 * Uses primary and secondary houses with different weights.
 */
function calculateDimensionScore(
  houseScores: HouseScores,
  dimension: typeof LIFE_DIMENSIONS[LifeDimension],
  dashaLord: string,
  bhuktiLord: string
): { score: number; nature: "positive" | "challenging" | "neutral" | "building" } {
  let totalScore = 0;
  let maxPossible = 0;

  // Primary houses contribute more (weight 1.0)
  for (const house of dimension.primaryHouses) {
    totalScore += houseScores[house]?.score || 0;
    maxPossible += 10; // Assume max score of 10 per house
  }

  // Secondary houses contribute less (weight 0.5)
  for (const house of dimension.secondaryHouses) {
    totalScore += (houseScores[house]?.score || 0) * 0.5;
    maxPossible += 5;
  }

  // Bonus if dasha/bhukti lord is a significator for this dimension
  if (dimension.planets.includes(dashaLord)) {
    totalScore += 2;
  }
  if (dimension.planets.includes(bhuktiLord)) {
    totalScore += 1;
  }

  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, Math.round((totalScore / maxPossible) * 100));

  // Determine nature based on planet types and house conditions
  const benefics = ["Jupiter", "Venus", "Mercury", "Moon"];
  const malefics = ["Saturn", "Mars", "Rahu", "Ketu"];

  let nature: "positive" | "challenging" | "neutral" | "building" = "neutral";

  // Check if benefic planets are involved
  const hasBeneficDasha = benefics.includes(dashaLord);
  const hasBeneficBhukti = benefics.includes(bhuktiLord);
  const hasMaleficDasha = malefics.includes(dashaLord);
  const hasMaleficBhukti = malefics.includes(bhuktiLord);

  if (hasBeneficDasha && hasBeneficBhukti) {
    nature = "positive";
  } else if (hasBeneficDasha || hasBeneficBhukti) {
    nature = normalizedScore > 50 ? "positive" : "building";
  } else if (hasMaleficDasha && hasMaleficBhukti) {
    nature = normalizedScore > 30 ? "building" : "challenging";
  } else if (hasMaleficDasha || hasMaleficBhukti) {
    nature = "building";
  }

  // Saturn always brings building/structure
  if (dashaLord === "Saturn" || bhuktiLord === "Saturn") {
    nature = "building";
  }

  return { score: normalizedScore, nature };
}

/**
 * Generate astrological reasoning text for a period.
 */
function generateAstrologicalReason(
  mahaDasha: string,
  bhukti: string,
  sadeSatiActive: boolean,
  yogasActive: string[]
): string {
  const planetDescriptions: Record<string, string> = {
    Sun: "leadership and authority focus",
    Moon: "emotional and nurturing energy",
    Mars: "action and drive",
    Mercury: "communication and intellect",
    Jupiter: "expansion and wisdom",
    Venus: "harmony and relationships",
    Saturn: "discipline and structure",
    Rahu: "ambition and unconventional paths",
    Ketu: "spirituality and introspection",
  };

  let reason = `${mahaDasha}-${bhukti} bhukti`;

  if (mahaDasha === bhukti) {
    reason = `${mahaDasha} Dasha begins - ${planetDescriptions[mahaDasha] || "transition period"}`;
  } else {
    reason += ` - ${planetDescriptions[mahaDasha] || ""} with ${planetDescriptions[bhukti] || ""}`;
  }

  if (sadeSatiActive) {
    reason += " + Sade Sati";
  }

  if (yogasActive.length > 0) {
    reason += ` (${yogasActive[0]} active)`;
  }

  return reason;
}

/**
 * Generate comprehensive life arc with full timeline.
 * This is the main function for the redesigned Life Arc feature.
 */
export function generateComprehensiveLifeArc(
  planets: PlanetPositionsForLifeArc,
  lagnaSign: string,
  moonSign: string,
  birthDate: string,
  birthYear: number
): ComprehensiveLifeArcResult {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentAge = currentYear - birthYear;

  // Setup planet structures for various calculations
  const planetsForKaalSarp: PlanetsForKaalSarp = {
    sun: { sign: planets.sun.sign },
    moon: { sign: planets.moon.sign },
    mars: { sign: planets.mars.sign },
    mercury: { sign: planets.mercury.sign },
    jupiter: { sign: planets.jupiter.sign },
    venus: { sign: planets.venus.sign },
    saturn: { sign: planets.saturn.sign },
    rahu: { sign: planets.rahu.sign },
    ketu: { sign: planets.ketu.sign },
    lagna: { sign: lagnaSign },
  };

  const planetsForYogas: PlanetsForYogas = {
    sun: { sign: planets.sun.sign },
    moon: { sign: planets.moon.sign },
    mars: { sign: planets.mars.sign },
    mercury: { sign: planets.mercury.sign },
    jupiter: { sign: planets.jupiter.sign },
    venus: { sign: planets.venus.sign },
    saturn: { sign: planets.saturn.sign },
  };

  const planetsForKemdrum: PlanetsForKemdrum = {
    moon: { sign: planets.moon.sign },
    sun: { sign: planets.sun.sign },
    mars: { sign: planets.mars.sign },
    mercury: { sign: planets.mercury.sign },
    jupiter: { sign: planets.jupiter.sign },
    venus: { sign: planets.venus.sign },
    saturn: { sign: planets.saturn.sign },
  };

  const chartForScoring: ChartForScoring = {
    planets: {
      sun: { sign: planets.sun.sign },
      moon: { sign: planets.moon.sign },
      mars: { sign: planets.mars.sign },
      mercury: { sign: planets.mercury.sign },
      jupiter: { sign: planets.jupiter.sign },
      venus: { sign: planets.venus.sign },
      saturn: { sign: planets.saturn.sign },
      rahu: { sign: planets.rahu.sign },
      ketu: { sign: planets.ketu.sign },
    },
    lagnaSign,
    moonSign,
  };

  // 1. Calculate all doshas
  const mangalDosha = calculateMangalDosha(
    planets.mars.sign,
    lagnaSign,
    moonSign,
    planets.venus.sign
  );
  const kaalSarp = calculateKaalSarp(planetsForKaalSarp);
  const guruChandal = calculateGuruChandal(
    planets.jupiter.sign,
    planets.rahu.sign,
    planets.ketu.sign
  );
  const pitraDosha = calculatePitraDosha(
    planets.sun.sign,
    planets.rahu.sign,
    planets.ketu.sign,
    planets.saturn.sign
  );
  const kemdrum = calculateKemdrum(planetsForKemdrum);

  // 2. Calculate yogas
  const yogas = calculateYogas(planetsForYogas, lagnaSign);

  // 3. Calculate Sade Sati periods
  const sadeSatiPeriods = calculateSadeSatiPeriods(moonSign, birthYear);

  // 4. Generate ALL dasha-bhukti periods (birth to age 80)
  const allBhuktis = generateAllBhuktis(planets.moon.fullDegree, birthYear, birthYear + 80);

  // 5. Calculate house scores for each period
  const houseScores = new Map<string, HouseScores>();
  for (const period of allBhuktis) {
    let scores = scorePeriodForHouses(period.mahaDasha, period.bhukti, chartForScoring);

    // Apply Sade Sati overlay
    const inSadeSati = sadeSatiPeriods.some(
      (ss) => period.ageAtStart <= ss.ageEnd && period.ageAtEnd >= ss.ageStart
    );
    scores = applySadeSatiOverlay(scores, inSadeSati);

    // Apply yoga activation
    const { scores: yogaScores } = applyYogaActivation(
      scores,
      yogas,
      period.mahaDasha,
      period.bhukti
    );
    scores = yogaScores;

    // Apply dosha influences
    const { scores: doshaScores } = applyDoshaInfluences(
      scores,
      mangalDosha,
      guruChandal,
      kaalSarp,
      period.mahaDasha
    );
    scores = doshaScores;

    houseScores.set(`${period.mahaDasha}-${period.bhukti}`, scores);
  }

  // 6. Build comprehensive timeline
  const timeline: TimelineEntry[] = [];

  for (const period of allBhuktis) {
    // Skip periods outside reasonable range (before birth or after age 80)
    if (period.ageAtEnd < 0 || period.ageAtStart > 80) continue;

    const periodKey = `${period.mahaDasha}-${period.bhukti}`;
    const scores = houseScores.get(periodKey);
    if (!scores) continue;

    // Check Sade Sati
    const sadeSatiActive = sadeSatiPeriods.some(
      (ss) => period.ageAtStart <= ss.ageEnd && period.ageAtEnd >= ss.ageStart
    );

    // Get active yogas
    const { activeYogas } = applyYogaActivation(
      scores,
      yogas,
      period.mahaDasha,
      period.bhukti
    );

    // Get active doshas
    const doshasActive: string[] = [];
    if (mangalDosha.present && period.mahaDasha === "Mars") {
      doshasActive.push("Mangal Dosha");
    }
    if (kaalSarp.present) {
      doshasActive.push("Kaal Sarp");
    }
    if (guruChandal.present && period.mahaDasha === "Jupiter") {
      doshasActive.push("Guru Chandal");
    }

    // Calculate dimension scores
    const careerScore = calculateDimensionScore(scores, LIFE_DIMENSIONS.career, period.mahaDasha, period.bhukti);
    const loveScore = calculateDimensionScore(scores, LIFE_DIMENSIONS.love, period.mahaDasha, period.bhukti);
    const childrenScore = calculateDimensionScore(scores, LIFE_DIMENSIONS.children, period.mahaDasha, period.bhukti);
    const wealthScore = calculateDimensionScore(scores, LIFE_DIMENSIONS.wealth, period.mahaDasha, period.bhukti);
    const healthScore = calculateDimensionScore(scores, LIFE_DIMENSIONS.health, period.mahaDasha, period.bhukti);

    // Adjust health during Sade Sati
    if (sadeSatiActive) {
      healthScore.nature = "challenging";
    }

    const startYear = birthYear + Math.max(0, Math.floor(period.ageAtStart));
    const endYear = birthYear + Math.ceil(period.ageAtEnd);

    const entry: TimelineEntry = {
      yearRange: `${startYear}-${endYear}`,
      ageRange: `${Math.max(0, Math.floor(period.ageAtStart))}-${Math.ceil(period.ageAtEnd)}`,
      ageStart: Math.max(0, period.ageAtStart),
      ageEnd: period.ageAtEnd,
      mahaDasha: period.mahaDasha,
      bhukti: period.bhukti,
      dimensions: {
        career: careerScore,
        love: loveScore,
        children: childrenScore,
        wealth: wealthScore,
        health: healthScore,
      },
      astrologicalReason: generateAstrologicalReason(
        period.mahaDasha,
        period.bhukti,
        sadeSatiActive,
        activeYogas
      ),
      sadeSatiActive,
      yogasActive: activeYogas,
      doshasActive,
    };

    timeline.push(entry);
  }

  // 7. Separate past and future
  const pastTimeline = timeline.filter((e) => e.ageEnd <= currentAge);
  const futureTimeline = timeline.filter((e) => e.ageStart > currentAge);

  // 8. Generate life arc patterns (simplified)
  const patterns: LifeArcPattern[] = [
    {
      dimension: "Career",
      phases: generateDimensionPhases(timeline, "career"),
    },
    {
      dimension: "Love & Marriage",
      phases: generateDimensionPhases(timeline, "love"),
    },
    {
      dimension: "Children",
      phases: generateDimensionPhases(timeline, "children"),
    },
    {
      dimension: "Wealth",
      phases: generateDimensionPhases(timeline, "wealth"),
    },
    {
      dimension: "Health",
      phases: generateDimensionPhases(timeline, "health"),
    },
  ];

  return {
    summary: {
      lagnaSign,
      moonSign,
      birthYear,
      currentAge,
    },
    chartSignature: {
      doshas: {
        mangalDosha,
        kaalSarp,
        guruChandal,
        pitraDosha,
        kemdrum,
      },
      yogas,
      sadeSatiPeriods,
    },
    timeline,
    pastTimeline,
    futureTimeline,
    patterns,
  };
}

/**
 * Generate phase labels for a dimension based on timeline scores.
 */
function generateDimensionPhases(
  timeline: TimelineEntry[],
  dimension: LifeDimension
): { ageRange: string; label: string }[] {
  const phases: { ageRange: string; label: string }[] = [];

  // Group timeline into life stages
  const stages = [
    { name: "Early Years", start: 0, end: 12 },
    { name: "Adolescence", start: 12, end: 20 },
    { name: "Young Adult", start: 20, end: 30 },
    { name: "Establishment", start: 30, end: 40 },
    { name: "Prime", start: 40, end: 50 },
    { name: "Maturity", start: 50, end: 60 },
    { name: "Wisdom", start: 60, end: 80 },
  ];

  for (const stage of stages) {
    const stageEntries = timeline.filter(
      (e) => e.ageStart >= stage.start && e.ageStart < stage.end
    );

    if (stageEntries.length === 0) continue;

    // Calculate average score and predominant nature for this stage
    const avgScore =
      stageEntries.reduce((sum, e) => sum + e.dimensions[dimension].score, 0) /
      stageEntries.length;

    const natures = stageEntries.map((e) => e.dimensions[dimension].nature);
    const predominantNature = getMostFrequent(natures);

    // Generate label based on dimension and nature
    const label = getDimensionPhaseLabel(dimension, avgScore, predominantNature, stage.name);

    phases.push({
      ageRange: `${stage.start}-${stage.end}`,
      label,
    });
  }

  return phases;
}

/**
 * Get the most frequent item in an array.
 */
function getMostFrequent<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  let maxItem = arr[0];
  let maxCount = 0;
  for (const [item, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxItem = item;
    }
  }
  return maxItem;
}

/**
 * Generate a human-readable label for a dimension phase.
 */
function getDimensionPhaseLabel(
  dimension: LifeDimension,
  score: number,
  nature: string,
  stageName: string
): string {
  const labels: Record<LifeDimension, Record<string, string[]>> = {
    career: {
      positive: ["Rising", "Peak", "Recognition", "Leadership", "Authority"],
      building: ["Building", "Learning", "Developing", "Establishing", "Growing"],
      challenging: ["Transition", "Restructuring", "Pivoting", "Testing", "Evolving"],
      neutral: ["Steady", "Maintaining", "Stable", "Consistent", "Balanced"],
    },
    love: {
      positive: ["Flourishing", "Deepening", "Blossoming", "Harmonious", "Joyful"],
      building: ["Seeking", "Finding", "Forming", "Nurturing", "Developing"],
      challenging: ["Testing", "Clarifying", "Transforming", "Learning", "Growing"],
      neutral: ["Steady", "Comfortable", "Stable", "Peaceful", "Content"],
    },
    children: {
      positive: ["Fertile Window", "Joy", "Celebration", "Connection", "Fulfillment"],
      building: ["Preparing", "Planning", "Nurturing", "Bonding", "Growing"],
      challenging: ["Adjusting", "Learning", "Patience", "Challenges", "Growth"],
      neutral: ["Stable", "Routine", "Peaceful", "Balanced", "Steady"],
    },
    wealth: {
      positive: ["Abundance", "Growth", "Expansion", "Prosperity", "Harvest"],
      building: ["Building", "Accumulating", "Investing", "Growing", "Saving"],
      challenging: ["Restructuring", "Learning", "Adjusting", "Discipline", "Patience"],
      neutral: ["Steady", "Stable", "Maintaining", "Sufficient", "Balanced"],
    },
    health: {
      positive: ["Vitality", "Strength", "Energy", "Wellness", "Thriving"],
      building: ["Improving", "Recovering", "Strengthening", "Balancing", "Nurturing"],
      challenging: ["Attention Needed", "Healing", "Rest Required", "Caution", "Recovery"],
      neutral: ["Stable", "Maintaining", "Steady", "Balanced", "Normal"],
    },
  };

  const options = labels[dimension][nature] || labels[dimension].neutral;
  const index = Math.floor(Math.random() * options.length);
  return options[index];
}

// ============================================
// UTILITY EXPORTS
// ============================================

export { SIGN_ORDER, SATURN_TRANSITS, DASHA_YEARS, DASHA_SEQUENCE, SIGN_LORDS };
