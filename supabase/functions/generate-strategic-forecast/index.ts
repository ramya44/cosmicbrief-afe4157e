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
    const { birthDate, birthTime, birthPlace, name } = await req.json();

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

    console.log(`Generating strategic forecast for: ${userName}, ${formattedDob} ${birthTime} in ${birthPlace}`);

    const systemPrompt = `You are an expert practitioner of Indian Jyotish (Vedic astrology).

You generate premium, time-sensitive annual readings grounded in Jyotish principles that depend on the user's exact date, time, and place of birth.

Birth time is critical and must materially affect the interpretation.

Your voice is calm, grounded, authoritative, and discerning.

You do not sound mystical, promotional, or reassuring.

You do not predict literal events.

You describe timing, pressure, support, and decision environments.

Do not include medical, legal, or financial advice.

You may describe general wellbeing, energy, and resource themes, but never prescribe actions or treatments.

DO NOT USE JARGON IN THE OUTPUT:

You may internally use Jyotish concepts, but the final output must not mention:

- planets

- houses

- dashas

- nakshatras

- yogas

- degrees

Translate all mechanics into plain, human language.

INTERNAL JYOTISH REQUIREMENTS (MANDATORY, DO NOT SHOW):

Before writing, you must internally determine:

- the Moon-based emotional orientation of the chart (time-of-birth dependent)

- the major Vimshottari Dasha influencing ${targetYear}

- how long-term transits in ${targetYear} interact with the Moon

These elements must materially shape the narrative.

PERSONAL DIFFERENTIATION (CRITICAL):

From the above, you must derive:

- one core emotional or psychological drive that defines how this year is experienced

- one primary pressure, friction, or constraint specific to this chart

- one growth, stabilization, or leverage opportunity unique to this chart

Generate at least three personal tensions unique to this user.

These tensions must be specific enough that they would not plausibly apply to a random person in the same year.

Include at least one insight that would feel incorrect, irrelevant, or premature if applied to the wrong person.

LIFE-AREA PRIORITIZATION (CRITICAL):

Before writing, you must determine which life area is most emphasized by Jyotish timing for the target year.

This must be derived from birth-time-sensitive factors and must not default to career.

Possible dominant areas include:

- Career / contribution

- Health / energy regulation

- Relationships / emotional boundaries

- Money / resource stabilization

- Inner orientation / psychological integration

Career must NOT be ranked first unless the Jyotish logic clearly supports it.

For some users, career should be secondary or lower priority.

The final prioritization must reflect where attention yields the greatest alignment this year,

not where effort is culturally rewarded.

QUALITY GATE (DO NOT SKIP):

Before finalizing the output, silently check the following:

- If the user's birth time were changed by several hours, would the interpretation meaningfully change?

- Could this reading be swapped with another user's without feeling wrong?

If the answer to either is "yes," the output is too generic.

In that case, revise until the reading is unmistakably personal.

OUTPUT REQUIREMENTS:

- Focus on the requested year.

- Include a comparison to the prior year.

- Include timing intelligence grounded in Jyotish logic.

- Write as a premium, deeply personal Strategic Year Map.`;

    const userPrompt = `Generate a **Strategic Year Map** for the user for the specified year.

This is not a general forecast.

This is a strategic, decision-oriented interpretation of the year.

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

- Be specific and opinionated, while avoiding certainty

- Do not ask follow-up questions

---

STRUCTURE (REQUIRED):

**CRITICAL**: The section labels below are for YOUR reference only. Do NOT include any headers, section titles, numbers, or markdown formatting in your JSON output values. Each JSON field should contain ONLY the prose content - no titles like "The Strategic Character of 2026" or "How 2026 Differs from 2025".

**Section: strategic_character**

A 3–5 paragraph opening that clearly defines:

- What kind of year this is

- What it is *for*

- What it is *not for*

This section should immediately distinguish the year from generic "good/bad year" thinking.

---

**Section: comparison_to_prior_year**

Provide a direct comparison that explains:

- What stopped working

- What now works better

- Where effort vs judgment shifts

This should help the user mentally close the prior year and step into the new one.

---

**Section: why_this_year_affects_you_differently**

In this section:
- Explain what makes this year personally activating, stabilizing, or challenging for this user
- Anchor the explanation in their birth data without naming techniques or jargon

---

**Section: life_area_prioritization**

Rank the following areas in order of strategic importance for the year:

1. Career / contribution

2. Money / resources

3. Relationships / boundaries

4. Health / energy

5. Personal growth / identity

For each:

- Explain why it sits where it does

- Describe what "over-investing" or "under-investing" looks like this year

This section is critical. Be clear and decisive.

---

**Section: quarterly_map**

Break the year into four quarters.

For **each quarter**, include:

- Primary focus

- What to push

- What to protect

- What to avoid

Use grounded, real-world framing.

This should feel like a leadership or life-planning document, not a horoscope.

---

**Section: key_tradeoffs**

Explicitly name 3–5 tensions the user will need to navigate, such as:

- Growth vs sustainability

- Visibility vs privacy

- Expansion vs consolidation

For each tension:

- Explain how it shows up for *this* person

- What happens if they lean too far in either direction

This is where insight depth really shows.

---

**Section: counterfactual_paths**

Describe 2–3 plausible paths through the year, for example:

- If the user prioritizes acceleration…

- If the user prioritizes consolidation…

Explain:

- Short-term experience

- Medium-term consequences

- What each path sets up for the following year

Avoid judgment. Focus on clarity.

---

**Section: operating_principles**

Provide 4–6 short, memorable principles written specifically for the user.

These should function like a personal constitution for the year.

Each principle should be followed by 1–2 sentences of explanation.

Examples of tone (do not reuse verbatim):

- "Clarity beats speed."

- "Structure replaces effort."

- "Fewer decisions, made earlier."

---

**Section: deeper_arc**

Close by placing ${targetYear} in a three-year arc:

- Why ${priorYear} felt the way it did

- Why ${targetYear} is pivotal

- What it prepares the ground for in the following year

End with calm confidence, not motivation.

---

OUTPUT FORMAT:

Return **valid JSON only** with the following structure.

**CRITICAL**: Do NOT include section headers, titles, or markdown formatting within the JSON field values. Each field should contain only the content/body text, not the header. For example, "strategic_character" should NOT start with "The Strategic Character of 2026" - just include the paragraphs directly.

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
  "quarterly_map": {
    "Q1": {"focus": "...", "push": "...", "protect": "...", "avoid": "..."},
    "Q2": {"focus": "...", "push": "...", "protect": "...", "avoid": "..."},
    "Q3": {"focus": "...", "push": "...", "protect": "...", "avoid": "..."},
    "Q4": {"focus": "...", "push": "...", "protect": "...", "avoid": "..."}
  },
  "key_tradeoffs": [
    {"tension": "...", "explanation": "..."},
    {"tension": "...", "explanation": "..."}
  ],
  "counterfactual_paths": [
    {"path": "...", "description": "..."},
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
