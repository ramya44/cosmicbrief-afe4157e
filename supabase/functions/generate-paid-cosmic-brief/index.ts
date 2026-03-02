import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { buildPaidCosmicBriefEmailHtml } from "../_shared/lib/email-templates.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { trackPurchase } from "../_shared/lib/meta-capi.ts";

// Declare EdgeRuntime for background processing
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("GENERATE-PAID-COSMIC-BRIEF");

const PAID_COSMIC_BRIEF_SYSTEM_PROMPT = `You are an expert Vedic astrologer who writes deeply personalized cosmic briefs. Your writing feels like a therapist and strategist combined—psychologically precise, behaviorally specific, and occasionally confrontational.

This is PAID content. It must feel unforgettable, not just insightful.

---

## CORE RULE: THIS IS A TIMELESS COSMIC BRIEF

- NO year references except in the Current Life Chapter section (where date ranges are allowed)
- NO transit predictions
- Focus on birth chart placements, current planetary period, and long-term patterns
- Valid now and for years to come

---

## LANGUAGE RULES

- Say "rising sign," not "ascendant"
- Say "life chapter" or "planetary period," not "dasha"
- Technical terms go ONLY in astrology_note sections
- Describe lived experience, not abstract symbolism

BANNED VOCABULARY (sounds like "astrology" not "me"):
- emotional territories, transcendent, collective endeavors, spiritual depletion
- harmony, balance, depth, mystical, harmonious, old soul
- empathetic, intuitive, spiritual, creative, humanitarian, caring

---

## THE PAID TIER DIFFERENCE

### 1. Don't Describe From Outside—Drop Them Into It

BAD (describes from outside):
"You operate through systems, precision, and quiet competence."

GOOD (drops them inside the moment):
"When someone asks what you actually need, your mind goes blank. You pivot to logistics, or you offer a solution, and the moment passes."

Paid tier must create at least 2-3 moments in the first section where the reader freezes in recognition.

---

### 2. No Repeating The Same Insight

Don't describe the same pattern 3 times in different language. That feels AI-written.

Instead:
- Name the core pattern ONCE
- Then show it in different contexts:
  - One example from dating/early relationships
  - One example from long-term partnership or family
  - One example from conflict or rupture

---

### 3. Career Section: No Industry Lists

BAD: "Healthcare, technology, research, consulting..."

The moment you list career buckets, it sounds like astrology.

GOOD: Describe decision environments, meeting behavior, what they over-function in, what they under-claim.

Example: "You're rarely the loudest voice in a room, but you're the one whose comment shifts the strategy."

---

### 4. Life Chapter: Curated, Not Exhaustive

DO NOT list all planetary periods from birth to age 120. That shifts the product from "personal insight" to "dasha calculator output."

Instead:
- Current Chapter: Deep dive (what it's forced, what's exhausting, what skill it's building)
- Next Major Shift: One chapter ahead with brief preview
- Lifetime Arc: One paragraph about how their energy evolves across life (conceptual, no dates)

---

### 5. Growth Edge: Therapist + Strategist, Not Spiritual Advice

BAD: "You're moving from a pattern of needing personal recognition toward collective service."

That's abstract and moralizing.

GOOD: Show the behavior → what they keep doing → what it's costing → the shift.

Example: "You've built your identity around being the capable one. The cost is that you don't know how to receive help without feeling diminished. The growth is learning that needing people doesn't make you weak—it makes you human."

---

### 6. Emotional Temperature Must Spike

The document should NOT sit at one tone (insightful, measured, composed).

Paid tier needs:
- 2 moments that feel slightly confrontational
- 1 moment that feels deeply validating
- 1 moment that reframes a past wound

Without emotional spikes, it feels high-quality but not unforgettable.

---

### 7. Specificity Standard

If the description could apply to more than 30% of people with that sign combination, it is not specific enough.

Interpret placements through house placement, planetary dignity, and chart context before describing personality.

---

## WRITING STRUCTURE

1. Lead with WHAT the person experiences (human reality)
2. Follow with WHY (astrological explanation) in separate astrology_note sections
3. Each paragraph: 90-130 words—substantial but focused
4. Every sentence must add insight. No filler.

---

## TONE CALIBRATION

You are:
- Intimate, not polite
- Occasionally confrontational
- Validating where it matters
- A therapist who sees patterns + a strategist who sees leverage

The reader should feel:
"This understands how I actually operate—including the parts I don't advertise."

CRITICAL: Return ONLY valid JSON. No markdown, no preamble, no commentary.`;

interface PlanetaryPosition {
  name: string;
  sign: string;
  sign_id: number;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
}

interface MahaDashaInfo {
  name: string;
  start: string;
  end: string;
  duration_years?: number;
  themes?: string;
}

function calculateHouseFromAscendant(planetSignId: number, ascendantSignId: number): number {
  let house = planetSignId - ascendantSignId + 1;
  if (house <= 0) house += 12;
  return house;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
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

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  return `${startYear} - ${endYear}`;
}

function getAllMahaDashasWithDetails(dashas: any[]): MahaDashaInfo[] {
  if (!dashas || !Array.isArray(dashas)) return [];

  return dashas.map((maha) => {
    const startDate = new Date(maha.start);
    const endDate = new Date(maha.end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationYears = Math.round(durationMs / (365.25 * 24 * 60 * 60 * 1000));

    return {
      name: maha.name,
      start: maha.start,
      end: maha.end,
      duration_years: durationYears,
    };
  });
}

function getCurrentDashaFromList(dashas: any[], currentDate: Date = new Date()) {
  const currentMahadasha = dashas.find((d) => {
    const start = new Date(d.start);
    const end = new Date(d.end);
    return currentDate >= start && currentDate <= end;
  });
  if (!currentMahadasha) return null;

  const currentAntardasha = currentMahadasha.antardasha?.find((ad: any) => {
    const start = new Date(ad.start);
    const end = new Date(ad.end);
    return currentDate >= start && currentDate <= end;
  });

  return {
    mahadasha: currentMahadasha,
    antardasha: currentAntardasha,
  };
}

function getNextMahadasha(dashas: any[], currentDate: Date = new Date()): MahaDashaInfo | null {
  if (!dashas || !Array.isArray(dashas)) return null;

  // Sort dashas by start date
  const sortedDashas = [...dashas].sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // Find the first dasha that starts after current date
  const nextDasha = sortedDashas.find((d) => {
    const start = new Date(d.start);
    return start > currentDate;
  });

  if (!nextDasha) return null;

  const startDate = new Date(nextDasha.start);
  const endDate = new Date(nextDasha.end);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationYears = Math.round(durationMs / (365.25 * 24 * 60 * 60 * 1000));

  return {
    name: nextDasha.name,
    start: nextDasha.start,
    end: nextDasha.end,
    duration_years: durationYears,
  };
}

function buildPaidCosmicBriefUserPrompt(inputs: {
  name?: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  planetary_positions: string;
  current_dasha: string;
  next_dasha: string;
  rahu_ketu_axis: string;
}): string {
  const personReference = inputs.name ? `for ${inputs.name}` : "for this person";
  return `Create a comprehensive, timeless Vedic cosmic brief ${personReference}. Return ONLY valid JSON.

THIS IS PAID CONTENT. It must feel unforgettable, not just insightful.

WRITING APPROACH:
- Main paragraphs: 90-130 words, plain language, lead with the human experience
- Drop the reader INTO moments, don't describe from outside
- Create 2-3 moments where they freeze in recognition
- Include 2 confrontational insights, 1 deeply validating moment, 1 reframe of a past wound
- astrology_note sections: technical explanation for those who want mechanics

---

## SECTIONS TO WRITE:

### 1. WHO YOU ARE: The Complete Picture (4 paragraphs + astrology_note)

Paragraph 1: Core identity - the interplay of rising sign, sun, and moon. What each wants, how they conflict, where the person feels pulled.

Paragraph 2: The internal contradiction - name it directly. Include a sharp micro-scene that puts the reader inside a specific moment. Example: "When someone asks what you actually need, your mind goes blank. You pivot to logistics, and the moment passes."

Paragraph 3: The cost - what has this pattern broken? What keeps repeating? Be slightly confrontational here.

Paragraph 4: The hidden strength - what they've built because of this tension. Include one deeply validating insight.

---

### 2. RELATIONSHIP PATTERN DEEP DIVE (3 paragraphs + astrology_note)

DO NOT repeat the same insight in different words. That feels AI-written.

Paragraph 1: The core loop - how they show up in relationships, what they draw out in others. Name the pattern ONCE.

Paragraph 2: Show this pattern in THREE contexts:
- One example from dating/early relationships
- One example from long-term partnership or family
- One example from conflict or rupture

Paragraph 3: The intimacy avoidance pattern AND how to interrupt it. Be specific, not abstract.

---

### 3. CAREER & POWER PATTERN (2 paragraphs + astrology_note)

DO NOT list career industries (healthcare, technology, consulting, etc.). That sounds like generic astrology.

Paragraph 1: How they use competence. What decision environments they thrive in. How they behave in meetings. What they over-function in.

Paragraph 2: What they under-claim. Their real leverage. The role they're built for (not industries—decision contexts and influence patterns).

Example of good specificity: "You're rarely the loudest voice in a room, but you're the one whose comment shifts the strategy."

---

### 4. YOUR CURRENT CHAPTER (2 paragraphs + astrology_note)

Focus on the 2 most important life areas this person is navigating RIGHT NOW based on their planetary period and chart. Choose from: relationships, love, career, health, family, spirituality, creativity, finances, identity, etc.

Paragraph 1: THE FIRST MAJOR THEME
- What life area is being activated most intensely right now
- What this phase has forced them to confront
- What's exhausting about it, what skill it's building
- Be specific to their chart—drop them into a recognizable moment

Paragraph 2: THE SECOND MAJOR THEME
- What other life area is under pressure or transformation
- How this intersects with the first theme
- What decisions or changes they've already made or are being pushed toward

---

### 5. WHAT'S AHEAD (3 paragraphs + astrology_note)

DO NOT list all planetary periods. Keep it focused and meaningful.

Paragraph 1: NEXT CHAPTER - FIRST SHIFT
- Name the next planetary period and when it begins
- What house themes become activated
- What will start to matter more, what will matter less

Paragraph 2: NEXT CHAPTER - SECOND SHIFT
- Another key house or life area that shifts in the next chapter
- How their priorities or relationships will evolve
- What they should start preparing for

Paragraph 3: LIFETIME ARC
- One paragraph about how their energy evolves across life (conceptual, no exhaustive dates)
- The through-line of their journey—what they're building toward
- Example: "Later in life, your work becomes more collective and outward-facing..."

---

### 6. YOUR GROWTH EDGE (2 paragraphs + key_actions + astrology_note)

Write like a therapist + strategist, NOT spiritual advice.

BAD: "You're moving from needing personal recognition toward collective service."
GOOD: Show behavior → what they keep doing → what it's costing → the shift.

Paragraph 1: The pattern they're stuck in. What they keep doing. What it costs. Be direct.

Paragraph 2: The shift that's being asked of them. Frame it as strategic, not spiritual. What specifically changes if they make this shift?

key_actions: 4 specific, actionable recommendations. Not generic wisdom—concrete behavioral shifts.

---

**Birth Details:**
${inputs.name ? `Name: ${inputs.name}` : ""}
Date: ${inputs.birth_date}
Time: ${inputs.birth_time}
Location: ${inputs.birth_location}

**Full Planetary Placements:**
${inputs.planetary_positions}

**Current Life Chapter:**
${inputs.current_dasha}

**Next Life Chapter:**
${inputs.next_dasha}

**Growth Edge (Rahu-Ketu Axis):**
${inputs.rahu_ketu_axis}

---

OUTPUT FORMAT:
{
  "title": "Your Expanded Cosmic Brief",
  "subtitle": "Born ${inputs.birth_date} • ${inputs.birth_location}",
  "sections": [
    {
      "heading": "Who You Are: The Complete Picture",
      "content": [
        { "type": "paragraph", "text": "Core identity paragraph..." },
        { "type": "paragraph", "text": "Internal contradiction + micro-scene..." },
        { "type": "paragraph", "text": "The cost - slightly confrontational..." },
        { "type": "paragraph", "text": "Hidden strength - validating..." },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
      ]
    },
    {
      "heading": "Relationship Patterns",
      "content": [
        { "type": "paragraph", "text": "Core loop..." },
        { "type": "paragraph", "text": "Three contexts: dating, long-term, conflict..." },
        { "type": "paragraph", "text": "Intimacy avoidance + how to interrupt..." },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
      ]
    },
    {
      "heading": "Career & Power",
      "content": [
        { "type": "paragraph", "text": "How they use competence, decision environments, over-functioning..." },
        { "type": "paragraph", "text": "What they under-claim, real leverage, built-for role..." },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
      ]
    },
    {
      "heading": "Your Current Chapter",
      "content": [
        { "type": "paragraph", "text": "First major theme - most important life area right now..." },
        { "type": "paragraph", "text": "Second major theme - another area under transformation..." },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
      ]
    },
    {
      "heading": "What's Ahead",
      "content": [
        { "type": "paragraph", "text": "Next chapter first shift - when it begins, what house themes activate..." },
        { "type": "paragraph", "text": "Next chapter second shift - another key area that shifts..." },
        { "type": "paragraph", "text": "Lifetime arc - conceptual, how energy evolves across life..." },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
      ]
    },
    {
      "heading": "Your Growth Edge",
      "content": [
        { "type": "paragraph", "text": "Pattern they're stuck in, what it costs..." },
        { "type": "paragraph", "text": "The shift being asked, strategic framing..." },
        {
          "type": "key_actions",
          "items": [
            "Specific action 1...",
            "Specific action 2...",
            "Specific action 3...",
            "Specific action 4..."
          ]
        },
        { "type": "astrology_note", "label": "The Astrology:", "text": "..." }
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration missing");
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { session_id, kundli_id } = await req.json();
    logStep("Request body parsed", { session_id, kundli_id });

    if (!session_id || !kundli_id) {
      return new Response(JSON.stringify({ error: "session_id and kundli_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify Stripe payment
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { status: session.payment_status, amount: session.amount_total });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if forecast already generated for this session
    const { data: existingForecast } = await supabase
      .from("user_kundli_details")
      .select("paid_vedic_forecast, stripe_session_id, paid_forecast_status")
      .eq("id", kundli_id)
      .single();

    // If forecast already exists and complete, return it
    if (existingForecast?.stripe_session_id === session_id && existingForecast?.paid_vedic_forecast) {
      logStep("Returning existing forecast");
      return new Response(
        JSON.stringify({
          forecast: existingForecast.paid_vedic_forecast,
          cached: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // If generation is already in progress for this session, return processing status
    if (existingForecast?.stripe_session_id === session_id && existingForecast?.paid_forecast_status === "generating") {
      logStep("Generation already in progress");
      return new Response(
        JSON.stringify({
          status: "processing",
          message: "Your expanded cosmic brief is being generated",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 202,
        },
      );
    }

    // Mark payment as verified and generation as started
    const { error: markStartedError } = await supabase
      .from("user_kundli_details")
      .update({
        stripe_session_id: session_id,
        paid_at: new Date().toISOString(),
        paid_amount: session.amount_total,
        paid_forecast_status: "generating",
      })
      .eq("id", kundli_id);

    if (markStartedError) {
      logStep("Failed to mark generation started", { error: markStartedError.message });
    } else {
      logStep("Payment verified and generation marked as started");
    }

    // Capture request headers before returning
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("cf-connecting-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Start background generation
    const backgroundGeneration = (async () => {
      try {
        logStep("Background generation started");

        // Fetch kundli details
        const { data: kundliData, error: kundliError } = await supabase
          .from("user_kundli_details")
          .select("*")
          .eq("id", kundli_id)
          .single();

        if (kundliError || !kundliData) {
          throw new Error("Kundli not found");
        }

        logStep("Kundli data fetched", { birth_date: kundliData.birth_date });

        const planetaryPositions: PlanetaryPosition[] = kundliData.planetary_positions || [];
        const dashaPeriods = kundliData.dasha_periods || [];

        // Find ascendant
        const ascendantPosition = planetaryPositions.find((p) => p.name === "Ascendant");
        const ascendantSignId = ascendantPosition?.sign_id || 1;

        // Format planetary positions for prompt
        const keyPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];
        const planetaryPositionsText = planetaryPositions
          .filter((p) => keyPlanets.includes(p.name))
          .map((p) => {
            const house = calculateHouseFromAscendant(p.sign_id, ascendantSignId);
            const lord = getSignLord(p.sign);
            return `- ${p.name} in ${p.sign} (${getOrdinal(house)} house, ruled by ${lord})${p.is_retrograde ? " [Retrograde]" : ""} at ${p.degree.toFixed(1)}°`;
          })
          .join("\n");

        // Get current dasha hierarchy
        const currentDasha = getCurrentDashaFromList(dashaPeriods);
        const currentDashaText = currentDasha
          ? `- Main life chapter: ${currentDasha.mahadasha.name} (${formatDateRange(currentDasha.mahadasha.start, currentDasha.mahadasha.end)})
- Current sub-chapter: ${currentDasha.antardasha?.name || "Unknown"} (${currentDasha.antardasha ? formatDateRange(currentDasha.antardasha.start, currentDasha.antardasha.end) : "?"})`
          : "Unknown";

        // Get next mahadasha (one chapter ahead only)
        const nextMahadasha = getNextMahadasha(dashaPeriods);
        const nextDashaText = nextMahadasha
          ? `- Next chapter: ${nextMahadasha.name} (${formatDateRange(nextMahadasha.start, nextMahadasha.end)}, ${nextMahadasha.duration_years} years)`
          : "No next chapter data available";

        // Get Rahu-Ketu axis
        const rahuPosition = planetaryPositions.find((p) => p.name === "Rahu");
        const ketuPosition = planetaryPositions.find((p) => p.name === "Ketu");
        let rahuKetuText = "Not available";
        if (rahuPosition && ketuPosition) {
          const rahuHouse = calculateHouseFromAscendant(rahuPosition.sign_id, ascendantSignId);
          const ketuHouse = calculateHouseFromAscendant(ketuPosition.sign_id, ascendantSignId);
          rahuKetuText = `Rahu (North Node) in ${rahuPosition.sign} (${getOrdinal(rahuHouse)} house) - Growth direction
Ketu (South Node) in ${ketuPosition.sign} (${getOrdinal(ketuHouse)} house) - Comfort zone/past patterns`;
        }

        logStep("Building paid cosmic brief prompt");

        const userPrompt = buildPaidCosmicBriefUserPrompt({
          name: kundliData.name || undefined,
          birth_date: kundliData.birth_date,
          birth_time: kundliData.birth_time,
          birth_location: kundliData.birth_place,
          planetary_positions: planetaryPositionsText,
          current_dasha: currentDashaText,
          next_dasha: nextDashaText,
          rahu_ketu_axis: rahuKetuText,
        });

        logStep("Calling Claude Sonnet 4.5", { prompt_length: userPrompt.length });

        // Call Claude API with higher token limit for comprehensive brief
        const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            messages: [{ role: "user", content: userPrompt }],
            system: PAID_COSMIC_BRIEF_SYSTEM_PROMPT,
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

          // Log to alerts table
          await supabase.from("vedic_generation_alerts").insert({
            kundli_id,
            error_message: isRateLimited
              ? "Anthropic rate limit hit (429)"
              : `Claude API error: ${claudeResponse.status} - ${errorText}`,
            error_type: isRateLimited ? "rate_limit" : "paid_cosmic_brief_generation",
          });

          throw new Error(`Claude API error: ${claudeResponse.status}`);
        }

        const claudeData = await claudeResponse.json();
        const forecastText = claudeData.content?.[0]?.text || "";

        logStep("Paid cosmic brief generated", {
          length: forecastText.length,
          model: claudeData.model,
          usage: claudeData.usage,
        });

        // Generate shareable link for paid cosmic brief
        const shareableLink = `https://www.cosmicbrief.com/vedic/results?id=${kundli_id}&type=cosmic-brief&paid=true`;

        // Save the paid forecast with status = complete
        const { error: updateError } = await supabase
          .from("user_kundli_details")
          .update({
            paid_vedic_forecast: forecastText,
            stripe_session_id: session_id,
            paid_amount: session.amount_total,
            paid_at: new Date().toISOString(),
            shareable_link: shareableLink,
            paid_prompt_tokens: claudeData.usage?.input_tokens || null,
            paid_completion_tokens: claudeData.usage?.output_tokens || null,
            paid_forecast_status: "complete",
          })
          .eq("id", kundli_id);

        if (updateError) {
          logStep("Failed to save forecast", { error: updateError.message });

          // Send alert email
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            const resend = new Resend(resendApiKey);
            resend.emails.send({
              from: "Cosmic Brief Alerts <noreply@notifications.cosmicbrief.com>",
              to: ["support@cosmicbrief.com"],
              subject: "PAID COSMIC BRIEF SAVE FAILED",
              html: `
                <h2>Paid Cosmic Brief Failed to Save</h2>
                <p><strong>Kundli ID:</strong> ${kundli_id}</p>
                <p><strong>Customer Email:</strong> ${kundliData.email || 'N/A'}</p>
                <p><strong>Customer Name:</strong> ${kundliData.name || 'N/A'}</p>
                <p><strong>Session ID:</strong> ${session_id}</p>
                <p><strong>Error:</strong> ${updateError.message}</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              `,
            }).catch(e => logStep("Failed to send alert email", { error: e }));
          }

          // Log to alerts table
          await supabase.from("vedic_generation_alerts").insert({
            kundli_id,
            error_message: `Save failed: ${updateError.message}`,
            error_type: "paid_cosmic_brief_save_failed",
          });
        } else {
          logStep("Paid cosmic brief saved to database");
        }

        // Send email asynchronously
        const customerEmail = kundliData.email;
        if (customerEmail) {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (resendApiKey) {
            (async () => {
              try {
                const resend = new Resend(resendApiKey);
                const emailHtml = buildPaidCosmicBriefEmailHtml(kundliData.name, shareableLink);

                const emailResponse = await resend.emails.send({
                  from: "Cosmic Brief <noreply@notifications.cosmicbrief.com>",
                  to: [customerEmail],
                  subject: "Your Expanded Cosmic Brief is Ready!",
                  html: emailHtml,
                });

                logStep("Email sent successfully", { emailId: emailResponse?.data?.id });
              } catch (emailError) {
                const emailErrMsg = emailError instanceof Error ? emailError.message : "Unknown email error";
                logStep("Failed to send email", { error: emailErrMsg });
              }
            })();
            logStep("Email generation initiated");
          }
        }

        // Track Purchase event via Meta Conversions API
        const purchaseValue = session.amount_total ? session.amount_total / 100 : 29;
        trackPurchase({
          email: customerEmail,
          name: kundliData.name,
          value: purchaseValue,
          currency: "USD",
          clientIp,
          userAgent,
          transactionId: session_id,
        }).catch((err) => {
          logStep("Meta CAPI tracking failed", { error: err instanceof Error ? err.message : "Unknown" });
        });

        logStep("Background generation completed successfully", {
          forecastLength: forecastText.length,
          model: claudeData.model,
        });

      } catch (bgError) {
        const bgErrMessage = bgError instanceof Error ? bgError.message : "Unknown error";
        const bgErrStack = bgError instanceof Error ? bgError.stack : "";
        logStep("Background generation error", { message: bgErrMessage });

        // Update status to failed
        await supabase
          .from("user_kundli_details")
          .update({ paid_forecast_status: "failed" })
          .eq("id", kundli_id);

        // Log to alerts
        await supabase.from("vedic_generation_alerts").insert({
          kundli_id,
          error_message: bgErrMessage,
          error_type: "paid_cosmic_brief_background_generation",
        });

        // Send alert email
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: "Cosmic Brief Alerts <noreply@notifications.cosmicbrief.com>",
            to: ["support@cosmicbrief.com"],
            subject: "PAID COSMIC BRIEF GENERATION FAILED",
            html: `
              <h2>Background Generation Failed</h2>
              <p><strong>Kundli ID:</strong> ${kundli_id}</p>
              <p><strong>Session ID:</strong> ${session_id}</p>
              <p><strong>Error:</strong> ${bgErrMessage}</p>
              <p><strong>Stack:</strong></p>
              <pre style="background:#f5f5f5;padding:10px;font-size:12px;">${bgErrStack}</pre>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            `,
          }).catch(e => logStep("Failed to send background error alert", { error: e }));
        }
      }
    })();

    // Use EdgeRuntime.waitUntil to keep the function alive for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundGeneration);
    }

    // Return immediately - frontend will poll for completion
    return new Response(
      JSON.stringify({
        status: "processing",
        message: "Your expanded cosmic brief is being generated. This may take up to 2 minutes.",
        kundli_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 202,
      },
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    const errStack = error instanceof Error ? error.stack : "";
    logStep("Error", { message: errMessage, stack: errStack });

    // Send alert email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let body: { kundli_id?: string; session_id?: string } = {};

    try {
      body = await req.clone().json().catch(() => ({}));
    } catch {
      // Body parsing failed
    }

    if (resendApiKey && body.kundli_id) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "Cosmic Brief Alerts <noreply@notifications.cosmicbrief.com>",
          to: ["support@cosmicbrief.com"],
          subject: "PAID COSMIC BRIEF GENERATION FAILED",
          html: `
            <h2>Paid Cosmic Brief Generation Failed</h2>
            <p><strong>Kundli ID:</strong> ${body.kundli_id || 'UNKNOWN'}</p>
            <p><strong>Session ID:</strong> ${body.session_id || 'UNKNOWN'}</p>
            <p><strong>Error:</strong> ${errMessage}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          `,
        });
      } catch (emailError) {
        logStep("Failed to send alert email", { error: emailError });
      }
    }

    return new Response(
      JSON.stringify({
        manual_generation: true,
        message: "Your Cosmic Brief is being manually prepared. You'll receive it via email shortly.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});
