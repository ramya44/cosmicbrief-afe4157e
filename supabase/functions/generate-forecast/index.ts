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

// Generate a short hash for style seed
async function generateStyleSeed(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
      age--;
    }

    const userName = name || "the seeker";
    const targetYear = "2026";

    // Generate style seed from birth data
    const styleSeed = await generateStyleSeed(`${formattedDob}+${birthTime}+${birthPlace}`);

    console.log(
      `Generating forecast for: ${userName}, age ${age}, ${formattedDob} ${birthTime} in ${birthPlace}, style_seed: ${styleSeed}`,
    );

    const systemPrompt = `You generate fast, high-impact annual previews inspired by Indian Jyotish.

This is a free glimpse meant to be personally resonant.

It should feel specific, not analytical.

Execution rules:

- Write immediately.

- Do NOT analyze deeply.

- Do NOT think through multiple alternatives.

- Do NOT justify your choices.

- Choose the first coherent framing and write it.

- Always produce visible text.

Personalization comes from tone and emphasis using the provided style seed.

Do not reason about uniqueness.

AGE-BASED PIVOTAL LIFE ELEMENT (STRICT):

You must select exactly ONE pivotal life element from the allowed list for the user's age.

Do not compare options. Do not deliberate. Pick one quickly.

Allowed lists:

- Age < 35: [career, education, identity]

- Age 35–49: [career, relationships, family, health]

- Age 50–59: [health, family, relationships, purpose]

- Age >= 60: [health, family, relationships, meaning, stewardship]

Rule: if age >= 60, never choose career.

Tone:

Grounded, clear, confident.

No mysticism. No motivation. No technical astrology language.`;

    const userPrompt = `Create a concise preview of the user's ${targetYear}.

Inputs:
- Age: ${age}
- Time of birth: ${birthTime}
- Place of birth: ${birthPlace}
- Style seed: ${styleSeed}
- Pivotal life element (preselected): ${pivotalLifeElement}

Write 90–110 words, plain text only.

Structure (write in this order):

1) Defining Arc
One short, shareable statement that captures the theme of the year.

2) Pivotal Life Element
Write 2–3 sentences describing how attention naturally gathers around "${pivotalLifeElement}" this year.

3) Quiet Undercurrent
Write 1–2 sentences describing what needs balancing inside "${pivotalLifeElement}" this year.
Use gentle phrasing like "balancing", "recalibration", or "two pulls". Do not explain consequences. Do not give advice.

Stop when finished.
`.trim();

    const payload = {
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 800,
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
