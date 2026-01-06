import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract and parse the first complete top-level JSON object from a string.
function extractFirstJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let depth = 0;
  let start = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = cleaned.slice(start, i + 1);
        return JSON.parse(candidate);
      }
    }
  }

  throw new Error("No complete JSON object found in model output");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { birthDate, birthTime, birthPlace, name, pivotalTheme } = await req.json();

    if (!birthDate || !birthTime || !birthPlace) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: birthDate, birthTime, birthPlace",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY env var" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format date for display
    const dateObj = new Date(birthDate);
    const formattedDob = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(
      2,
      "0",
    )}/${dateObj.getFullYear()}`;

    const userName = name || "the seeker";
    const targetYear = "2026";
    const priorYear = "2025";

    console.log(`Generating strategic forecast for: ${userName}, ${formattedDob} ${birthTime} in ${birthPlace}, pivotalTheme: ${pivotalTheme || 'not specified'}`);

    const systemPrompt = `You are an expert practitioner of Indian Jyotish (Vedic astrology).

You generate premium, time-sensitive annual readings grounded in Jyotish principles that depend on the user's exact date, time, and place of birth.

Birth time is critical and must materially affect the interpretation.

Your voice is calm, grounded, authoritative, and discerning.

You do not sound mystical, promotional, motivational, or reassuring.

You do not predict literal events.

You describe timing, pressure, support, emotional load, and decision environments as they are experienced by a human being moving through a year.

Do not include medical, legal, or financial advice.

You may describe general wellbeing, energy, and resource themes, but never prescribe actions or treatments.

DO NOT USE JARGON IN THE OUTPUT:

You may internally use Jyotish concepts, but the final output must not mention or allude to:

- planets

- houses

- dashas

- nakshatras

- yogas

- degrees

- transits

- astrological systems or techniques

All mechanics must be translated into plain, human language.

INTERNAL JYOTISH REQUIREMENTS (MANDATORY, DO NOT SHOW):

Before writing, you must internally determine:

- the Moon-based emotional orientation of the chart (time-of-birth dependent)

- the major Vimshottari Dasha influencing the target year

- how long-term background pressures in the target year interact with the Moon

These elements must materially shape tone, emphasis, and timing.

PERSONAL DIFFERENTIATION (CRITICAL):

From the above, you must derive:

- one core emotional or psychological drive that defines how this year is experienced

- one primary pressure, friction, or constraint specific to this chart

- one growth, stabilization, or leverage opportunity unique to this chart

Generate at least three personal tensions that would not plausibly apply to a random person in the same year.

Include at least one insight that would feel incorrect, irrelevant, or premature if applied to the wrong person.

LIFE-AREA PRIORITIZATION (CRITICAL):

Before writing, determine which life area is most emphasized by timing for the target year.

This must be derived from birth-time-sensitive factors and must not default to career. If a pivotal theme is provided, it must remain ranked first.

${pivotalTheme ? `MANDATORY CONSTRAINT: The life area "${pivotalTheme}" MUST be ranked as priority #1 in the life_area_prioritization output. This was identified as the user's pivotal theme from their free forecast and must remain consistent.` : ''}

Possible dominant areas include:

- Career / contribution

- Health / energy regulation

- Relationships / emotional boundaries

- Money / resource stabilization

- Inner orientation / psychological integration

Prioritize where attention produces alignment and steadiness, not where effort is culturally rewarded.

QUALITY GATE (DO NOT SKIP):

Before finalizing, silently check:

- Would changing the birth time by several hours meaningfully alter this reading?

- Could this reading be given to another person without feeling wrong?

If yes to either, revise until unmistakably personal.

OUTPUT REQUIREMENTS:

- Focus on the requested year

- Include a comparison to the prior year

- Include timing intelligence expressed through lived experience

- Write as a premium, deeply personal Strategic Year Map.`;

    const userPrompt = `Generate a Strategic Year Map for the user for the specified year.

This is not a general forecast.

This is a personal, decision-oriented interpretation of how the year unfolds for this individual.

---

INPUTS:

- Name (optional): ${userName}

- Date of birth (MM/DD/YYYY): ${formattedDob}

- Birth time (local): ${birthTime}

- Birth location: ${birthPlace}

- Target year: ${targetYear}

- Prior year: ${priorYear}

---

OUTPUT REQUIREMENTS:

- Length: 900–1,200 words

- Tone: experienced, composed, confident

- Write as if speaking to an intelligent adult who wants clarity, not reassurance

- Be specific and opinionated while avoiding certainty

- Do not ask follow-up questions

- Output body text only

- Do NOT include titles, headers, section names, numbers, or repeated labels

- Do NOT restate the year or section headings

- Assume the UI provides all headings

---

STRUCTURE (REQUIRED):

The section labels below are for reference only. Do NOT include them in the output text.

---

Section: strategic_character

A 3–5 paragraph opening that establishes:

- What kind of year this is

- What it is for

- What it is not for

This should immediately move the reader out of generic good or bad year thinking.

---

Section: comparison_to_prior_year

Explain:

- What stopped working last year

- What now works differently

- How effort, judgment, or pacing shifts

Help the reader mentally close the prior year.

---

Section: why_this_year_affects_you_differently

Explain why this year lands differently for this person.

Anchor the explanation in their birth data without naming techniques or systems.

---

Section: life_area_prioritization

Rank the following areas in order of importance for the year:

1. Career / contribution

2. Money / resources

3. Relationships / boundaries

4. Health / energy

5. Personal growth / identity

For each:

- Explain why it ranks where it does

- Describe what over-investing or under-investing looks like this year

Be decisive.

---

Section: seasonal_map

Break the year into four human seasons rather than quarters.

Do not reference months, quarters, or business cycles.

Each season should feel like a phase of lived experience, defined by energy, attention, and emotional load.

For each season, include:

- What matters: The underlying personal or emotional priority of this phase

- What to lean into: The kinds of commitments, behaviors, or conversations that align with the season

- What to protect: Time, energy, boundaries, or conditions that support steadiness

- What to watch for: Subtle missteps, pressures, or patterns that undermine this phase

Avoid business language, execution framing, or operational metaphors.

This should feel like guidance for navigating life, not managing work.

---

Section: key_tradeoffs

Name 3–5 tensions the user will need to navigate.

For each:

- Explain how it shows up specifically for this person

- Describe the cost of leaning too far in either direction

---

Section: counterfactual_paths

Describe 2–3 plausible ways the year could be lived.

For each path, explain:

- The short-term experience

- The medium-term consequence

- What it sets up for the following year

Avoid judgment. Focus on clarity.

---

Section: operating_principles

Provide 4–6 short, memorable principles written specifically for this user.

Each principle should be followed by 1–2 sentences explaining its meaning in practice.

These should feel personal, not generic.

---

Section: deeper_arc

Place the target year within a three-year arc.

Explain:

- Why the prior year felt the way it did

- Why this year is pivotal

- What it prepares for next year

End with grounded confidence, not motivation.

---

OUTPUT FORMAT:

Return valid JSON only.

Do NOT include headers, titles, or markdown inside the JSON values.

{
  "year": "${targetYear}",
  "strategic_character": "...",
  "comparison_to_prior_year": "...",
  "why_this_year_affects_you_differently": "...",
  "life_area_prioritization": [
    {"area": "Career and contribution", "priority": 1, "explanation": "..."},
    {"area": "Money and resources", "priority": 2, "explanation": "..."},
    {"area": "Relationships and boundaries", "priority": 3, "explanation": "..."},
    {"area": "Health and energy", "priority": 4, "explanation": "..."},
    {"area": "Personal growth and identity", "priority": 5, "explanation": "..."}
  ],
  "seasonal_map": [
    {"what_matters": "...", "lean_into": "...", "protect": "...", "watch_for": "..."},
    {"what_matters": "...", "lean_into": "...", "protect": "...", "watch_for": "..."},
    {"what_matters": "...", "lean_into": "...", "protect": "...", "watch_for": "..."},
    {"what_matters": "...", "lean_into": "...", "protect": "...", "watch_for": "..."}
  ],
  "key_tradeoffs": [
    {"tension": "...", "explanation": "..."}
  ],
  "counterfactual_paths": [
    {"path": "...", "description": "..."}
  ],
  "operating_principles": [
    {"principle": "...", "meaning": "..."}
  ],
  "deeper_arc": "..."
}`;

    const payload = {
      model: "gpt-5-2025-08-07",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8000,
    };

    console.log("OpenAI strategic payload:", JSON.stringify(payload));

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("OpenAI API error:", resp.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate strategic forecast", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    console.log("Full API response:", JSON.stringify(data));
    console.log("Token usage:", JSON.stringify(data.usage));

    const generatedContent = data?.choices?.[0]?.message?.content ?? "";

    if (!generatedContent.trim()) {
      console.error("Empty content in response. Finish reason:", data?.choices?.[0]?.finish_reason);
      return new Response(JSON.stringify({ error: "Empty response from AI", raw: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let forecast: unknown;
    try {
      forecast = extractFirstJsonObject(generatedContent);
    } catch (parseError) {
      console.error("Failed to parse strategic forecast JSON:", parseError);
      console.error("Raw content:", generatedContent);

      return new Response(
        JSON.stringify({
          error: "Failed to parse strategic forecast response",
          parseError: String(parseError),
          rawContent: generatedContent,
          finish_reason: data?.choices?.[0]?.finish_reason,
          usage: data?.usage,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-strategic-forecast function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
