/**
 * Vedic calculation regression tests
 *
 * Uses the same calculation logic as verify-calculations.ts but runs
 * in vitest for CI. Tests ascendant calculation, ayanamsa, and sign/nakshatra
 * lookups against known reference values.
 */
import { describe, it, expect } from 'vitest';

// ---- Inline core calculation functions (Node.js compatible) ----

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

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha',
  'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
  'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

function dateToJulianDay(year: number, month: number, day: number, hour: number = 0): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
}

function getLahiriAyanamsa(jd: number): number {
  const J2000 = 2451545.0;
  return 23.85 + (50.29 / 3600) * ((jd - J2000) / 365.25);
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
  const y = Math.cos(LST_rad);
  const x = -Math.sin(LST_rad) * Math.cos(obl_rad) - Math.tan(lat_rad) * Math.sin(obl_rad);
  return normalizeAngle(Math.atan2(y, x) * RAD_TO_DEG);
}

function getSignFromLongitude(longitude: number) {
  const signIndex = Math.floor(longitude / 30);
  return { index: signIndex, vedic: SIGNS[signIndex].vedic };
}

function getNakshatraFromLongitude(longitude: number) {
  const span = 360 / 27;
  const index = Math.floor(longitude / span);
  const degreeInNakshatra = longitude % span;
  const pada = Math.floor(degreeInNakshatra / (span / 4)) + 1;
  return { index, name: NAKSHATRAS[index], pada };
}

function computeSiderealAscendant(datetime: string, lat: number, lon: number) {
  const dt = new Date(datetime);
  const year = dt.getUTCFullYear();
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const hour = dt.getUTCHours() + dt.getUTCMinutes() / 60 + dt.getUTCSeconds() / 3600;
  const jd = dateToJulianDay(year, month, day, hour);
  const ayanamsa = getLahiriAyanamsa(jd);
  const tropicalAsc = calculateAscendant(jd, lat, lon);
  const siderealAsc = normalizeAngle(tropicalAsc - ayanamsa);
  return { jd, ayanamsa, tropicalAsc, siderealAsc, sign: getSignFromLongitude(siderealAsc) };
}

// ---- Tests ----

describe('Julian Day calculation', () => {
  it('J2000.0 epoch is correct', () => {
    // Jan 1, 2000, 12:00 UT = JD 2451545.0
    const jd = dateToJulianDay(2000, 1, 1, 12);
    expect(jd).toBeCloseTo(2451545.0, 1);
  });

  it('known historical date', () => {
    // April 10, 1989 = JD ~2447626.5
    const jd = dateToJulianDay(1989, 4, 10, 0);
    expect(jd).toBeCloseTo(2447626.5, 0);
  });
});

describe('Lahiri Ayanamsa', () => {
  it('is ~23.85° at J2000', () => {
    const ayanamsa = getLahiriAyanamsa(2451545.0);
    expect(ayanamsa).toBeCloseTo(23.85, 1);
  });

  it('increases over time', () => {
    const a2000 = getLahiriAyanamsa(2451545.0);
    const a2024 = getLahiriAyanamsa(2451545.0 + 24 * 365.25);
    expect(a2024).toBeGreaterThan(a2000);
  });

  it('is in reasonable range for modern dates (23-25°)', () => {
    const jd2025 = dateToJulianDay(2025, 1, 1, 0);
    const a = getLahiriAyanamsa(jd2025);
    expect(a).toBeGreaterThan(23);
    expect(a).toBeLessThan(25);
  });
});

describe('Sign lookup', () => {
  it('0° is Mesha (Aries)', () => {
    expect(getSignFromLongitude(0).vedic).toBe('Mesha');
  });

  it('30° is Vrishabha (Taurus)', () => {
    expect(getSignFromLongitude(30).vedic).toBe('Vrishabha');
  });

  it('359° is Meena (Pisces)', () => {
    expect(getSignFromLongitude(359).vedic).toBe('Meena');
  });

  it('covers all 12 signs', () => {
    const signs = new Set<string>();
    for (let deg = 0; deg < 360; deg += 30) {
      signs.add(getSignFromLongitude(deg).vedic);
    }
    expect(signs.size).toBe(12);
  });
});

describe('Nakshatra lookup', () => {
  it('0° is Ashwini', () => {
    expect(getNakshatraFromLongitude(0).name).toBe('Ashwini');
  });

  it('covers all 27 nakshatras', () => {
    const names = new Set<string>();
    const span = 360 / 27;
    for (let i = 0; i < 27; i++) {
      names.add(getNakshatraFromLongitude(i * span + 1).name);
    }
    expect(names.size).toBe(27);
  });

  it('pada is between 1 and 4', () => {
    for (let deg = 0; deg < 360; deg += 7) {
      const n = getNakshatraFromLongitude(deg);
      expect(n.pada).toBeGreaterThanOrEqual(1);
      expect(n.pada).toBeLessThanOrEqual(4);
    }
  });
});

describe('Ascendant regression tests', () => {
  it('Hyderabad 1989-04-04 9:04 PM IST → Tula ascendant', () => {
    const result = computeSiderealAscendant('1989-04-04T21:04:00+05:30', 17.385, 78.4867);
    expect(result.sign.vedic).toBe('Tula');
  });

  it('morning birth June 2024 → Mithuna ascendant', () => {
    const result = computeSiderealAscendant('2024-06-15T06:00:00+05:30', 17.385, 78.4867);
    expect(result.sign.vedic).toBe('Mithuna');
  });

  it('ascendant changes through at least 4 signs in 24 hours', () => {
    const signs = new Set<string>();
    for (let hour = 0; hour < 24; hour += 4) {
      const hourStr = hour.toString().padStart(2, '0');
      const result = computeSiderealAscendant(
        `2024-06-15T${hourStr}:00:00+05:30`, 17.385, 78.4867
      );
      signs.add(result.sign.vedic);
    }
    expect(signs.size).toBeGreaterThanOrEqual(4);
  });

  it('different latitudes produce different ascendants at same time', () => {
    const datetime = '2024-06-15T12:00:00Z';
    const equator = computeSiderealAscendant(datetime, 0, 78.4867);
    const nordic = computeSiderealAscendant(datetime, 60, 78.4867);
    // They may or may not differ, but sidereal ascendant values should differ
    expect(equator.siderealAsc).not.toBeCloseTo(nordic.siderealAsc, 0);
  });
});

describe('Celebrity birth chart sanity checks', () => {
  // These just verify the calculation doesn't crash and returns valid data
  const celebrities = [
    { name: 'Steve Jobs', datetime: '1955-02-24T19:15:00-06:00', lat: 44.5133, lng: -88.0133 },
    { name: 'Beyoncé', datetime: '1981-09-04T21:47:00-05:00', lat: 29.7667, lng: -95.3667 },
    { name: 'Barack Obama', datetime: '1961-08-04T19:24:00-10:00', lat: 21.3000, lng: -157.8667 },
    { name: 'Taylor Swift', datetime: '1989-12-13T08:36:00-05:00', lat: 40.3333, lng: -75.9333 },
    { name: 'Leonardo DiCaprio', datetime: '1974-11-11T02:47:00-08:00', lat: 34.0500, lng: -118.2500 },
  ];

  celebrities.forEach(({ name, datetime, lat, lng }) => {
    it(`${name}: produces valid ascendant sign`, () => {
      const result = computeSiderealAscendant(datetime, lat, lng);
      expect(result.siderealAsc).toBeGreaterThanOrEqual(0);
      expect(result.siderealAsc).toBeLessThan(360);
      expect(SIGNS.map((s) => s.vedic)).toContain(result.sign.vedic);
    });
  });
});

describe('Edge cases', () => {
  it('handles midnight (00:00) birth time', () => {
    const result = computeSiderealAscendant('2000-01-01T00:00:00Z', 28.6139, 77.2090);
    expect(result.siderealAsc).toBeGreaterThanOrEqual(0);
  });

  it('handles southern hemisphere', () => {
    const result = computeSiderealAscendant('1990-07-15T14:00:00+10:00', -33.8688, 151.2093);
    expect(result.sign.vedic).toBeTruthy();
  });

  it('handles date near epoch boundary (1970-01-01)', () => {
    const result = computeSiderealAscendant('1970-01-01T12:00:00Z', 40.7128, -74.0060);
    expect(result.sign.vedic).toBeTruthy();
  });

  it('handles old date (1920)', () => {
    const result = computeSiderealAscendant('1920-06-15T10:00:00+05:30', 17.385, 78.4867);
    expect(result.sign.vedic).toBeTruthy();
  });
});
