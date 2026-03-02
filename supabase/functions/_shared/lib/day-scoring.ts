/**
 * Vedic Day Scoring Module
 *
 * Calculates actual astrological favorability for each day based on:
 * 1. Tara Bala - Nakshatra transit relationship to natal moon
 * 2. Chandrabala - Moon sign transit strength
 * 3. Vara (Day Lord) - Planetary ruler of the day
 */

// The 27 Nakshatras in order
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Nakshatra spans 13°20' each (13.333... degrees)
const NAKSHATRA_SPAN = 360 / 27;

// The 9 Taras (Nakshatra groups) and their meanings
export const TARAS = {
  1: { name: 'Janma', meaning: 'Birth', quality: 'challenging', score: -2 },
  2: { name: 'Sampat', meaning: 'Wealth', quality: 'excellent', score: 3 },
  3: { name: 'Vipat', meaning: 'Danger', quality: 'difficult', score: -3 },
  4: { name: 'Kshema', meaning: 'Well-being', quality: 'good', score: 2 },
  5: { name: 'Pratyari', meaning: 'Obstacles', quality: 'challenging', score: -2 },
  6: { name: 'Sadhaka', meaning: 'Achievement', quality: 'excellent', score: 3 },
  7: { name: 'Vadha', meaning: 'Death', quality: 'avoid', score: -4 },
  8: { name: 'Mitra', meaning: 'Friend', quality: 'good', score: 2 },
  9: { name: 'Atimitra', meaning: 'Great Friend', quality: 'excellent', score: 3 },
};

// Day lords (Vara) and their domains
export const DAY_LORDS = {
  0: { planet: 'Sun', domains: ['power_position', 'focus_creation'], score: { power_position: 2, focus_creation: 1 } },
  1: { planet: 'Moon', domains: ['love_intimacy', 'inner_signal'], score: { love_intimacy: 2, inner_signal: 2 } },
  2: { planet: 'Mars', domains: ['power_position', 'money_risk'], score: { power_position: 2, money_risk: 1 } },
  3: { planet: 'Mercury', domains: ['allies_influence', 'focus_creation'], score: { allies_influence: 2, focus_creation: 2 } },
  4: { planet: 'Jupiter', domains: ['power_position', 'allies_influence'], score: { power_position: 2, allies_influence: 2 } },
  5: { planet: 'Venus', domains: ['love_intimacy', 'money_risk'], score: { love_intimacy: 3, money_risk: 2 } },
  6: { planet: 'Saturn', domains: ['inner_signal', 'focus_creation'], score: { inner_signal: 1, focus_creation: 1 } },
};

// Chandrabala - Moon transit position from natal moon
// Position from natal moon sign (1-12) and its strength
export const CHANDRABALA = {
  1: { strength: 'strong', score: 2, note: 'Moon in own sign - emotional clarity' },
  2: { strength: 'weak', score: -1, note: 'Financial stress possible' },
  3: { strength: 'medium', score: 1, note: 'Courage and initiative' },
  4: { strength: 'weak', score: -2, note: 'Emotional turbulence' },
  5: { strength: 'neutral', score: 0, note: 'Creativity flows' },
  6: { strength: 'strong', score: 2, note: 'Victory over obstacles' },
  7: { strength: 'medium', score: 1, note: 'Partnerships highlighted' },
  8: { strength: 'weak', score: -3, note: 'Avoid major decisions' },
  9: { strength: 'neutral', score: 0, note: 'Luck and expansion' },
  10: { strength: 'medium', score: 1, note: 'Career focus' },
  11: { strength: 'strong', score: 3, note: 'Gains and fulfillment' },
  12: { strength: 'weak', score: -2, note: 'Expenses, rest needed' },
};

// Domain-to-favorable-tara mapping
export const DOMAIN_TARAS = {
  power_position: {
    excellent: [2, 6], // Sampat, Sadhaka
    good: [8, 9],      // Mitra, Atimitra
    themes: 'authority, visibility, leadership'
  },
  money_risk: {
    excellent: [2, 6], // Sampat (wealth!), Sadhaka
    good: [9],         // Atimitra
    themes: 'investments, contracts, purchases'
  },
  love_intimacy: {
    excellent: [4, 8, 9], // Kshema, Mitra, Atimitra
    good: [2],            // Sampat
    themes: 'connection, vulnerability, repair'
  },
  allies_influence: {
    excellent: [8, 9], // Mitra (friend!), Atimitra
    good: [4, 6],      // Kshema, Sadhaka
    themes: 'networking, partnerships, introductions'
  },
  focus_creation: {
    excellent: [6, 2], // Sadhaka (achievement!), Sampat
    good: [9],         // Atimitra
    themes: 'deep work, creativity, strategic thinking'
  },
  inner_signal: {
    excellent: [4, 9], // Kshema (well-being!), Atimitra
    good: [8],         // Mitra
    themes: 'intuition, reflection, processing'
  },
};

/**
 * Get nakshatra index (0-26) from lunar longitude
 */
export function getNakshatraIndex(moonLongitude: number): number {
  const normalized = ((moonLongitude % 360) + 360) % 360;
  return Math.floor(normalized / NAKSHATRA_SPAN);
}

/**
 * Get nakshatra name from index
 */
export function getNakshatraName(index: number): string {
  return NAKSHATRAS[index % 27];
}

/**
 * Calculate Tara number (1-9) from transit nakshatra relative to natal nakshatra
 */
export function calculateTara(natalNakshatraIndex: number, transitNakshatraIndex: number): number {
  // Count from natal nakshatra (natal = 1)
  let count = transitNakshatraIndex - natalNakshatraIndex;
  if (count < 0) count += 27;
  count += 1; // 1-indexed

  // Tara cycles every 9 nakshatras
  const tara = ((count - 1) % 9) + 1;
  return tara;
}

/**
 * Get sign index (0-11) from longitude
 */
export function getSignIndex(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.floor(normalized / 30);
}

/**
 * Calculate Chandrabala position (1-12) from transit moon to natal moon
 */
export function calculateChandrabala(natalMoonSignIndex: number, transitMoonSignIndex: number): number {
  let position = transitMoonSignIndex - natalMoonSignIndex;
  if (position < 0) position += 12;
  position += 1; // 1-indexed
  return position;
}

/**
 * Calculate moon longitude for a given date (approximate)
 * Moon moves ~13.2 degrees per day
 */
export function getMoonLongitudeForDate(baseDate: Date, baseLongitude: number, targetDate: Date): number {
  const daysDiff = (targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
  const moonSpeed = 13.176; // degrees per day (average)
  const longitude = baseLongitude + (daysDiff * moonSpeed);
  return ((longitude % 360) + 360) % 360;
}

export interface DayScore {
  date: Date;
  dayName: string;
  dateStr: string;

  // Tara information
  transitNakshatra: string;
  tara: number;
  taraName: string;
  taraQuality: string;
  taraScore: number;

  // Chandrabala information
  chandrabalaPosition: number;
  chandrabalaStrength: string;
  chandrabalaScore: number;
  chandrabalaNote: string;

  // Day lord
  dayLord: string;
  dayLordDomains: string[];

  // Domain scores (sum of all factors)
  domainScores: {
    power_position: number;
    money_risk: number;
    love_intimacy: number;
    allies_influence: number;
    focus_creation: number;
    inner_signal: number;
  };

  // Total score
  totalScore: number;
}

/**
 * Score a single day for all domains
 */
export function scoreDayForDomains(
  date: Date,
  natalMoonLongitude: number,
  transitMoonLongitude: number
): DayScore {
  const dayOfWeek = date.getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[dayOfWeek];
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Calculate nakshatra indices
  const natalNakshatraIndex = getNakshatraIndex(natalMoonLongitude);
  const transitNakshatraIndex = getNakshatraIndex(transitMoonLongitude);
  const transitNakshatra = getNakshatraName(transitNakshatraIndex);

  // Calculate Tara
  const tara = calculateTara(natalNakshatraIndex, transitNakshatraIndex);
  const taraInfo = TARAS[tara as keyof typeof TARAS];

  // Calculate Chandrabala
  const natalMoonSignIndex = getSignIndex(natalMoonLongitude);
  const transitMoonSignIndex = getSignIndex(transitMoonLongitude);
  const chandrabalaPos = calculateChandrabala(natalMoonSignIndex, transitMoonSignIndex);
  const chandrabalaInfo = CHANDRABALA[chandrabalaPos as keyof typeof CHANDRABALA];

  // Get day lord info
  const dayLordInfo = DAY_LORDS[dayOfWeek as keyof typeof DAY_LORDS];

  // Calculate domain scores
  const domainScores = {
    power_position: 0,
    money_risk: 0,
    love_intimacy: 0,
    allies_influence: 0,
    focus_creation: 0,
    inner_signal: 0,
  };

  // Add Tara scores per domain
  for (const [domain, config] of Object.entries(DOMAIN_TARAS)) {
    const domainKey = domain as keyof typeof domainScores;
    if (config.excellent.includes(tara)) {
      domainScores[domainKey] += 3;
    } else if (config.good.includes(tara)) {
      domainScores[domainKey] += 2;
    } else if (taraInfo.score < 0) {
      // Negative taras hurt all domains
      domainScores[domainKey] += taraInfo.score;
    }
  }

  // Add Chandrabala base score to all domains
  for (const domain of Object.keys(domainScores)) {
    domainScores[domain as keyof typeof domainScores] += chandrabalaInfo.score;
  }

  // Add day lord bonuses
  for (const [domain, bonus] of Object.entries(dayLordInfo.score)) {
    if (domain in domainScores) {
      domainScores[domain as keyof typeof domainScores] += bonus;
    }
  }

  // Calculate total score
  const totalScore = taraInfo.score + chandrabalaInfo.score;

  return {
    date,
    dayName,
    dateStr,
    transitNakshatra,
    tara,
    taraName: taraInfo.name,
    taraQuality: taraInfo.quality,
    taraScore: taraInfo.score,
    chandrabalaPosition: chandrabalaPos,
    chandrabalaStrength: chandrabalaInfo.strength,
    chandrabalaScore: chandrabalaInfo.score,
    chandrabalaNote: chandrabalaInfo.note,
    dayLord: dayLordInfo.planet,
    dayLordDomains: dayLordInfo.domains,
    domainScores,
    totalScore,
  };
}

/**
 * Score all days in a week for all domains
 */
export function scoreWeekForDomains(
  weekStart: Date,
  natalMoonLongitude: number,
  currentMoonLongitude: number,
  currentDate: Date
): DayScore[] {
  const scores: DayScore[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);

    // Calculate moon position for this date
    const transitMoonLongitude = getMoonLongitudeForDate(currentDate, currentMoonLongitude, date);

    const dayScore = scoreDayForDomains(date, natalMoonLongitude, transitMoonLongitude);
    scores.push(dayScore);
  }

  return scores;
}

export interface DomainBestDays {
  domain: string;
  bestDays: Array<{
    dayName: string;
    dateStr: string;
    score: number;
    taraName: string;
    taraQuality: string;
    chandrabalaNote: string;
    dayLord: string;
    reasoning: string;
  }>;
  worstDays: Array<{
    dayName: string;
    dateStr: string;
    score: number;
    reason: string;
  }>;
}

/**
 * Get best days for each domain based on scores
 */
export function getBestDaysPerDomain(weekScores: DayScore[]): Record<string, DomainBestDays> {
  const domains = ['power_position', 'money_risk', 'love_intimacy', 'allies_influence', 'focus_creation', 'inner_signal'];
  const result: Record<string, DomainBestDays> = {};

  for (const domain of domains) {
    const domainKey = domain as keyof DayScore['domainScores'];

    // Sort days by domain score (descending)
    const sortedDays = [...weekScores].sort((a, b) =>
      b.domainScores[domainKey] - a.domainScores[domainKey]
    );

    // Get top 2 days (or 1 if second is negative)
    const bestDays = sortedDays
      .filter(day => day.domainScores[domainKey] > 0)
      .slice(0, 2)
      .map(day => {
        // Build reasoning string
        const reasons: string[] = [];

        if (day.taraScore > 0) {
          reasons.push(`${day.taraName} nakshatra (${day.taraQuality})`);
        }
        if (day.chandrabalaScore > 0) {
          reasons.push(day.chandrabalaNote.toLowerCase());
        }
        if (day.dayLordDomains.includes(domain)) {
          reasons.push(`${day.dayLord} day supports this`);
        }

        return {
          dayName: day.dayName,
          dateStr: day.dateStr,
          score: day.domainScores[domainKey],
          taraName: day.taraName,
          taraQuality: day.taraQuality,
          chandrabalaNote: day.chandrabalaNote,
          dayLord: day.dayLord,
          reasoning: reasons.join(', ') || 'favorable alignment',
        };
      });

    // Get worst days (score < 0)
    const worstDays = sortedDays
      .filter(day => day.domainScores[domainKey] < -1)
      .slice(-2)
      .map(day => {
        const reasons: string[] = [];
        if (day.taraScore < 0) {
          reasons.push(`${day.taraName} nakshatra (${day.taraQuality})`);
        }
        if (day.chandrabalaScore < 0) {
          reasons.push(day.chandrabalaNote.toLowerCase());
        }

        return {
          dayName: day.dayName,
          dateStr: day.dateStr,
          score: day.domainScores[domainKey],
          reason: reasons.join(', ') || 'challenging alignment',
        };
      });

    result[domain] = {
      domain,
      bestDays,
      worstDays,
    };
  }

  return result;
}

/**
 * Format scored days for the LLM prompt
 */
export function formatScoredDaysForPrompt(
  weekScores: DayScore[],
  bestDaysPerDomain: Record<string, DomainBestDays>
): string {
  let output = 'CALCULATED BEST DAYS (based on Vedic timing):\n\n';

  const domainNames: Record<string, string> = {
    power_position: 'Power & Position',
    money_risk: 'Money & Risk',
    love_intimacy: 'Love & Intimacy',
    allies_influence: 'Allies & Influence',
    focus_creation: 'Focus & Creation',
    inner_signal: 'Inner Signal',
  };

  for (const [domain, data] of Object.entries(bestDaysPerDomain)) {
    output += `${domainNames[domain]}:\n`;

    if (data.bestDays.length > 0) {
      output += `  Best: ${data.bestDays.map(d => `${d.dayName} (${d.reasoning})`).join(', ')}\n`;
    } else {
      output += `  Best: No strongly favorable days this week\n`;
    }

    if (data.worstDays.length > 0) {
      output += `  Avoid: ${data.worstDays.map(d => `${d.dayName} (${d.reason})`).join(', ')}\n`;
    }

    output += '\n';
  }

  output += 'DAILY BREAKDOWN:\n';
  for (const day of weekScores) {
    output += `${day.dayName} ${day.dateStr}: Moon in ${day.transitNakshatra} (${day.taraName}), ${day.chandrabalaNote}, ${day.dayLord} day\n`;
  }

  return output;
}
