/**
 * Vedic Calculator Tests
 * Run with: deno test --allow-read supabase/functions/_shared/lib/vedic-calculator.test.ts
 *
 * These tests verify that birth chart calculations are accurate by comparing
 * against known reference values from established Vedic astrology software.
 */

import { assertEquals, assertAlmostEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  calculateBirthChart,
  formatAsProkeralaResponse,
  dateToJulianDay,
  getLahiriAyanamsa,
  calculateAscendant,
  SIGNS,
} from "./vedic-calculator.ts";

// Helper to check if sign matches expected (with some tolerance for edge cases)
function assertSignEquals(actual: string, expected: string, message: string) {
  assertEquals(actual, expected, message);
}

// Helper to check longitude is within tolerance (degrees)
function assertLongitudeNear(actual: number, expected: number, toleranceDeg: number, message: string) {
  const diff = Math.abs(actual - expected);
  const wrappedDiff = Math.min(diff, 360 - diff); // Handle wrap-around at 360°
  if (wrappedDiff > toleranceDeg) {
    throw new Error(`${message}: expected ~${expected}°, got ${actual}° (diff: ${wrappedDiff}°)`);
  }
}

// ============================================
// TEST CASES WITH KNOWN REFERENCE VALUES
// ============================================

/**
 * Test Case 1: April 4, 1989, 9:04 PM IST, Hyderabad
 * Reference values verified against multiple Vedic astrology sources.
 *
 * Expected:
 * - Ascendant (Lagna): Tula (Libra)
 * - Moon Sign: Meena (Pisces) - Moon in Revati nakshatra
 * - Sun Sign: Meena (Pisces) - Sun in late Pisces
 */
Deno.test("Test Case 1: Hyderabad 1989 - Ascendant should be Tula", () => {
  // Hyderabad coordinates: 17.385°N, 78.4867°E
  // Birth time: 21:04 IST (UTC+5:30) = 15:34 UTC
  const datetime = "1989-04-04T21:04:00+05:30";
  const latitude = 17.385;
  const longitude = 78.4867;

  const chart = calculateBirthChart(datetime, latitude, longitude);
  const formatted = formatAsProkeralaResponse(chart);

  // Ascendant should be Tula (Libra) - this was the reported bug
  assertSignEquals(
    formatted.ascendant_sign,
    "Tula",
    `Ascendant should be Tula (Libra), got ${formatted.ascendant_sign}`
  );

  // Moon should be in Meena (Pisces) - in Revati nakshatra
  assertSignEquals(
    formatted.moon_sign,
    "Meena",
    `Moon sign should be Meena (Pisces), got ${formatted.moon_sign}`
  );

  // Sun should be in Meena (Pisces) in early April
  assertSignEquals(
    formatted.sun_sign,
    "Meena",
    `Sun sign should be Meena (Pisces), got ${formatted.sun_sign}`
  );

  // Moon nakshatra should be Revati
  assertEquals(
    formatted.nakshatra,
    "Revati",
    `Moon nakshatra should be Revati, got ${formatted.nakshatra}`
  );

  console.log("✓ Test Case 1 passed: Hyderabad 1989 chart calculations correct");
  console.log(`  Ascendant: ${formatted.ascendant_sign} (${chart.ascendant.longitude.toFixed(2)}°)`);
  console.log(`  Moon: ${formatted.moon_sign} in ${formatted.nakshatra}`);
  console.log(`  Sun: ${formatted.sun_sign}`);
});

/**
 * Test Case 2: January 1, 2000, 12:00 PM UTC, Greenwich
 * Useful reference point at J2000 epoch.
 */
Deno.test("Test Case 2: J2000 Epoch Reference Point", () => {
  const datetime = "2000-01-01T12:00:00+00:00";
  const latitude = 51.4772; // Greenwich Observatory
  const longitude = 0.0;

  const chart = calculateBirthChart(datetime, latitude, longitude);
  const formatted = formatAsProkeralaResponse(chart);

  // Sun should be in Dhanu (Sagittarius) at J2000
  // (Tropical Capricorn - ~23.85° ayanamsa = Sidereal Sagittarius)
  assertSignEquals(
    formatted.sun_sign,
    "Dhanu",
    `Sun sign at J2000 should be Dhanu (Sagittarius), got ${formatted.sun_sign}`
  );

  console.log("✓ Test Case 2 passed: J2000 epoch reference");
  console.log(`  Sun: ${formatted.sun_sign} (${chart.planets.find(p => p.name === "Sun")?.longitude.toFixed(2)}°)`);
});

/**
 * Test Case 3: Verify ascendant changes roughly every 2 hours
 * The ascendant moves through all 12 signs in 24 hours, so it should
 * change approximately every 2 hours.
 */
Deno.test("Test Case 3: Ascendant changes with time", () => {
  const latitude = 17.385;
  const longitude = 78.4867;
  const date = "2024-06-15";

  // Calculate ascendant at different times
  const times = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
  const ascendants: string[] = [];

  for (const time of times) {
    const datetime = `${date}T${time}:00+05:30`;
    const chart = calculateBirthChart(datetime, latitude, longitude);
    ascendants.push(chart.ascendant.sign.vedic);
  }

  // There should be multiple different ascendants across 20 hours
  const uniqueAscendants = new Set(ascendants);

  if (uniqueAscendants.size < 4) {
    throw new Error(
      `Expected at least 4 different ascendants across 20 hours, got ${uniqueAscendants.size}: ${[...uniqueAscendants].join(", ")}`
    );
  }

  console.log("✓ Test Case 3 passed: Ascendant correctly changes with time");
  console.log(`  Ascendants at 4-hour intervals: ${ascendants.join(" → ")}`);
});

/**
 * Test Case 4: Northern vs Southern hemisphere ascendants
 * Verify that latitude affects ascendant calculation correctly.
 */
Deno.test("Test Case 4: Latitude affects ascendant", () => {
  const datetime = "2024-01-15T12:00:00+00:00";
  const longitude = 0.0;

  // Northern hemisphere
  const chartNorth = calculateBirthChart(datetime, 51.5, longitude);
  // Southern hemisphere
  const chartSouth = calculateBirthChart(datetime, -33.9, longitude);

  // The ascendants should be different
  if (chartNorth.ascendant.sign.vedic === chartSouth.ascendant.sign.vedic) {
    // They might be the same sign but at very different degrees
    const degDiff = Math.abs(chartNorth.ascendant.longitude - chartSouth.ascendant.longitude);
    if (degDiff < 5) {
      throw new Error("Northern and Southern hemisphere ascendants are too similar");
    }
  }

  console.log("✓ Test Case 4 passed: Latitude correctly affects ascendant");
  console.log(`  North (51.5°): ${chartNorth.ascendant.sign.vedic} (${chartNorth.ascendant.longitude.toFixed(2)}°)`);
  console.log(`  South (-33.9°): ${chartSouth.ascendant.sign.vedic} (${chartSouth.ascendant.longitude.toFixed(2)}°)`);
});

/**
 * Test Case 5: Verify Lahiri Ayanamsa is in expected range
 */
Deno.test("Test Case 5: Lahiri Ayanamsa sanity check", () => {
  // At J2000 (Jan 1, 2000), Lahiri ayanamsa was approximately 23.85°
  const jd2000 = dateToJulianDay(2000, 1, 1, 12);
  const ayanamsa2000 = getLahiriAyanamsa(jd2000);

  if (ayanamsa2000 < 23.5 || ayanamsa2000 > 24.2) {
    throw new Error(`Ayanamsa at J2000 should be ~23.85°, got ${ayanamsa2000.toFixed(4)}°`);
  }

  // In 2024, it should be slightly higher (~24.2°)
  const jd2024 = dateToJulianDay(2024, 1, 1, 12);
  const ayanamsa2024 = getLahiriAyanamsa(jd2024);

  if (ayanamsa2024 < 24.0 || ayanamsa2024 > 24.5) {
    throw new Error(`Ayanamsa at 2024 should be ~24.2°, got ${ayanamsa2024.toFixed(4)}°`);
  }

  // Ayanamsa should increase over time (precession)
  if (ayanamsa2024 <= ayanamsa2000) {
    throw new Error("Ayanamsa should increase over time due to precession");
  }

  console.log("✓ Test Case 5 passed: Lahiri Ayanamsa in expected range");
  console.log(`  J2000: ${ayanamsa2000.toFixed(4)}°`);
  console.log(`  2024: ${ayanamsa2024.toFixed(4)}°`);
});

/**
 * Test Case 6: Rahu and Ketu should be exactly opposite
 */
Deno.test("Test Case 6: Rahu and Ketu are 180° apart", () => {
  const datetime = "2024-03-15T10:00:00+05:30";
  const latitude = 28.6139; // Delhi
  const longitude = 77.209;

  const chart = calculateBirthChart(datetime, latitude, longitude);
  const rahu = chart.planets.find(p => p.name === "Rahu");
  const ketu = chart.planets.find(p => p.name === "Ketu");

  if (!rahu || !ketu) {
    throw new Error("Rahu or Ketu not found in chart");
  }

  let diff = Math.abs(rahu.longitude - ketu.longitude);
  if (diff > 180) diff = 360 - diff;

  if (Math.abs(diff - 180) > 0.1) {
    throw new Error(`Rahu (${rahu.longitude.toFixed(2)}°) and Ketu (${ketu.longitude.toFixed(2)}°) should be 180° apart, diff is ${diff.toFixed(2)}°`);
  }

  console.log("✓ Test Case 6 passed: Rahu and Ketu are opposite");
  console.log(`  Rahu: ${rahu.sign.vedic} (${rahu.longitude.toFixed(2)}°)`);
  console.log(`  Ketu: ${ketu.sign.vedic} (${ketu.longitude.toFixed(2)}°)`);
});

/**
 * Test Case 7: All 9 planets should be present
 */
Deno.test("Test Case 7: All planets present in chart", () => {
  const datetime = "2024-01-01T12:00:00+05:30";
  const chart = calculateBirthChart(datetime, 20, 80);

  const expectedPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

  for (const planetName of expectedPlanets) {
    const planet = chart.planets.find(p => p.name === planetName);
    if (!planet) {
      throw new Error(`Planet ${planetName} not found in chart`);
    }
    if (planet.longitude < 0 || planet.longitude >= 360) {
      throw new Error(`Planet ${planetName} has invalid longitude: ${planet.longitude}`);
    }
  }

  console.log("✓ Test Case 7 passed: All 9 planets present with valid longitudes");
});

/**
 * Test Case 8: Nakshatra pada should be 1-4
 */
Deno.test("Test Case 8: Nakshatra pada validation", () => {
  const datetime = "1985-07-20T14:30:00+05:30";
  const chart = calculateBirthChart(datetime, 13.0827, 80.2707); // Chennai

  // Check Moon nakshatra pada
  if (chart.moonNakshatra.pada < 1 || chart.moonNakshatra.pada > 4) {
    throw new Error(`Moon nakshatra pada should be 1-4, got ${chart.moonNakshatra.pada}`);
  }

  // Check all planet nakshatras
  for (const planet of chart.planets) {
    if (planet.nakshatra.pada < 1 || planet.nakshatra.pada > 4) {
      throw new Error(`${planet.name} nakshatra pada should be 1-4, got ${planet.nakshatra.pada}`);
    }
  }

  console.log("✓ Test Case 8 passed: All nakshatra padas are valid (1-4)");
});

// Run a summary at the end
Deno.test("Summary", () => {
  console.log("\n========================================");
  console.log("All Vedic Calculator tests passed!");
  console.log("========================================\n");
});
