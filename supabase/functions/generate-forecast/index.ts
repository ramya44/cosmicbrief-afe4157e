import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Normalize UTC datetime to 30-minute increments for cache key
function normalizeUtcDatetime(utcDatetime: string): string {
  const date = new Date(utcDatetime);
  const minutes = date.getUTCMinutes();
  const normalizedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
  const normalizedHours = minutes >= 45 ? date.getUTCHours() + 1 : date.getUTCHours();

  // Handle day rollover
  date.setUTCHours(normalizedHours % 24, normalizedMinutes, 0, 0);
  if (normalizedHours >= 24) {
    date.setUTCDate(date.getUTCDate() + 1);
    date.setUTCHours(0);
  }

  return date.toISOString();
}

// Deterministic selection of pivotal life element based on age and style seed
function pickPivotalLifeElement(age: number, styleSeed: string): string {
  const seedNum = Array.from(styleSeed).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let options: string[];
  if (age < 35) options = ["career", "education", "identity"];
  else if (age < 50) options = ["career", "relationships", "family", "health"];
  else if (age < 60) options = ["health", "family", "relationships", "purpose"];
  else options = ["health", "family", "relationships", "meaning", "stewardship"];
  return options[seedNum % options.length];
}

// Calculate age from UTC birth datetime
function calculateAge(birthDatetimeUtc: string, targetYear: number): number {
  const birthDate = new Date(birthDatetimeUtc);
  const birthYear = birthDate.getUTCFullYear();
  return targetYear - birthYear;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { birthDate, birthTime, birthPlace, birthTimeUtc } = await req.json();

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

    // Require birthTimeUtc for proper theme caching
    if (!birthTimeUtc) {
      console.warn("birthTimeUtc not provided - using local date for age calculation");
    }

    // Target year
    const targetYear = new Date().getFullYear();
    const priorYear = targetYear - 1;

    // Calculate age based on UTC birth datetime (or fallback to local date)
    let age: number;
    if (birthTimeUtc) {
      age = calculateAge(birthTimeUtc, targetYear);
    } else {
      const dateObj = new Date(birthDate);
      age = targetYear - dateObj.getFullYear();
    }

    // Format date for display
    const dateObj = new Date(birthDate);
    const formattedDob = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${String(dateObj.getDate()).padStart(
      2,
      "0",
    )}/${dateObj.getFullYear()}`;

    

    // Generate style seed based on UTC datetime for consistency
    const styleSeedInput = birthTimeUtc || `${birthDate}+${birthTime}+${birthPlace}`;
    const styleSeed = await generateStyleSeed(styleSeedInput);

    // Create Supabase client for cache operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let pivotalLifeElement: string;

    // Only use cache if we have UTC datetime
    if (birthTimeUtc) {
      // Normalize UTC datetime for cache key (30-minute increments)
      const normalizedUtc = normalizeUtcDatetime(birthTimeUtc);

      console.log(`Cache lookup: normalized UTC=${normalizedUtc}, targetYear=${targetYear}`);

      // Check theme cache using UTC datetime
      const { data: cachedTheme, error: cacheError } = await supabase
        .from("theme_cache")
        .select("pivotal_theme")
        .eq("birth_datetime_utc", normalizedUtc)
        .eq("target_year", String(targetYear))
        .maybeSingle();

      if (cacheError) {
        console.error("Cache lookup error:", cacheError);
      }

      if (cachedTheme?.pivotal_theme) {
        // Cache hit - use existing theme
        pivotalLifeElement = cachedTheme.pivotal_theme;
        console.log(
          `Cache HIT: Using cached theme "${pivotalLifeElement}" for UTC=${normalizedUtc}, targetYear=${targetYear}`,
        );
      } else {
        // Cache miss - generate and store new theme
        pivotalLifeElement = pickPivotalLifeElement(age, styleSeed);

        console.log(
          `Cache MISS: Generated new theme "${pivotalLifeElement}" for UTC=${normalizedUtc}, targetYear=${targetYear}, age=${age}`,
        );

        // Insert into cache (ignore errors - cache is optional)
        const { error: insertError } = await supabase.from("theme_cache").insert({
          birth_datetime_utc: normalizedUtc,
          target_year: String(targetYear),
          pivotal_theme: pivotalLifeElement,
        });

        if (insertError) {
          console.error("Cache insert error:", insertError);
        }
      }
    } else {
      // No UTC datetime - just generate theme without caching
      pivotalLifeElement = pickPivotalLifeElement(age, styleSeed);
      console.log(`No UTC datetime provided - generated theme "${pivotalLifeElement}" without caching`);
    }

    console.log(
      `Generating forecast for: age ${age}, ${formattedDob} ${birthTime} in ${birthPlace}, UTC=${birthTimeUtc || "N/A"}, styleSeed: ${styleSeed}, pivotalLifeElement: ${pivotalLifeElement}`,
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

- Do NOT use em dashes

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

    const userPrompt = `Create a concise preview of the user’s ${targetYear}.

This preview should feel specific, grounded, and slightly unfinished in a way that creates curiosity.

INPUTS:
- Age: ${age}
- Date of birth: ${birthDate}
- Time of birth: ${birthTime}
- Place of birth: ${birthPlace}
- Style seed: ${styleSeed}
- Pivotal life element (preselected): ${pivotalLifeElement}
- Prior year: ${priorYear}

LENGTH:
- 120–160 words total
- Plain text only

EDGE REQUIREMENT (MANDATORY):
Across the preview, include at least TWO moments where:
- A cost, friction, or limit is implied if something is misread, delayed, or treated casually
- The consequence is NOT resolved
- No correction or advice is offered

The reader should feel oriented, but not fully equipped.

STYLE AND SAFETY RULES:
- Grounded, composed, quietly confident
- Observational, not therapeutic
- Avoid abstract or managerial phrasing (e.g., "systems," "processes," "strategies," "management," "momentum").
- Write in direct second-person language that reflects lived experience.
- Do NOT mention astrology, zodiac signs, or systems
- Do NOT explicitly mention age, birthplace, or time of birth
- Avoid medical or literal health claims
- Do NOT use em dashes

STRUCTURE:
Write exactly in the following format with headers.
Do not add extra sections.
Do not add commentary.

---

Your Natural Orientation  
Write 3–4 sentences describing how the user typically responds to uncertainty or pressure at this stage of life.
- Frame this as an orientation or default pattern, not a personality trait
- Describe the orientation using concrete internal behaviors (e.g., how you decide, what you carry, what you delay, what you absorb).
- Describe how this orientation has generally helped them
- Name one way this same pattern is beginning to show a limit now
- Do not give advice or suggest change
- Do not summarize or generalize.

Your ${priorYear}  
Write 2–3 sentences describing what the prior year felt like emotionally or psychologically.
- Focus on pacing, effort, and what was required to keep things moving
- Explicitly state what stopped working or felt increasingly costly
- Do not resolve the tension

Your Pivotal Life Theme  
Write 2–3 sentences describing how attention naturally gathers around "${pivotalLifeElement}" in ${targetYear}.
- Explicitly state what happens when last year’s logic is applied to this year
- Do not explain how to fix it

The Quiet Undercurrent  
Write 1–2 sentences describing a subtle, ongoing tension within "${pivotalLifeElement}" this year.
- Use language like balancing, recalibration, or competing pulls
- Do not describe outcomes
- Do not give advice

Stop when finished.
`.trim();

    const payload = {
      model: "gpt-4.1-mini-2025-04-14",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.8,
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

    const forecastText = generatedContent.trim();

    // Save to free_forecasts table (non-blocking failure)
    let freeForecastId: string | undefined;
    try {
      const { data: saveData, error: saveError } = await supabase
        .from("free_forecasts")
        .insert({
          birth_date: birthDate,
          birth_time: birthTime,
          birth_place: birthPlace,
          birth_time_utc: birthTimeUtc || null,
          forecast_text: forecastText,
          pivotal_theme: pivotalLifeElement,
        })
        .select("id")
        .single();

      if (saveError) {
        console.error("Error saving free forecast:", saveError);
      } else {
        freeForecastId = saveData?.id;
        console.log("Free forecast saved with ID:", freeForecastId);
      }
    } catch (saveErr) {
      console.error("Failed to save free forecast:", saveErr);
    }

    return new Response(
      JSON.stringify({
        forecast: forecastText,
        pivotalTheme: pivotalLifeElement,
        freeForecastId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in generate-forecast function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
