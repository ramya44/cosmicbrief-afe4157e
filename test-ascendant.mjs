// Test ascendant calculation
// Run with: node test-ascendant.mjs

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
  const ayanamsa = 23.85 + (50.29 / 3600) * yearsSinceJ2000;
  return ayanamsa;
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
  let asc = Math.atan2(y, x) * RAD_TO_DEG;
  asc = normalizeAngle(asc);

  return asc;
}

const signNames = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                   "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

// Test with different locations and times
const testCases = [
  { name: "Orange CA - Dec 26 1986 11:50 PM PST", date: new Date("1986-12-27T07:50:00Z"), lat: 33.7879, lon: -117.8531 },
  { name: "Current time - Orange CA", date: new Date(), lat: 33.7879, lon: -117.8531 },
  { name: "Current time - Mumbai", date: new Date(), lat: 19.0760, lon: 72.8777 },
];

console.log("Ascendant Calculation Test\n" + "=".repeat(70) + "\n");

for (const tc of testCases) {
  const ayanamsa = getLahiriAyanamsa(tc.date);
  const tropicalAsc = calculateAscendant(tc.date, tc.lat, tc.lon);
  const siderealAsc = normalizeAngle(tropicalAsc - ayanamsa);
  const ascSign = Math.floor(siderealAsc / 30);
  const ascDegree = siderealAsc % 30;

  console.log(`${tc.name}`);
  console.log(`  Date/Time: ${tc.date.toISOString()}`);
  console.log(`  Location: ${tc.lat.toFixed(4)}, ${tc.lon.toFixed(4)}`);
  console.log(`  Ayanamsa: ${ayanamsa.toFixed(4)}°`);
  console.log(`  Tropical Asc: ${tropicalAsc.toFixed(2)}°`);
  console.log(`  Sidereal Asc: ${ascDegree.toFixed(2)}° ${signNames[ascSign]} (sign ${ascSign + 1})`);
  console.log("");
}
