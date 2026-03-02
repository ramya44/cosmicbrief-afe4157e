import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";

const logStep = createLogger("CALCULATE-WEEKLY-TRANSITS");

// Vedic signs in order (sidereal)
const VEDIC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Moon completes a full cycle in ~27.3 days, spending ~2.3 days per sign
const MOON_DAYS_PER_SIGN = 2.33;

// Nakshatras in order (13°20' each, 27 total)
const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

interface MoonTransit {
  date: string;
  sign: string;
  nakshatra: string;
  quality: "favorable" | "neutral" | "challenging";
  themes: string[];
}

interface SlowPlanetPosition {
  planet: string;
  sign: string;
  degree: number;
  isRetrograde: boolean;
  themes: string[];
}

interface WeeklyTransitData {
  week_start: string;
  week_end: string;
  moon_transits: MoonTransit[];
  slow_planet_aspects: {
    jupiter: SlowPlanetPosition;
    saturn: SlowPlanetPosition;
    rahu: SlowPlanetPosition;
    ketu: SlowPlanetPosition;
  };
}

/**
 * Get the Monday of the current week
 */
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate Moon's approximate position for a given date
 * This is a simplified calculation - in production, use an ephemeris API
 */
function calculateMoonPosition(date: Date, referenceMoonDegree: number, referenceDate: Date): {
  sign: string;
  nakshatra: string;
  degree: number;
} {
  // Moon moves ~13.2 degrees per day
  const MOON_DAILY_MOTION = 13.2;

  const daysDiff = (date.getTime() - referenceDate.getTime()) / (24 * 60 * 60 * 1000);
  const totalDegrees = (referenceMoonDegree + (daysDiff * MOON_DAILY_MOTION)) % 360;
  const normalizedDegrees = totalDegrees < 0 ? totalDegrees + 360 : totalDegrees;

  // Calculate sign (each sign is 30 degrees)
  const signIndex = Math.floor(normalizedDegrees / 30);
  const sign = VEDIC_SIGNS[signIndex];

  // Calculate nakshatra (each is 13.333 degrees)
  const nakshatraIndex = Math.floor(normalizedDegrees / 13.333333) % 27;
  const nakshatra = NAKSHATRAS[nakshatraIndex];

  return {
    sign,
    nakshatra,
    degree: normalizedDegrees % 30
  };
}

/**
 * Determine quality based on nakshatra characteristics
 */
function getNakshatraQuality(nakshatra: string): "favorable" | "neutral" | "challenging" {
  const favorable = ["Rohini", "Pushya", "Hasta", "Shravana", "Revati", "Ashwini", "Punarvasu"];
  const challenging = ["Ardra", "Ashlesha", "Jyeshtha", "Mula", "Bharani"];

  if (favorable.includes(nakshatra)) return "favorable";
  if (challenging.includes(nakshatra)) return "challenging";
  return "neutral";
}

/**
 * Get themes based on Moon's sign
 */
function getMoonThemes(sign: string): string[] {
  const themeMap: Record<string, string[]> = {
    "Aries": ["initiative", "new beginnings", "courage", "action"],
    "Taurus": ["stability", "finances", "comfort", "patience"],
    "Gemini": ["communication", "learning", "networking", "versatility"],
    "Cancer": ["emotions", "home", "nurturing", "intuition"],
    "Leo": ["creativity", "leadership", "recognition", "self-expression"],
    "Virgo": ["details", "health", "service", "organization"],
    "Libra": ["relationships", "balance", "harmony", "partnerships"],
    "Scorpio": ["transformation", "depth", "research", "intensity"],
    "Sagittarius": ["expansion", "travel", "philosophy", "optimism"],
    "Capricorn": ["ambition", "structure", "discipline", "achievement"],
    "Aquarius": ["innovation", "community", "independence", "vision"],
    "Pisces": ["spirituality", "creativity", "compassion", "imagination"]
  };
  return themeMap[sign] || ["general energy"];
}

/**
 * Get slow planet positions for the week
 * In production, these would come from an ephemeris
 */
function getSlowPlanetPositions(weekStart: Date): {
  jupiter: SlowPlanetPosition;
  saturn: SlowPlanetPosition;
  rahu: SlowPlanetPosition;
  ketu: SlowPlanetPosition;
} {
  // 2026 approximate positions (simplified)
  // Jupiter enters Gemini in May 2026, moves through Cancer later
  // Saturn in Pisces throughout 2026
  // Rahu in Aquarius/Pisces, Ketu in Leo/Virgo

  const year = weekStart.getFullYear();
  const month = weekStart.getMonth();

  // Simplified 2026 positions
  let jupiterSign = "Gemini";
  let jupiterRetro = false;
  if (month >= 5 && month <= 8) {
    jupiterSign = "Cancer";
  }

  return {
    jupiter: {
      planet: "Jupiter",
      sign: jupiterSign,
      degree: 15,
      isRetrograde: jupiterRetro,
      themes: ["expansion", "wisdom", "opportunity", "growth"]
    },
    saturn: {
      planet: "Saturn",
      sign: "Pisces",
      degree: 18,
      isRetrograde: month >= 5 && month <= 9,
      themes: ["discipline", "structure", "karma", "responsibility"]
    },
    rahu: {
      planet: "Rahu",
      sign: month < 7 ? "Pisces" : "Aquarius",
      degree: 10,
      isRetrograde: false,
      themes: ["ambition", "obsession", "material desires", "innovation"]
    },
    ketu: {
      planet: "Ketu",
      sign: month < 7 ? "Virgo" : "Leo",
      degree: 10,
      isRetrograde: false,
      themes: ["spirituality", "detachment", "past karma", "intuition"]
    }
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional week_start parameter
    let weekStart: Date;
    try {
      const body = await req.json();
      if (body.week_start) {
        weekStart = new Date(body.week_start);
      } else {
        // Default to next week's Monday
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        weekStart = getMonday(nextWeek);
      }
    } catch {
      // Default to next week's Monday
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      weekStart = getMonday(nextWeek);
    }

    // Calculate week end (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    logStep("Calculating transits", {
      week_start: formatDate(weekStart),
      week_end: formatDate(weekEnd)
    });

    // Reference Moon position (you'd get this from an ephemeris in production)
    // For 2026-01-01, approximate Moon at 0° Aries
    const referenceDate = new Date("2026-01-01");
    const referenceMoonDegree = 0;

    // Calculate Moon transits for each day of the week
    const moonTransits: MoonTransit[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + i);

      const moonPos = calculateMoonPosition(currentDate, referenceMoonDegree, referenceDate);
      const quality = getNakshatraQuality(moonPos.nakshatra);
      const themes = getMoonThemes(moonPos.sign);

      moonTransits.push({
        date: formatDate(currentDate),
        sign: moonPos.sign,
        nakshatra: moonPos.nakshatra,
        quality,
        themes
      });
    }

    // Get slow planet positions
    const slowPlanetAspects = getSlowPlanetPositions(weekStart);

    const transitData: WeeklyTransitData = {
      week_start: formatDate(weekStart),
      week_end: formatDate(weekEnd),
      moon_transits: moonTransits,
      slow_planet_aspects: slowPlanetAspects
    };

    logStep("Transits calculated", {
      moon_transits_count: moonTransits.length,
      favorable_days: moonTransits.filter(t => t.quality === "favorable").length
    });

    // Store in database
    const { error: upsertError } = await supabase
      .from("weekly_transits")
      .upsert({
        week_start: formatDate(weekStart),
        week_end: formatDate(weekEnd),
        moon_transits: moonTransits,
        slow_planet_aspects: slowPlanetAspects
      }, {
        onConflict: 'week_start'
      });

    if (upsertError) {
      logStep("Failed to store transits", { error: upsertError.message });
      // Continue even if storage fails
    } else {
      logStep("Transits stored in database");
    }

    return jsonResponse({
      success: true,
      data: transitData
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
