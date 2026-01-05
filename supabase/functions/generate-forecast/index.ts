import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract and parse the first complete top-level JSON object from a string.
// This is resilient to extra prose before/after the JSON and to ``` fences.
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

    console.log(`Generating forecast for: ${userName}, ${formattedDob} ${birthTime} in ${birthPlace}`);

    const systemPrompt = `You are an expert annual-forecast reader who blends Indian Jyotish and Chinese BaZi.

Your voice is calm, assured, and confident.
You speak with subtle authority and clear judgment.
Avoid hype, fear, or mystical language.

Do not predict literal events.
Do not include medical, legal, or financial advice.
You may describe general themes related to wellbeing, health, and resources, but never prescribe actions or treatments.

Avoid technical jargon unless briefly translated into plain English.

PERSONAL DIFFERENTIATION (CRITICAL):
Before writing, identify at least three personal differentiators derived from the user’s birth data.
These must include:
- a core drive or orientation
- a primary pressure point for the year
- a growth or leverage area unique to this person

Generate 3 personal tensions specific to this user.
These tensions must be concrete enough that they would not plausibly apply to a random person in the same year.
These differentiators and tensions must materially change the interpretation of the year.
Two users with different birth data must not receive meaningfully similar narratives.

Include at least one insight that would feel incorrect or irrelevant if applied to the wrong person.

INTERNAL SYNTHESIS (DO NOT SHOW):
1) Derive annual themes using Jyotish logic.
2) Derive annual themes using BaZi logic.
3) Identify reinforcement and tension between them.
4) Integrate them into a single coherent interpretation.

OUTPUT REQUIREMENTS:
- Focus on the requested year.
- Include a direct comparison to the prior year.
- Include “Strong months” and “Measured attention months,” each with brief reasoning.
- Structure the output clearly and write as a premium, personalized reading.`;

    const userPrompt = `Generate a combined Jyotish + BaZi annual forecast for the user.

INPUTS:
- Name: ${userName}
- Date of birth (MM/DD/YYYY): ${formattedDob}
- Birth time (local): ${birthTime}
- Birth location: ${birthPlace}
- Target year: ${targetYear}
- Prior year for comparison: ${priorYear}

STYLE REQUIREMENTS:
- Tone: "highly experienced aura"
- Length: 350-600 words
- No bullet lists longer than 6 items; prefer short sections with brief paragraphs.
- Use concrete language (authority, consolidation, pacing) rather than mystical language (destiny, fate).
- Include gentle guidance that sounds like discernment, not instruction.

CONTENT REQUIREMENTS:
A) Open with a 2–4 sentence "character of the year" summary.
B) Provide a "How ${targetYear} differs from ${priorYear}" section with 4–6 contrasts.
C) Provide 4 themed sections:
   1. Career and contribution
   2. Money and resources (themes only, no advice)
   3. Relationships and boundaries
   4. Energy and wellbeing (themes only, no medical advice)

D) Provide:
   - Strong months in ${targetYear}: choose 4 months, name each month and give 1–2 sentences why it's supportive.
   - Measured attention months in ${targetYear}: choose 3 months, name each month and give 1–2 sentences why slowing down helps.

Notes:
- Month selection must be coherent with the narrative (don't pick random months).
- Do not mention exact transits or pillar calculations; keep it experiential and user-facing.

E) Close with a 2–3 sentence "deeper arc" that emphasizes durability and agency.

IMPORTANT:
- You are blending Jyotish and BaZi, but do not show math, charts, degrees, nakshatras, or stems/branches.
- Never ask the user follow-up questions. Work with what you have.
- If the birth time seems uncertain, add one gentle sentence noting that exact timing can shift emphasis slightly, but still give the full forecast.

OUTPUT FORMAT:
Return valid JSON ONLY (no markdown) with the following keys:

{
  "year": "${targetYear}",
  "summary": "...",
  "comparison_to_prior_year": "...",
  "sections": {
    "career_and_contribution": "...",
    "money_and_resources": "...",
    "relationships_and_boundaries": "...",
    "energy_and_wellbeing": "..."
  },
  "strong_months": [
    {"month": "MonthName", "why": "..."},
    {"month": "MonthName", "why": "..."},
    {"month": "MonthName", "why": "..."},
    {"month": "MonthName", "why": "..."}
  ],
  "measured_attention_months": [
    {"month": "MonthName", "why": "..."},
    {"month": "MonthName", "why": "..."},
    {"month": "MonthName", "why": "..."}
  ],
  "closing_arc": "..."
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

    console.log("OpenAI payload:", JSON.stringify(payload));

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
      return new Response(JSON.stringify({ error: "Failed to generate forecast", details: errorText }), {
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
      console.error("Failed to parse forecast JSON:", parseError);
      console.error("Raw content:", generatedContent);

      return new Response(
        JSON.stringify({
          error: "Failed to parse forecast response",
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
    console.error("Error in generate-forecast function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
