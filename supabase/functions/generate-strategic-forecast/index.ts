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

You generate premium, time-sensitive annual readings grounded in Jyotish principles that depend on the user’s exact date, time, and place of birth.
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
- the major Vimshottari Dasha influencing the target year
- how long-term transits in the target year interact with the Moon
These elements must materially shape the narrative.

PERSONAL DIFFERENTIATION (CRITICAL):
From the above, you must derive:
- one core emotional or psychological drive that defines how this year is experienced
- one primary pressure, friction, or constraint specific to this chart
- one growth, stabilization, or leverage opportunity unique to this chart

Generate at least three personal tensions unique to this user.
These tensions must be specific enough that they would not plausibly apply to a random person in the same year.

Include at least one insight that would feel incorrect, irrelevant, or premature if applied to the wrong person.

QUALITY GATE (DO NOT SKIP):
Before finalizing the output, silently check the following:
- If the user’s birth time were changed by several hours, would the interpretation meaningfully change?
- Could this reading be swapped with another user’s without feeling wrong?

If the answer to either is “yes,” the output is too generic.
In that case, revise until the reading is unmistakably personal.

OUTPUT REQUIREMENTS:
- Focus on the requested year.
- Include a comparison to the prior year.
- Include timing intelligence grounded in Jyotish logic.
- Write as a premium, deeply personal Strategic Year Map.`;

    const userPrompt = `Generate a Jyotish-based Strategic Year Map for the user.

INPUTS:
- Name (optional): {{name}}
- Date of birth (MM/DD/YYYY): {{dob}}
- Time of birth (local): {{birth_time}}
- Place of birth: {{birth_place}}
- Target year: {{target_year}}
- Prior year: {{prior_year}}

LENGTH:
900–1,200 words

STRUCTURE (REQUIRED):

1) The Strategic Character of {{target_year}}
Explain what kind of year this is for this person.
Clarify what the year is for and what it is not for.
Avoid generic “good/bad year” framing.

2) Why This Year Affects You Differently
Explain why {{target_year}} activates or stabilizes this person differently than it would an average individual.
Anchor this explanation in birth-time-sensitive Jyotish logic, translated into plain language.

3) Comparison to {{prior_year}}
Describe how the decision environment, emotional tone, and pressure differ from the prior year.
Help the user mentally close {{prior_year}} and step into {{target_year}}.

4) Core Jyotish Orientation for the Year
Describe:
- the dominant internal posture of the year
- how responsibility, effort, and emotional load behave
This section should feel unmistakably personal.

5) Decision Environment
Break the year into:
- High-return zones (where effort compounds)
- Neutral zones (maintenance only)
- Leak zones (where effort drains energy)
Do not give advice; describe terrain.

6) Timing Intelligence
Describe how timing works across the year:
- when initiation is supported
- when consolidation is favored
- when restraint or pause is protective
Do not name transits or mechanics.

7) Key Personal Tensions and Friction Patterns
Explicitly name 3–5 tensions specific to this user.
For each:
- how it shows up
- what happens if it is mishandled

8) Counterfactual Paths (If–Then Scenarios)
Describe 2–3 plausible paths through the year:
- what happens if the user pushes
- what happens if the user restrains or consolidates
Include near-term experience and what each path sets up for the following year.

9) Operating Principles for {{target_year}}
Provide 4–6 short, memorable principles derived from this chart and year.
Each principle should be followed by 1–2 sentences of explanation.

10) The Deeper Arc
Place {{target_year}} in a longer arc:
- why {{prior_year}} felt the way it did
- why {{target_year}} matters
- what it prepares for next

IMPORTANT:
- Do not ask the user follow-up questions.
- Do not reference astrology techniques explicitly.
- Do not soften or generalize insights to make them universally applicable.

OUTPUT FORMAT:
Return valid JSON only with the following structure:

{
  "year": "{{target_year}}",
  "strategic_character": "...",
  "why_this_year_is_personal": "...",
  "comparison_to_prior_year": "...",
  "core_orientation": "...",
  "decision_environment": {
    "high_return_zones": "...",
    "neutral_zones": "...",
    "leak_zones": "..."
  },
  "timing_intelligence": "...",
  "personal_tensions": [
    {"tension": "...", "description": "..."}
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
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 16000,
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
