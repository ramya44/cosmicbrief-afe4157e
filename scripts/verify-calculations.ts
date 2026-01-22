/**
 * Verification script for Vedic birth chart calculations
 * Run with: npx tsx scripts/verify-calculations.ts
 *
 * This script verifies that the vedic-calculator produces correct results
 * by testing against known reference values.
 */

// Inline the core calculation functions for Node.js compatibility
// (The actual edge function uses Deno imports)

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const SIGNS = [
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

function dateToJulianDay(year: number, month: number, day: number, hour: number = 0): number {
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

function getLahiriAyanamsa(jd: number): number {
  const J2000 = 2451545.0;
  const ayanamsa = 23.85 + (50.29 / 3600) * ((jd - J2000) / 365.25);
  return ayanamsa;
}

function normalizeAngle(angle: number): number {
  angle = angle % 360;
  if (angle < 0) angle += 360;
  return angle;
}

function calculateAscendant(jd: number, latitude: number, longitude: number): number {
  const J2000 = 2451545.0;
  const D = jd - J2000;
  const T = D / 36525;

  let GMST = 280.46061837 + 360.98564736629 * D + 0.000387933 * T * T;
  GMST = normalizeAngle(GMST);

  const LST = normalizeAngle(GMST + longitude);
  const LST_rad = LST * DEG_TO_RAD;

  const obliquity = 23.439291 - 0.0130042 * T;
  const obl_rad = obliquity * DEG_TO_RAD;
  const lat_rad = latitude * DEG_TO_RAD;

  // Correct Meeus formula
  const y = Math.cos(LST_rad);
  const x = -Math.sin(LST_rad) * Math.cos(obl_rad) - Math.tan(lat_rad) * Math.sin(obl_rad);
  let asc = Math.atan2(y, x) * RAD_TO_DEG;
  asc = normalizeAngle(asc);

  return asc;
}

function getSignFromLongitude(longitude: number): { vedic: string; index: number } {
  const signIndex = Math.floor(longitude / 30);
  return {
    index: signIndex,
    vedic: SIGNS[signIndex].vedic,
  };
}

// ============================================
// TEST CASES
// ============================================

interface TestCase {
  name: string;
  datetime: string;
  latitude: number;
  longitude: number;
  expectedAscendant: string;
  description: string;
}

const testCases: TestCase[] = [
  {
    name: "Hyderabad 1989",
    datetime: "1989-04-04T21:04:00+05:30",
    latitude: 17.385,
    longitude: 78.4867,
    expectedAscendant: "Tula",
    description: "This was the reported bug - was showing Mesha instead of Tula",
  },
  {
    name: "Morning birth - should have eastern sign rising",
    datetime: "2024-06-15T06:00:00+05:30",
    latitude: 17.385,
    longitude: 78.4867,
    expectedAscendant: "Mithuna", // Around sunrise, Gemini rises in June
    description: "Around sunrise in June, eastern signs should be rising",
  },
];

console.log("===============================================");
console.log("Vedic Birth Chart Calculation Verification");
console.log("===============================================\n");

let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log(`Test: ${test.name}`);
  console.log(`  ${test.description}`);

  // Parse datetime
  const dt = new Date(test.datetime);
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const hour = dt.getUTCHours() + dt.getUTCMinutes() / 60 + dt.getUTCSeconds() / 3600;

  // Calculate
  const jd = dateToJulianDay(year, month, day, hour);
  const ayanamsa = getLahiriAyanamsa(jd);
  const tropicalAsc = calculateAscendant(jd, test.latitude, test.longitude);
  const siderealAsc = normalizeAngle(tropicalAsc - ayanamsa);
  const sign = getSignFromLongitude(siderealAsc);

  console.log(`  JD: ${jd.toFixed(4)}`);
  console.log(`  Ayanamsa: ${ayanamsa.toFixed(4)}°`);
  console.log(`  Tropical Ascendant: ${tropicalAsc.toFixed(2)}°`);
  console.log(`  Sidereal Ascendant: ${siderealAsc.toFixed(2)}° (${sign.vedic})`);
  console.log(`  Expected: ${test.expectedAscendant}`);

  if (sign.vedic === test.expectedAscendant) {
    console.log(`  ✅ PASSED\n`);
    passed++;
  } else {
    console.log(`  ❌ FAILED - Got ${sign.vedic}, expected ${test.expectedAscendant}\n`);
    failed++;
  }
}

// Additional verification: Ascendant should change every ~2 hours
console.log("Test: Ascendant changes throughout the day");
console.log("  Verifying that ascendant moves through multiple signs in 24 hours...");

const baseDate = "2024-06-15";
const lat = 17.385;
const lon = 78.4867;
const ascendantsAtDifferentTimes: string[] = [];

for (let hour = 0; hour < 24; hour += 4) {
  const hourStr = hour.toString().padStart(2, '0');
  const dt = new Date(`${baseDate}T${hourStr}:00:00+05:30`);
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const h = dt.getUTCHours() + dt.getUTCMinutes() / 60;

  const jd = dateToJulianDay(year, month, day, h);
  const ayanamsa = getLahiriAyanamsa(jd);
  const tropicalAsc = calculateAscendant(jd, lat, lon);
  const siderealAsc = normalizeAngle(tropicalAsc - ayanamsa);
  const sign = getSignFromLongitude(siderealAsc);
  ascendantsAtDifferentTimes.push(sign.vedic);
}

const uniqueAscendants = new Set(ascendantsAtDifferentTimes);
console.log(`  Ascendants at 4-hour intervals: ${ascendantsAtDifferentTimes.join(" → ")}`);
console.log(`  Unique signs: ${uniqueAscendants.size}`);

if (uniqueAscendants.size >= 4) {
  console.log(`  ✅ PASSED - ${uniqueAscendants.size} different signs in 24 hours\n`);
  passed++;
} else {
  console.log(`  ❌ FAILED - Only ${uniqueAscendants.size} different signs, expected at least 4\n`);
  failed++;
}

// Summary
console.log("===============================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("===============================================");

if (failed > 0) {
  process.exit(1);
}
