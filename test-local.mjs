// Test local calculation for Dec 26 1986 11:50 PM PST in Orange CA
import * as Astronomy from 'astronomy-engine';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function normalizeAngle(angle) {
  angle = angle % 360;
  if (angle < 0) angle += 360;
  return angle;
}

function getLahiriAyanamsa(date) {
  const J2000 = new Date("2000-01-01T12:00:00Z");
  const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
  const yearsSinceJ2000 = daysSinceJ2000 / 365.25;
  return 23.85 + (50.29 / 3600) * yearsSinceJ2000;
}

function getPlanetLongitude(body, date) {
  const time = Astronomy.MakeTime(date);
  if (body === "Moon") {
    return normalizeAngle(Astronomy.EclipticGeoMoon(time).lon);
  }
  if (body === "Sun") {
    return normalizeAngle(Astronomy.SunPosition(time).elon);
  }
  const bodyEnum = Astronomy.Body[body];
  const geoVec = Astronomy.GeoVector(bodyEnum, time, true);
  return normalizeAngle(Astronomy.Ecliptic(geoVec).elon);
}

function getRahuLongitude(date) {
  const J2000 = new Date("2000-01-01T12:00:00Z");
  const T = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24 * 36525);
  return normalizeAngle(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
}

function calculateAscendant(date, latitude, longitude) {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lst = (gst * 15 + longitude) % 360;
  const lstRad = lst * DEG_TO_RAD;
  const obliquity = 23.439291 - 0.0130042 * ((date.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24 * 36525));
  const oblRad = obliquity * DEG_TO_RAD;
  const latRad = latitude * DEG_TO_RAD;
  const y = Math.cos(lstRad);
  const x = -Math.sin(lstRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad);
  return normalizeAngle(Math.atan2(y, x) * RAD_TO_DEG);
}

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
               "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

function getSignId(siderealLon) {
  return Math.floor(siderealLon / 30) + 1; // 1-indexed
}

function getSign(siderealLon) {
  return SIGNS[Math.floor(siderealLon / 30)];
}

function calculateHouse(planetSignId, ascSignId) {
  return ((planetSignId - ascSignId + 12) % 12) + 1;
}

// Test date: December 26, 1986, 11:50 PM PST (UTC-8)
// 11:50 PM PST = next day 07:50 UTC
const testDate = new Date("1986-12-27T07:50:00Z");
const lat = 33.7879;
const lon = -117.8531;

const ayanamsa = getLahiriAyanamsa(testDate);
const tropAsc = calculateAscendant(testDate, lat, lon);
const sidAsc = normalizeAngle(tropAsc - ayanamsa);
const ascSignId = getSignId(sidAsc);

console.log("=".repeat(70));
console.log("Birth: December 26, 1986, 11:50 PM PST in Orange, CA");
console.log("=".repeat(70));
console.log(`\nAyanamsa: ${ayanamsa.toFixed(4)}°`);
console.log(`Ascendant: ${sidAsc.toFixed(2)}° ${getSign(sidAsc)} (sign_id: ${ascSignId})`);

const planets = [
  { name: "Sun", trop: getPlanetLongitude("Sun", testDate) },
  { name: "Moon", trop: getPlanetLongitude("Moon", testDate) },
  { name: "Mercury", trop: getPlanetLongitude("Mercury", testDate) },
  { name: "Venus", trop: getPlanetLongitude("Venus", testDate) },
  { name: "Mars", trop: getPlanetLongitude("Mars", testDate) },
  { name: "Jupiter", trop: getPlanetLongitude("Jupiter", testDate) },
  { name: "Saturn", trop: getPlanetLongitude("Saturn", testDate) },
  { name: "Rahu", trop: getRahuLongitude(testDate) },
];
planets.push({ name: "Ketu", trop: normalizeAngle(planets[7].trop + 180) });

console.log("\n" + "-".repeat(70));
console.log("Planet     | Tropical  | Sidereal  | Sign        | sign_id | House");
console.log("-".repeat(70));

for (const p of planets) {
  const sid = normalizeAngle(p.trop - ayanamsa);
  const signId = getSignId(sid);
  const sign = getSign(sid);
  const house = calculateHouse(signId, ascSignId);
  console.log(`${p.name.padEnd(10)} | ${p.trop.toFixed(2).padStart(7)}°  | ${sid.toFixed(2).padStart(7)}°  | ${sign.padEnd(11)} | ${String(signId).padStart(7)} | ${house}`);
}

console.log("\n" + "=".repeat(70));
console.log("Expected from reference site:");
console.log("  - Venus should be in House 2");
console.log("  - Saturn should be in House 3");
console.log("=".repeat(70));
