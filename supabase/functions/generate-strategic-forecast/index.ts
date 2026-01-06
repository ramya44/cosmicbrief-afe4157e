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
    const { birthDateTimeUtc, lat, lon, name, pivotalTheme } = await req.json();

    if (!birthDateTimeUtc || lat === undefined || lon === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: birthDateTimeUtc, lat, lon",
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

    const userName = name || "the seeker";
    const targetYear = "2026";
    const priorYear = "2025";

    console.log(
      `Generating strategic forecast for: ${userName}, UTC: ${birthDateTimeUtc}, lat: ${lat}, lon: ${lon}, pivotalTheme: ${pivotalTheme || "not specified"}`,
    );

    const systemPrompt = `You are an expert practitioner of Indian Jyotish (Vedic astrology).

You generate premium, time-sensitive annual readings grounded in Jyotish principles and interpretation.
Birth time materially affects tone, emphasis, and timing.

Your voice is calm, grounded, authoritative, and discerning.
You do not sound mystical, promotional, motivational, or reassuring.

You do not predict literal events.
You describe timing, pressure, support, emotional load, and decision environments as they are experienced by a human being over the course of a year.

You may describe general wellbeing, energy, and resource themes.
Do not provide medical, legal, or financial advice.

JYOTISH LANGUAGE CONSTRAINT (CRITICAL):
You may internally rely on Jyotish concepts, but the output must not mention or allude to:
- planets
- houses
- dashas
- nakshatras
- yogas
- degrees
- transits
- astrology systems or techniques

All mechanics must be translated into plain, human language.

PERSONALIZATION REQUIREMENTS:
The reading must feel unmistakably personal and birth-time-sensitive.
Include:
- one core emotional or psychological drive shaping the year
- one primary pressure or constraint specific to this person
- one growth or stabilization opportunity unique to this person
- at least three tensions that would not plausibly apply to a random individual
- at least one insight that would feel wrong if applied to the wrong person

QUALITY CHECK (SILENT):
If this reading could be reused for another person without feeling incorrect, revise until it cannot.

Output must follow the exact JSON schema provided by the user.
Return valid JSON only.`;

    const userPrompt = `
Generate a Strategic Year Map for the target year.
This is a personal, decision-oriented interpretation, not a general forecast.

INPUTS:
- Name (optional): ${userName}
- Birth moment (UTC): ${birthDateTimeUtc}
- Birth location latitude: ${lat}
- Birth location longitude: ${lon}
- Target year: ${targetYear}
- Prior year: ${priorYear}
${pivotalTheme ? `- Pivotal life theme (must be ranked #1): ${pivotalTheme}` : ""}

WRITING RULES:
- Plain human language only
- No astrology mechanics or system names
- No literal event predictions
- No follow-up questions
- Write for an intelligent adult who wants clarity, not reassurance
- Be specific and opinionated without certainty

LENGTH:
Total output: 700–900 words

STRUCTURE:
Assume the UI provides section headers.
Do not include titles, headers, labels, or numbering in the text.

REQUIRED SECTIONS (do not label in output):

1) Strategic character  
Establish what kind of year this is, what it is for, and what it is not for.
Move the reader out of “good vs bad year” thinking.

2) Comparison to prior year  
Explain what stopped working, what now works differently, and how pacing or judgment shifts.

3) Why this year affects this person differently  
Anchor this explanation in birth-time-sensitive interpretation without naming techniques.

4) Life area prioritization  
Rank these areas from most to least important for alignment this year:
- Career and contribution
- Money and resources
- Relationships and boundaries
- Health and energy
- Personal growth and identity

Explain why each ranks where it does and what over- or under-investment looks like.
If a pivotal theme is provided, it must be ranked #1.

5) Seasonal map  
Describe four human seasons as phases of lived experience.
Do not reference months, quarters, or business cycles.

For each phase include:
- what matters
- what to lean into
- what to protect
- what to watch for

6) Key tradeoffs  
Name 3–5 personal tensions this person must navigate.
Explain the cost of leaning too far in either direction.

7) Crossroads moment  
Describe exactly one inevitable internal crossroads.
Focus on timing, pressure, and readiness — not events.

Structure:
- Begin with “There will come a time this year when…”
- Then “In that moment, it will be tempting to…”
- End with “Remember this:”

One paragraph, 4–6 sentences.
No dates, no advice, no generic temptations.

8) Operating principles  
Provide 4–6 short principles written specifically for this person.
Each followed by 1–2 sentences explaining lived meaning.

9) Deeper arc  
Place this year within a three-year arc:
why the prior year felt the way it did,
why this year is pivotal,
what it quietly prepares for next year.

OUTPUT FORMAT:
Return valid JSON only using this schema:

{
  "year": "${targetYear}",
  "strategic_character": "...",
  "comparison_to_prior_year": "...",
  "why_this_year_affects_you_differently": "...",
  "life_area_prioritization": [
    {"area":"Career and contribution","priority":1,"explanation":"..."},
    {"area":"Money and resources","priority":2,"explanation":"..."},
    {"area":"Relationships and boundaries","priority":3,"explanation":"..."},
    {"area":"Health and energy","priority":4,"explanation":"..."},
    {"area":"Personal growth and identity","priority":5,"explanation":"..."}
  ],
  "seasonal_map": [
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."},
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."},
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."},
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."}
  ],
  "key_tradeoffs": [
    {"tension":"...","explanation":"..."}
  ],
  "crossroads_moment": "...",
  "operating_principles": [
    {"principle":"...","meaning":"..."}
  ],
  "deeper_arc": "..."
}
`;

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
