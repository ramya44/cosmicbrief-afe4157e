import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { createLogger } from "../_shared/lib/logger.ts";
import {
  generateComprehensiveLifeArc,
  type ComprehensiveLifeArcResult,
  type PlanetPositionsForLifeArc,
  type TimelineEntry,
} from "../_shared/lib/life-arc-calculations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("GET-LIFE-ARC");

const InputSchema = z.object({
  birth_date: z.string(),
  birth_time: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  kundli_id: z.string().uuid().optional(),
});

// System prompt for comprehensive Life Arc interpretation
const LIFE_ARC_SYSTEM_PROMPT = `You are a Vedic astrology expert creating a comprehensive Life Arc analysis. Your job is to transform raw astrological timeline data into warm, specific, and resonant life guidance.

**YOUR TASK:**
Generate specific interpretations for each life period across 5 dimensions: Career, Love & Marriage, Children, Wealth, and Health.

**LANGUAGE RULES - CRITICAL:**
- Use plain English, avoid jargon
- Be specific about what might happen, not vague
- "You may experience..." not "The native will..."
- Frame challenges as growth opportunities
- Be warm but not fluffy - give real insights

**TONE:**
- Direct and specific like a trusted advisor
- Validate past experiences accurately
- Future guidance should feel actionable
- Include both positives and areas of attention for health

**OUTPUT REQUIREMENTS:**
- For EACH period, provide a 1-2 sentence interpretation for EACH of the 5 dimensions
- If a dimension isn't strongly activated, say something like "Stable period" or "Maintaining"
- For Health, always note both positives and any areas needing attention

Return ONLY valid JSON. No markdown code blocks.`;

// Build prompt from comprehensive Life Arc data
function buildComprehensivePrompt(data: ComprehensiveLifeArcResult): string {
  const { summary, timeline, patterns, chartSignature } = data;

  // Limit timeline sent to Claude (but full timeline is still returned to user)
  // 70 periods should cover ~80 years for most birth charts
  const limitedTimeline = timeline.slice(0, 70);

  // Format timeline for Claude
  const timelineText = limitedTimeline
    .map((entry) => {
      const dims = entry.dimensions;
      return `${entry.yearRange} (Ages ${entry.ageRange}): ${entry.mahaDasha}-${entry.bhukti}
  Career: ${dims.career.score}/100 (${dims.career.nature})
  Love: ${dims.love.score}/100 (${dims.love.nature})
  Children: ${dims.children.score}/100 (${dims.children.nature})
  Wealth: ${dims.wealth.score}/100 (${dims.wealth.nature})
  Health: ${dims.health.score}/100 (${dims.health.nature})
  Context: ${entry.astrologicalReason}${entry.sadeSatiActive ? " [Sade Sati]" : ""}`;
    })
    .join("\n\n");

  // Format yogas
  const yogasText = chartSignature.yogas
    .filter((y) => y.present)
    .map((y) => `${y.name}: ${y.indication}`)
    .join("; ");

  // Format doshas
  const doshasList = [];
  if (chartSignature.doshas.mangalDosha.present) {
    doshasList.push("Mars energy (Mangal) - affects partnerships");
  }
  if (chartSignature.doshas.kaalSarp.present) {
    doshasList.push(`Karmic intensity (${chartSignature.doshas.kaalSarp.type})`);
  }
  if (chartSignature.doshas.guruChandal.present) {
    doshasList.push("Unconventional wisdom path");
  }

  // Format Sade Sati periods
  const sadeSatiText = chartSignature.sadeSatiPeriods
    .map((s) => `Ages ${s.ageStart}-${s.ageEnd}${s.peakStart ? " (peak)" : ""}`)
    .join(", ");

  return `Generate a COMPREHENSIVE Life Arc interpretation. Return ONLY valid JSON.

**CHART SUMMARY:**
- Rising Sign: ${summary.lagnaSign}
- Moon Sign: ${summary.moonSign}
- Birth Year: ${summary.birthYear}
- Current Age: ${summary.currentAge}

**CHART STRENGTHS (Yogas):**
${yogasText || "Balanced chart without prominent yogas"}

**GROWTH PATTERNS (Doshas):**
${doshasList.length > 0 ? doshasList.join("; ") : "No significant challenging patterns"}

**SATURN PERIODS (Sade Sati):**
${sadeSatiText || "None in tracked range"}

**COMPLETE TIMELINE DATA:**
${timelineText}

---

**OUTPUT FORMAT:**

Generate interpretations for EVERY period in the timeline. Each period needs specific, resonant text for all 5 dimensions.

{
  "overview": "2-3 paragraph summary of their overall life arc pattern and current position...",

  "timeline": [
    {
      "yearRange": "1989-1993",
      "ageRange": "0-4",
      "career": "Early foundation years...",
      "love": "Family bonds forming...",
      "children": "—",
      "wealth": "Family stability establishing...",
      "health": "Protected, healthy foundation years"
    },
    // ... continue for ALL periods
  ],

  "patterns": {
    "career": "Building (23-37) → Peak (37-40) → Evolution (40-47) → Renaissance (47-60) → Legacy (60+)",
    "love": "Seeking (23-26) → Finding (26-29) → Building (29-37) → Deepening (37-47) → Flourishing (47-60)",
    "children": "Preparing (26-30) → Welcoming (30-38) → Raising (38-50) → Launching (50-56) → Grandparenting (56+)",
    "wealth": "Independence (23-29) → Growth (29-40) → Plateau (40-47) → Abundance (47-60) → Sufficiency (60+)",
    "health": "Peak vitality (25-33) → Stress challenges (33-36) → Recovery (36-40) → Discipline (40-47) → Graceful aging (60+)"
  },

  "currentPeriod": {
    "headline": "Brief theme (3-5 words)",
    "description": "What they're experiencing now...",
    "guidance": "Actionable advice..."
  }
}`;
}

// Parse planetary positions from kundli data
function extractPlanetPositions(planetaryPositions: any[]): PlanetPositionsForLifeArc | null {
  if (!planetaryPositions || planetaryPositions.length === 0) {
    return null;
  }

  const findPlanet = (name: string) => {
    const planet = planetaryPositions.find((p) => p.name === name);
    return planet ? { sign: planet.sign, fullDegree: planet.full_degree || 0 } : null;
  };

  const sun = findPlanet("Sun");
  const moon = findPlanet("Moon");
  const mars = findPlanet("Mars");
  const mercury = findPlanet("Mercury");
  const jupiter = findPlanet("Jupiter");
  const venus = findPlanet("Venus");
  const saturn = findPlanet("Saturn");
  const rahu = findPlanet("Rahu");
  const ketu = findPlanet("Ketu");

  if (!sun || !moon || !mars || !mercury || !jupiter || !venus || !saturn || !rahu || !ketu) {
    return null;
  }

  return {
    sun: { sign: sun.sign },
    moon: { sign: moon.sign, fullDegree: moon.fullDegree },
    mars: { sign: mars.sign },
    mercury: { sign: mercury.sign },
    jupiter: { sign: jupiter.sign },
    venus: { sign: venus.sign },
    saturn: { sign: saturn.sign },
    rahu: { sign: rahu.sign },
    ketu: { sign: ketu.sign },
  };
}

serve(async (req) => {
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

    const body = await req.json();
    const input = InputSchema.parse(body);
    logStep("Input validated", input);

    // Try to fetch existing kundli data
    let kundliData: any = null;
    let planets: PlanetPositionsForLifeArc | null = null;
    let lagnaSign: string = "";
    let moonSign: string = "";

    if (input.kundli_id) {
      const { data, error } = await supabase
        .from("user_kundli_details")
        .select("*")
        .eq("id", input.kundli_id)
        .single();

      if (!error && data) {
        kundliData = data;
        planets = extractPlanetPositions(data.planetary_positions);
        lagnaSign = data.ascendant_sign || "";
        moonSign = data.moon_sign || "";
      }
    }

    // If no kundli data, search by birth details
    if (!kundliData) {
      const { data, error } = await supabase
        .from("user_kundli_details")
        .select("*")
        .eq("birth_date", input.birth_date)
        .eq("birth_time", input.birth_time)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        kundliData = data;
        planets = extractPlanetPositions(data.planetary_positions);
        lagnaSign = data.ascendant_sign || "";
        moonSign = data.moon_sign || "";
      }
    }

    if (!planets || !lagnaSign || !moonSign) {
      logStep("Missing chart data");
      return new Response(
        JSON.stringify({
          error: "Chart data not found. Please ensure birth chart has been calculated.",
          status: "missing_data",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const birthYear = parseInt(input.birth_date.split("-")[0]);
    logStep("Generating comprehensive Life Arc data", { birthYear, lagnaSign, moonSign });

    // Generate comprehensive Life Arc data
    let lifeArcData: ComprehensiveLifeArcResult;
    try {
      lifeArcData = generateComprehensiveLifeArc(
        planets,
        lagnaSign,
        moonSign,
        input.birth_date,
        birthYear
      );
      logStep("Comprehensive Life Arc data generated", {
        totalPeriods: lifeArcData.timeline?.length || 0,
        pastPeriods: lifeArcData.pastTimeline?.length || 0,
        futurePeriods: lifeArcData.futureTimeline?.length || 0,
        hasPatterns: !!lifeArcData.patterns,
        hasSummary: !!lifeArcData.summary,
      });
    } catch (calcError) {
      logStep("Life Arc calculation failed", { error: String(calcError) });
      throw new Error(`Life Arc calculation failed: ${calcError}`);
    }

    // Build Claude prompt
    let userPrompt: string;
    try {
      userPrompt = buildComprehensivePrompt(lifeArcData);
      logStep("Prompt built successfully", { promptLength: userPrompt.length });
    } catch (promptError) {
      logStep("Prompt building failed", { error: String(promptError) });
      throw new Error(`Prompt building failed: ${promptError}`);
    }

    logStep("Calling Claude for comprehensive interpretation", { promptLength: userPrompt.length });

    // Call Claude API with extended timeout for comprehensive analysis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

    let claudeResponse: Response;
    try {
      claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000, // Increased for comprehensive output
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          system: LIFE_ARC_SYSTEM_PROMPT,
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        logStep("Claude API timeout");
        throw new Error("AI interpretation timed out. Please try again.");
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      const isRateLimited = claudeResponse.status === 429;

      logStep("Claude API error", {
        status: claudeResponse.status,
        error: errorText,
        isRateLimited,
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
          }
        );
      }

      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const interpretationText = claudeData.content?.[0]?.text || "";

    logStep("Comprehensive interpretation generated", {
      length: interpretationText.length,
      model: claudeData.model,
    });

    // Parse the interpretation JSON
    logStep("Step 1: Parsing interpretation JSON");
    let interpretation: any = {};
    try {
      let cleanedText = interpretationText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      interpretation = JSON.parse(cleanedText.trim());
      logStep("Step 1 complete: JSON parsed successfully", {
        hasOverview: !!interpretation.overview,
        timelineLength: interpretation.timeline?.length || 0,
        hasPatterns: !!interpretation.patterns,
      });
    } catch (parseError) {
      logStep("Step 1 warning: Failed to parse interpretation JSON, using fallback", {
        error: String(parseError),
      });
      interpretation = { overview: interpretationText, timeline: [], patterns: null };
    }

    // Merge raw data with interpretations
    logStep("Step 2: Merging timeline with interpretations", {
      rawTimelineLength: lifeArcData.timeline?.length || 0,
    });
    let mergedTimeline: any[] = [];
    try {
      mergedTimeline = (lifeArcData.timeline || []).map((entry, index) => {
        const interp = interpretation.timeline?.[index] || {};
        return {
          ...entry,
          interpretations: {
            career: interp.career || null,
            love: interp.love || null,
            children: interp.children || null,
            wealth: interp.wealth || null,
            health: interp.health || null,
          },
        };
      });
      logStep("Step 2 complete: Timeline merged", { mergedLength: mergedTimeline.length });
    } catch (mergeError) {
      logStep("Step 2 error: Failed to merge timeline", { error: String(mergeError) });
      throw new Error(`Timeline merge failed: ${mergeError}`);
    }

    // Convert patterns array to object format if needed
    logStep("Step 3: Converting patterns to object format");
    let patternsObj: Record<string, string> = {};
    try {
      // Use Claude's patterns if available and it's an object
      if (interpretation.patterns && typeof interpretation.patterns === "object" && !Array.isArray(interpretation.patterns)) {
        patternsObj = interpretation.patterns;
      } else if (Array.isArray(lifeArcData.patterns)) {
        // Convert our calculated patterns array to object format
        for (const p of lifeArcData.patterns) {
          if (p && p.dimension && Array.isArray(p.phases)) {
            const key = p.dimension.toLowerCase().replace(/ & /g, "").replace(/ /g, "");
            patternsObj[key] = p.phases.map((ph: any) => `${ph?.label || "Phase"} (${ph?.ageRange || "?"})`).join(" → ");
          }
        }
      }
      logStep("Step 3 complete: Patterns converted", { patternKeys: Object.keys(patternsObj) });
    } catch (patternError) {
      logStep("Step 3 error: Failed to convert patterns", { error: String(patternError) });
      patternsObj = {};
    }

    // Build final result
    logStep("Step 4: Building final result object");
    let result: any;
    try {
      const currentAge = lifeArcData.summary?.currentAge || 0;
      result = {
        status: "success",
        data: {
          summary: {
            lagnaSign: lifeArcData.summary?.lagnaSign || "",
            moonSign: lifeArcData.summary?.moonSign || "",
            birthYear: lifeArcData.summary?.birthYear || 0,
            currentAge: currentAge,
            overview: interpretation.overview || "",
          },
          chartSignature: lifeArcData.chartSignature || {},
          timeline: mergedTimeline,
          pastTimeline: mergedTimeline.filter((e) => e.ageEnd <= currentAge),
          futureTimeline: mergedTimeline.filter((e) => e.ageStart > currentAge),
          patterns: patternsObj,
          currentPeriod: interpretation.currentPeriod || null,
        },
        birth_details: {
          birth_date: input.birth_date,
          birth_time: input.birth_time,
          latitude: input.latitude,
          longitude: input.longitude,
        },
        model: claudeData.model,
      };
      logStep("Step 4 complete: Result object built", {
        timelineLength: result.data.timeline.length,
        pastLength: result.data.pastTimeline.length,
        futureLength: result.data.futureTimeline.length,
      });
    } catch (buildError) {
      logStep("Step 4 error: Failed to build result", { error: String(buildError) });
      throw new Error(`Result build failed: ${buildError}`);
    }

    // Save to database
    logStep("Step 5: Saving to database");
    if (kundliData?.id) {
      try {
        await supabase
          .from("user_kundli_details")
          .update({
            life_arc_data: result.data,
            life_arc_generated_at: new Date().toISOString(),
          })
          .eq("id", kundliData.id);
        logStep("Step 5 complete: Life Arc saved to database");
      } catch (saveError) {
        logStep("Step 5 warning: Failed to save Life Arc to database", { error: String(saveError) });
        // Don't throw - saving is optional
      }
    } else {
      logStep("Step 5 skipped: No kundli_id to save to");
    }

    // Serialize response
    logStep("Step 6: Serializing response");
    let responseBody: string;
    try {
      responseBody = JSON.stringify(result);
      logStep("Step 6 complete: Response serialized", { responseLength: responseBody.length });
    } catch (serializeError) {
      logStep("Step 6 error: Failed to serialize response", { error: String(serializeError) });
      throw new Error(`Response serialization failed: ${serializeError}`);
    }

    logStep("Returning comprehensive Life Arc response");
    return new Response(responseBody, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    const errStack = error instanceof Error ? error.stack : "";
    logStep("Error", { message: errMessage, stack: errStack });
    return new Response(
      JSON.stringify({ error: errMessage, details: errStack?.slice(0, 500) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
