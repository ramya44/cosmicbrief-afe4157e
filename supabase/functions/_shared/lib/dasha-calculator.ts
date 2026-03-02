/**
 * Vimshottari Dasha Calculator
 * Calculates Maha Dasha and Antar Dasha periods from Moon's position
 * Shared module for use across edge functions
 */

export interface PlanetaryPosition {
  id: number;
  name: string;
  sign: string;
  sign_id: number;
  sign_lord: string;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
}

export interface DashaPeriod {
  planet: string;
  start_date: string;
  end_date: string;
  years: number;
}

export interface AntarDashaPeriod {
  planet: string;
  start_date: string;
  end_date: string;
  maha_dasha_lord: string;
}

export interface PratyantardashaPeriod {
  planet: string;
  start_date: string;
  end_date: string;
  days: number;
  maha_dasha_lord: string;
  antar_dasha_lord: string;
}

export interface CurrentDashaInfo {
  maha_dasha: string;
  antar_dasha: string;
  maha_dasha_start: string;
  maha_dasha_end: string;
  antar_dasha_start: string;
  antar_dasha_end: string;
}

// Nakshatra data: [name, ruling planet, start degree, end degree]
const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", start: 0, end: 13.333333 },
  { name: "Bharani", lord: "Venus", start: 13.333333, end: 26.666667 },
  { name: "Krittika", lord: "Sun", start: 26.666667, end: 40 },
  { name: "Rohini", lord: "Moon", start: 40, end: 53.333333 },
  { name: "Mrigashira", lord: "Mars", start: 53.333333, end: 66.666667 },
  { name: "Ardra", lord: "Rahu", start: 66.666667, end: 80 },
  { name: "Punarvasu", lord: "Jupiter", start: 80, end: 93.333333 },
  { name: "Pushya", lord: "Saturn", start: 93.333333, end: 106.666667 },
  { name: "Ashlesha", lord: "Mercury", start: 106.666667, end: 120 },
  { name: "Magha", lord: "Ketu", start: 120, end: 133.333333 },
  { name: "Purva Phalguni", lord: "Venus", start: 133.333333, end: 146.666667 },
  { name: "Uttara Phalguni", lord: "Sun", start: 146.666667, end: 160 },
  { name: "Hasta", lord: "Moon", start: 160, end: 173.333333 },
  { name: "Chitra", lord: "Mars", start: 173.333333, end: 186.666667 },
  { name: "Swati", lord: "Rahu", start: 186.666667, end: 200 },
  { name: "Vishakha", lord: "Jupiter", start: 200, end: 213.333333 },
  { name: "Anuradha", lord: "Saturn", start: 213.333333, end: 226.666667 },
  { name: "Jyeshtha", lord: "Mercury", start: 226.666667, end: 240 },
  { name: "Mula", lord: "Ketu", start: 240, end: 253.333333 },
  { name: "Purva Ashadha", lord: "Venus", start: 253.333333, end: 266.666667 },
  { name: "Uttara Ashadha", lord: "Sun", start: 266.666667, end: 280 },
  { name: "Shravana", lord: "Moon", start: 280, end: 293.333333 },
  { name: "Dhanishta", lord: "Mars", start: 293.333333, end: 306.666667 },
  { name: "Shatabhisha", lord: "Rahu", start: 306.666667, end: 320 },
  { name: "Purva Bhadrapada", lord: "Jupiter", start: 320, end: 333.333333 },
  { name: "Uttara Bhadrapada", lord: "Saturn", start: 333.333333, end: 346.666667 },
  { name: "Revati", lord: "Mercury", start: 346.666667, end: 360 }
];

// Vimshottari Dasha periods in years
const DASHA_PERIODS: Record<string, number> = {
  "Sun": 6,
  "Moon": 10,
  "Mars": 7,
  "Rahu": 18,
  "Jupiter": 16,
  "Saturn": 19,
  "Mercury": 17,
  "Ketu": 7,
  "Venus": 20
};

// Dasha sequence starting from Ketu
const DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

/**
 * Find which nakshatra the Moon is in based on its longitude
 */
export function getMoonNakshatra(moonLongitude: number): { name: string; lord: string; progress: number } {
  // Handle 360 degree wrap
  const normalizedLongitude = ((moonLongitude % 360) + 360) % 360;

  const nakshatra = NAKSHATRAS.find(n => normalizedLongitude >= n.start && normalizedLongitude < n.end);

  if (!nakshatra) {
    // Edge case: if exactly 360, treat as Ashwini (0)
    if (normalizedLongitude >= 359.999) {
      return { name: "Ashwini", lord: "Ketu", progress: 0 };
    }
    throw new Error(`Invalid moon longitude: ${moonLongitude}`);
  }

  // Calculate how far into the nakshatra (0-1)
  const nakshatraSpan = 13.333333; // Each nakshatra spans 13°20'
  const progress = (normalizedLongitude - nakshatra.start) / nakshatraSpan;

  return {
    name: nakshatra.name,
    lord: nakshatra.lord,
    progress
  };
}

/**
 * Helper function to add years to a date (accounting for leap years)
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  const days = years * 365.25; // Account for leap years
  result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
  return result;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate Vimshottari Maha Dasha periods from birth date and Moon position
 */
export function calculateMahaDashas(
  birthDate: Date,
  moonLongitude: number
): DashaPeriod[] {
  const nakshatra = getMoonNakshatra(moonLongitude);
  const startingPlanet = nakshatra.lord;

  // Find index of starting planet in sequence
  const startIndex = DASHA_SEQUENCE.indexOf(startingPlanet);

  // Calculate elapsed portion of first dasha
  const firstDashaTotalYears = DASHA_PERIODS[startingPlanet];
  const elapsedYears = nakshatra.progress * firstDashaTotalYears;
  const remainingYears = firstDashaTotalYears - elapsedYears;

  const dashas: DashaPeriod[] = [];
  let currentDate = new Date(birthDate);

  // First dasha (partial)
  const firstDashaEnd = addYears(currentDate, remainingYears);
  dashas.push({
    planet: startingPlanet,
    start_date: formatDate(currentDate),
    end_date: formatDate(firstDashaEnd),
    years: remainingYears
  });

  currentDate = firstDashaEnd;

  // Subsequent complete dashas (cycle through 120 years)
  let totalYears = remainingYears;
  let currentIndex = (startIndex + 1) % DASHA_SEQUENCE.length;

  while (totalYears < 120) {
    const planet = DASHA_SEQUENCE[currentIndex];
    const years = DASHA_PERIODS[planet];
    const endDate = addYears(currentDate, years);

    dashas.push({
      planet,
      start_date: formatDate(currentDate),
      end_date: formatDate(endDate),
      years
    });

    currentDate = endDate;
    totalYears += years;
    currentIndex = (currentIndex + 1) % DASHA_SEQUENCE.length;
  }

  return dashas;
}

/**
 * Calculate Antar Dasha (sub-periods) for a given Maha Dasha
 */
export function calculateAntarDashas(
  mahaDashaStartDate: Date,
  mahaDashaYears: number,
  mahaDashaLord: string
): AntarDashaPeriod[] {
  // Find starting index for antar dasha (starts with maha dasha lord)
  const startIndex = DASHA_SEQUENCE.indexOf(mahaDashaLord);

  const antarDashas: AntarDashaPeriod[] = [];
  let currentDate = new Date(mahaDashaStartDate);

  // Calculate each antar dasha
  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const antarPlanetIndex = (startIndex + i) % DASHA_SEQUENCE.length;
    const antarPlanet = DASHA_SEQUENCE[antarPlanetIndex];
    const antarPlanetPeriod = DASHA_PERIODS[antarPlanet];

    // Antar dasha duration = (Maha lord period × Antar lord period) / 120
    const antarYears = (mahaDashaYears * antarPlanetPeriod) / 120;
    const endDate = addYears(currentDate, antarYears);

    antarDashas.push({
      planet: antarPlanet,
      start_date: formatDate(currentDate),
      end_date: formatDate(endDate),
      maha_dasha_lord: mahaDashaLord
    });

    currentDate = endDate;
  }

  return antarDashas;
}

/**
 * Get current Maha Dasha for a given date
 */
export function getCurrentMahaDasha(
  dashas: DashaPeriod[],
  currentDate: Date = new Date()
): DashaPeriod | null {
  return dashas.find(d => {
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    return currentDate >= start && currentDate <= end;
  }) || null;
}

/**
 * Get current Antar Dasha for a given date
 */
export function getCurrentAntarDasha(
  birthDate: Date,
  moonLongitude: number,
  currentDate: Date = new Date()
): AntarDashaPeriod | null {
  const dashas = calculateMahaDashas(birthDate, moonLongitude);
  const mahaDasha = getCurrentMahaDasha(dashas, currentDate);
  if (!mahaDasha) return null;

  const antarDashas = calculateAntarDashas(
    new Date(mahaDasha.start_date),
    mahaDasha.years,
    mahaDasha.planet
  );

  return antarDashas.find(d => {
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    return currentDate >= start && currentDate <= end;
  }) || null;
}

/**
 * Get complete current dasha info
 */
export function getCurrentDashaInfo(
  birthDate: Date,
  moonLongitude: number,
  currentDate: Date = new Date()
): CurrentDashaInfo | null {
  const dashas = calculateMahaDashas(birthDate, moonLongitude);
  const mahaDasha = getCurrentMahaDasha(dashas, currentDate);
  if (!mahaDasha) return null;

  const antarDashas = calculateAntarDashas(
    new Date(mahaDasha.start_date),
    mahaDasha.years,
    mahaDasha.planet
  );

  const antarDasha = antarDashas.find(d => {
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    return currentDate >= start && currentDate <= end;
  });

  return {
    maha_dasha: mahaDasha.planet,
    antar_dasha: antarDasha?.planet || 'Unknown',
    maha_dasha_start: mahaDasha.start_date,
    maha_dasha_end: mahaDasha.end_date,
    antar_dasha_start: antarDasha?.start_date || '',
    antar_dasha_end: antarDasha?.end_date || ''
  };
}

/**
 * Process planetary positions to calculate all dasha information
 */
export function calculateDashaPeriods(
  positions: PlanetaryPosition[],
  birthDateStr: string
): {
  dasha_periods: DashaPeriod[];
  current_dasha: CurrentDashaInfo | null;
} {
  // Find Moon position
  const moon = positions.find(p => p.name === "Moon");
  if (!moon) {
    throw new Error("Moon position not found");
  }

  const moonLongitude = moon.full_degree;
  const birthDate = new Date(birthDateStr);

  // Calculate all maha dashas
  const dashas = calculateMahaDashas(birthDate, moonLongitude);

  // Get current dasha info
  const currentDasha = getCurrentDashaInfo(birthDate, moonLongitude);

  return {
    dasha_periods: dashas,
    current_dasha: currentDasha
  };
}

/**
 * Helper function to add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
  return result;
}

/**
 * Calculate Pratyantardasha (sub-sub-periods) for a given Antar Dasha
 * Pratyantardasha duration = (Antar dasha days × Pratyantardasha lord period) / 120
 */
export function calculatePratyantardashas(
  antarDashaStartDate: Date,
  antarDashaDays: number,
  mahaDashaLord: string,
  antarDashaLord: string
): PratyantardashaPeriod[] {
  // Find starting index for pratyantardasha (starts with antar dasha lord)
  const startIndex = DASHA_SEQUENCE.indexOf(antarDashaLord);

  const pratyantardashas: PratyantardashaPeriod[] = [];
  let currentDate = new Date(antarDashaStartDate);

  // Calculate each pratyantardasha
  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const pratyantarPlanetIndex = (startIndex + i) % DASHA_SEQUENCE.length;
    const pratyantarPlanet = DASHA_SEQUENCE[pratyantarPlanetIndex];
    const pratyantarPlanetPeriod = DASHA_PERIODS[pratyantarPlanet];

    // Pratyantardasha duration = (Antar dasha days × Pratyantardasha lord period) / 120
    const pratyantarDays = (antarDashaDays * pratyantarPlanetPeriod) / 120;
    const endDate = addDays(currentDate, pratyantarDays);

    pratyantardashas.push({
      planet: pratyantarPlanet,
      start_date: formatDate(currentDate),
      end_date: formatDate(endDate),
      days: pratyantarDays,
      maha_dasha_lord: mahaDashaLord,
      antar_dasha_lord: antarDashaLord
    });

    currentDate = endDate;
  }

  return pratyantardashas;
}

/**
 * Get the active pratyantardasha for a specific date
 */
export function getCurrentPratyantardasha(
  birthDate: Date,
  moonLongitude: number,
  targetDate: Date = new Date()
): PratyantardashaPeriod | null {
  const dashas = calculateMahaDashas(birthDate, moonLongitude);
  const mahaDasha = getCurrentMahaDasha(dashas, targetDate);
  if (!mahaDasha) return null;

  const antarDashas = calculateAntarDashas(
    new Date(mahaDasha.start_date),
    mahaDasha.years,
    mahaDasha.planet
  );

  const antarDasha = antarDashas.find(d => {
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    return targetDate >= start && targetDate <= end;
  });

  if (!antarDasha) return null;

  // Calculate antar dasha duration in days
  const antarStart = new Date(antarDasha.start_date);
  const antarEnd = new Date(antarDasha.end_date);
  const antarDashaDays = (antarEnd.getTime() - antarStart.getTime()) / (24 * 60 * 60 * 1000);

  const pratyantardashas = calculatePratyantardashas(
    antarStart,
    antarDashaDays,
    mahaDasha.planet,
    antarDasha.planet
  );

  return pratyantardashas.find(p => {
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    return targetDate >= start && targetDate <= end;
  }) || null;
}

/**
 * Get all pratyantardashas active during a specific week
 * Returns all pratyantardashas that overlap with the week period
 */
export function getPratyantardashasForWeek(
  birthDate: Date,
  moonLongitude: number,
  weekStart: Date,
  weekEnd: Date
): PratyantardashaPeriod[] {
  const dashas = calculateMahaDashas(birthDate, moonLongitude);

  // Find maha dashas that could overlap with the week
  const relevantMahaDashas = dashas.filter(d => {
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    return start <= weekEnd && end >= weekStart;
  });

  const weekPratyantardashas: PratyantardashaPeriod[] = [];

  for (const mahaDasha of relevantMahaDashas) {
    const antarDashas = calculateAntarDashas(
      new Date(mahaDasha.start_date),
      mahaDasha.years,
      mahaDasha.planet
    );

    // Find antar dashas that overlap with the week
    const relevantAntarDashas = antarDashas.filter(d => {
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);
      return start <= weekEnd && end >= weekStart;
    });

    for (const antarDasha of relevantAntarDashas) {
      const antarStart = new Date(antarDasha.start_date);
      const antarEnd = new Date(antarDasha.end_date);
      const antarDashaDays = (antarEnd.getTime() - antarStart.getTime()) / (24 * 60 * 60 * 1000);

      const pratyantardashas = calculatePratyantardashas(
        antarStart,
        antarDashaDays,
        mahaDasha.planet,
        antarDasha.planet
      );

      // Filter pratyantardashas that overlap with the week
      for (const p of pratyantardashas) {
        const pStart = new Date(p.start_date);
        const pEnd = new Date(p.end_date);
        if (pStart <= weekEnd && pEnd >= weekStart) {
          weekPratyantardashas.push(p);
        }
      }
    }
  }

  // Remove duplicates and sort by start date
  const uniquePratyantardashas = weekPratyantardashas.filter(
    (p, index, self) =>
      index === self.findIndex(t => t.start_date === p.start_date && t.planet === p.planet)
  );

  return uniquePratyantardashas.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
}

/**
 * Format pratyantardasha info for display (using accessible language)
 */
export function formatPratyantardashaForDisplay(p: PratyantardashaPeriod): string {
  return `${p.maha_dasha_lord}-${p.antar_dasha_lord}-${p.planet} sub-period`;
}

/**
 * Get a summary of the week's pratyantardasha influences
 */
export function getWeeklyDashaSummary(
  birthDate: Date,
  moonLongitude: number,
  weekStart: Date,
  weekEnd: Date
): {
  mahaDasha: string;
  antarDasha: string;
  pratyantardashas: PratyantardashaPeriod[];
  hasTransition: boolean;
} {
  const pratyantardashas = getPratyantardashasForWeek(birthDate, moonLongitude, weekStart, weekEnd);

  // Get the current dasha info for the middle of the week
  const midWeek = new Date(weekStart.getTime() + (weekEnd.getTime() - weekStart.getTime()) / 2);
  const currentInfo = getCurrentDashaInfo(birthDate, moonLongitude, midWeek);

  return {
    mahaDasha: currentInfo?.maha_dasha || 'Unknown',
    antarDasha: currentInfo?.antar_dasha || 'Unknown',
    pratyantardashas,
    hasTransition: pratyantardashas.length > 1
  };
}
