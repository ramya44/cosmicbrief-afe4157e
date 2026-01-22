/**
 * Vedic Astrology Calculator for Deno Edge Functions
 * Pure TypeScript implementation using astronomical algorithms
 * Replaces Prokerala API dependency
 */

// Zodiac signs (Vedic and Western names)
export const SIGNS = [
  { vedic: "Mesha", western: "Aries", lord: "Mars" },
  { vedic: "Vrishabha", western: "Taurus", lord: "Venus" },
  { vedic: "Mithuna", western: "Gemini", lord: "Mercury" },
  { vedic: "Karka", western: "Cancer", lord: "Moon" },
  { vedic: "Simha", western: "Leo", lord: "Sun" },
  { vedic: "Kanya", western: "Virgo", lord: "Mercury" },
  { vedic: "Tula", western: "Libra", lord: "Venus" },
  { vedic: "Vrishchika", western: "Scorpio", lord: "Mars" },
  { vedic: "Dhanu", western: "Sagittarius", lord: "Jupiter" },
  { vedic: "Makara", western: "Capricorn", lord: "Saturn" },
  { vedic: "Kumbha", western: "Aquarius", lord: "Saturn" },
  { vedic: "Meena", western: "Pisces", lord: "Jupiter" },
];

// 27 Nakshatras with ruling planets
export const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", deity: "Ashwini Kumaras", animal: "Horse" },
  { name: "Bharani", lord: "Venus", deity: "Yama", animal: "Elephant" },
  { name: "Krittika", lord: "Sun", deity: "Agni", animal: "Sheep" },
  { name: "Rohini", lord: "Moon", deity: "Brahma", animal: "Serpent" },
  { name: "Mrigashira", lord: "Mars", deity: "Soma", animal: "Serpent" },
  { name: "Ardra", lord: "Rahu", deity: "Rudra", animal: "Dog" },
  { name: "Punarvasu", lord: "Jupiter", deity: "Aditi", animal: "Cat" },
  { name: "Pushya", lord: "Saturn", deity: "Brihaspati", animal: "Sheep" },
  { name: "Ashlesha", lord: "Mercury", deity: "Nagas", animal: "Cat" },
  { name: "Magha", lord: "Ketu", deity: "Pitris", animal: "Rat" },
  { name: "Purva Phalguni", lord: "Venus", deity: "Bhaga", animal: "Rat" },
  { name: "Uttara Phalguni", lord: "Sun", deity: "Aryaman", animal: "Cow" },
  { name: "Hasta", lord: "Moon", deity: "Savitar", animal: "Buffalo" },
  { name: "Chitra", lord: "Mars", deity: "Vishvakarma", animal: "Tiger" },
  { name: "Swati", lord: "Rahu", deity: "Vayu", animal: "Buffalo" },
  { name: "Vishakha", lord: "Jupiter", deity: "Indra-Agni", animal: "Tiger" },
  { name: "Anuradha", lord: "Saturn", deity: "Mitra", animal: "Deer" },
  { name: "Jyeshtha", lord: "Mercury", deity: "Indra", animal: "Deer" },
  { name: "Mula", lord: "Ketu", deity: "Nirriti", animal: "Dog" },
  { name: "Purva Ashadha", lord: "Venus", deity: "Apas", animal: "Monkey" },
  { name: "Uttara Ashadha", lord: "Sun", deity: "Vishvadevas", animal: "Mongoose" },
  { name: "Shravana", lord: "Moon", deity: "Vishnu", animal: "Monkey" },
  { name: "Dhanishta", lord: "Mars", deity: "Vasus", animal: "Lion" },
  { name: "Shatabhisha", lord: "Rahu", deity: "Varuna", animal: "Horse" },
  { name: "Purva Bhadrapada", lord: "Jupiter", deity: "Aja Ekapada", animal: "Lion" },
  { name: "Uttara Bhadrapada", lord: "Saturn", deity: "Ahir Budhnya", animal: "Cow" },
  { name: "Revati", lord: "Mercury", deity: "Pushan", animal: "Elephant" },
];

// Vimshottari Dasha periods (in years)
export const DASHA_YEARS: Record<string, number> = {
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

export const DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

// ============================================
// ASTRONOMICAL CALCULATIONS
// ============================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Convert datetime to Julian Day
 */
export function dateToJulianDay(year: number, month: number, day: number, hour: number = 0): number {
  // Handle January and February as months 13 and 14 of the previous year
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);

  const JD = Math.floor(365.25 * (year + 4716)) +
             Math.floor(30.6001 * (month + 1)) +
             day + hour / 24 + B - 1524.5;

  return JD;
}

/**
 * Calculate Lahiri Ayanamsa for a given Julian Day
 * This is the precession of equinoxes value used in Vedic astrology
 */
export function getLahiriAyanamsa(jd: number): number {
  // Reference: Lahiri ayanamsa on Jan 1, 2000 (J2000.0) was approximately 23.85°
  // Precession rate is approximately 50.29" per year
  const J2000 = 2451545.0; // Jan 1, 2000, 12:00 TT
  const T = (jd - J2000) / 36525; // Julian centuries from J2000

  // Lahiri ayanamsa calculation (simplified but accurate)
  // Base value at J2000 + precession
  const ayanamsa = 23.85 + (50.29 / 3600) * ((jd - J2000) / 365.25);

  return ayanamsa;
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
  angle = angle % 360;
  if (angle < 0) angle += 360;
  return angle;
}

// ============================================
// PLANETARY POSITION CALCULATIONS
// Using VSOP87-based algorithms (simplified)
// ============================================

interface PlanetElements {
  L0: number[];  // Mean longitude coefficients
  L1: number[];
  L2: number[];
  e0: number[];  // Eccentricity
  e1: number[];
  i0: number[];  // Inclination
  i1: number[];
  O0: number[];  // Longitude of ascending node
  O1: number[];
  P0: number[];  // Longitude of perihelion
  P1: number[];
  a: number;     // Semi-major axis (AU)
}

// Simplified orbital elements for planets (J2000.0 epoch)
// Format: [value at J2000, rate per century]
const ORBITAL_ELEMENTS: Record<string, { L: number[]; a: number; e: number[]; i: number[]; O: number[]; w: number[] }> = {
  Sun: { // Actually Earth's elements, giving Sun's apparent position
    L: [280.46646, 36000.76983], // Mean longitude
    a: 1.000001018,
    e: [0.01670862, -0.000042037],
    i: [0, 0],
    O: [0, 0],
    w: [102.93735, 0.32327],
  },
  Moon: { // Lunar elements (simplified)
    L: [218.3165, 481267.8813],
    a: 0.00257,  // In AU
    e: [0.0549, 0],
    i: [5.145, 0],
    O: [125.08, -1934.136],
    w: [318.0634, 6003.1498],
  },
  Mercury: {
    L: [252.25084, 149472.67411],
    a: 0.38709893,
    e: [0.20563069, 0.00002123],
    i: [7.00487, -0.00594],
    O: [48.33167, -0.12534],
    w: [77.45645, 0.16047],
  },
  Venus: {
    L: [181.97973, 58517.81539],
    a: 0.72333199,
    e: [0.00677323, -0.00004938],
    i: [3.39471, -0.00078],
    O: [76.68069, -0.27769],
    w: [131.53298, 0.00869],
  },
  Mars: {
    L: [355.45332, 19140.30268],
    a: 1.52366231,
    e: [0.09341233, 0.00011902],
    i: [1.85061, -0.00660],
    O: [49.57854, -0.29257],
    w: [336.04084, 0.44326],
  },
  Jupiter: {
    L: [34.40438, 3034.74612],
    a: 5.20336301,
    e: [0.04839266, -0.00012880],
    i: [1.30530, -0.00183],
    O: [100.55615, 0.16540],
    w: [14.75385, 0.16483],
  },
  Saturn: {
    L: [49.94432, 1222.49362],
    a: 9.53707032,
    e: [0.05415060, -0.00036762],
    i: [2.48446, 0.00465],
    O: [113.71504, -0.29331],
    w: [92.43194, 0.87401],
  },
};

/**
 * Calculate geocentric ecliptic longitude for a planet
 */
function calculatePlanetLongitude(planet: string, jd: number): number {
  const J2000 = 2451545.0;
  const T = (jd - J2000) / 36525; // Julian centuries from J2000

  if (planet === "Sun") {
    // Sun's apparent geocentric longitude
    const elem = ORBITAL_ELEMENTS.Sun;
    const L = normalizeAngle(elem.L[0] + elem.L[1] * T);
    const M = normalizeAngle(L - elem.w[0] - elem.w[1] * T); // Mean anomaly
    const e = elem.e[0] + elem.e[1] * T;

    // Equation of center (simplified)
    const C = (2 * e - e * e * e / 4) * Math.sin(M * DEG_TO_RAD) +
              (5 / 4) * e * e * Math.sin(2 * M * DEG_TO_RAD) +
              (13 / 12) * e * e * e * Math.sin(3 * M * DEG_TO_RAD);
    const C_deg = C * RAD_TO_DEG;

    return normalizeAngle(L + C_deg);
  }

  if (planet === "Moon") {
    // High-precision lunar longitude calculation based on ELP2000-82 / Meeus
    // Mean elements
    const Lp = normalizeAngle(218.3164477 + 481267.88123421 * T
               - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000);
    const D = normalizeAngle(297.8501921 + 445267.1114034 * T
              - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000);
    const M = normalizeAngle(357.5291092 + 35999.0502909 * T
              - 0.0001536 * T * T + T * T * T / 24490000);
    const Mp = normalizeAngle(134.9633964 + 477198.8675055 * T
               + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000);
    const F = normalizeAngle(93.2720950 + 483202.0175233 * T
              - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000);

    // Additional arguments
    const A1 = normalizeAngle(119.75 + 131.849 * T);
    const A2 = normalizeAngle(53.09 + 479264.290 * T);
    const A3 = normalizeAngle(313.45 + 481266.484 * T);

    // Eccentricity correction
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const E2 = E * E;

    // Convert to radians for calculations
    const Dr = D * DEG_TO_RAD;
    const Mr = M * DEG_TO_RAD;
    const Mpr = Mp * DEG_TO_RAD;
    const Fr = F * DEG_TO_RAD;
    const A1r = A1 * DEG_TO_RAD;
    const A2r = A2 * DEG_TO_RAD;
    const A3r = A3 * DEG_TO_RAD;

    // Longitude perturbations (in 0.000001 degrees, from Meeus Table 47.A)
    // Format: [D, M, Mp, F, coeff]
    let sumL = 0;

    // Main periodic terms for longitude (60 most significant terms)
    sumL += 6288774 * Math.sin(Mpr);
    sumL += 1274027 * Math.sin(2 * Dr - Mpr);
    sumL += 658314 * Math.sin(2 * Dr);
    sumL += 213618 * Math.sin(2 * Mpr);
    sumL += -185116 * E * Math.sin(Mr);
    sumL += -114332 * Math.sin(2 * Fr);
    sumL += 58793 * Math.sin(2 * Dr - 2 * Mpr);
    sumL += 57066 * E * Math.sin(2 * Dr - Mr - Mpr);
    sumL += 53322 * Math.sin(2 * Dr + Mpr);
    sumL += 45758 * E * Math.sin(2 * Dr - Mr);
    sumL += -40923 * E * Math.sin(Mr - Mpr);
    sumL += -34720 * Math.sin(Dr);
    sumL += -30383 * E * Math.sin(Mr + Mpr);
    sumL += 15327 * Math.sin(2 * Dr - 2 * Fr);
    sumL += -12528 * Math.sin(Mpr + 2 * Fr);
    sumL += 10980 * Math.sin(Mpr - 2 * Fr);
    sumL += 10675 * Math.sin(4 * Dr - Mpr);
    sumL += 10034 * Math.sin(3 * Mpr);
    sumL += 8548 * Math.sin(4 * Dr - 2 * Mpr);
    sumL += -7888 * E * Math.sin(2 * Dr + Mr - Mpr);
    sumL += -6766 * E * Math.sin(2 * Dr + Mr);
    sumL += -5163 * Math.sin(Dr - Mpr);
    sumL += 4987 * E * Math.sin(Dr + Mr);
    sumL += 4036 * E * Math.sin(2 * Dr - Mr + Mpr);
    sumL += 3994 * Math.sin(2 * Dr + 2 * Mpr);
    sumL += 3861 * Math.sin(4 * Dr);
    sumL += 3665 * Math.sin(2 * Dr - 3 * Mpr);
    sumL += -2689 * E * Math.sin(Mr - 2 * Mpr);
    sumL += -2602 * Math.sin(2 * Dr - Mpr + 2 * Fr);
    sumL += 2390 * E * Math.sin(2 * Dr - Mr - 2 * Mpr);
    sumL += -2348 * Math.sin(Dr + Mpr);
    sumL += 2236 * E2 * Math.sin(2 * Dr - 2 * Mr);
    sumL += -2120 * E * Math.sin(Mr + 2 * Mpr);
    sumL += -2069 * E2 * Math.sin(2 * Mr);
    sumL += 2048 * E2 * Math.sin(2 * Dr - 2 * Mr - Mpr);
    sumL += -1773 * Math.sin(2 * Dr + Mpr - 2 * Fr);
    sumL += -1595 * Math.sin(2 * Dr + 2 * Fr);
    sumL += 1215 * E * Math.sin(4 * Dr - Mr - Mpr);
    sumL += -1110 * Math.sin(2 * Mpr + 2 * Fr);
    sumL += -892 * Math.sin(3 * Dr - Mpr);
    sumL += -810 * E * Math.sin(2 * Dr + Mr + Mpr);
    sumL += 759 * E * Math.sin(4 * Dr - Mr - 2 * Mpr);
    sumL += -713 * E2 * Math.sin(2 * Mr - Mpr);
    sumL += -700 * E2 * Math.sin(2 * Dr + 2 * Mr - Mpr);
    sumL += 691 * E * Math.sin(2 * Dr + Mr - 2 * Mpr);
    sumL += 596 * E * Math.sin(2 * Dr - Mr - 2 * Fr);
    sumL += 549 * Math.sin(4 * Dr + Mpr);
    sumL += 537 * Math.sin(4 * Mpr);
    sumL += 520 * E * Math.sin(4 * Dr - Mr);
    sumL += -487 * Math.sin(Dr - 2 * Mpr);
    sumL += -399 * E * Math.sin(2 * Dr + Mr - 2 * Fr);
    sumL += -381 * Math.sin(2 * Mpr - 2 * Fr);
    sumL += 351 * E * Math.sin(Dr + Mr + Mpr);
    sumL += -340 * Math.sin(3 * Dr - 2 * Mpr);
    sumL += 330 * Math.sin(4 * Dr - 3 * Mpr);
    sumL += 327 * E * Math.sin(2 * Dr - Mr + 2 * Mpr);
    sumL += -323 * E2 * Math.sin(2 * Mr + Mpr);
    sumL += 299 * E * Math.sin(Dr + Mr - Mpr);
    sumL += 294 * Math.sin(2 * Dr + 3 * Mpr);

    // Additional corrections
    sumL += 3958 * Math.sin(A1r);
    sumL += 1962 * Math.sin(Lp * DEG_TO_RAD - Fr);
    sumL += 318 * Math.sin(A2r);

    // Convert from 0.000001 degrees to degrees and add to mean longitude
    const longitude = Lp + sumL / 1000000;

    return normalizeAngle(longitude);
  }

  if (planet === "Rahu") {
    // Mean North Node (Rahu)
    const O = normalizeAngle(125.0445 - 1934.1363 * T);
    return normalizeAngle(O);
  }

  if (planet === "Ketu") {
    // South Node is opposite to North Node
    const rahu = calculatePlanetLongitude("Rahu", jd);
    return normalizeAngle(rahu + 180);
  }

  // Other planets
  const elem = ORBITAL_ELEMENTS[planet];
  if (!elem) throw new Error(`Unknown planet: ${planet}`);

  const L = normalizeAngle(elem.L[0] + elem.L[1] * T);
  const M = normalizeAngle(L - (elem.w[0] + elem.w[1] * T));
  const e = elem.e[0] + elem.e[1] * T;

  // Equation of center
  const C = (2 * e - e * e * e / 4) * Math.sin(M * DEG_TO_RAD) +
            (5 / 4) * e * e * Math.sin(2 * M * DEG_TO_RAD);
  const C_deg = C * RAD_TO_DEG;

  let helioLongitude = normalizeAngle(L + C_deg);

  // Convert heliocentric to geocentric (simplified)
  // This is a rough approximation - for precise results, full VSOP87 would be needed
  const sunLong = calculatePlanetLongitude("Sun", jd);

  if (["Mercury", "Venus"].includes(planet)) {
    // Inner planets - more complex correction needed
    // Using simplified approach
    const r_planet = elem.a;
    const r_earth = 1.0;
    const elongation = helioLongitude - sunLong;

    // Simplified geocentric correction
    const correction = Math.atan2(
      r_planet * Math.sin(elongation * DEG_TO_RAD),
      r_earth + r_planet * Math.cos(elongation * DEG_TO_RAD)
    ) * RAD_TO_DEG;

    return normalizeAngle(sunLong + 180 + correction);
  } else {
    // Outer planets
    const r_planet = elem.a;
    const r_earth = 1.0;
    const helioEarth = sunLong + 180; // Earth's heliocentric longitude

    // Simplified geocentric correction for outer planets
    const diff = helioLongitude - helioEarth;
    const correction = Math.atan2(
      Math.sin(diff * DEG_TO_RAD),
      r_planet / r_earth - Math.cos(diff * DEG_TO_RAD)
    ) * RAD_TO_DEG;

    return normalizeAngle(helioEarth + correction);
  }
}

/**
 * Check if planet is retrograde
 */
function isRetrograde(planet: string, jd: number): boolean {
  if (["Sun", "Moon", "Rahu", "Ketu"].includes(planet)) {
    // Sun and Moon never retrograde, Rahu/Ketu always retrograde
    return ["Rahu", "Ketu"].includes(planet);
  }

  // Check if longitude is decreasing
  const lon1 = calculatePlanetLongitude(planet, jd - 1);
  const lon2 = calculatePlanetLongitude(planet, jd + 1);

  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return diff < 0;
}

/**
 * Calculate Ascendant (Lagna)
 * Formula from Meeus "Astronomical Algorithms":
 * tan(Asc) = cos(LST) / [-sin(LST)·cos(ε) - tan(φ)·sin(ε)]
 */
export function calculateAscendant(jd: number, latitude: number, longitude: number): number {
  // Local Sidereal Time
  const J2000 = 2451545.0;
  const D = jd - J2000;
  const T = D / 36525;

  // Greenwich Mean Sidereal Time at 0h UT
  let GMST = 280.46061837 + 360.98564736629 * D + 0.000387933 * T * T;
  GMST = normalizeAngle(GMST);

  // Local Sidereal Time
  const LST = normalizeAngle(GMST + longitude);
  const LST_rad = LST * DEG_TO_RAD;

  // Obliquity of ecliptic
  const obliquity = 23.439291 - 0.0130042 * T;
  const obl_rad = obliquity * DEG_TO_RAD;
  const lat_rad = latitude * DEG_TO_RAD;

  // Ascendant calculation using correct Meeus formula
  // tan(Asc) = cos(LST) / [-sin(LST)·cos(ε) - tan(φ)·sin(ε)]
  const y = Math.cos(LST_rad);
  const x = -Math.sin(LST_rad) * Math.cos(obl_rad) - Math.tan(lat_rad) * Math.sin(obl_rad);
  let asc = Math.atan2(y, x) * RAD_TO_DEG;
  asc = normalizeAngle(asc);

  return asc;
}

// ============================================
// SIGN AND NAKSHATRA FUNCTIONS
// ============================================

export interface SignInfo {
  index: number;
  vedic: string;
  western: string;
  lord: string;
  degree: number;
}

export interface NakshatraInfo {
  index: number;
  name: string;
  lord: string;
  deity: string;
  pada: number;
  degree: number;
  animal: string;
}

export function getSignFromLongitude(longitude: number): SignInfo {
  const signIndex = Math.floor(longitude / 30);
  const degreeInSign = longitude % 30;

  return {
    index: signIndex,
    vedic: SIGNS[signIndex].vedic,
    western: SIGNS[signIndex].western,
    lord: SIGNS[signIndex].lord,
    degree: Math.round(degreeInSign * 100) / 100,
  };
}

export function getNakshatraFromLongitude(longitude: number): NakshatraInfo {
  const nakshatraSpan = 360 / 27; // 13.333... degrees
  const nakshatraIndex = Math.floor(longitude / nakshatraSpan);
  const degreeInNakshatra = longitude % nakshatraSpan;
  const pada = Math.floor(degreeInNakshatra / (nakshatraSpan / 4)) + 1;

  return {
    index: nakshatraIndex,
    name: NAKSHATRAS[nakshatraIndex].name,
    lord: NAKSHATRAS[nakshatraIndex].lord,
    deity: NAKSHATRAS[nakshatraIndex].deity,
    pada: pada,
    degree: Math.round(degreeInNakshatra * 100) / 100,
    animal: NAKSHATRAS[nakshatraIndex].animal,
  };
}

// ============================================
// MAIN CALCULATION FUNCTIONS
// ============================================

export interface PlanetPosition {
  id: number;
  name: string;
  longitude: number;
  sign: SignInfo;
  nakshatra: NakshatraInfo;
  isRetrograde: boolean;
}

export interface BirthChartData {
  ascendant: {
    longitude: number;
    sign: SignInfo;
    nakshatra: NakshatraInfo;
  };
  moonSign: SignInfo;
  moonNakshatra: NakshatraInfo;
  sunSign: SignInfo;
  sunNakshatra: NakshatraInfo;
  planets: PlanetPosition[];
}

/**
 * Calculate complete birth chart data
 * @param datetime - ISO datetime string (e.g., "1989-04-04T21:04:00+05:30")
 * @param latitude - Birth location latitude
 * @param longitude - Birth location longitude
 */
export function calculateBirthChart(
  datetime: string,
  latitude: number,
  longitude: number
): BirthChartData {
  // Parse datetime
  const dt = new Date(datetime);
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const hour = dt.getUTCHours() + dt.getUTCMinutes() / 60 + dt.getUTCSeconds() / 3600;

  // Calculate Julian Day
  const jd = dateToJulianDay(year, month, day, hour);

  // Get Lahiri ayanamsa
  const ayanamsa = getLahiriAyanamsa(jd);

  // Calculate tropical positions and convert to sidereal
  const planetNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const planetIds: Record<string, number> = {
    Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6, Rahu: 101, Ketu: 102
  };

  const planets: PlanetPosition[] = [];

  for (const name of planetNames) {
    const tropicalLon = calculatePlanetLongitude(name, jd);
    const siderealLon = normalizeAngle(tropicalLon - ayanamsa);

    planets.push({
      id: planetIds[name],
      name: name,
      longitude: Math.round(siderealLon * 100) / 100,
      sign: getSignFromLongitude(siderealLon),
      nakshatra: getNakshatraFromLongitude(siderealLon),
      isRetrograde: isRetrograde(name, jd),
    });
  }

  // Calculate Ascendant
  const tropicalAsc = calculateAscendant(jd, latitude, longitude);
  const siderealAsc = normalizeAngle(tropicalAsc - ayanamsa);

  // Get Moon and Sun data
  const moonData = planets.find(p => p.name === "Moon")!;
  const sunData = planets.find(p => p.name === "Sun")!;

  return {
    ascendant: {
      longitude: Math.round(siderealAsc * 100) / 100,
      sign: getSignFromLongitude(siderealAsc),
      nakshatra: getNakshatraFromLongitude(siderealAsc),
    },
    moonSign: moonData.sign,
    moonNakshatra: moonData.nakshatra,
    sunSign: sunData.sign,
    sunNakshatra: sunData.nakshatra,
    planets: planets,
  };
}

/**
 * Format result to match Prokerala API response structure
 */
export function formatAsProkeralaResponse(chart: BirthChartData) {
  return {
    // Nakshatra details
    nakshatra: chart.moonNakshatra.name,
    nakshatra_id: chart.moonNakshatra.index + 1,
    nakshatra_pada: chart.moonNakshatra.pada,
    nakshatra_lord: chart.moonNakshatra.lord,
    deity: chart.moonNakshatra.deity,
    animal_sign: chart.moonNakshatra.animal,

    // Signs
    moon_sign: chart.moonSign.vedic,
    moon_sign_id: chart.moonSign.index + 1,
    moon_sign_lord: chart.moonSign.lord,
    sun_sign: chart.sunSign.vedic,
    sun_sign_id: chart.sunSign.index + 1,
    sun_sign_lord: chart.sunSign.lord,
    zodiac_sign: chart.moonSign.vedic, // In Vedic, zodiac sign = moon sign

    // Ascendant
    ascendant_sign: chart.ascendant.sign.vedic,
    ascendant_sign_id: chart.ascendant.sign.index + 1,
    ascendant_sign_lord: chart.ascendant.sign.lord,

    // Planetary positions
    planetary_positions: chart.planets.map(p => ({
      id: p.id,
      name: p.name,
      sign: p.sign.vedic,
      sign_id: p.sign.index + 1,
      sign_lord: p.sign.lord,
      degree: p.sign.degree,
      full_degree: p.longitude,
      is_retrograde: p.isRetrograde,
      nakshatra: p.nakshatra.name,
      nakshatra_id: p.nakshatra.index + 1,
      nakshatra_pada: p.nakshatra.pada,
      nakshatra_lord: p.nakshatra.lord,
    })),
  };
}
