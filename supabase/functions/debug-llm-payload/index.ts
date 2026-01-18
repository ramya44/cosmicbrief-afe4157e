/**
 * Debug endpoint to test LLM payload generation without calling the LLM
 * Returns the complete payload (prompts, inputs, formatted data) that would be sent
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  formatPlanetaryPositionsForPrompt,
  formatAscendantForPrompt,
  getAscendantLordPosition,
  getSignLord,
  calculateHouseFromAscendant,
  getOrdinal,
  toWesternSign,
  type PlanetaryPosition,
} from "../_shared/lib/planetary-positions.ts";
import {
  getPast3Mahadashas,
  getCurrentDasha,
  getCurrentDashaWithPratyantardasha,
  getPratyantardashasForYear,
  formatPastDashasForPrompt,
  formatCurrentDashaForPrompt,
  formatCurrentDashaWithPratyantardashaForPrompt,
  formatPratyantardashasForPrompt,
  type DashaJson,
  type PratyantardashaInfo,
} from "../_shared/lib/dasha-helpers.ts";
import { createLogger } from "../_shared/lib/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("DEBUG-LLM-PAYLOAD");

// System prompts (same as the actual functions)
const FREE_SYSTEM_PROMPT = `You are an expert Vedic astrologer who writes personalized forecasts in accessible, engaging language. Your writing style is:

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

const PAID_SYSTEM_PROMPT = `You are an expert Vedic astrologer who writes comprehensive, detailed forecasts in accessible, engaging language. Your writing style is:

- Conversational and warm, never academic or preachy
- Focused on practical implications before technical details
- Empowering and growth-oriented, never fatalistic
- Clear and concise—every sentence adds value
- Extremely thorough in the paid forecast - this is a premium product

When writing forecasts:
1. Lead with WHAT the person will experience (the practical reality)
2. Follow with WHY (the astrological explanation) in separate "astrology" or "astrology_note" sections
3. Use plain language for the main content
4. Save technical terms for the astrology sections
5. Make predictions specific and actionable with exact dates
6. Describe personality traits directly without using phrases like "the Pisces in you"

Return ONLY valid JSON. No markdown code blocks, no additional text before or after the JSON.`;

interface DebugPayload {
  type: "free" | "paid";
  kundli_id: string;
  inputs: {
    name?: string;
    birth_date: string;
    birth_time: string;
    birth_location: string;
    ascendant_sign: string;
    ascendant_sign_id: number;
    ascendant_degree?: number;
    ascendant_lord?: string;
    moon_sign?: string;
    moon_nakshatra?: string;
  };
  raw_data: {
    planetary_positions: PlanetaryPosition[];
    dasha_periods: DashaJson[];
    transits_2026?: Record<string, unknown>[];
  };
  formatted_data: {
    planetary_positions_text: string;
    ascendant_text?: string;
    ascendant_lord_position_text?: string;
    current_dasha_text: string;
    past_dashas_text?: string;
    pratyantardashas_text?: string;
    transits_text: string;
    dasha_changes_2026_text?: string;
  };
  prompts: {
    system_prompt: string;
    user_prompt: string;
  };
  metadata: {
    prompt_length: number;
    system_prompt_length: number;
    generated_at: string;
    target_year: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { kundli_id, type = "free" } = await req.json();

    if (!kundli_id) {
      return new Response(JSON.stringify({ error: "kundli_id is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (type !== "free" && type !== "paid") {
      return new Response(JSON.stringify({ error: "type must be 'free' or 'paid'" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Fetching kundli details", { kundli_id, type });

    // Fetch kundli details
    const { data: kundliData, error: kundliError } = await supabase
      .from("user_kundli_details")
      .select("*")
      .eq("id", kundli_id)
      .single();

    if (kundliError || !kundliData) {
      return new Response(JSON.stringify({ error: "Kundli not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Kundli data fetched", {
      birth_date: kundliData.birth_date,
      has_planetary_positions: !!kundliData.planetary_positions,
      has_dasha_periods: !!kundliData.dasha_periods,
    });

    const planetaryPositions: PlanetaryPosition[] = kundliData.planetary_positions || [];
    const dashaPeriods: DashaJson[] = kundliData.dasha_periods || [];
    const targetYear = 2026;

    if (planetaryPositions.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No planetary positions found for this kundli",
        kundli_id,
        available_fields: {
          planetary_positions: kundliData.planetary_positions,
          dasha_periods: kundliData.dasha_periods?.length || 0,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Find ascendant
    const ascendantPosition = planetaryPositions.find(p => p.name === "Ascendant");
    const ascendantSign = ascendantPosition?.sign || kundliData.ascendant_sign || "Aries";
    const ascendantSignId = ascendantPosition?.sign_id || kundliData.ascendant_sign_id || 1;
    const ascendantDegree = ascendantPosition?.degree;
    const ascendantLord = getSignLord(ascendantSign);

    // Find Moon position for nakshatra
    const moonPosition = planetaryPositions.find(p => p.name === "Moon");

    logStep("Ascendant found", { ascendantSign, ascendantSignId, ascendantLord });

    // Fetch transit data
    const { data: transitsData } = await supabase
      .from("transits_lookup")
      .select("*")
      .eq("year", targetYear);

    // Format transits
    let transitsText = "No major transit data available";
    if (transitsData && transitsData.length > 0) {
      const transitParts: string[] = [];
      for (const row of transitsData) {
        const data = typeof row.transit_data === "string" 
          ? JSON.parse(row.transit_data) 
          : row.transit_data;
        
        if (row.id === "jupiter" && data?.sign) {
          transitParts.push(`Jupiter in ${data.sign}${data.notes ? ` (${data.notes})` : ""}`);
        } else if (row.id === "saturn" && data?.sign) {
          transitParts.push(`Saturn in ${data.sign}`);
        } else if (row.id === "rahu_ketu" && data?.rahu_sign) {
          transitParts.push(`Rahu in ${data.rahu_sign}, Ketu in ${data.ketu_sign}`);
          if (data.shift_date && data.rahu_sign_after) {
            transitParts.push(`Rahu-Ketu shift to ${data.rahu_sign_after}/${data.ketu_sign_after} on ${data.shift_date}`);
          }
        }
      }
      if (transitParts.length > 0) {
        transitsText = transitParts.join("; ");
      }
    }

    let payload: DebugPayload;

    if (type === "free") {
      // FREE FORECAST PAYLOAD
      const planetaryPositionsText = formatPlanetaryPositionsForPrompt(
        planetaryPositions,
        ascendantSign,
        ascendantSignId,
        {
          includeRulership: true,
          includeDegree: false,
          includeRetrograde: false,
          useWesternSigns: true,
        }
      );

      const ascendantText = formatAscendantForPrompt(ascendantSign, ascendantDegree, { useWesternSigns: true });
      const ascendantLordPositionText = getAscendantLordPosition(
        planetaryPositions,
        ascendantSign,
        ascendantSignId,
        { useWesternSigns: true }
      );

      // Get past dashas
      const pastDashas = getPast3Mahadashas(dashaPeriods);
      const pastDashasText = formatPastDashasForPrompt(pastDashas);

      // Get current dasha
      const currentDashaInfo = getCurrentDasha(dashaPeriods);
      const currentDashaText = formatCurrentDashaForPrompt(currentDashaInfo);

      // Calculate 2026 dasha changes (antardasha transitions)
      const dashaChanges2026: string[] = [];
      for (const maha of dashaPeriods) {
        if (!maha.antardasha) continue;
        for (const antar of maha.antardasha) {
          const startDate = new Date(antar.start);
          if (startDate.getFullYear() === 2026) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const startMonth = monthNames[startDate.getMonth()];
            const startDay = startDate.getDate();
            dashaChanges2026.push(`${maha.name}-${antar.name} (${startMonth} ${startDay})`);
          }
        }
      }
      const dashaChanges2026Text = dashaChanges2026.length > 0 ? dashaChanges2026.join(", ") : undefined;

      // Build user prompt (simplified version for debugging)
      const personReference = kundliData.name ? `for ${kundliData.name}` : "for this person";
      const birthYear = new Date(kundliData.birth_date).getFullYear();
      
      const userPrompt = `Create a free astrology forecast ${personReference}. Return ONLY valid JSON.

**Birth Details:**
${kundliData.name ? `Name: ${kundliData.name}` : ""}
Date: ${kundliData.birth_date}
Time: ${kundliData.birth_time}
Location: ${kundliData.birth_place}
Birth Year: ${birthYear}

**Ascendant:** ${ascendantText}
${ascendantLordPositionText ? `**Ascendant Lord:** ${ascendantLord} in ${ascendantLordPositionText}` : ""}

**Key Planets:**
${planetaryPositionsText}

**Moon Nakshatra:** ${kundliData.nakshatra || moonPosition?.sign || "Unknown"}

**Current Dasha Period:**
${currentDashaText}

**Past Dasha Periods:**
${pastDashasText}

**2026 Context:**
${dashaChanges2026Text ? `Antar Dasha Changes: ${dashaChanges2026Text}` : "Use current dasha context"}
${transitsText ? `Major Transits: ${transitsText}` : ""}

[Full prompt structure would continue with output format instructions...]`;

      payload = {
        type: "free",
        kundli_id,
        inputs: {
          name: kundliData.name || undefined,
          birth_date: kundliData.birth_date,
          birth_time: kundliData.birth_time,
          birth_location: kundliData.birth_place,
          ascendant_sign: ascendantSign,
          ascendant_sign_id: ascendantSignId,
          ascendant_degree: ascendantDegree,
          ascendant_lord: ascendantLord,
          moon_sign: moonPosition?.sign,
          moon_nakshatra: kundliData.nakshatra,
        },
        raw_data: {
          planetary_positions: planetaryPositions,
          dasha_periods: dashaPeriods,
          transits_2026: transitsData || [],
        },
        formatted_data: {
          planetary_positions_text: planetaryPositionsText,
          ascendant_text: ascendantText,
          ascendant_lord_position_text: ascendantLordPositionText,
          current_dasha_text: currentDashaText,
          past_dashas_text: pastDashasText,
          dasha_changes_2026_text: dashaChanges2026Text,
          transits_text: transitsText,
        },
        prompts: {
          system_prompt: FREE_SYSTEM_PROMPT,
          user_prompt: userPrompt,
        },
        metadata: {
          prompt_length: userPrompt.length,
          system_prompt_length: FREE_SYSTEM_PROMPT.length,
          generated_at: new Date().toISOString(),
          target_year: targetYear,
        },
      };

    } else {
      // PAID FORECAST PAYLOAD
      const planetaryPositionsText = formatPlanetaryPositionsForPrompt(
        planetaryPositions,
        ascendantSign,
        ascendantSignId,
        {
          includeRulership: true,
          includeDegree: true,
          includeRetrograde: true,
          useWesternSigns: true,
        }
      );

      // Get current dasha with pratyantardasha
      const currentDashaInfo = getCurrentDashaWithPratyantardasha(dashaPeriods);
      const currentDashaText = formatCurrentDashaWithPratyantardashaForPrompt(currentDashaInfo);

      // Get pratyantardashas for target year
      const pratyantardashas = getPratyantardashasForYear(dashaPeriods, targetYear);
      const pratyantardashText = formatPratyantardashasForPrompt(pratyantardashas);

      // Build user prompt (simplified version for debugging)
      const personReference = kundliData.name ? `for ${kundliData.name}` : "for this person";
      
      const userPrompt = `Create a comprehensive paid astrology forecast ${personReference} for ${targetYear}. Return ONLY valid JSON.

**Birth Details:**
${kundliData.name ? `Name: ${kundliData.name}` : ""}
Date: ${kundliData.birth_date}
Time: ${kundliData.birth_time}
Location: ${kundliData.birth_place}

**Full Planetary Positions:**
${planetaryPositionsText}

**Current Dasha Hierarchy:**
${currentDashaText}

**${targetYear} Pratyantardasha Schedule:**
${pratyantardashText}

**Major Transits in ${targetYear}:**
${transitsText}

[Full prompt structure would continue with detailed output format instructions...]`;

      payload = {
        type: "paid",
        kundli_id,
        inputs: {
          name: kundliData.name || undefined,
          birth_date: kundliData.birth_date,
          birth_time: kundliData.birth_time,
          birth_location: kundliData.birth_place,
          ascendant_sign: ascendantSign,
          ascendant_sign_id: ascendantSignId,
          ascendant_degree: ascendantDegree,
          ascendant_lord: ascendantLord,
          moon_sign: moonPosition?.sign,
          moon_nakshatra: kundliData.nakshatra,
        },
        raw_data: {
          planetary_positions: planetaryPositions,
          dasha_periods: dashaPeriods,
          transits_2026: transitsData || [],
        },
        formatted_data: {
          planetary_positions_text: planetaryPositionsText,
          current_dasha_text: currentDashaText,
          pratyantardashas_text: pratyantardashText,
          transits_text: transitsText,
        },
        prompts: {
          system_prompt: PAID_SYSTEM_PROMPT,
          user_prompt: userPrompt,
        },
        metadata: {
          prompt_length: userPrompt.length,
          system_prompt_length: PAID_SYSTEM_PROMPT.length,
          generated_at: new Date().toISOString(),
          target_year: targetYear,
        },
      };
    }

    logStep("Payload generated", {
      type: payload.type,
      prompt_length: payload.metadata.prompt_length,
      planetary_positions_count: payload.raw_data.planetary_positions.length,
      dasha_periods_count: payload.raw_data.dasha_periods.length,
    });

    return new Response(JSON.stringify(payload, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return new Response(JSON.stringify({ error: errMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
