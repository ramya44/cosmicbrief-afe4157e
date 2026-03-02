import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/lib/http.ts";
import type { PlanetaryPosition } from "../generate-free-vedic-forecast/lib/types.ts";
import {
  getCurrentMahaDasha,
  getCurrentAntarDasha,
  getMoonNakshatra,
  formatDate,
  calculateMahaDashas,
  calculateAntarDashas,
} from "../generate-free-vedic-forecast/lib/dasha-calculator.ts";
import type { DashaPeriod, AntarDashaPeriod } from "../generate-free-vedic-forecast/lib/dasha-calculator.ts";
import {
  getPast3Mahadashas,
  getCurrentDasha,
  formatPastDashasForPrompt,
  type DashaJson,
} from "../_shared/lib/dasha-helpers.ts";
import {
  formatPlanetaryPositionsForPrompt,
  getSignLord,
  calculateHouseFromAscendant,
  getOrdinal,
} from "../_shared/lib/planetary-positions.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { trackLead } from "../_shared/lib/meta-capi.ts";

const logStep = createLogger("GENERATE-COSMIC-BRIEF");

// Input validation schema
const CosmicBriefRequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
  event_id: z.string().optional(),
});

const SYSTEM_PROMPT = `You are an expert Vedic astrologer who writes deeply personalized cosmic briefs in clear, modern language.

Your writing feels:
- Psychologically precise, not archetypal
- Warm but direct, like a trusted mentor who sees patterns clearly
- Grounded and growth-oriented, never mystical or fatalistic
- Specific enough that the reader feels recognized, not categorized

This is not generic astrology. It must feel personally accurate.

---

## CORE RULE: THIS IS A TIMELESS COSMIC BRIEF

- NO year references
- NO "this year," "next year," or specific dates
- NO transit predictions
- Focus ONLY on:
  - Birth chart placements
  - Current life chapter (planetary period)
  - Long-term psychological patterns
- The analysis must be valid now and for years to come

---

## LANGUAGE RULES

Use modern, accessible language.

- Say "rising sign," not "ascendant"
- Say "life chapter" or "planetary period," not "dasha"
- Avoid technical terms in main text
- Technical mechanics go ONLY in astrology_note sections
- Say "Saturn brings lessons," not "malefic influence"
- Describe lived experience, not abstract symbolism

BANNED VOCABULARY (too abstract, sounds like "astrology" not "me"):
- emotional territories, transcendent, collective endeavors, spiritual depletion
- harmony, balance, depth, mystical, harmonious, old soul
- empathetic, intuitive, spiritual, creative, humanitarian, caring

Replace these with concrete behaviors and observable patterns.

---

## PERSONALIZATION REQUIREMENTS (MANDATORY)

### 1. Describe COST, Not Just Identity

Don't just describe who they are. Describe what it costs them.

BAD: "You want harmony and connection, but you also need space."
GOOD: "You stay longer than you should in dynamics that are misaligned because you can see everyone's side."

BAD: "You have a need for independence."
GOOD: "You disappear emotionally without warning when you feel overwhelmed, and people interpret it as detachment."

For every trait, ask: What has this broken? What pattern keeps repeating because of it?

---

### 2. No Hedging

Do NOT use: "likely," "may," "might," "tend to," "often," "can be," "sometimes."

Write with calm confidence. Be direct.

---

### 3. Micro-Scenes Must Be Sharp and Embodied

Don't write safe micro-scenes. Put the reader inside the moment.

BAD: "You've probably had partners say they never quite know which version of you they're getting."

GOOD: "You've watched someone's face shift in confusion because you were warm and open last week and suddenly distant this week — and you didn't know how to explain the shift yourself."

The reader should feel it in their body, not just understand it conceptually.

---

### 4. Life Chapter Sections Must Feel Lived

Don't summarize the chapter theoretically. Show what it looked like in real life.

BAD: "You've been mastering systems and developing competence."

GOOD: "You've become the person people rely on when things need to run correctly. You catch errors before anyone else notices. You carry more operational weight than your title reflects."

Include: What decisions did they make? What exhaustion did they feel? What competence did they overbuild?

---

### 5. Be Slightly Confrontational

You want the user to feel seen? Risk saying something intimate.

Examples:
- "You pride yourself on being composed, but privately you feel misunderstood more often than you admit."
- "You don't like being emotionally dependent on anyone, even when you crave closeness."
- "You've convinced yourself you're fine alone, but part of you tracks whether people notice your absence."

This isn't mean. It's intimate. Don't be polite at the expense of accuracy.

---

### 6. Name the Internal Contradiction

Explicitly describe the tension between rising sign, Sun, and Moon.

Show:
- What each part wants
- How they conflict
- Where the person feels pulled in two directions

Avoid purely positive framing. The tension should feel real.

---

### 7. Anchor in Life Domains

Each major section must reference at least two real-life domains:
- Romantic relationships
- Career/work
- Family dynamics
- Decision-making style
- Conflict style

No floating personality summaries.

---

### 8. Specificity Standard

If the description could apply to more than 30% of people with that sign combination, it is not specific enough.

Avoid textbook interpretations. Interpret placements through house placement, planetary dignity, and chart context before describing personality.

---

## WRITING STRUCTURE

1. Lead with WHAT the person experiences (human reality).
2. Follow with WHY (astrological explanation) in separate astrology_note sections.
3. Main content reads like precise psychological insight, not horoscope language.
4. Every sentence must add insight. No filler.

---

## TONE CALIBRATION

You are:
- Warm but direct
- Intimate, not polite
- Empowering but honest
- Specific, never vague
- Confident, never mystical

The reader should feel:
"This understands how I actually operate — including the parts I don't advertise."

CRITICAL: Return ONLY valid JSON. No markdown, no preamble, no commentary.`;

interface CosmicBriefPromptInputs {
  name?: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  ascendant_sign: string;
  ascendant_degree?: number;
  planetary_positions_text: string;
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

export function buildUserPrompt(inputs: CosmicBriefPromptInputs): string {
  const personReference = inputs.name ? `for ${inputs.name}` : "for this person";

  return `Create a timeless Vedic cosmic brief ${personReference}. Return ONLY valid JSON.

THE GOAL OF THIS BRIEF:

This is a free-tier reading. It should feel deeply personal and insightful—but leave them at a threshold.

Reveal their current situation clearly. Build tension around what's emerging. Don't resolve it.

The reader should finish thinking "I need to know more."

SECTIONS TO WRITE:

1. WHO YOU ARE: Your Natural Design
- 1-2 paragraphs on core personality: rising sign, sun, moon
- Natural strengths, how they see the world, what drives them
- One astrology_note with technical chart summary

2. YOUR CURRENT LIFE CHAPTER
- 1-2 paragraphs on what this planetary period is asking of them RIGHT NOW
- What themes are active, what tension exists, what's being tested
- Make it feel alive and present, not abstract
- One astrology_note with technical dasha explanation

3. WHAT'S EMERGING (the hook)
- 2 paragraphs maximum
- Describe what's building under the surface—energetically, directionally
- Be specific enough to feel true, vague enough to leave them wanting resolution
- End with an open question or unresolved tension, NOT a conclusion
- No timing specifics, but grounded in "right now" and "what's next"

4. YOUR GROWTH EDGE
- 1-2 paragraphs on the core development theme
- Based on Rahu/Ketu axis and challenging placements
- Give one practical insight—but hint that there's deeper guidance available

5. WANT MORE DEPTH? (Upsell)
- Write a personalized 1-sentence hook referencing something specific from their chart
- Then transition to the benefits list

---

**Birth Details:**
${inputs.name ? `Name: ${inputs.name}` : ""}
Date: ${inputs.birth_date}
Time: ${inputs.birth_time}
Location: ${inputs.birth_location}

**Rising Sign:** ${inputs.ascendant_sign}${inputs.ascendant_degree ? ` at ${inputs.ascendant_degree.toFixed(1)}°` : ""}${
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

**Past Life Chapters:**
${inputs.past_dashas}

---

OUTPUT FORMAT:

{
  "title": "Your Cosmic Brief",
  "subtitle": "Born ${inputs.birth_date} • ${inputs.birth_location}",
  "sections": [
    {
      "heading": "Who You Are: Your Natural Design",
      "content": [
        { "type": "paragraph", "text": "..." },
        { "type": "paragraph", "text": "..." },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
      ]
    },
    {
      "heading": "Your Current Life Chapter",
      "content": [
        { "type": "paragraph", "text": "..." },
        { "type": "paragraph", "text": "..." },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
      ]
    },
    {
      "heading": "What's Emerging",
      "content": [
        { "type": "paragraph", "text": "..." },
        { "type": "paragraph", "text": "..." }
      ]
    },
    {
      "heading": "Your Growth Edge",
      "content": [
        { "type": "paragraph", "text": "..." },
        { "type": "paragraph", "text": "..." }
      ]
    },
    {
      "heading": "Want More Depth?",
      "content": [
        { "type": "paragraph", "text": "[Personalized hook from their chart]" },
        {
          "type": "benefits_list",
          "items": [
            "Detailed breakdown of each planetary placement and house",
            "Relationship patterns and compatibility insights",
            "Career and life purpose guidance",
            "Upcoming life chapter transitions with timing",
            "Personalized practices for your growth edge"
          ]
        },
        { "type": "cta", "text": "Unlock Your Expanded Cosmic Brief", "subtext": "Deep dive into your complete birth chart—$29" }
      ]
    }
  ]
}`;
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

    const validationResult = CosmicBriefRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id, event_id } = validationResult.data;
    logStep("Request validated", { kundli_id, event_id });

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

    // Build prompt inputs (no 2026 context needed for cosmic brief)
    const promptInputs: CosmicBriefPromptInputs = {
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

    logStep("Cosmic brief generated", {
      length: forecastText.length,
      model: claudeData.model,
      usage: claudeData.usage,
    });

    // Save the cosmic brief to database using free_vedic_forecast column
    const { error: updateError } = await supabase
      .from("user_kundli_details")
      .update({
        free_vedic_forecast: forecastText,
        forecast_model: claudeData.model,
        forecast_generated_at: new Date().toISOString(),
        dasha_periods: formattedDashaPeriods,
      })
      .eq("id", kundli_id);

    if (updateError) {
      logStep("Failed to save forecast", { error: updateError.message });
      // Still return the forecast even if saving failed
    } else {
      logStep("Forecast saved to database");
    }

    // Track Lead event via Meta Conversions API (fire-and-forget)
    const customerEmail = kundliData.email;
    trackLead({
      email: customerEmail,
      name: kundliData.name,
      clientIp: req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("cf-connecting-ip") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      eventId: event_id,
    }).catch((err) => {
      logStep("Meta CAPI tracking failed", { error: err instanceof Error ? err.message : "Unknown" });
    });

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
