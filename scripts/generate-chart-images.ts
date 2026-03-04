/**
 * Generate birth chart images for marketing/social media
 * Usage: npx tsx scripts/generate-chart-images.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface BirthData {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  lat: number;
  lng: number;
  timezone?: string;
}

interface PlanetPosition {
  id: number;
  name: string;
  sign: string;
  sign_id: number;
  degree: number;
  is_retrograde: boolean;
  nakshatra?: string;
}

// Planet configuration - matching website
const PLANET_CONFIG: Record<string, { symbol: string; color: string }> = {
  Sun: { symbol: '☉', color: '#FCD34D' },
  Moon: { symbol: '☽', color: '#E5E7EB' },
  Mars: { symbol: '♂', color: '#DC2626' },
  Mercury: { symbol: '☿', color: '#10B981' },
  Jupiter: { symbol: '♃', color: '#FBBF24' },
  Venus: { symbol: '♀', color: '#EC4899' },
  Saturn: { symbol: '♄', color: '#3B82F6' },
  Rahu: { symbol: '☊', color: '#A855F7' },
  Ketu: { symbol: '☋', color: '#A855F7' },
  Ascendant: { symbol: 'લ', color: '#FCD34D' },
};

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈' },
  { name: 'Taurus', symbol: '♉' },
  { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' },
  { name: 'Leo', symbol: '♌' },
  { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' },
  { name: 'Scorpio', symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' },
  { name: 'Aquarius', symbol: '♒' },
  { name: 'Pisces', symbol: '♓' },
];

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Helper functions
const calculateHouse = (planetSignId: number, ascendantSignId: number): number => {
  return ((planetSignId - ascendantSignId + 12) % 12) + 1;
};

const getSignForHouse = (houseNumber: number, ascendantSignId: number): string => {
  const signIndex = ((ascendantSignId - 1) + (houseNumber - 1)) % 12;
  return SIGNS[signIndex];
};

// Generate Western Chart SVG
function generateWesternSVG(positions: PlanetPosition[], ascendantSignId: number, name: string): string {
  const size = 600;
  const center = size / 2;
  const outerRadius = size / 2 - 30;
  const zodiacRadius = outerRadius - 45;
  const planetRadius = zodiacRadius - 55;
  const innerRadius = planetRadius - 65;

  // Group planets by house
  const planetsByHouse: Record<number, PlanetPosition[]> = {};
  const planets = positions.filter(p => p.name !== 'Ascendant');

  planets.forEach(planet => {
    const house = calculateHouse(planet.sign_id, ascendantSignId);
    if (!planetsByHouse[house]) {
      planetsByHouse[house] = [];
    }
    planetsByHouse[house].push(planet);
  });

  // Calculate angle for house
  const getHouseAngle = (houseNum: number): number => -90 - (houseNum - 1) * 30;
  const getHouseCenterAngle = (houseNum: number): number => getHouseAngle(houseNum) - 15;

  // Generate house division lines
  let houseDivisions = '';
  for (let i = 0; i < 12; i++) {
    const angle = (getHouseAngle(i + 1) * Math.PI) / 180;
    const x1 = center + Math.cos(angle) * innerRadius;
    const y1 = center + Math.sin(angle) * innerRadius;
    const x2 = center + Math.cos(angle) * outerRadius;
    const y2 = center + Math.sin(angle) * outerRadius;
    houseDivisions += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="1" opacity="0.2"/>`;
  }

  // Generate house numbers
  let houseNumbers = '';
  for (let i = 0; i < 12; i++) {
    const angle = (getHouseCenterAngle(i + 1) * Math.PI) / 180;
    const x = center + Math.cos(angle) * (outerRadius - 18);
    const y = center + Math.sin(angle) * (outerRadius - 18);
    houseNumbers += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#f59e0b" font-size="16" font-weight="600" opacity="0.6">${i + 1}</text>`;
  }

  // Generate zodiac symbols
  let zodiacSymbols = '';
  for (let i = 0; i < 12; i++) {
    const angle = (getHouseCenterAngle(i + 1) * Math.PI) / 180;
    const x = center + Math.cos(angle) * (zodiacRadius - 8);
    const y = center + Math.sin(angle) * (zodiacRadius - 8);
    const signIndex = (ascendantSignId - 1 + i) % 12;
    zodiacSymbols += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#b8a070" font-size="14" font-family="serif" opacity="0.6">${ZODIAC_SIGNS[signIndex].symbol}</text>`;
  }

  // Generate planet positions with collision detection
  let planetElements = '';
  planets.forEach((planet) => {
    const house = calculateHouse(planet.sign_id, ascendantSignId);
    const housePlanets = planetsByHouse[house];
    const indexInHouse = housePlanets.indexOf(planet);
    const totalInHouse = housePlanets.length;

    const baseAngle = getHouseCenterAngle(house);
    let offsetAngle = 0;
    let radiusOffset = 0;

    if (totalInHouse === 1) {
      offsetAngle = 0;
      radiusOffset = 0;
    } else if (totalInHouse === 2) {
      offsetAngle = indexInHouse === 0 ? -8 : 8;
      radiusOffset = 0;
    } else if (totalInHouse === 3) {
      if (indexInHouse === 0) { offsetAngle = 0; radiusOffset = 20; }
      else if (indexInHouse === 1) { offsetAngle = -8; radiusOffset = -10; }
      else { offsetAngle = 8; radiusOffset = -10; }
    } else {
      const maxAngleSpread = 18;
      const angleStep = maxAngleSpread / Math.max(totalInHouse - 1, 1);
      offsetAngle = (indexInHouse - (totalInHouse - 1) / 2) * angleStep;
      radiusOffset = (indexInHouse % 2 === 0) ? 15 : -15;
    }

    const finalAngle = baseAngle + offsetAngle;
    const radians = (finalAngle * Math.PI) / 180;
    const adjustedRadius = planetRadius + radiusOffset;
    const x = center + Math.cos(radians) * adjustedRadius;
    const y = center + Math.sin(radians) * adjustedRadius;

    const config = PLANET_CONFIG[planet.name] || { symbol: '?', color: '#FFFFFF' };

    planetElements += `
      <g>
        <!-- Glow circle -->
        <circle cx="${x}" cy="${y}" r="22" fill="${config.color}" opacity="0.15"/>
        <!-- Outer ring -->
        <circle cx="${x}" cy="${y}" r="26" fill="none" stroke="${config.color}" stroke-width="1.5" opacity="0.25"/>
        <!-- Planet symbol -->
        <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="22" font-weight="bold" font-family="serif">${config.symbol}</text>
        <!-- Degree label -->
        <text x="${x}" y="${y + 28}" text-anchor="middle" fill="#9CA3AF" font-size="8" font-family="Inter, sans-serif">${planet.sign.substring(0, 3)} ${Math.round(planet.degree)}°${planet.is_retrograde ? ' R' : ''}</text>
      </g>
    `;
  });

  // Ascendant marker
  const ascAngle = (getHouseCenterAngle(1) * Math.PI) / 180;
  const ascRadius = planetRadius + 30;
  const ascX = center + Math.cos(ascAngle) * ascRadius;
  const ascY = center + Math.sin(ascAngle) * ascRadius;

  const ascendantMarker = `
    <g>
      <circle cx="${ascX}" cy="${ascY}" r="22" fill="#FCD34D" opacity="0.15"/>
      <circle cx="${ascX}" cy="${ascY}" r="26" fill="none" stroke="#FCD34D" stroke-width="1.5" opacity="0.25"/>
      <text x="${ascX}" y="${ascY}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="22" font-weight="bold">લ</text>
    </g>
  `;

  // Center emblem
  const ascendantSign = getSignForHouse(1, ascendantSignId);
  const ascendantSymbol = ZODIAC_SIGNS.find(z => z.name === ascendantSign)?.symbol || '♎';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size + 100}" width="${size * 1.5}" height="${(size + 100) * 1.5}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&amp;family=Inter:wght@400;500;600&amp;display=swap');
    </style>
    <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </radialGradient>
    <!-- Glow gradient for background effect -->
    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FCD34D" stop-opacity="0.15"/>
      <stop offset="60%" stop-color="#FCD34D" stop-opacity="0"/>
    </radialGradient>
    <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="30"/>
    </filter>
    <pattern id="stars" width="100" height="100" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="25" r="0.5" fill="white" opacity="0.3"/>
      <circle cx="45" cy="15" r="0.4" fill="white" opacity="0.2"/>
      <circle cx="75" cy="45" r="0.6" fill="white" opacity="0.25"/>
      <circle cx="25" cy="65" r="0.3" fill="white" opacity="0.2"/>
      <circle cx="85" cy="85" r="0.5" fill="white" opacity="0.3"/>
      <circle cx="55" cy="75" r="0.4" fill="white" opacity="0.15"/>
      <circle cx="35" cy="95" r="0.3" fill="white" opacity="0.2"/>
      <circle cx="65" cy="5" r="0.4" fill="white" opacity="0.25"/>
      <circle cx="5" cy="55" r="0.5" fill="white" opacity="0.2"/>
      <circle cx="95" cy="35" r="0.3" fill="white" opacity="0.15"/>
    </pattern>
  </defs>

  <!-- Full background -->
  <rect x="0" y="0" width="${size}" height="${size + 100}" fill="#0f172a"/>

  <!-- Title with Cormorant Garamond -->
  <text x="${center}" y="45" text-anchor="middle" fill="#f59e0b" font-size="32" font-weight="600" font-family="'Cormorant Garamond', serif">${name}</text>

  <g transform="translate(0, 70)">
    <!-- Subtle background glow effect -->
    <circle cx="${center}" cy="${center}" r="${outerRadius + 40}" fill="url(#glowGradient)" filter="url(#glowBlur)"/>

    <!-- Outer background circle -->
    <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="url(#bgGradient)" stroke="#8B7355" stroke-width="1.5" opacity="0.3"/>

    <!-- Star pattern overlay -->
    <circle cx="${center}" cy="${center}" r="${outerRadius - 1}" fill="url(#stars)" opacity="0.3"/>

    <!-- Zodiac ring -->
    <circle cx="${center}" cy="${center}" r="${zodiacRadius}" fill="none" stroke="#8B7355" stroke-width="1" opacity="0.2"/>

    <!-- Inner circle -->
    <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="url(#bgGradient)" stroke="#f59e0b" stroke-width="1" opacity="0.2"/>

    <!-- House divisions -->
    ${houseDivisions}

    <!-- House numbers -->
    ${houseNumbers}

    <!-- Zodiac symbols -->
    ${zodiacSymbols}

    <!-- Ascendant marker -->
    ${ascendantMarker}

    <!-- Planets -->
    ${planetElements}

    <!-- Center emblem -->
    <circle cx="${center}" cy="${center}" r="45" fill="url(#bgGradient)" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
    <text x="${center}" y="${center - 2}" text-anchor="middle" dominant-baseline="middle" fill="#f59e0b" font-size="28" font-family="serif">${ascendantSymbol}</text>
    <text x="${center}" y="${center + 24}" text-anchor="middle" fill="#f59e0b" font-size="10" font-weight="500" opacity="0.8">${ascendantSign}</text>
  </g>

  <!-- Footer -->
  <text x="${center}" y="${size + 85}" text-anchor="middle" fill="#6B7280" font-size="12" font-family="'Inter', sans-serif">cosmicbrief.com</text>
</svg>`;
}

// Generate North Indian Chart SVG
function generateNorthIndianSVG(positions: PlanetPosition[], ascendantSignId: number, name: string): string {
  const size = 600;
  const chartSize = 400;
  const offset = (size - chartSize) / 2;

  // North Indian house positions (fixed layout, houses rotate based on ascendant)
  // House 1 is always at top center diamond
  const housePositions: Record<number, { x: number; y: number; w: number; h: number }> = {
    1:  { x: 133, y: 0, w: 133, h: 100 },      // Top center (diamond)
    2:  { x: 0, y: 0, w: 100, h: 100 },        // Top left
    3:  { x: 0, y: 100, w: 100, h: 100 },      // Left upper
    4:  { x: 0, y: 200, w: 100, h: 100 },      // Left center (diamond)
    5:  { x: 0, y: 300, w: 100, h: 100 },      // Left lower
    6:  { x: 100, y: 300, w: 100, h: 100 },    // Bottom left
    7:  { x: 133, y: 300, w: 133, h: 100 },    // Bottom center (diamond)
    8:  { x: 300, y: 300, w: 100, h: 100 },    // Bottom right
    9:  { x: 300, y: 200, w: 100, h: 100 },    // Right lower
    10: { x: 300, y: 100, w: 100, h: 133 },    // Right center (diamond)
    11: { x: 300, y: 0, w: 100, h: 100 },      // Right upper
    12: { x: 200, y: 0, w: 100, h: 100 },      // Top right
  };

  // Get planets in each house
  const planetsByHouse: Record<number, PlanetPosition[]> = {};
  positions.filter(p => p.name !== 'Ascendant').forEach(planet => {
    const house = calculateHouse(planet.sign_id, ascendantSignId);
    if (!planetsByHouse[house]) planetsByHouse[house] = [];
    planetsByHouse[house].push(planet);
  });

  // Generate house content
  let houseContent = '';
  for (let house = 1; house <= 12; house++) {
    const pos = housePositions[house];
    const planets = planetsByHouse[house] || [];
    const signIndex = (ascendantSignId - 1 + house - 1) % 12;
    const signSymbol = ZODIAC_SIGNS[signIndex].symbol;

    // Center of house for planet placement
    const centerX = offset + pos.x + pos.w / 2;
    const centerY = offset + pos.y + pos.h / 2;

    // Sign symbol (small, in corner)
    houseContent += `<text x="${offset + pos.x + 8}" y="${offset + pos.y + 16}" fill="#6B7280" font-size="12" font-family="serif">${signSymbol}</text>`;

    // Planets
    planets.forEach((planet, idx) => {
      const config = PLANET_CONFIG[planet.name] || { symbol: '?', color: '#FFFFFF' };
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const px = centerX + (col - 0.5) * 35;
      const py = centerY + (row - 0.5) * 30;

      houseContent += `
        <g>
          <circle cx="${px}" cy="${py}" r="14" fill="${config.color}" opacity="0.15"/>
          <text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle" fill="${config.color}" font-size="16" font-family="serif">${config.symbol}</text>
          ${planet.is_retrograde ? `<text x="${px + 12}" y="${py - 8}" fill="#9CA3AF" font-size="8">R</text>` : ''}
        </g>
      `;
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size + 100}" width="${size * 1.5}" height="${(size + 100) * 1.5}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&amp;family=Inter:wght@400;500;600&amp;display=swap');
    </style>
    <radialGradient id="niGlowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FCD34D" stop-opacity="0.12"/>
      <stop offset="70%" stop-color="#FCD34D" stop-opacity="0"/>
    </radialGradient>
    <filter id="niGlowBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="25"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="${size}" height="${size + 100}" fill="#0f172a"/>

  <!-- Title -->
  <text x="${size / 2}" y="45" text-anchor="middle" fill="#f59e0b" font-size="32" font-weight="600" font-family="'Cormorant Garamond', serif">${name}</text>

  <g transform="translate(0, 60)">
    <!-- Background glow -->
    <rect x="${offset - 30}" y="${offset - 30}" width="${chartSize + 60}" height="${chartSize + 60}" fill="url(#niGlowGradient)" filter="url(#niGlowBlur)"/>

    <!-- Outer square -->
    <rect x="${offset}" y="${offset}" width="${chartSize}" height="${chartSize}" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.6"/>

    <!-- Inner diamond (connecting midpoints) -->
    <polygon points="${offset + chartSize / 2},${offset} ${offset + chartSize},${offset + chartSize / 2} ${offset + chartSize / 2},${offset + chartSize} ${offset},${offset + chartSize / 2}" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.4"/>

    <!-- Diagonal lines from corners to center -->
    <line x1="${offset}" y1="${offset}" x2="${offset + chartSize / 2}" y2="${offset + chartSize / 2}" stroke="#f59e0b" stroke-width="1" opacity="0.3"/>
    <line x1="${offset + chartSize}" y1="${offset}" x2="${offset + chartSize / 2}" y2="${offset + chartSize / 2}" stroke="#f59e0b" stroke-width="1" opacity="0.3"/>
    <line x1="${offset}" y1="${offset + chartSize}" x2="${offset + chartSize / 2}" y2="${offset + chartSize / 2}" stroke="#f59e0b" stroke-width="1" opacity="0.3"/>
    <line x1="${offset + chartSize}" y1="${offset + chartSize}" x2="${offset + chartSize / 2}" y2="${offset + chartSize / 2}" stroke="#f59e0b" stroke-width="1" opacity="0.3"/>

    <!-- House contents -->
    ${houseContent}

    <!-- Ascendant indicator -->
    <text x="${offset + chartSize / 2}" y="${offset + 25}" text-anchor="middle" fill="#FCD34D" font-size="11" font-weight="600">ASC</text>
  </g>

  <!-- Footer -->
  <text x="${size / 2}" y="${size + 85}" text-anchor="middle" fill="#6B7280" font-size="12" font-family="'Inter', sans-serif">cosmicbrief.com</text>
</svg>`;
}

// Calculate planetary positions using the edge function
async function calculatePositions(birthData: BirthData): Promise<{ positions: PlanetPosition[], ascendantSignId: number }> {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tgjjgshoviowjnoeksar.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_KEY) {
    throw new Error('Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-chart-positions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      date: birthData.date,
      time: birthData.time,
      latitude: birthData.lat,
      longitude: birthData.lng,
      timezone: birthData.timezone || 'America/Los_Angeles',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to calculate chart: ${error}`);
  }

  const data = await response.json();

  return {
    positions: data.positions || [],
    ascendantSignId: data.ascendant_sign_id || 1,
  };
}

// Convert SVG to PNG using Playwright
async function svgToPng(svg: string, outputPath: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to match SVG size
  await page.setViewportSize({ width: 900, height: 1050 });

  // Create HTML with the SVG and font loading
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          svg { display: block; }
        </style>
      </head>
      <body>${svg}</body>
    </html>
  `;

  await page.setContent(html);

  // Wait for fonts to load
  await page.waitForTimeout(1000);

  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();
}

// Main function
async function generateCharts(birthDataList: BirthData[]): Promise<void> {
  const outputDir = path.join(process.cwd(), 'chart-images');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating charts for ${birthDataList.length} people...`);

  for (const birthData of birthDataList) {
    console.log(`\nProcessing: ${birthData.name}`);

    try {
      // Calculate positions
      console.log('  Calculating planetary positions...');
      const { positions, ascendantSignId } = await calculatePositions(birthData);

      // Generate file-safe name
      const safeName = birthData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Generate Western chart
      console.log('  Generating Western chart...');
      const westernSvg = generateWesternSVG(positions, ascendantSignId, birthData.name);
      const westernPath = path.join(outputDir, `${safeName}-western.png`);
      await svgToPng(westernSvg, westernPath);
      console.log(`  ✓ Saved: ${westernPath}`);

      // Generate North Indian chart
      console.log('  Generating North Indian chart...');
      const northIndianSvg = generateNorthIndianSVG(positions, ascendantSignId, birthData.name);
      const northIndianPath = path.join(outputDir, `${safeName}-north-indian.png`);
      await svgToPng(northIndianSvg, northIndianPath);
      console.log(`  ✓ Saved: ${northIndianPath}`);

    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\nDone!');
}

// Example data - Steve Jobs
const exampleData: BirthData[] = [
  {
    // Celebrity birth data from Astrodatabank (astro.com)
// Rodden Rating: AA = Birth certificate in hand, A = From memory, DD = Conflicting/unverified

    name: "Steve Jobs",
    date: "1955-02-24",
    time: "19:15",
    location: "Green Bay, WI",
    lat: 44.5133,
    lng: -88.0133,
    timezone: "America/Chicago"
  },
  {
    name: "Beyoncé",
    date: "1981-09-04",
    time: "21:47",
    location: "Houston, TX",
    lat: 29.7667,
    lng: -95.3667,
    timezone: "America/Chicago"
  },
  {
    name: "Barack Obama",
    date: "1961-08-04",
    time: "19:24",
    location: "Honolulu, HI",
    lat: 21.3000,
    lng: -157.8667,
    timezone: "Pacific/Honolulu"
  },
  {
    name: "Taylor Swift",
    date: "1989-12-13",
    time: "08:36",
    location: "Reading, PA",
    lat: 40.3333,
    lng: -75.9333,
    timezone: "America/New_York"
  },
  {
    name: "Leonardo DiCaprio",
    date: "1974-11-11",
    time: "02:47",
    location: "Los Angeles, CA",
    lat: 34.0500,
    lng: -118.2500,
    timezone: "America/Los_Angeles"
  },
  // New celebrities added from Astrodatabank
  {
    name: "Angelina Jolie",
    date: "1975-06-04",
    time: "09:09",
    location: "Los Angeles, CA",
    lat: 34.0500,
    lng: -118.2500,
    timezone: "America/Los_Angeles"
  },
  {
    name: "Brad Pitt",
    date: "1963-12-18",
    time: "06:31",
    location: "Shawnee, OK",
    lat: 35.3333,
    lng: -96.9333,
    timezone: "America/Chicago"
  },
  {
    name: "Oprah Winfrey",
    date: "1954-01-29",
    time: "04:30",
    location: "Kosciusko, MS",
    lat: 33.0500,
    lng: -89.5833,
    timezone: "America/Chicago"
  },
  {
    name: "Madonna",
    date: "1958-08-16",
    time: "07:05",
    location: "Bay City, MI",
    lat: 43.6000,
    lng: -83.8833,
    timezone: "America/Detroit"
  },
  {
    name: "Michael Jackson",
    date: "1958-08-29",
    time: "19:33",
    location: "Gary, IN",
    lat: 41.6000,
    lng: -87.3500,
    timezone: "America/Chicago"
  },
  {
    name: "Prince",
    date: "1958-06-07",
    time: "18:17",
    location: "Minneapolis, MN",
    lat: 44.9833,
    lng: -93.2667,
    timezone: "America/Chicago"
  },
  {
    name: "Meryl Streep",
    date: "1949-06-22",
    time: "08:05",
    location: "Summit, NJ",
    lat: 40.7333,
    lng: -74.3667,
    timezone: "America/New_York"
  },
  {
    name: "Tom Hanks",
    date: "1956-07-09",
    time: "11:17",
    location: "Concord, CA",
    lat: 37.9833,
    lng: -122.0333,
    timezone: "America/Los_Angeles"
  },
  {
    name: "George Clooney",
    date: "1961-05-06",
    time: "02:58",
    location: "Lexington, KY",
    lat: 38.0500,
    lng: -84.5000,
    timezone: "America/New_York"
  },
  {
    name: "Jennifer Aniston",
    date: "1969-02-11",
    time: "22:22",
    location: "Los Angeles, CA",
    lat: 34.0500,
    lng: -118.2500,
    timezone: "America/Los_Angeles"
  },
  {
    name: "Johnny Depp",
    date: "1963-06-09",
    time: "08:44",
    location: "Owensboro, KY",
    lat: 37.7667,
    lng: -87.1167,
    timezone: "America/Chicago"
  },
  {
    name: "Julia Roberts",
    date: "1967-10-28",
    time: "00:16",
    location: "Atlanta, GA",
    lat: 33.7500,
    lng: -84.3833,
    timezone: "America/New_York"
  },
  {
    name: "Robin Williams",
    date: "1951-07-21",
    time: "13:34",
    location: "Chicago, IL",
    lat: 41.8500,
    lng: -87.6500,
    timezone: "America/Chicago"
  },
  {
    name: "Denzel Washington",
    date: "1954-12-28",
    time: "00:09",
    location: "Mount Vernon, NY",
    lat: 40.9167,
    lng: -73.8333,
    timezone: "America/New_York"
  },
  {
    name: "Nicole Kidman",
    date: "1967-06-20",
    time: "15:15",
    location: "Honolulu, HI",
    lat: 21.3000,
    lng: -157.8667,
    timezone: "Pacific/Honolulu"
  },
];

// Run
generateCharts(exampleData);
