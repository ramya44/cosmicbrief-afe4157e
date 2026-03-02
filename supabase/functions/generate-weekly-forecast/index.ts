import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import {
  getMoonNakshatra,
  getWeeklyDashaSummary,
  formatPratyantardashaForDisplay,
  type PratyantardashaPeriod
} from "../_shared/lib/dasha-calculator.ts";
import {
  formatPlanetaryPositionsForPrompt,
  getSignLord,
  calculateHouseFromAscendant,
} from "../_shared/lib/planetary-positions.ts";
import {
  scoreWeekForDomains,
  getBestDaysPerDomain,
  formatScoredDaysForPrompt,
  getNakshatraName,
  getNakshatraIndex,
  type DayScore,
  type DomainBestDays,
} from "../_shared/lib/day-scoring.ts";

const logStep = createLogger("GENERATE-WEEKLY-FORECAST");

// Input validation schema
const WeeklyForecastRequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
  week_start: z.string().optional(), // ISO date string, defaults to current week
});

// Output JSON schema for LLM - editorial format
const WEEKLY_FORECAST_SCHEMA = {
  week_focus: {
    headline: "string (4-6 word directive, e.g. 'Reposition, don't push.')",
    explanation: "string (2-3 sentences expanding on the theme)"
  },
  power_position: {
    best_days: ["string (day names like 'Thu', 'Sat')"],
    signal: "string (evocative 2-4 word phrase like 'High leverage window')",
    context: "string (2-3 sentences of astrological context, no jargon)",
    do_this: ["string (specific action)", "string", "string"],
    avoid: "string (one punchy line of what not to do)"
  },
  money_risk: {
    best_days: ["string"],
    signal: "string",
    context: "string",
    do_this: ["string", "string", "string"],
    avoid: "string"
  },
  love_intimacy: {
    best_days: ["string"],
    signal: "string",
    context: "string",
    do_this: ["string", "string", "string"],
    avoid: "string"
  },
  allies_influence: {
    best_days: ["string"],
    signal: "string",
    context: "string",
    do_this: ["string", "string", "string"],
    avoid: "string"
  },
  focus_creation: {
    best_days: ["string"],
    signal: "string",
    context: "string",
    do_this: ["string", "string", "string"],
    avoid: "string"
  },
  inner_signal: {
    best_days: ["string"],
    signal: "string",
    context: "string",
    do_this: ["string", "string", "string"],
    avoid: "string"
  },
  week_avoid: ["string (pitfall to avoid)", "string", "string"]
};

const SYSTEM_PROMPT = `You are a sharp, opinionated advisor writing weekly forecasts. Your voice is:
- Direct and confident - you know what you're talking about
- Editorial, not mystical - like a strategist who happens to use astrology
- Specific and actionable - tell them exactly what to do
- Psychologically insightful - understand human dynamics
- Zero jargon - no Sanskrit, no "sub-periods", no astro-speak

Your tone: Like a trusted advisor giving insider intel. Not fluffy. Not cautious. Clear signal.

DO NOT mention: dashas, nakshatras, planetary periods, houses, aspects, or any technical terms.
DO focus on: timing, leverage, dynamics, psychology, strategic moves.

Return ONLY valid JSON following this exact schema:
${JSON.stringify(WEEKLY_FORECAST_SCHEMA, null, 2)}

CRITICAL: Return ONLY the JSON object. No markdown code blocks, no explanatory text.`;

interface WeeklyForecastInput {
  name?: string;
  weekStart: string;
  weekEnd: string;
  ascendantSign: string;
  moonSign: string;
  moonNakshatra: string;
  planetaryPositionsText: string;
  dashaSummary: {
    mahaDasha: string;
    antarDasha: string;
    pratyantardashas: PratyantardashaPeriod[];
    hasTransition: boolean;
  };
  // Calculated day scores from Vedic timing
  scoredDaysText: string;
  bestDaysPerDomain: Record<string, DomainBestDays>;
  slowPlanetAspects: Record<string, unknown>;
}

function buildUserPrompt(inputs: WeeklyForecastInput): string {
  // Format the best days for each domain
  const domainBestDays: Record<string, string[]> = {};
  for (const [domain, data] of Object.entries(inputs.bestDaysPerDomain)) {
    domainBestDays[domain] = data.bestDays.map(d => d.dayName);
  }

  // Determine the overall energy theme based on dasha lords
  const majorInfluence = inputs.dashaSummary.mahaDasha;
  const currentVibe = inputs.dashaSummary.antarDasha;

  return `Create a weekly forecast for ${inputs.name || 'someone'}.

WEEK: ${inputs.weekStart} to ${inputs.weekEnd}

THEIR CHART:
- Rising: ${inputs.ascendantSign}
- Moon: ${inputs.moonSign} (Nakshatra: ${inputs.moonNakshatra})
- Key planets: ${inputs.planetaryPositionsText}

CURRENT ENERGY THEME:
They're in a ${majorInfluence} phase with ${currentVibe} undertones.${inputs.dashaSummary.hasTransition ? ' Energy is shifting this week.' : ''}

${inputs.scoredDaysText}

BACKGROUND INFLUENCES:
- Jupiter (growth/luck): ${(inputs.slowPlanetAspects.jupiter as any)?.sign || 'Unknown'}${(inputs.slowPlanetAspects.jupiter as any)?.isRetrograde ? ' - reflecting inward' : ''}
- Saturn (structure/lessons): ${(inputs.slowPlanetAspects.saturn as any)?.sign || 'Unknown'}${(inputs.slowPlanetAspects.saturn as any)?.isRetrograde ? ' - revisiting old patterns' : ''}

CRITICAL INSTRUCTIONS:

The "Best Days" listed above are CALCULATED from Vedic timing (Tara Bala + Chandrabala).
You MUST use these exact days in your JSON output. Do NOT make up different days.
Your job is to explain WHY these days are favorable and craft compelling content.

WRITE THE FORECAST:

1. week_focus: A 4-6 word directive headline + 2-3 sentence explanation.
   Base it on their dasha period (${majorInfluence}/${currentVibe}) and the overall week pattern.

2. For EACH domain, use the CALCULATED best days from above:
   - best_days: Copy the days from the calculated list above
   - signal: A punchy 2-4 word phrase capturing the energy
   - context: 2-3 sentences explaining WHY these days work (reference the tara/chandrabala reasoning)
   - do_this: 3 specific, concrete actions
   - avoid: One punchy line about what NOT to do

THE 6 DOMAINS:
- power_position: Career, reputation, leverage, authority
- money_risk: Investments, purchases, negotiations, contracts
- love_intimacy: Romantic dynamics, emotional openings, connection
- allies_influence: Partnerships, networking, social momentum
- focus_creation: Deep work, creativity, strategic planning
- inner_signal: Intuition, reflection, processing

3. week_avoid: 3 pitfalls based on the challenging days identified above.

VOICE: Trusted strategist giving insider intel. Direct. Opinionated. No hedging.

Return ONLY valid JSON.`;
}

/**
 * Calculate the week boundaries (always 7+ days from today)
 * If checking on Wednesday, shows Wed-Sun of current week + Mon-Tue of next week
 */
function calculateWeekBoundaries(requestedStart?: string): { weekStart: Date; weekEnd: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let weekStart: Date;

  if (requestedStart) {
    weekStart = new Date(requestedStart);
  } else {
    // Start from today and ensure we have at least 7 days
    weekStart = today;
  }

  // Week end is 6 days after start (7 days total)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return { weekStart, weekEnd };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const validationResult = WeeklyForecastRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id, week_start } = validationResult.data;
    logStep("Request validated", { kundli_id, week_start });

    // Calculate week boundaries
    const { weekStart, weekEnd } = calculateWeekBoundaries(week_start);
    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);

    logStep("Week boundaries", { weekStart: weekStartStr, weekEnd: weekEndStr });

    // Check if forecast already exists for this week
    const { data: existingForecast } = await supabase
      .from("personalized_weekly_forecasts")
      .select("*")
      .eq("kundli_id", kundli_id)
      .eq("week_start", weekStartStr)
      .single();

    if (existingForecast) {
      logStep("Returning existing forecast");
      return jsonResponse({
        forecast: existingForecast.forecast_content,
        week_start: existingForecast.week_start,
        week_end: existingForecast.week_end,
        cached: true
      });
    }

    // Fetch kundli details
    const { data: kundliData, error: kundliError } = await supabase
      .from("user_kundli_details")
      .select("*")
      .eq("id", kundli_id)
      .single();

    if (kundliError || !kundliData) {
      logStep("Kundli not found", { error: kundliError?.message });
      return errorResponse("Kundli details not found", 404);
    }

    logStep("Kundli fetched", {
      moon_sign: kundliData.moon_sign,
      nakshatra: kundliData.nakshatra,
      ascendant: kundliData.ascendant_sign
    });

    // Get planetary positions
    const planetaryPositions = kundliData.planetary_positions || [];

    if (!planetaryPositions || planetaryPositions.length === 0) {
      logStep("No planetary positions found", { kundli_id });
      return errorResponse("Planetary positions not found in kundli data. Please regenerate your birth chart.", 400);
    }

    const moonPosition = planetaryPositions.find((p: any) => p.name === "Moon");
    const ascendantPosition = planetaryPositions.find((p: any) => p.name === "Ascendant");

    if (!moonPosition) {
      logStep("Moon position not found", { positions: planetaryPositions.map((p: any) => p.name) });
      return errorResponse("Moon position not found in kundli data", 400);
    }

    if (moonPosition.full_degree === undefined || moonPosition.full_degree === null) {
      logStep("Moon full_degree missing", { moonPosition });
      return errorResponse("Moon degree data is missing. Please regenerate your birth chart.", 400);
    }

    const moonLongitude = moonPosition.full_degree;
    const birthDate = new Date(kundliData.birth_date);
    const ascendantSign = ascendantPosition?.sign || kundliData.ascendant_sign || "Unknown";
    const ascendantSignId = ascendantPosition?.sign_id || 1;

    // Calculate dasha summary for the week
    let dashaSummary;
    try {
      dashaSummary = getWeeklyDashaSummary(birthDate, moonLongitude, weekStart, weekEnd);
      logStep("Dasha summary", {
        mahaDasha: dashaSummary.mahaDasha,
        antarDasha: dashaSummary.antarDasha,
        pratyantardashas: dashaSummary.pratyantardashas.length,
        hasTransition: dashaSummary.hasTransition
      });
    } catch (dashaError) {
      const errMsg = dashaError instanceof Error ? dashaError.message : "Unknown dasha error";
      logStep("Dasha calculation error", { error: errMsg, moonLongitude, birthDate: birthDate.toISOString() });
      // Use fallback dasha summary
      dashaSummary = {
        mahaDasha: "Unknown",
        antarDasha: "Unknown",
        pratyantardashas: [],
        hasTransition: false
      };
    }

    // Fetch or calculate weekly transits
    let moonTransits: any[] = [];
    let slowPlanetAspects: any = {};

    const { data: transitsData } = await supabase
      .from("weekly_transits")
      .select("*")
      .eq("week_start", weekStartStr)
      .single();

    if (transitsData) {
      moonTransits = transitsData.moon_transits;
      slowPlanetAspects = transitsData.slow_planet_aspects;
      logStep("Using cached transits");
    } else {
      // Calculate transits on the fly
      logStep("Calculating transits on the fly");
      const { data: calcResult, error: calcError } = await supabase.functions.invoke(
        'calculate-weekly-transits',
        { body: { week_start: weekStartStr } }
      );

      if (calcError) {
        logStep("Transit calculation error", { error: calcError.message });
        // Continue with empty transits rather than failing
      } else if (calcResult?.data) {
        moonTransits = calcResult.data.moon_transits;
        slowPlanetAspects = calcResult.data.slow_planet_aspects;
        logStep("Transits calculated successfully", { moon_transits_count: moonTransits.length });
      }
    }

    // Ensure we have at least some transit data
    if (!moonTransits || moonTransits.length === 0) {
      logStep("Warning: No moon transit data available");
    }

    // Calculate day scores using Vedic timing (Tara Bala + Chandrabala)
    logStep("Calculating Vedic day scores");

    // Get current moon longitude for transit calculations
    // Use the first transit's data if available, otherwise estimate from natal
    let currentMoonLongitude = moonLongitude; // Start with natal as fallback
    if (moonTransits.length > 0) {
      // The transit data should have moon positions - use the first day's moon
      const firstTransit = moonTransits[0];
      // Estimate from sign if we have it (each sign = 30 degrees, starting from Aries = 0)
      const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const signIndex = signs.indexOf(firstTransit.sign);
      if (signIndex >= 0) {
        currentMoonLongitude = signIndex * 30 + 15; // Mid-point of sign
      }
    }

    // Score each day of the week
    const weekScores = scoreWeekForDomains(weekStart, moonLongitude, currentMoonLongitude, new Date());
    const bestDaysPerDomain = getBestDaysPerDomain(weekScores);
    const scoredDaysText = formatScoredDaysForPrompt(weekScores, bestDaysPerDomain);

    logStep("Day scores calculated", {
      days_scored: weekScores.length,
      sample_day: weekScores[0] ? {
        day: weekScores[0].dayName,
        tara: weekScores[0].taraName,
        chandrabala: weekScores[0].chandrabalaStrength,
        total: weekScores[0].totalScore
      } : null
    });

    // Format planetary positions for prompt
    const planetaryPositionsText = formatPlanetaryPositionsForPrompt(
      planetaryPositions,
      ascendantSign,
      ascendantSignId,
      { includeRulership: true, includeDegree: false, includeRetrograde: false, useWesternSigns: true }
    );

    // Build prompt inputs
    const promptInputs: WeeklyForecastInput = {
      name: kundliData.name,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      ascendantSign,
      moonSign: kundliData.moon_sign || moonPosition.sign,
      moonNakshatra: kundliData.nakshatra || getMoonNakshatra(moonLongitude).name,
      planetaryPositionsText,
      dashaSummary,
      scoredDaysText,
      bestDaysPerDomain,
      slowPlanetAspects
    };

    const userPrompt = buildUserPrompt(promptInputs);

    logStep("Calling Claude Sonnet", { prompt_length: userPrompt.length });

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: userPrompt }],
        system: SYSTEM_PROMPT,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      logStep("Claude API error", { status: claudeResponse.status, error: errorText });

      if (claudeResponse.status === 429) {
        return jsonResponse({
          high_demand: true,
          message: "We're experiencing high demand. Please try again in a few minutes.",
          retry_after: 60,
        }, 503);
      }

      return errorResponse(`Claude API error: ${claudeResponse.status}`, 500);
    }

    const claudeData = await claudeResponse.json();
    const forecastText = claudeData.content?.[0]?.text || "";

    logStep("Forecast generated", {
      length: forecastText.length,
      model: claudeData.model,
      input_tokens: claudeData.usage?.input_tokens,
      output_tokens: claudeData.usage?.output_tokens,
      total_tokens: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
    });

    // Parse the JSON response
    let forecastContent: unknown;
    try {
      forecastContent = JSON.parse(forecastText);
    } catch {
      logStep("Failed to parse forecast JSON, returning raw text");
      forecastContent = { raw_text: forecastText };
    }

    // Store the forecast
    const { error: insertError } = await supabase
      .from("personalized_weekly_forecasts")
      .insert({
        kundli_id,
        week_start: weekStartStr,
        week_end: weekEndStr,
        forecast_content: forecastContent,
        pratyantardasha_info: dashaSummary.pratyantardashas
      });

    if (insertError) {
      logStep("Failed to store forecast", { error: insertError.message });
    } else {
      logStep("Forecast stored");
    }

    // Auto-create trial subscription if not exists
    const { data: existingSub } = await supabase
      .from("weekly_forecast_subscriptions")
      .select("id")
      .eq("kundli_id", kundli_id)
      .single();

    if (!existingSub) {
      const { error: subError } = await supabase
        .from("weekly_forecast_subscriptions")
        .insert({
          kundli_id,
          email: kundliData.email || '',
          status: 'trial',
          trial_started_at: new Date().toISOString(),
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (subError) {
        logStep("Failed to create trial subscription", { error: subError.message });
      } else {
        logStep("Trial subscription created");
      }
    }

    return jsonResponse({
      forecast: forecastContent,
      week_start: weekStartStr,
      week_end: weekEndStr,
      dasha_summary: {
        maha_dasha: dashaSummary.mahaDasha,
        antar_dasha: dashaSummary.antarDasha,
        has_transition: dashaSummary.hasTransition
      },
      model: claudeData.model,
      usage: claudeData.usage
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
