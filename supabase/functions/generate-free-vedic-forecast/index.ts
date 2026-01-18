import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/lib/http.ts";
import type { UserData, TransitLookupRow, PlanetaryPosition } from "./lib/types.ts";
import { generateForecastInputs } from "./lib/generate-forecast-inputs.ts";
import { buildVedicFreeEmailHtml } from "../_shared/lib/email-templates.ts";
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
} from "../_shared/lib/dasha-helpers.ts";
import {
  formatPlanetaryPositionsForPrompt,
  getSignLord,
  calculateHouseFromAscendant,
  getOrdinal,
  getAscendantLordPosition,
  toWesternSign,
} from "../_shared/lib/planetary-positions.ts";
import { createLogger } from "../_shared/lib/logger.ts";

const logStep = createLogger("GENERATE-FREE-VEDIC-FORECAST");

// Input validation schema
const ForecastRequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
});

const SYSTEM_PROMPT = `You are an expert astrologer who writes personalized forecasts in accessible, modern language. Your writing style is:

- Conversational and warm, like talking to a trusted mentor
- Focused on practical life guidance before astrological mechanics
- Empowering and growth-oriented, never mystical or fatalistic
- Clear and relatable—every sentence adds value

**Language Guidelines - CRITICAL:**
- Use "rising sign" instead of "ascendant"
- Use "life chapter" or "planetary period" instead of "dasha"
- Use "lunar mansion" sparingly; usually just describe the moon's quality
- Use "growth edge" or "karmic path" instead of "Rahu-Ketu axis"
- Say "Saturn brings lessons" not "Saturn's malefic influence"
- Say "Jupiter expands" not "Jupiter bestows"
- Describe WHAT happens, not astrological mechanics

**Writing Structure:**
1. Lead with WHAT the person will experience (the human reality)
2. Follow with WHY (the astrological explanation) in separate "astrology_note" sections
3. Main content reads like modern lifestyle advice
4. Technical terms stay in astrology notes only
5. Predictions are specific and actionable
6. Personality traits are direct: "You're naturally intuitive" not "The Pisces moon in you..."

Return ONLY valid JSON. No markdown code blocks, no additional text before or after the JSON.`;

interface ForecastPromptInputs {
  name?: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  ascendant_sign: string;
  ascendant_degree?: number;
  planetary_positions_text: string; // Pre-formatted planetary positions string
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
  dasha_changes_2026?: string;
  transits_2026?: string;
}

// calculateHouseFromAscendant and getSignLord imported from _shared/lib/planetary-positions.ts

export function buildUserPrompt(inputs: ForecastPromptInputs): string {
  const birthYear = new Date(inputs.birth_date).getFullYear();
  const personReference = inputs.name ? `for ${inputs.name}` : "for this person";

  return `Create a modern astrology forecast ${personReference}. Return ONLY valid JSON (no markdown code blocks).

**LANGUAGE RULES - APPLY TO ALL SECTIONS:**
- Never use: "dasha", "ascendant", "nakshatra", "malefic", "benefic", "exalted"
- Instead use: "life chapter/period", "rising sign", descriptive qualities, "challenging energy", "supportive energy", "at peak strength"
- Write as if explaining to someone who's curious about astrology but new to it
- Save technical terms for "astrology_note" sections only

**CRITICAL INSTRUCTION - LIFE AREA BALANCE:**
This forecast must cover MULTIPLE areas of life, not just career. Include appropriate discussion of:
- Personal relationships (romantic, family, friendships)
- Career and life purpose
- Financial matters and resources
- Health and well-being
- Spiritual growth and inner development
- Creative expression
- Personal transformation

DO NOT focus predominantly on career unless the chart overwhelmingly indicates it. Most people want guidance across ALL life areas.

The JSON should include:

**1. WHO YOU ARE: Natural Orientation**
- 2-3 paragraphs describing personality based on their rising sign, sun, moon
- How they naturally process the world and core traits
- Written in modern, relatable language
- One "astrology_note" with technical chart explanation

Example opening: "You're someone who processes the world through ideas and innovation. While others get caught up in details, you're seeing patterns and possibilities three steps ahead..."

NOT: "With Aquarius ascendant, you are an air sign ruled by Saturn..."

**2. YOUR JOURNEY SO FAR: Key Patterns**
- 2-3 paragraphs summarizing their adult life as ONE flowing narrative
- Use "life chapters" or "periods" instead of "dasha"
- Example: "From 2015-2022, you were in a chapter focused on..." NOT "During your Venus Mahadasha..."
- CRITICAL: Only discuss the periods explicitly provided in "Past Life Chapters" section below
- DO NOT discuss childhood, early years, or formative experiences unless a period clearly covers that time AFTER birth
- If a period started before birth, only discuss the years AFTER the birth year
- Cover MULTIPLE life areas: relationships, career, personal growth, spiritual development, creative pursuits, health, family
- Balance the narrative - don't focus exclusively on career
- Connect the PROVIDED periods to diverse adult life themes
- NO detailed breakdowns - just key transitions
- One "astrology_note" explaining the astrological progression

Example: "The past seven years have been about building your foundation—both literally in your home life and figuratively in your career. You've learned what stability means to you..."

NOT: "During your Saturn Mahadasha, the lord of your 10th house brought career challenges..."

**3. WHAT'S NEXT: Path Forward**
- 3-4 paragraphs teasing what the current year holds (general themes only)
- Cover MULTIPLE life areas: relationships, career/purpose, finances, health, spiritual growth, creativity
- Balance focus across different life domains based on their chart
- Emphasize that timing matters across ALL these areas
- Create intrigue without giving specifics
- Mention this is a "pivotal year" or "setup phase"

Example: "This year is setting the stage for something bigger. You'll feel pulled toward deeper connections while simultaneously craving more independence in your work..."

NOT: "2026 features Jupiter transiting your 7th house while Saturn aspects your Moon..."

**4. YOUR TURNING POINT (Hook Section - CRITICAL)**
- ONE specific upcoming date or period in 2026 that will be highly significant
- Keep it to 1-2 sentences ONLY
- Lead with the WHAT (the moment/experience), not the WHY
- Use modern language: "Late spring brings a rare alignment" NOT "Jupiter's transit to your 5th house"
- VARY THE FOCUS across different life areas based on the chart:
  * Relationships: "Between March and May, a critical window opens for relationship decisions and deep connections."
  * Creative work: "Spring 2026 activates your creative potential in ways not seen since 2014."
  * Career: "June 1st marks a rare professional opportunity that happens once every 12 years."
  * Spiritual: "August 2026 presents a powerful period for inner transformation and spiritual awakening."
  * Financial: "Late summer brings your most auspicious financial opportunity in years."
  * Health/Wellness: "Early fall 2026 is ideal for making lasting changes to your health and daily routines."
- End with: "Get the full forecast for details on [what they need to know]"
- Make the [what they need to know] specific to the life area
- DO NOT explain why it matters or give astrological details (that's for paid)
- DO NOT give guidance or actions (that's for paid)
- Just name the moment + tell them to upgrade for details

Example: "Between June and August 2026, a rare window opens for creative and romantic breakthroughs—the kind that reshape your entire trajectory. Get the full forecast for details on how to make the most of this pivotal period."

NOT: "Jupiter's transit through your 5th house from June-August creates a powerful dasha period. Get the full forecast to understand the Vedic implications."

**5. UPGRADE SECTION**
- Brief intro paragraph building on the hook: "The difference between those who capitalize on pivotal moments and those who miss them? Preparation and precision."
- "benefits_list" with 5 specific items (first item references the turning point)
- "cta" with main text and subtext

---

**Birth Details:**
${inputs.name ? `Name: ${inputs.name}` : ""}
Date: ${inputs.birth_date}
Time: ${inputs.birth_time}
Location: ${inputs.birth_location}
Birth Year: ${birthYear}

**Rising Sign (Ascendant):** ${inputs.ascendant_sign}${inputs.ascendant_degree ? ` at ${inputs.ascendant_degree.toFixed(1)}°` : ""}${
    inputs.ascendant_lord && inputs.ascendant_lord_position
      ? `\n**Chart Ruler:** ${inputs.ascendant_lord} in ${inputs.ascendant_lord_position}`
      : ""
  }

**Key Planetary Placements:**
${inputs.planetary_positions_text}

**Moon's Placement:** ${inputs.moon_nakshatra} lunar mansion

**Current Life Chapter:**
- Main period: ${inputs.current_mahadasha.name} chapter (${inputs.current_mahadasha.start} to ${inputs.current_mahadasha.end})
- Sub-period: ${inputs.current_antardasha?.name || "Unknown"} (${inputs.current_antardasha?.start || "?"} to ${inputs.current_antardasha?.end || "?"})

**Past Life Chapters (ONLY discuss these periods, ONLY for years after ${birthYear}):**
${inputs.past_dashas}

**CRITICAL RESTRICTIONS FOR "JOURNEY SO FAR" SECTION:**
- Birth year is ${birthYear}
- Only discuss the periods listed above under "Past Life Chapters"
- DO NOT extrapolate to childhood, early years, or pre-teen experiences
- If a period started before birth, ONLY discuss the portion from ${birthYear} onward
- Use modern language: "During your 2010-2018 chapter..." NOT "During your Mars Mahadasha..."
- Cover diverse life areas: education, relationships, personal growth, career, spiritual development, creativity
- Example: If a period is 1998-2015 and birth is 1989, discuss ages 9-26 across multiple life dimensions

**CORRECT APPROACH (balanced, modern language):**
"From the late 1990s through 2015, your world expanded intellectually and socially. This was your era of education and forming meaningful connections, while also discovering your creative voice..."

**INCORRECT (NEVER DO THIS - technical language):**
"Your Mercury Mahadasha brought intellectual expansion and communication skills development through educational institutions..."

**ALSO INCORRECT (too narrow):**
"This period was all about professional development..." [WRONG - missing other life areas]

**2026 Context (use this to identify the turning point):**
${inputs.dasha_changes_2026 ? `Life Chapter Shifts: ${inputs.dasha_changes_2026}` : "Use current chapter context"}
${inputs.transits_2026 ? `Major Planetary Movements: ${inputs.transits_2026}` : ""}

**INSTRUCTIONS FOR TURNING POINT SECTION:**
- Analyze the 2026 shifts and movements above
- Identify the MOST auspicious or transformative period/date
- Determine which LIFE AREA this affects based on chart emphasis
- Use modern, engaging language - NO technical jargon in the main text
- Make it specific: "May 15th" or "Between June-August" or "Late March 2026"
- Match the turning point to the actual life area the chart indicates
- Create genuine curiosity without being clickbaity
- Save all technical explanation for the paid forecast

---

**OUTPUT FORMAT:**

Return valid JSON only. Use markdown within text fields for emphasis (**bold**, *italic*).

{
  "title": "Your Life Forecast",
  "subtitle": "Born ${inputs.birth_date} • ${inputs.birth_location}",
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
          "label": "The Astrology:",
          "text": "Technical explanation using proper astrological terms..."
        }
      ]
    },
    {
      "heading": "Your Journey So Far: Key Patterns",
      "content": [
        {
          "type": "paragraph",
          "text": "Narrative using modern language (life chapters, periods, etc)..."
        },
        {
          "type": "astrology_note",
          "label": "The Astrology:",
          "text": "Technical dasha progression explanation..."
        }
      ]
    },
    {
      "heading": "What's Next: Your Path Forward",
      "content": [
        {
          "type": "paragraph",
          "text": "Forward-looking narrative in accessible language..."
        }
      ]
    },
    {
      "heading": "Your Turning Point",
      "content": [
        {
          "type": "paragraph",
          "text": "[Specific date/period in modern language + what it represents + CTA to upgrade]"
        }
      ]
    },
    {
      "heading": "Want to Know the Specifics?",
      "content": [
        {
          "type": "paragraph",
          "text": "The difference between those who capitalize on pivotal moments and those who miss them? Preparation and precision. The complete 2026 forecast reveals:"
        },
        {
          "type": "benefits_list",
          "items": [
            "Exactly what to do during your [specific month] window",
            "Month-by-month breakdown of opportunities and challenges",
            "Specific dates for major decisions and pivotal moments",
            "Strategic guidance on career, relationships, and finances",
            "Which risks to take and which to avoid"
          ]
        },
        {
          "type": "cta",
          "text": "Unlock Your Complete 2026 Forecast",
          "subtext": "Get the strategic playbook for your most pivotal year yet."
        }
      ]
    }
  ]
}`;
}

// getOrdinal imported from _shared/lib/planetary-positions.ts

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

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const validationResult = ForecastRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id } = validationResult.data;
    logStep("Request validated", { kundli_id });

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
      has_dasha_periods: !!(kundliData.dasha_periods && kundliData.dasha_periods.length > 0),
    });

    // Check if dasha periods need to be calculated (lazy calculation)
    if (!kundliData.dasha_periods || kundliData.dasha_periods.length === 0) {
      logStep("Dasha periods not found, calculating on-demand");
      
      // Invoke the calculate-dasha-periods function
      const { data: dashaResult, error: dashaError } = await supabase.functions.invoke(
        'calculate-dasha-periods',
        { body: { kundli_id } }
      );

      if (dashaError) {
        logStep("Failed to calculate dasha periods", { error: dashaError.message });
        return errorResponse("Failed to calculate dasha periods for forecast", 500);
      }

      logStep("Dasha periods calculated", { result: dashaResult });

      // Re-fetch the kundli data with the new dasha periods
      const { data: refreshedKundli, error: refreshError } = await supabase
        .from("user_kundli_details")
        .select("*")
        .eq("id", kundli_id)
        .single();

      if (refreshError || !refreshedKundli) {
        logStep("Failed to refresh kundli after dasha calculation");
        return errorResponse("Failed to retrieve updated kundli data", 500);
      }

      // Replace kundliData with refreshed data
      Object.assign(kundliData, refreshedKundli);
      logStep("Kundli data refreshed with dasha periods");
    }

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

    // Format planetary positions for prompt using shared helper
    const planetaryPositionsText = formatPlanetaryPositionsForPrompt(
      planetaryPositions,
      ascendantSign,
      ascendantSignId,
      {
        includeRulership: true,
        includeDegree: false,
        includeRetrograde: false,
        useWesternSigns: true,
      },
    );

    // Calculate 2026 dasha changes for the turning point hook
    const year2026Start = new Date(2026, 0, 1);
    const year2026End = new Date(2026, 11, 31);

    const dashaChanges2026: string[] = [];
    for (const maha of allMahaDashas) {
      const antarDashas = calculateAntarDashas(maha);
      for (const antar of antarDashas) {
        // Check if this antardasha starts within 2026
        if (antar.start_date >= year2026Start && antar.start_date <= year2026End) {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const startMonth = monthNames[antar.start_date.getMonth()];
          const startDay = antar.start_date.getDate();
          dashaChanges2026.push(`${maha.planet}-${antar.planet} (${startMonth} ${startDay})`);
        }
      }
    }
    const dashaChanges2026Text = dashaChanges2026.length > 0 ? dashaChanges2026.join(", ") : undefined;

    // Fetch 2026 transits from the transits_lookup table
    let transits2026Text: string | undefined;
    try {
      const { data: transitsData } = await supabase.from("transits_lookup").select("id, transit_data").eq("year", 2026);

      if (transitsData && transitsData.length > 0) {
        const transitParts: string[] = [];
        for (const row of transitsData) {
          const data = row.transit_data as any;
          if (row.id === "jupiter" && data?.sign) {
            transitParts.push(`Jupiter in ${data.sign}${data.notes ? ` (${data.notes})` : ""}`);
          } else if (row.id === "saturn" && data?.sign) {
            transitParts.push(`Saturn in ${data.sign}`);
          } else if (row.id === "rahu_ketu" && data?.rahu_sign) {
            transitParts.push(`Rahu in ${data.rahu_sign}, Ketu in ${data.ketu_sign}`);
            if (data.shift_date && data.rahu_sign_after) {
              transitParts.push(
                `Rahu-Ketu shift to ${data.rahu_sign_after}/${data.ketu_sign_after} on ${data.shift_date}`,
              );
            }
          }
        }
        if (transitParts.length > 0) {
          transits2026Text = transitParts.join("; ");
        }
      }
    } catch (transitError) {
      logStep("Transit lookup failed (non-critical)", { error: String(transitError) });
    }

    logStep("2026 context prepared", {
      dasha_changes_count: dashaChanges2026.length,
      has_transits: !!transits2026Text,
    });

    // Build prompt inputs
    const promptInputs: ForecastPromptInputs = {
      name: kundliData.name || undefined,
      birth_date: kundliData.birth_date,
      birth_time: kundliData.birth_time,
      birth_location: kundliData.birth_place,
      ascendant_sign: ascendantSign,
      ascendant_degree: ascendantDegree,
      planetary_positions_text: planetaryPositionsText,
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
      dasha_changes_2026: dashaChanges2026Text,
      transits_2026: transits2026Text,
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
        is_rate_limit: isRateLimited,
      });

      if (isRateLimited) {
        return new Response(
          JSON.stringify({
            high_demand: true,
            message: "We're experiencing high demand right now. Please try again in a few minutes.",
            retry_after: 60,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 503,
          },
        );
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

    // Filter 2026 periods for storage (reusing year2026Start/End from earlier)

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

    // Send email with link to the forecast
    const customerEmail = kundliData.email;
    if (customerEmail) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          const resultsUrl = `https://cosmicbrief.com/#/vedic/results?id=${kundli_id}`;
          const emailHtml = buildVedicFreeEmailHtml(kundliData.name, resultsUrl);

          const emailResponse = await resend.emails.send({
            from: "Cosmic Brief <noreply@send.notifications.cosmicbrief.com>",
            to: [customerEmail],
            subject: "Your Free Vedic Forecast is Ready! ✨",
            html: emailHtml,
          });

          logStep("Email sent successfully", { emailId: emailResponse?.data?.id });
        } else {
          logStep("RESEND_API_KEY not configured, skipping email");
        }
      } catch (emailError) {
        // Don't fail the request if email fails
        const emailErrMsg = emailError instanceof Error ? emailError.message : "Unknown email error";
        logStep("Failed to send email", { error: emailErrMsg });
      }
    } else {
      logStep("No email address provided, skipping email");
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
