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

    const systemPrompt = `You generate fast, intuitive annual previews inspired by Indian Jyotish.

This is a free glimpse, not a full reading.

Your priorities are speed, clarity, and personal resonance.

Do NOT perform deep analysis.

Do NOT plan or outline before writing.

Keep internal reasoning minimal and brief.

IMPORTANT OUTPUT GUARANTEE:

You must produce visible text immediately.

Never use more than 25% of the available tokens for internal reasoning.

If space is tight, shorten the output but always return text.

Tone:

Calm, grounded, quietly insightful.

No hype. No mystical jargon. No advice.

Avoid:

- predictions of events

- technical astrology terms

- universal statements that apply to everyone

Even at this high level, the output must feel specific to the individual.

Two people with different birth dates or birth time must not receive the same response.`;

    const userPrompt = `Create a fast, intuitive preview of the user's ${targetYear}.

INPUTS:

- Date of birth: ${formattedDob}

- Time of birth (local): ${birthTime}

- Place of birth: ${birthPlace}

- Target year: ${targetYear}

Write ONLY the following, in 70–110 words total:

1) The Shape of the Year

Describe the year using a single visual metaphor or shape.

Let birth time subtly influence tone (e.g., steady, sensitive, assertive).

2) One Line That Matters

One short, declarative sentence that captures what defines this year for this person.

It must not be universally applicable.

3) Energy Snapshot

In 2–3 sentences, describe:

- how momentum feels

- where effort flows naturally

- where friction quietly appears

Rules:

- Choose quickly. Do not overthink.

- No disclaimers, no uncertainty language.

- Do not reuse metaphors or phrasing across users.

Return plain text only.`;

    const payload = {
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 2000,
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
    console.log("Token usage:", JSON.stringify(data.usage));

    const generatedContent = data?.choices?.[0]?.message?.content ?? "";

    if (!generatedContent.trim()) {
      console.error("Empty content in response. Finish reason:", data?.choices?.[0]?.finish_reason);
      return new Response(JSON.stringify({ error: "Empty response from AI", raw: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ forecast: generatedContent.trim() }), {
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
