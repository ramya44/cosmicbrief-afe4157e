import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/lib/http.ts";
import type { UserData, TransitLookupRow, PlanetaryPosition } from "./lib/types.ts";
import { generateForecastInputs } from "./lib/generate-forecast-inputs.ts";
import {
  getCurrentMahaDasha,
  getCurrentAntarDasha,
  getDashaChangesInYear,
  getMoonNakshatra,
  formatDate,
  calculateMahaDashas,
  calculateAntarDashas,
} from "./lib/dasha-calculator.ts";
import type { DashaPeriod, AntarDashaPeriod } from "./lib/dasha-calculator.ts";
import {
  getPast3Mahadashas,
  getCurrentDasha,
  formatPastDashasForPrompt,
  formatCurrentDashaForPrompt,
  type DashaJson,
} from "./lib/dasha-prompt-helpers.ts";

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[generate-free-vedic-forecast] ${step}${detailsStr}`);
}

const SYSTEM_PROMPT = `You are an expert Vedic astrologer who writes personalized forecasts in accessible, engaging language. Your writing style is:

- Conversational and warm, never academic or preachy
- Focused on practical implications before technical details
- Empowering and growth-oriented, never fatalistic
- Clear and concise—every sentence adds value

When writing forecasts:
1. Lead with WHAT the person will experience (the practical reality)
2. Follow with WHY (the astrological explanation) in separate "astrology_note" sections
3. Use plain language for the main content
4. Save technical terms for the astrology notes
5. Make predictions specific and actionable
6. Describe personality traits directly without using phrases like "the Pisces in you" or "your Aquarius heart"

Return ONLY valid JSON. No markdown code blocks, no additional text before or after the JSON.`;

interface ForecastPromptInputs {
  birth_date: string;
  birth_time: string;
  birth_location: string;
  ascendant_sign: string;
  ascendant_degree?: number;
  planetary_positions: {
    name: string;
    sign: string;
    house: number;
  }[];
  current_mahadasha: {
    name: string;
    start: string;
    end: string;
  };
  current_antardasha: {
    name: string;
    start: string;
    end: string;
  } | null;
  past_dashas: string;
  moon_nakshatra: string;
  ascendant_lord?: string;
  ascendant_lord_position?: string;
}

function calculateHouseFromAscendant(planetSignId: number, ascendantSignId: number): number {
  // House is calculated as the distance from the ascendant sign
  // If planet is in ascendant sign, it's in the 1st house
  let house = planetSignId - ascendantSignId + 1;
  if (house <= 0) house += 12;
  return house;
}

function getSignLord(sign: string): string {
  const signLords: Record<string, string> = {
    Aries: "Mars",
    Taurus: "Venus",
    Gemini: "Mercury",
    Cancer: "Moon",
    Leo: "Sun",
    Virgo: "Mercury",
    Libra: "Venus",
    Scorpio: "Mars",
    Sagittarius: "Jupiter",
    Capricorn: "Saturn",
    Aquarius: "Saturn",
    Pisces: "Jupiter",
  };
  return signLords[sign] || "Unknown";
}

export function buildUserPrompt(inputs: ForecastPromptInputs): string {
  // Format planetary positions
  const planetaryPositionsText = inputs.planetary_positions
    .map((p) => `- ${p.name} in ${p.sign} (${getOrdinal(p.house)} house from ascendant)`)
    .join("\n");

  // Format ascendant lord info
  const ascendantLordInfo =
    inputs.ascendant_lord && inputs.ascendant_lord_position
      ? `\n**Ascendant Lord:** ${inputs.ascendant_lord} in ${inputs.ascendant_lord_position}`
      : "";

  return `Create a free astrology forecast for this person. Return ONLY valid JSON (no markdown code blocks, no additional text).

The JSON should include:

1. **WHO YOU ARE: Natural Orientation**
   - 2-3 paragraphs describing personality based on ascendant, sun, moon signs
   - How they process the world and key traits
   - One "astrology_note" with chart explanation

2. **YOUR JOURNEY SO FAR: Key Patterns**
   - 2-3 paragraphs summarizing their past as ONE flowing narrative
   - Connect past mahadasha periods to life themes (childhood, education, transformation, current era)
   - CRITICAL: Only discuss dasha periods that occurred AFTER their birth date. 
   - Do NOT make assumptions about childhood or early life unless you have dasha data that clearly falls within their lifetime after birth.
   - NO detailed breakdowns - just touch on key transitions
   - One "astrology_note" explaining dasha progression

3. **WHAT'S NEXT: Path Forward**
   - 3-4 paragraphs teasing what the current year holds (general themes only)
   - Emphasize that timing matters
   - Create intrigue without giving specifics
   - Mention this is a "pivotal year" or "setup phase"

4. **UPGRADE SECTION**
   - Brief intro paragraph
   - "benefits_list" with 5 specific items
   - "cta" with main text and subtext

**Birth Details:**
Date: ${inputs.birth_date}
Time: ${inputs.birth_time}
Location: ${inputs.birth_location}

**Ascendant:** ${inputs.ascendant_sign}${inputs.ascendant_degree ? ` at ${inputs.ascendant_degree.toFixed(1)}°` : ""}${ascendantLordInfo}

**Key Planets:**
${planetaryPositionsText}

**Moon Nakshatra:** ${inputs.moon_nakshatra}

**Current Dasha Period:**
- Mahadasha: ${inputs.current_mahadasha.name} (${inputs.current_mahadasha.start} to ${inputs.current_mahadasha.end})
- Antardasha: ${inputs.current_antardasha?.name || "Unknown"} (${inputs.current_antardasha?.start || "?"} to ${inputs.current_antardasha?.end || "?"})

**Past Dasha Periods:**
${inputs.past_dashas}

Return valid JSON only. Use markdown within text fields for emphasis (**bold**, *italic*).

Output format:
{
  "title": "Your Life Forecast",
  "subtitle": "Born [date] • [location]",
  "sections": [
    {
      "heading": "Who You Are: Your Natural Orientation",
      "content": [
        {
          "type": "paragraph",
          "text": "..."
        },
        {
          "type": "paragraph",
          "text": "..."
        },
        {
          "type": "astrology_note",
          "label": "Why This Is:",
          "text": "..."
        }
      ]
    },
    {
      "heading": "Your Journey So Far: Key Patterns",
      "content": [
        {
          "type": "paragraph",
          "text": "..."
        },
        {
          "type": "astrology_note",
          "label": "The Astrology:",
          "text": "..."
        }
      ]
    },
    {
      "heading": "What's Next: Your Path Forward",
      "content": [
        {
          "type": "paragraph",
          "text": "..."
        }
      ]
    },
    {
      "heading": "Want to Know the Specifics?",
      "content": [
        {
          "type": "paragraph",
          "text": "The complete 2026 forecast includes:"
        },
        {
          "type": "benefits_list",
          "items": [
            "Month-by-month breakdown of opportunities and challenges",
            "Specific dates for major decisions and pivotal moments",
            "Strategic guidance on career, relationships, and finances",
            "Key transition points where energy shifts",
            "Critical decisions to make in each quarter"
          ]
        },
        {
          "type": "cta",
          "text": "Upgrade to the Full 2026 Forecast",
          "subtext": "Get the complete roadmap for navigating your most pivotal year yet."
        }
      ]
    }
  ]
}`;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface RequestBody {
  kundli_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const body: RequestBody = await req.json();
    const { kundli_id } = body;

    if (!kundli_id) {
      return errorResponse("kundli_id is required", 400);
    }

    logStep("Fetching kundli details", { kundli_id });

    // Fetch the kundli details
    const { data: kundliData, error: kundliError } = await supabase
      .from("user_kundli_details")
      .select("*")
      .eq("id", kundli_id)
      .single();

    if (kundliError || !kundliData) {
      logStep("Kundli not found", { error: kundliError?.message });
      return errorResponse("Kundli details not found", 404);
    }

    logStep("Kundli details fetched", {
      moon_sign: kundliData.moon_sign,
      sun_sign: kundliData.sun_sign,
      nakshatra: kundliData.nakshatra,
      ascendant: kundliData.ascendant_sign,
    });

    // Get planetary positions from kundli data
    const planetaryPositions: PlanetaryPosition[] = kundliData.planetary_positions || [];

    // Find Moon position
    const moonPosition = planetaryPositions.find((p) => p.name === "Moon");
    if (!moonPosition) {
      return errorResponse("Moon position not found in kundli data", 400);
    }

    // Find Ascendant
    const ascendantPosition = planetaryPositions.find((p) => p.name === "Ascendant");
    const ascendantSign = ascendantPosition?.sign || kundliData.ascendant_sign || "Unknown";
    const ascendantSignId = ascendantPosition?.sign_id || 1;
    const ascendantDegree = ascendantPosition?.degree;
    const ascendantLord = getSignLord(ascendantSign);

    // Find ascendant lord position
    const ascendantLordPosition = planetaryPositions.find((p) => p.name === ascendantLord);
    const ascendantLordPositionText = ascendantLordPosition
      ? `${ascendantLordPosition.sign} (${getOrdinal(calculateHouseFromAscendant(ascendantLordPosition.sign_id, ascendantSignId))} house)`
      : undefined;

    logStep("Moon position found", {
      moon_degree: moonPosition.full_degree,
      moon_sign: moonPosition.sign,
    });

    // Parse birth date
    const birthDate = new Date(kundliData.birth_date);
    const moonLongitude = moonPosition.full_degree;

    // Calculate nakshatra from Moon position
    const nakshatraInfo = getMoonNakshatra(moonLongitude);

    logStep("Nakshatra calculated", {
      nakshatra: nakshatraInfo.name,
      lord: nakshatraInfo.lord,
    });

    // Calculate current Maha Dasha
    const currentMahaDasha = getCurrentMahaDasha(birthDate, moonLongitude);
    if (!currentMahaDasha) {
      return errorResponse("Could not calculate current Maha Dasha", 500);
    }

    // Calculate current Antar Dasha
    const currentAntarDasha = getCurrentAntarDasha(birthDate, moonLongitude);

    logStep("Current dashas calculated", {
      maha_dasha: currentMahaDasha.planet,
      antar_dasha: currentAntarDasha?.planet,
    });

    // Calculate full dasha periods for helpers
    const allMahaDashas = calculateMahaDashas(birthDate, moonLongitude);

    // Format for dasha prompt helpers
    const formattedDashaPeriods: DashaJson[] = allMahaDashas.map((maha: DashaPeriod) => {
      const antarDashas = calculateAntarDashas(maha);
      return {
        name: maha.planet,
        start: formatDate(maha.start_date),
        end: formatDate(maha.end_date),
        antardasha: antarDashas.map((antar: AntarDashaPeriod) => ({
          name: antar.planet,
          start: formatDate(antar.start_date),
          end: formatDate(antar.end_date),
        })),
      };
    });

    // Get past dashas using the helper
    const pastDashas = getPast3Mahadashas(formattedDashaPeriods);
    const pastDashasText = formatPastDashasForPrompt(pastDashas);

    // Get current dasha info using helper
    const currentDashaInfo = getCurrentDasha(formattedDashaPeriods);

    logStep("Dasha helpers applied", {
      past_dashas_count: pastDashas.length,
      current_dasha: currentDashaInfo?.mahadasha?.name,
    });

    // Prepare planetary positions for prompt (key planets only)
    const keyPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];
    const keyPlanetaryPositions = planetaryPositions
      .filter((p) => keyPlanets.includes(p.name))
      .map((p) => ({
        name: p.name,
        sign: p.sign,
        house: calculateHouseFromAscendant(p.sign_id, ascendantSignId),
      }));

    // Build prompt inputs
    const promptInputs: ForecastPromptInputs = {
      birth_date: kundliData.birth_date,
      birth_time: kundliData.birth_time,
      birth_location: kundliData.birth_place,
      ascendant_sign: ascendantSign,
      ascendant_degree: ascendantDegree,
      planetary_positions: keyPlanetaryPositions,
      current_mahadasha: currentDashaInfo?.mahadasha || {
        name: currentMahaDasha.planet,
        start: formatDate(currentMahaDasha.start_date),
        end: formatDate(currentMahaDasha.end_date),
      },
      current_antardasha:
        currentDashaInfo?.antardasha ||
        (currentAntarDasha
          ? {
              name: currentAntarDasha.planet,
              start: formatDate(currentAntarDasha.start_date),
              end: formatDate(currentAntarDasha.end_date),
            }
          : null),
      past_dashas: pastDashasText,
      moon_nakshatra: nakshatraInfo.name,
      ascendant_lord: ascendantLord,
      ascendant_lord_position: ascendantLordPositionText,
    };

    // Build the prompt
    const userPrompt = buildUserPrompt(promptInputs);

    logStep("Calling Claude Sonnet 4.5", {
      prompt_length: userPrompt.length,
    });

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
        max_tokens: 2500,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        system: SYSTEM_PROMPT,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      const isRateLimited = claudeResponse.status === 429;
      
      logStep("Claude API error", { 
        status: claudeResponse.status, 
        error: errorText,
        is_rate_limit: isRateLimited 
      });
      
      if (isRateLimited) {
        return new Response(JSON.stringify({
          high_demand: true,
          message: "We're experiencing high demand right now. Please try again in a few minutes.",
          retry_after: 60,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        });
      }
      
      return errorResponse(`Claude API error: ${claudeResponse.status}`, 500);
    }

    const claudeData = await claudeResponse.json();
    const forecastText = claudeData.content?.[0]?.text || "";

    logStep("Forecast generated", {
      length: forecastText.length,
      model: claudeData.model,
      usage: claudeData.usage,
    });

    // Filter 2026 periods for storage
    const year2026Start = new Date(2026, 0, 1);
    const year2026End = new Date(2026, 11, 31);

    const dashaPeriods2026 = allMahaDashas
      .filter((maha: DashaPeriod) => maha.start_date <= year2026End && maha.end_date >= year2026Start)
      .map((maha: DashaPeriod) => {
        const antarDashas = calculateAntarDashas(maha);
        const antarDashasIn2026 = antarDashas.filter(
          (antar: AntarDashaPeriod) => antar.start_date <= year2026End && antar.end_date >= year2026Start,
        );
        return {
          maha_dasha: maha.planet,
          maha_start: formatDate(maha.start_date),
          maha_end: formatDate(maha.end_date),
          antar_dashas_in_2026: antarDashasIn2026.map((antar: AntarDashaPeriod) => ({
            name: antar.planet,
            start: formatDate(antar.start_date),
            end: formatDate(antar.end_date),
          })),
        };
      });

    logStep("Dasha periods formatted for persistence", {
      total_mahas: formattedDashaPeriods.length,
      periods_2026: dashaPeriods2026.length,
    });

    // Save the forecast and dasha data to the database
    const { error: updateError } = await supabase
      .from("user_kundli_details")
      .update({
        free_vedic_forecast: forecastText,
        forecast_model: claudeData.model,
        forecast_generated_at: new Date().toISOString(),
        dasha_periods: formattedDashaPeriods,
        dasha_periods_2026: dashaPeriods2026,
      })
      .eq("id", kundli_id);

    if (updateError) {
      logStep("Failed to save forecast", { error: updateError.message });
      // Still return the forecast even if saving failed
    } else {
      logStep("Forecast saved to database");
    }

    return jsonResponse({
      forecast: forecastText,
      inputs: promptInputs,
      model: claudeData.model,
      usage: claudeData.usage,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});

export { SYSTEM_PROMPT };
