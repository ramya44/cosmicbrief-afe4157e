/**
 * Vedic Astrology Calculator v2 for Deno Edge Functions
 * Uses astronomy-engine library for accurate planetary positions (1 arcminute accuracy)
 * Based on VSOP87 theory - same foundation as Swiss Ephemeris
 */

// @ts-ignore - esm.sh import
import * as Astronomy from "https://esm.sh/astronomy-engine@2.1.19";

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
// ASTRONOMICAL CALCULATIONS using astronomy-engine
// ============================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculate Lahiri Ayanamsa for a given date
 * Using the standard Lahiri formula: 23.85° at J2000 + precession
 */
export function getLahiriAyanamsa(date: Date): number {
  // J2000.0 = January 1, 2000, 12:00 TT
  const J2000 = new Date("2000-01-01T12:00:00Z");
  const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
  const yearsSinceJ2000 = daysSinceJ2000 / 365.25;

  // Lahiri ayanamsa: ~23.85° at J2000, increasing ~50.29" per year
  const ayanamsa = 23.85 + (50.29 / 3600) * yearsSinceJ2000;
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

/**
 * Get geocentric ecliptic longitude for a planet using astronomy-engine
 */
function getPlanetLongitude(body: string, date: Date): number {
  const time = Astronomy.MakeTime(date);

  if (body === "Moon") {
    // For Moon, use EclipticGeoMoon for geocentric ecliptic position
    const moonPos = Astronomy.EclipticGeoMoon(time);
    return normalizeAngle(moonPos.lon);
  }

  if (body === "Sun") {
    // For Sun, use SunPosition which gives geocentric ecliptic coordinates
    const sunPos = Astronomy.SunPosition(time);
    return normalizeAngle(sunPos.elon);
  }

  // For other planets, use GeoVector and convert to ecliptic
  const bodyEnum = Astronomy.Body[body as keyof typeof Astronomy.Body];
  if (bodyEnum === undefined) {
    throw new Error(`Unknown body: ${body}`);
  }

  const geoVec = Astronomy.GeoVector(bodyEnum, time, true);
  const ecliptic = Astronomy.Ecliptic(geoVec);
  return normalizeAngle(ecliptic.elon);
}

/**
 * Get Moon's true node (Rahu) longitude using mean node formula
 */
function getRahuLongitude(date: Date): number {
  const J2000 = new Date("2000-01-01T12:00:00Z");
  const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
  const T = daysSinceJ2000 / 36525;

  // Mean longitude of ascending node (Rahu) - standard formula
  let rahu = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441;
  rahu = normalizeAngle(rahu);

  return rahu;
}

/**
 * Check if planet is retrograde
 */
function isRetrograde(body: string, date: Date): boolean {
  if (body === "Sun" || body === "Moon") {
    return false; // Sun and Moon never retrograde
  }

  if (body === "Rahu" || body === "Ketu") {
    return true; // Nodes always retrograde in Vedic astrology
  }

  // Check daily motion - if longitude decreases, it's retrograde
  const dayBefore = new Date(date.getTime() - 12 * 60 * 60 * 1000);
  const dayAfter = new Date(date.getTime() + 12 * 60 * 60 * 1000);

  try {
    const lon1 = getPlanetLongitude(body, dayBefore);
    const lon2 = getPlanetLongitude(body, dayAfter);

    let diff = lon2 - lon1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return diff < 0;
  } catch {
    return false;
  }
}

/**
 * Calculate Ascendant (Lagna)
 */
export function calculateAscendant(date: Date, latitude: number, longitude: number): number {
  // Calculate Local Sidereal Time
  const time = Astronomy.MakeTime(date);

  // Get Greenwich Sidereal Time
  const gst = Astronomy.SiderealTime(time);

  // Convert to Local Sidereal Time (in degrees)
  const lst = (gst * 15 + longitude) % 360;
  const lstRad = lst * DEG_TO_RAD;

  // Obliquity of ecliptic
  const obliquity = 23.439291 - 0.0130042 * ((date.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24 * 36525));
  const oblRad = obliquity * DEG_TO_RAD;
  const latRad = latitude * DEG_TO_RAD;

  // Ascendant calculation using Meeus formula
  const y = Math.cos(lstRad);
  const x = -Math.sin(lstRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad);
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
 * Calculate complete birth chart data using astronomy-engine
 * @param datetime - ISO datetime string (e.g., "1989-04-04T21:04:00+05:30")
 * @param latitude - Birth location latitude
 * @param longitude - Birth location longitude
 */
export function calculateBirthChart(
  datetime: string,
  latitude: number,
  longitude: number
): BirthChartData {
  // Parse datetime to UTC Date
  const date = new Date(datetime);

  // Get Lahiri ayanamsa
  const ayanamsa = getLahiriAyanamsa(date);

  // Calculate planetary positions
  const planetNames = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const planetIds: Record<string, number> = {
    Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Saturn: 6, Rahu: 101, Ketu: 102
  };

  const planets: PlanetPosition[] = [];

  for (const name of planetNames) {
    const tropicalLon = getPlanetLongitude(name, date);
    const siderealLon = normalizeAngle(tropicalLon - ayanamsa);

    planets.push({
      id: planetIds[name],
      name: name,
      longitude: Math.round(siderealLon * 100) / 100,
      sign: getSignFromLongitude(siderealLon),
      nakshatra: getNakshatraFromLongitude(siderealLon),
      isRetrograde: isRetrograde(name, date),
    });
  }

  // Add Rahu (North Node)
  const rahuTropical = getRahuLongitude(date);
  const rahuSidereal = normalizeAngle(rahuTropical - ayanamsa);
  planets.push({
    id: 101,
    name: "Rahu",
    longitude: Math.round(rahuSidereal * 100) / 100,
    sign: getSignFromLongitude(rahuSidereal),
    nakshatra: getNakshatraFromLongitude(rahuSidereal),
    isRetrograde: true,
  });

  // Add Ketu (South Node - opposite to Rahu)
  const ketuSidereal = normalizeAngle(rahuSidereal + 180);
  planets.push({
    id: 102,
    name: "Ketu",
    longitude: Math.round(ketuSidereal * 100) / 100,
    sign: getSignFromLongitude(ketuSidereal),
    nakshatra: getNakshatraFromLongitude(ketuSidereal),
    isRetrograde: true,
  });

  // Calculate Ascendant
  const tropicalAsc = calculateAscendant(date, latitude, longitude);
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

// Export a function to get planet ID by name (for Mars ordering fix)
export function reorderPlanetsForDisplay(planets: PlanetPosition[]): PlanetPosition[] {
  const order = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  return planets.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}
