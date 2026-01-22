/**
 * Vedic Birth Chart Calculation Tests
 *
 * These tests verify that the Vedic astrology calculations are accurate.
 * Run with: npm test
 *
 * IMPORTANT: These tests should be run before every deployment to ensure
 * calculation accuracy has not regressed.
 */

import { describe, it, expect } from 'vitest';

// Inline the calculation functions for testing
// (These mirror the edge function implementation)

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const SIGNS = [
  { vedic: 'Mesha', western: 'Aries', lord: 'Mars' },
  { vedic: 'Vrishabha', western: 'Taurus', lord: 'Venus' },
  { vedic: 'Mithuna', western: 'Gemini', lord: 'Mercury' },
  { vedic: 'Karka', western: 'Cancer', lord: 'Moon' },
  { vedic: 'Simha', western: 'Leo', lord: 'Sun' },
  { vedic: 'Kanya', western: 'Virgo', lord: 'Mercury' },
  { vedic: 'Tula', western: 'Libra', lord: 'Venus' },
  { vedic: 'Vrishchika', western: 'Scorpio', lord: 'Mars' },
  { vedic: 'Dhanu', western: 'Sagittarius', lord: 'Jupiter' },
  { vedic: 'Makara', western: 'Capricorn', lord: 'Saturn' },
  { vedic: 'Kumbha', western: 'Aquarius', lord: 'Saturn' },
  { vedic: 'Meena', western: 'Pisces', lord: 'Jupiter' },
];

function dateToJulianDay(year: number, month: number, day: number, hour: number = 0): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
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

  // Correct Meeus formula: tan(Asc) = cos(LST) / [-sin(LST)·cos(ε) - tan(φ)·sin(ε)]
  const y = Math.cos(LST_rad);
  const x = -Math.sin(LST_rad) * Math.cos(obl_rad) - Math.tan(lat_rad) * Math.sin(obl_rad);
  let asc = Math.atan2(y, x) * RAD_TO_DEG;
  asc = normalizeAngle(asc);

  return asc;
}

function getSignFromLongitude(longitude: number): { vedic: string; index: number; degree: number } {
  const signIndex = Math.floor(longitude / 30);
  const degreeInSign = longitude % 30;
  return {
    index: signIndex,
    vedic: SIGNS[signIndex].vedic,
    degree: degreeInSign,
  };
}

function calculateSiderealAscendant(
  datetime: string,
  latitude: number,
  longitude: number
): { longitude: number; sign: string } {
  const dt = new Date(datetime);
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const hour = dt.getUTCHours() + dt.getUTCMinutes() / 60 + dt.getUTCSeconds() / 3600;

  const jd = dateToJulianDay(year, month, day, hour);
  const ayanamsa = getLahiriAyanamsa(jd);
  const tropicalAsc = calculateAscendant(jd, latitude, longitude);
  const siderealAsc = normalizeAngle(tropicalAsc - ayanamsa);
  const sign = getSignFromLongitude(siderealAsc);

  return {
    longitude: siderealAsc,
    sign: sign.vedic,
  };
}

// ============================================
// TEST SUITES
// ============================================

describe('Vedic Birth Chart Calculations', () => {
  describe('Ascendant (Lagna) Calculations', () => {
    it('should calculate Tula ascendant for April 4, 1989, 9:04 PM IST, Hyderabad', () => {
      // This is the critical test case that was failing
      // Hyderabad coordinates: 17.385°N, 78.4867°E
      const result = calculateSiderealAscendant('1989-04-04T21:04:00+05:30', 17.385, 78.4867);

      expect(result.sign).toBe('Tula');
      // Ascendant should be in Libra (180-210°)
      expect(result.longitude).toBeGreaterThanOrEqual(180);
      expect(result.longitude).toBeLessThan(210);
    });

    it('should calculate Mithuna ascendant for morning birth in June', () => {
      // Around sunrise in June, Gemini should be rising
      const result = calculateSiderealAscendant('2024-06-15T06:00:00+05:30', 17.385, 78.4867);

      expect(result.sign).toBe('Mithuna');
    });

    it('should show different ascendants at different times of day', () => {
      const date = '2024-06-15';
      const lat = 17.385;
      const lon = 78.4867;

      const ascendants: string[] = [];
      for (let hour = 0; hour < 24; hour += 4) {
        const hourStr = hour.toString().padStart(2, '0');
        const datetime = `${date}T${hourStr}:00:00+05:30`;
        const result = calculateSiderealAscendant(datetime, lat, lon);
        ascendants.push(result.sign);
      }

      // Should have at least 4 different ascendants in 24 hours
      const uniqueAscendants = new Set(ascendants);
      expect(uniqueAscendants.size).toBeGreaterThanOrEqual(4);
    });

    it('should produce different results for different latitudes', () => {
      const datetime = '2024-01-15T12:00:00+00:00';

      const northResult = calculateSiderealAscendant(datetime, 51.5, 0); // London
      const southResult = calculateSiderealAscendant(datetime, -33.9, 0); // Cape Town approx

      // Either different signs or significantly different degrees
      if (northResult.sign === southResult.sign) {
        const diff = Math.abs(northResult.longitude - southResult.longitude);
        expect(diff).toBeGreaterThan(3); // At least 3 degrees difference
      }
    });
  });

  describe('Julian Day Calculation', () => {
    it('should calculate correct JD for J2000 epoch', () => {
      // J2000 is Jan 1, 2000 at 12:00 TT (approximately 12:00 UTC)
      const jd = dateToJulianDay(2000, 1, 1, 12);
      expect(jd).toBeCloseTo(2451545.0, 1);
    });

    it('should handle dates before 1970 correctly', () => {
      // Test a date from 1950
      const jd = dateToJulianDay(1950, 6, 15, 12);
      expect(jd).toBeGreaterThan(2433000); // Rough sanity check
      expect(jd).toBeLessThan(2434000);
    });
  });

  describe('Lahiri Ayanamsa', () => {
    it('should be approximately 23.85° at J2000', () => {
      const jd = dateToJulianDay(2000, 1, 1, 12);
      const ayanamsa = getLahiriAyanamsa(jd);
      expect(ayanamsa).toBeCloseTo(23.85, 1);
    });

    it('should increase over time due to precession', () => {
      const jd2000 = dateToJulianDay(2000, 1, 1, 12);
      const jd2024 = dateToJulianDay(2024, 1, 1, 12);

      const ayanamsa2000 = getLahiriAyanamsa(jd2000);
      const ayanamsa2024 = getLahiriAyanamsa(jd2024);

      expect(ayanamsa2024).toBeGreaterThan(ayanamsa2000);
      // Should increase by roughly 0.014° per year (50.29 arcsec)
      const expectedIncrease = 24 * 0.014;
      const actualIncrease = ayanamsa2024 - ayanamsa2000;
      expect(actualIncrease).toBeCloseTo(expectedIncrease, 1);
    });

    it('should be in expected range for 2024', () => {
      const jd = dateToJulianDay(2024, 1, 1, 12);
      const ayanamsa = getLahiriAyanamsa(jd);
      expect(ayanamsa).toBeGreaterThan(24.0);
      expect(ayanamsa).toBeLessThan(24.5);
    });
  });

  describe('Sign Calculation', () => {
    it('should map 0° to Mesha (Aries)', () => {
      const sign = getSignFromLongitude(0);
      expect(sign.vedic).toBe('Mesha');
    });

    it('should map 180° to Tula (Libra)', () => {
      const sign = getSignFromLongitude(180);
      expect(sign.vedic).toBe('Tula');
    });

    it('should correctly identify sign boundaries', () => {
      // Just before Taurus
      const aries = getSignFromLongitude(29.99);
      expect(aries.vedic).toBe('Mesha');

      // Just after Taurus starts
      const taurus = getSignFromLongitude(30.01);
      expect(taurus.vedic).toBe('Vrishabha');
    });

    it('should handle all 12 signs correctly', () => {
      const expectedSigns = [
        'Mesha',
        'Vrishabha',
        'Mithuna',
        'Karka',
        'Simha',
        'Kanya',
        'Tula',
        'Vrishchika',
        'Dhanu',
        'Makara',
        'Kumbha',
        'Meena',
      ];

      for (let i = 0; i < 12; i++) {
        const longitude = i * 30 + 15; // Middle of each sign
        const sign = getSignFromLongitude(longitude);
        expect(sign.vedic).toBe(expectedSigns[i]);
      }
    });
  });
});
