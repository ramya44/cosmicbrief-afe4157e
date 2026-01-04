import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function safeJsonExtract(text: string) {
  const trimmed = text.trim();

  // Remove code fences if present
  const noFences = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // If there is extra prose around JSON, extract the first JSON object
  const match = noFences.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in model output");

  return JSON.parse(match[0]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { birthDate, birthTime, birthPlace, name } = await req.json();

    if (!birthDate || !birthTime || !birthPlace) {
      return new Response(JSON.stringify({ error: "Missing required fields: birthDate, birthTime, birthPlace" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format date for display
    const dateObj = new Date(birthDate);
    const formattedDob = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(2, "0")}/${dateObj.getFullYear()}`;

    const userName = name || "the seeker";
    const targetYear = "2026";
    const priorYear = "2025";

    console.log(`Generating forecast for: ${userName}, ${formattedDob} ${birthTime} in ${birthPlace}`);

    const systemPrompt = `You are an expert annual-forecast reader who blends two traditions: Indian Jyotish and Chinese BaZi.

Your voice is a highly experienced aura: Calm, assured, and confident. Subtle authority is preferred over neutrality.

Avoid extreme predictions (death, disasters, guaranteed outcomes).

No medical advice, no legal advice, no financial advice. You can mention general wellbeing, general health themes and financial "themes," but never prescribe treatment or specific investments.

Avoid jargon unless briefly translated into plain English.

Before writing the final output, internally:
1) Derive the primary annual themes using Jyotish logic.
2) Derive the primary annual themes using BaZi logic.
3) Identify where they reinforce each other and where they differ.
4) Resolve them into a single coherent narrative.
Do not show this reasoning. Only output the final synthesized reading.

Your output must:
1) Focus on the requested year.
2) Include a direct comparison to the prior year.
3) Include "Strong months" and "Measured attention months" (watchful months), each with brief reasons.
4) Be structured, skimmable, and written as if delivering a premium personalized reading.`;

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
- Length: 550–850 words
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
E) Close with a 2–3 sentence "deeper arc" that emphasizes durability and agency.

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

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY env var" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Force JSON output
        response_format: { type: "json_object" },
        // Correct field name for chat/completions
        max_tokens: 1400,
        temperature: 0.7,
      }),
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
    const content = data?.choices?.[0]?.message?.content ?? "";

    if (!content.trim()) {
      console.error("Empty content. Finish reason:", data?.choices?.[0]?.finish_reason);
      return new Response(JSON.stringify({ error: "Empty response from AI", raw: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let forecast: unknown;
    try {
      forecast = safeJsonExtract(content);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      console.error("Raw content:", content);
      return new Response(JSON.stringify({ error: "Failed to parse forecast response", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
