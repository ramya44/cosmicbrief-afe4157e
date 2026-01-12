import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/lib/http.ts";
import type { UserData, DashaJson, TransitLookupRow, ForecastInputs } from "./lib/types.ts";
import { generateForecastInputs } from "./lib/generate-forecast-inputs.ts";

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
Describe their personality based on Sun sign, Moon sign, and nakshatra. Focus on:
- Core emotional nature (Moon sign traits)
- Spiritual/creative qualities (Sun sign traits)
- Unique gifts (nakshatra qualities)

End with:
**The Astrology:**  
Moon in ${inputs.moon_sign} in ${inputs.nakshatra} nakshatra. Sun in ${inputs.sun_sign}.

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

### Section 3: Your Biggest 2026 Moment (200-250 words)
Focus on: ${inputs.dasha_changes_2026 !== "No major Dasha changes" ? inputs.dasha_changes_2026 : inputs.sade_sati_2026}

Describe:
- What changes and when (specific date if applicable)
- What the first part of the year feels like
- What shifts after the pivot point
- Brief guidance on how to work with this

Then add:

### 🔒 What The Full Forecast Reveals:

Your complete 2026 forecast unlocks:

- **Exactly what's shifting** and why this is the defining moment of your year
- **Month-by-month guidance** for all 12 months with precise timing
- **Detailed house-by-house analysis** showing exactly which life areas are activated when (requires birth time + planetary positions)
- **Precise action windows** for career moves, relationship decisions, and major commitments
- **Your specific transformation timeline** and when relief comes
- **How to navigate each phase** for maximum results

**What to do now:**  
[1-2 sentences of immediate actionable guidance based on their biggest event]

End with:
**The Astrology:**  
[Technical explanation with exact dates and planetary positions]

---

**Unlock your complete 2026 roadmap → [Upgrade Now]**

## WRITING GUIDELINES:
- Keep total length under 800 words
- Use present tense for 2026 predictions
- Be specific about dates when available
- Make the paywall benefits concrete and chart-specific
- Ensure free version creates value while leaving them wanting more`;
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
      nakshatra: kundliData.nakshatra 
    });

    // Fetch transit data from lookup table
    const { data: transitsData, error: transitsError } = await supabase
      .from("transits_lookup")
      .select("*");

    if (transitsError) {
      logStep("Error fetching transits", { error: transitsError.message });
      return errorResponse("Failed to fetch transit data", 500);
    }

    logStep("Transit data fetched", { count: transitsData?.length || 0 });

    // Prepare user data
    const userData: UserData = {
      birth_date: kundliData.birth_date,
      birth_location: kundliData.birth_place,
      sun_sign: kundliData.sun_sign || "Unknown",
      moon_sign: kundliData.moon_sign || "Unknown",
      nakshatra: kundliData.nakshatra || "Unknown",
    };

    // Get dasha periods from kundli data
    const dashaJson: DashaJson[] = kundliData.dasha_periods || [];

    // Convert transits to expected format
    const transitsLookupTable: TransitLookupRow[] = (transitsData || []).map((row: any) => ({
      id: row.id,
      year: row.year,
      transit_data: typeof row.transit_data === "string" 
        ? row.transit_data 
        : JSON.stringify(row.transit_data),
    }));

    logStep("Generating forecast inputs");

    // Generate the forecast inputs
    const forecastInputs = generateForecastInputs(userData, dashaJson, transitsLookupTable);

    logStep("Forecast inputs generated", { 
      maha_dasha: forecastInputs.maha_dasha_planet,
      antar_dasha: forecastInputs.antar_dasha_planet 
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
      usage: claudeData.usage 
    });

    // Save the forecast to the database
    const { error: updateError } = await supabase
      .from("user_kundli_details")
      .update({
        free_vedic_forecast: forecastText,
        forecast_model: claudeData.model,
        forecast_generated_at: new Date().toISOString(),
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
