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
  return hashArray.slice(0, 4).map(b => b.toString(16).padStart(2, "0")).join("");
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

    // Generate style seed from birth data
    const styleSeed = await generateStyleSeed(`${formattedDob}+${birthTime}+${birthPlace}`);

    console.log(`Generating forecast for: ${userName}, ${formattedDob} ${birthTime} in ${birthPlace}, style_seed: ${styleSeed}`);

    const systemPrompt = `You generate fast, high-impact annual previews inspired by Indian Jyotish.

This is a free glimpse meant to be shareable and emotionally resonant.

It should feel personal, distinct, and meaningful — not analytical.

Execution rules:

- Write immediately.

- Do NOT analyze deeply or plan.

- Keep internal reasoning minimal.

- Always produce visible text.

Personalization comes from tone, emphasis, and focus using the provided style seed.

Do not reason about uniqueness.

Tone:

Grounded, clear, quietly confident.

Not mystical. Not motivational. Not generic.

Avoid:

- technical astrology language

- predictions of specific events

- random metaphors or abstract imagery`;

    const userPrompt = `Create a concise preview of the user's ${targetYear}.

Inputs:

- Date of birth: ${formattedDob}

- Time of birth: ${birthTime}

- Place of birth: ${birthPlace}

- Style seed: ${styleSeed}

Write 90–120 words total, plain text only.

Structure (write in this exact order):

1) The Defining Arc of the Year

One short, fortune-cookie-style statement that captures the main arc of the year.

It should feel specific enough that people would want to share it.

2) The Pivotal Life Element

Name ONE life area that will matter most this year (e.g., career, relationships, family, health, learning).

Use age and life stage to guide this choice.

Write 2–3 sentences about why this area is pivotal now.

3) The Central Tension

Describe the main tension or tradeoff that shows up around this life element.

What is being asked, strained, or rebalanced?

4) Why This Matters

2–3 sentences explaining what quietly goes wrong if this tension is ignored.

Do not give advice. Imply consequence.

Write clearly and directly. Stop when finished.`;

    const payload = {
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
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
