// Test planetary positions
// Run with: node test-planets.mjs

import * as Astronomy from 'astronomy-engine';

function normalizeAngle(angle) {
  angle = angle % 360;
  if (angle < 0) angle += 360;
  return angle;
}

function getLahiriAyanamsa(date) {
  const J2000 = new Date("2000-01-01T12:00:00Z");
  const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
  const yearsSinceJ2000 = daysSinceJ2000 / 365.25;
  const ayanamsa = 23.85 + (50.29 / 3600) * yearsSinceJ2000;
  return ayanamsa;
}

function getPlanetLongitude(body, date) {
  const time = Astronomy.MakeTime(date);

  if (body === "Moon") {
    const moonPos = Astronomy.EclipticGeoMoon(time);
    return normalizeAngle(moonPos.lon);
  }

  if (body === "Sun") {
    const sunPos = Astronomy.SunPosition(time);
    return normalizeAngle(sunPos.elon);
  }

  const bodyEnum = Astronomy.Body[body];
  const geoVec = Astronomy.GeoVector(bodyEnum, time, true);
  const ecliptic = Astronomy.Ecliptic(geoVec);
  return normalizeAngle(ecliptic.elon);
}

function getRahuLongitude(date) {
  const J2000 = new Date("2000-01-01T12:00:00Z");
  const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
  const T = daysSinceJ2000 / 36525;
  let rahu = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441;
  return normalizeAngle(rahu);
}

const signNames = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                   "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

function formatResult(tropical, ayanamsa) {
  const sidereal = normalizeAngle(tropical - ayanamsa);
  const sign = Math.floor(sidereal / 30);
  const degree = sidereal % 30;
  return `${degree.toFixed(1).padStart(5)}° ${signNames[sign].padEnd(11)} (sign ${sign + 1})`;
}

console.log("Testing planetary positions with astronomy-engine\n");
console.log("=".repeat(60));

// Test case: Current date
const now = new Date();
const ayanamsaNow = getLahiriAyanamsa(now);
console.log(`\nCURRENT: ${now.toISOString()}`);
console.log(`Lahiri Ayanamsa: ${ayanamsaNow.toFixed(4)}°\n`);

const planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
console.log("Planet    | Tropical    | Sidereal Position");
console.log("-".repeat(50));
for (const planet of planets) {
  const tropical = getPlanetLongitude(planet, now);
  console.log(`${planet.padEnd(9)} | ${tropical.toFixed(2).padStart(6)}°     | ${formatResult(tropical, ayanamsaNow)}`);
}
const rahuTrop = getRahuLongitude(now);
console.log(`Rahu      | ${rahuTrop.toFixed(2).padStart(6)}°     | ${formatResult(rahuTrop, ayanamsaNow)}`);
const ketuSid = normalizeAngle(rahuTrop - ayanamsaNow + 180);
console.log(`Ketu      | ${normalizeAngle(rahuTrop + 180).toFixed(2).padStart(6)}°     | ${(ketuSid % 30).toFixed(1).padStart(5)}° ${signNames[Math.floor(ketuSid / 30)].padEnd(11)} (sign ${Math.floor(ketuSid / 30) + 1})`);

// Additional verification: check against expected tropical positions
console.log("\n" + "=".repeat(60));
console.log("\nVERIFICATION: Today's Sun should be around 340-341° tropical (10-11° Pisces)");
console.log("This is because the Sun moves ~1° per day, and March 1 is ~70 days after Dec 21 (winter solstice at 270°)");
console.log(`Our calculated Sun tropical: ${getPlanetLongitude("Sun", now).toFixed(2)}°`);
