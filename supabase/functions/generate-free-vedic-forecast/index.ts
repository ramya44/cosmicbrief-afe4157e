import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/lib/http.ts";
import type { UserData, TransitLookupRow, ForecastInputs } from "./lib/types.ts";
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
2. Follow with WHY (the astrological explanation) in a separate "The Astrology" section
3. Use plain language for the main content ("life chapter" not "Maha Dasha")
4. Save technical terms for the astrology sections
5. Make predictions specific and actionable
6. Describe personality traits directly without using phrases like "the Pisces in you" or "your Aquarius heart"

For free forecasts:
- Create intrigue without giving away the full analysis
- Use strategic teasers that make the paid version essential
- Focus on the most dramatic/important elements
- End with a clear value proposition for upgrading`;

export function buildUserPrompt(inputs: ForecastInputs): string {
  return `Create a FREE 2026 Vedic astrology forecast with the following structure:

## INPUT DATA:
- Birth date: ${inputs.birth_date}
- Birth location: ${inputs.birth_location}
- Ascendant (Lagna): ${inputs.ascendant}
- Sun sign (Rashi): ${inputs.sun_sign}
- Moon sign (Rashi): ${inputs.moon_sign}
- Moon nakshatra: ${inputs.nakshatra}
- Current Maha Dasha: ${inputs.maha_dasha_planet} (${inputs.maha_dasha_start} to ${inputs.maha_dasha_end})
- Current Antar Dasha: ${inputs.antar_dasha_planet} (${inputs.antar_dasha_start} to ${inputs.antar_dasha_end})
- Dasha changes in 2026: ${inputs.dasha_changes_2026}

## MAJOR 2025 CONTEXT:
- Sade Sati status in 2025: ${inputs.sade_sati_2025}
- Rahu/Ketu in 2025: ${inputs.rahu_ketu_2025}
- Antar Dasha in 2025: ${inputs.antar_dasha_2025}

## MAJOR 2026 TRANSITS:
- Sade Sati status: ${inputs.sade_sati_2026}
- Rahu/Ketu: ${inputs.rahu_ketu_2026} (shift date: January 18, 2026)
- Saturn: ${inputs.saturn_2026}

## OUTPUT STRUCTURE:

### Section 1: Your Natural Orientation (150-200 words)
Describe their personality based on Ascendant, Sun sign, Moon sign, and nakshatra. Focus on:
- Core approach to life and how they present to the world (Ascendant traits)
- Emotional nature and inner world (Moon sign traits)
- Spiritual/creative essence and soul purpose (Sun sign traits)
- Unique gifts and deeper patterns (nakshatra qualities)

IMPORTANT: Describe traits directly. Instead of "Your Aquarius Moon" or "The Pisces in you", simply describe what they're like: "You're naturally intuitive and drawn to..." or "Your emotional world is..."

End with:
**The Astrology:**  
Ascendant in ${inputs.ascendant}. Moon in ${inputs.moon_sign} in ${inputs.nakshatra} nakshatra. Sun in ${inputs.sun_sign}.

### Section 2: How 2026 Differs From 2025 (150-200 words)
Compare what 2025 felt like vs what 2026 will bring. Use this framing:
- "2025 was the wake-up call. 2026 is the response."
- Describe 2025's pressure/realizations
- Explain how 2026 shifts to action/building
- Keep it specific to their transits

End with:
**The Astrology:**  
2025: ${inputs.sade_sati_2025}; ${inputs.rahu_ketu_2025}; ${inputs.antar_dasha_2025} Antar Dasha
2026: ${inputs.sade_sati_2026}; ${inputs.rahu_ketu_2026}; ${inputs.antar_dasha_planet} Antar Dasha

### Section 3: Your Biggest 2026 Moment (FIRST SENTENCE ONLY)
Focus on: ${inputs.dasha_changes_2026 !== "No major Dasha changes" ? inputs.dasha_changes_2026 : inputs.sade_sati_2026}

Write ONLY the opening sentence that identifies the date and what shifts. Example:
"The defining moment of your year happens around [DATE], when [BRIEF DESCRIPTION OF SHIFT]."

STOP AFTER THIS SENTENCE. Do not explain what the phases feel like, what changes, or provide any guidance.

Then immediately add:

### 🔒 What The Full Forecast Reveals:

Your complete 2026 forecast unlocks:

- **Exactly what's shifting** and why [DATE] marks your personal new year within the year
- **Month-by-month guidance** for all 12 months with precise timing for major decisions
- **Detailed house-by-house analysis** showing exactly which life areas are activated when (career, relationships, finances, health)
- **Precise action windows** for launching projects, making commitments, and strategic moves
- **Your specific transformation timeline** and how each phase builds toward your bigger vision
- **How to navigate each phase** for maximum results without burning out
- **Immediate actionable guidance** on what to prioritize right now based on your current planetary cycle

End with:
**The Astrology:**  
[Technical explanation with exact dates and planetary positions for the major shift]

---

## WRITING GUIDELINES:
- Keep total length under 800 words
- Use present tense for 2026 predictions
- Be specific about dates when available
- Make the paywall benefits concrete and chart-specific
- Ensure free version creates value while leaving them wanting more
- NO upgrade CTA language—the UI will handle that
- In Section 3, write ONLY the first sentence, then go straight to the paywall feature list
- Use the Ascendant to describe their outer personality and life approach in Section 1`;
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
      ascendant: kundliData.ascendant,
    });

    // Get planetary positions from kundli data
    const planetaryPositions = kundliData.planetary_positions || [];

    // Find Moon position
    const moonPosition = planetaryPositions.find((p: any) => p.name === "Moon");
    if (!moonPosition) {
      return errorResponse("Moon position not found in kundli data", 400);
    }

    // Find Ascendant
    const ascendantPosition = planetaryPositions.find((p: any) => p.name === "Ascendant");
    const ascendantSign = ascendantPosition?.sign || kundliData.ascendant || "Unknown";

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
    if (!currentAntarDasha) {
      return errorResponse("Could not calculate current Antar Dasha", 500);
    }

    logStep("Current dashas calculated", {
      maha_dasha: currentMahaDasha.planet,
      antar_dasha: currentAntarDasha.planet,
    });

    // Get dasha changes in 2025 and 2026
    const changes2025 = getDashaChangesInYear(birthDate, moonLongitude, 2025);
    const changes2026 = getDashaChangesInYear(birthDate, moonLongitude, 2026);

    logStep("Dasha changes calculated", {
      changes_2025: changes2025.antarDashaChanges.length,
      changes_2026: changes2026.antarDashaChanges.length,
    });

    // Fetch transit data from lookup table
    const { data: transitsData, error: transitsError } = await supabase.from("transits_lookup").select("*");

    if (transitsError) {
      logStep("Error fetching transits", { error: transitsError.message });
      return errorResponse("Failed to fetch transit data", 500);
    }

    logStep("Transit data fetched", { count: transitsData?.length || 0 });

    // Prepare user data
    const userData: UserData = {
      birth_date: kundliData.birth_date,
      birth_location: kundliData.birth_place,
      ascendant: ascendantSign,
      sun_sign: kundliData.sun_sign || "Unknown",
      moon_sign: moonPosition.sign || "Unknown",
      nakshatra: nakshatraInfo.name,
    };

    // Convert transits to expected format
    const transitsLookupTable: TransitLookupRow[] = (transitsData || []).map((row: any) => ({
      id: row.id,
      year: row.year,
      transit_data: typeof row.transit_data === "string" ? row.transit_data : JSON.stringify(row.transit_data),
    }));

    logStep("Generating forecast inputs");

    // Prepare dasha info in the format expected by generateForecastInputs
    const dashaInfo = {
      currentMahaDasha,
      currentAntarDasha,
      changes2025: changes2025.antarDashaChanges,
      changes2026: changes2026.antarDashaChanges,
    };

    // Generate the forecast inputs
    const forecastInputs = generateForecastInputs(userData, dashaInfo, transitsLookupTable);

    logStep("Forecast inputs generated", {
      maha_dasha: forecastInputs.maha_dasha_planet,
      antar_dasha: forecastInputs.antar_dasha_planet,
    });

    // Build the prompt
    const userPrompt = buildUserPrompt(forecastInputs);

    logStep("Calling Claude Sonnet 4.5");

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
      logStep("Claude API error", { status: claudeResponse.status, error: errorText });
      return errorResponse(`Claude API error: ${claudeResponse.status}`, 500);
    }

    const claudeData = await claudeResponse.json();
    const forecastText = claudeData.content?.[0]?.text || "";

    logStep("Forecast generated", {
      length: forecastText.length,
      model: claudeData.model,
      usage: claudeData.usage,
    });

    // Calculate full dasha periods for persistence
    const allMahaDashas = calculateMahaDashas(birthDate, moonLongitude);
    
    // Format full dasha periods for storage
    const formattedDashaPeriods = allMahaDashas.map((maha: DashaPeriod) => {
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

    // Filter 2026 periods
    const year2026Start = new Date(2026, 0, 1);
    const year2026End = new Date(2026, 11, 31);
    
    const dashaPeriods2026 = allMahaDashas
      .filter((maha: DashaPeriod) => maha.start_date <= year2026End && maha.end_date >= year2026Start)
      .map((maha: DashaPeriod) => {
        const antarDashas = calculateAntarDashas(maha);
        const antarDashasIn2026 = antarDashas.filter(
          (antar: AntarDashaPeriod) => antar.start_date <= year2026End && antar.end_date >= year2026Start
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
      inputs: forecastInputs,
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
