import { corsHeaders, jsonResponse, errorResponse } from "../_shared/lib/http.ts";
import type { UserData, DashaJson, TransitLookupRow, ForecastInputs } from "./lib/types.ts";
import { generateForecastInputs } from "./lib/generate-forecast-inputs.ts";

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

export async function generateFreeForecast(
  userData: UserData,
  dashaJson: DashaJson[],
  transitsLookupTable: TransitLookupRow[],
): Promise<string> {
  /**
   * Main function to generate free forecast
   *
   * @param userData - User's birth information
   * @param dashaJson - Full Dasha periods from API
   * @param transitsLookupTable - Transit lookup table from database
   * @returns Generated forecast text
   */

  // Generate inputs
  const inputs = generateForecastInputs(userData, dashaJson, transitsLookupTable);

  // Build prompt
  const userPrompt = buildUserPrompt(inputs);

  // Call Claude API (you'll implement this)
  // const response = await callClaudeAPI(SYSTEM_PROMPT, userPrompt);
  // return response;

  // For now, return the prompt for testing
  return userPrompt;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // TODO: Implement free Vedic forecast generation
    return jsonResponse({ message: "Not yet implemented" });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unknown error", 500);
  }
});

// Export everything
export { SYSTEM_PROMPT };
export type * from "./lib/types.ts";
