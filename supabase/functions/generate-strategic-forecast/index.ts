import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 3 requests per minute per IP (stricter for expensive API)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60000;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  if (rateLimiter.size > 10000) {
    for (const [key, value] of rateLimiter.entries()) {
      if (now > value.resetAt) rateLimiter.delete(key);
    }
  }
  
  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

const PRIMARY_MODEL = "gpt-5-2025-08-07";
const FALLBACK_MODEL = "gpt-5-mini-2025-08-07";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// Retry-able HTTP status codes
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

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

// Sleep with jitter for exponential backoff
function sleep(ms: number): Promise<void> {
  const jitter = Math.random() * 300;
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

// Fetch with retry logic
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  modelName: string,
  maxRetries: number = MAX_RETRIES
): Promise<{ response: Response; attempts: number }> {
  let lastError: Error | null = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
    
    try {
      console.log(`[${modelName}] Attempt ${attempt}/${maxRetries}...`);
      const startTime = Date.now();
      
      const response = await fetch(url, options);
      const elapsed = Date.now() - startTime;
      
      console.log(`[${modelName}] Attempt ${attempt} completed in ${elapsed}ms with status ${response.status}`);

      // If successful or non-retryable error, return
      if (response.ok || !RETRYABLE_STATUS_CODES.includes(response.status)) {
        return { response, attempts };
      }

      // Retryable error
      const errorText = await response.text();
      console.warn(`[${modelName}] Retryable error ${response.status}: ${errorText.slice(0, 500)}`);
      lastError = new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);

      if (attempt < maxRetries) {
        console.log(`[${modelName}] Waiting ${backoffMs}ms before retry...`);
        await sleep(backoffMs);
      }
    } catch (networkError) {
      // Network-level error (fetch failed, timeout, etc.)
      console.error(`[${modelName}] Network error on attempt ${attempt}:`, networkError);
      lastError = networkError instanceof Error ? networkError : new Error(String(networkError));

      if (attempt < maxRetries) {
        console.log(`[${modelName}] Waiting ${backoffMs}ms before retry...`);
        await sleep(backoffMs);
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
Move the reader out of "good vs bad year" thinking.

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
- Begin with "There will come a time this year when…"
- Then "In that moment, it will be tempting to…"
- End with "Remember this:"

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

    const createPayload = (model: string) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8000,
    });

    const fetchOptions = (payload: object) => ({
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let modelUsed = PRIMARY_MODEL;
    let totalAttempts = 0;
    let resp: Response;
    let usedFallback = false;

    // Try primary model with retries
    try {
      console.log(`Starting generation with primary model: ${PRIMARY_MODEL}`);
      const payload = createPayload(PRIMARY_MODEL);
      console.log("OpenAI strategic payload:", JSON.stringify(payload));
      
      const result = await fetchWithRetry(
        "https://api.openai.com/v1/chat/completions",
        fetchOptions(payload),
        PRIMARY_MODEL
      );
      resp = result.response;
      totalAttempts = result.attempts;
      
      if (!resp.ok) {
        throw new Error(`Primary model failed with status ${resp.status}`);
      }
    } catch (primaryError) {
      console.error(`Primary model ${PRIMARY_MODEL} failed after retries:`, primaryError);
      
      // Try fallback model once
      console.log(`Attempting fallback model: ${FALLBACK_MODEL}`);
      modelUsed = FALLBACK_MODEL;
      usedFallback = true;
      
      try {
        const fallbackPayload = createPayload(FALLBACK_MODEL);
        const fallbackResult = await fetchWithRetry(
          "https://api.openai.com/v1/chat/completions",
          fetchOptions(fallbackPayload),
          FALLBACK_MODEL,
          1 // Only one attempt for fallback
        );
        resp = fallbackResult.response;
        totalAttempts += fallbackResult.attempts;
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error("Fallback model also failed:", resp.status, errorText);
          return new Response(
            JSON.stringify({ 
              error: "All generation attempts failed", 
              details: errorText.slice(0, 500),
              totalAttempts,
              primaryModel: PRIMARY_MODEL,
              fallbackModel: FALLBACK_MODEL,
            }), 
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch (fallbackError) {
        console.error("Fallback model network error:", fallbackError);
        return new Response(
          JSON.stringify({ 
            error: "All generation attempts failed",
            details: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
            totalAttempts,
            primaryModel: PRIMARY_MODEL,
            fallbackModel: FALLBACK_MODEL,
          }), 
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log(`Generation succeeded with model: ${modelUsed} after ${totalAttempts} total attempts${usedFallback ? ' (used fallback)' : ''}`);

    const data = await resp.json();
    console.log("Token usage:", JSON.stringify(data.usage));

    const generatedContent = data?.choices?.[0]?.message?.content ?? "";

    if (!generatedContent.trim()) {
      console.error("Empty content in response. Finish reason:", data?.choices?.[0]?.finish_reason);
      return new Response(JSON.stringify({ 
        error: "Empty response from AI", 
        raw: data,
        modelUsed,
        totalAttempts,
      }), {
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
          modelUsed,
          totalAttempts,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Return forecast with metadata including token usage
    return new Response(JSON.stringify({
      forecast,
      modelUsed,
      totalAttempts,
      tokenUsage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : null,
    }), {
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
