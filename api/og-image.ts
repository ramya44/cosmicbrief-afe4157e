/**
 * Generates a dynamic OG image as SVG for social media previews.
 * Returns SVG with Content-Type image/svg+xml which is supported
 * by Facebook, Twitter, WhatsApp, LinkedIn, and Discord.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "\u2648",
  Taurus: "\u2649",
  Gemini: "\u264A",
  Cancer: "\u264B",
  Leo: "\u264C",
  Virgo: "\u264D",
  Libra: "\u264E",
  Scorpio: "\u264F",
  Sagittarius: "\u2650",
  Capricorn: "\u2651",
  Aquarius: "\u2652",
  Pisces: "\u2653",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const name = (req.query.name as string) || "";
  const sun = (req.query.sun as string) || "";
  const moon = (req.query.moon as string) || "";
  const asc = (req.query.asc as string) || "";
  const nakshatra = (req.query.nak as string) || "";
  const type = (req.query.type as string) || "forecast";

  const heading =
    type === "chart"
      ? name ? `${name}'s Birth Chart` : "Vedic Birth Chart"
      : type === "weekly"
        ? name ? `${name}'s Weekly Forecast` : "Weekly Vedic Forecast"
        : name ? `${name}'s Cosmic Brief` : "2026 Cosmic Brief";

  const fontSize = name && name.length > 15 ? 48 : 56;

  // Build placement columns
  const placements: { label: string; symbol: string; value: string }[] = [];
  if (sun) placements.push({ label: "Sun", symbol: ZODIAC_SYMBOLS[sun] || "\u2609", value: sun });
  if (moon) placements.push({ label: "Moon", symbol: ZODIAC_SYMBOLS[moon] || "\u263D", value: moon });
  if (asc) placements.push({ label: "Rising", symbol: ZODIAC_SYMBOLS[asc] || "\u2191", value: asc });

  const placementSpacing = 200;
  const placementsStartX = 600 - ((placements.length - 1) * placementSpacing) / 2;
  const placementsY = placements.length > 0 ? 370 : 0;

  const nakshatraY = placements.length > 0 ? 460 : 370;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="40%" style="stop-color:#1a1145"/>
      <stop offset="70%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative stars -->
  <text x="60" y="80" font-size="48" fill="white" opacity="0.12" font-family="serif">&#x2729;</text>
  <text x="1080" y="560" font-size="36" fill="white" opacity="0.10" font-family="serif">&#x2729;</text>
  <text x="1020" y="140" font-size="24" fill="white" opacity="0.08" font-family="serif">&#x2729;</text>
  <text x="180" y="520" font-size="20" fill="white" opacity="0.06" font-family="serif">&#x2729;</text>

  <!-- Brand -->
  <text x="600" y="230" text-anchor="middle" font-size="20" fill="#b8a9e0" font-family="system-ui, sans-serif" letter-spacing="6" text-transform="uppercase">COSMIC BRIEF</text>

  <!-- Heading -->
  <text x="600" y="${280 + fontSize * 0.8}" text-anchor="middle" font-size="${fontSize}" fill="white" font-family="system-ui, sans-serif" font-weight="700">${escapeXml(heading)}</text>

  <!-- Placements -->
  ${placements.map((p, i) => {
    const x = placementsStartX + i * placementSpacing;
    return `
  <text x="${x}" y="${placementsY}" text-anchor="middle" font-size="32" fill="white" font-family="serif">${escapeXml(p.symbol)}</text>
  <text x="${x}" y="${placementsY + 28}" text-anchor="middle" font-size="13" fill="#b8a9e0" font-family="system-ui, sans-serif" letter-spacing="2">${escapeXml(p.label.toUpperCase())}</text>
  <text x="${x}" y="${placementsY + 52}" text-anchor="middle" font-size="20" fill="white" font-family="system-ui, sans-serif" font-weight="600">${escapeXml(p.value)}</text>`;
  }).join("")}

  <!-- Nakshatra -->
  ${nakshatra ? `<text x="600" y="${nakshatraY}" text-anchor="middle" font-size="17" fill="#c4b5e0" font-family="system-ui, sans-serif">Nakshatra: ${escapeXml(nakshatra)}</text>` : ""}

  <!-- Footer -->
  <text x="600" y="600" text-anchor="middle" font-size="15" fill="#7a6b9e" font-family="system-ui, sans-serif" letter-spacing="2">www.cosmicbrief.com</text>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  res.status(200).send(svg);
}
