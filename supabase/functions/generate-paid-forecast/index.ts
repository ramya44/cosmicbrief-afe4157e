import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - strict and narrow
const InputSchema = z.object({
  sessionId: z.string().min(10, "Valid Stripe session ID required").max(200),
  birthDateTimeUtc: z.string().min(1, "Birth datetime is required"),
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lon: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  name: z.string().max(100).optional(),
  pivotalTheme: z.string().max(50).optional(),
  freeForecast: z.string().max(5000).optional(),
  freeForecastId: z.string().uuid().optional(),
  deviceId: z.string().max(100).optional(),
});

// Rate limiting: 2 requests per minute per IP (very strict for expensive paid endpoint)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 2;
const RATE_LIMIT_WINDOW_MS = 60000;

// Track used session IDs to prevent replay attacks (in-memory, resets on deploy)
const usedSessionIds = new Set<string>();

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  // Cleanup old entries
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

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-PAID-FORECAST] ${step}${detailsStr}`);
};

// OpenAI configuration
const PRIMARY_MODEL = "gpt-5-2025-08-07";
const FALLBACK_MODEL = "gpt-5-mini-2025-08-07";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

// Expected price for validation (in cents) - $20
const EXPECTED_AMOUNT = 2000;

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

function sleep(ms: number): Promise<void> {
  const jitter = Math.random() * 300;
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

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
      logStep(`[${modelName}] Attempt ${attempt}/${maxRetries}`);
      const startTime = Date.now();
      
      const response = await fetch(url, options);
      const elapsed = Date.now() - startTime;
      
      logStep(`[${modelName}] Attempt ${attempt} completed`, { elapsed, status: response.status });

      if (response.ok || !RETRYABLE_STATUS_CODES.includes(response.status)) {
        return { response, attempts };
      }

      const errorText = await response.text();
      console.warn(`[${modelName}] Retryable error ${response.status}: ${errorText.slice(0, 500)}`);
      lastError = new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);

      if (attempt < maxRetries) {
        await sleep(backoffMs);
      }
    } catch (networkError) {
      console.error(`[${modelName}] Network error on attempt ${attempt}:`, networkError);
      lastError = networkError instanceof Error ? networkError : new Error(String(networkError));

      if (attempt < maxRetries) {
        await sleep(backoffMs);
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

// Compute zodiac sign from birth date string
function getZodiacSign(birthDateTimeUtc: string): string {
  const date = new Date(birthDateTimeUtc);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  
  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    logStep("Function started", { ip: clientIP });

    // Validate environment
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR: Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    const rawInput = await req.json();
    const parseResult = InputSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation error", { errors: errorMessages });
      return new Response(
        JSON.stringify({ error: "Invalid input data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { sessionId, birthDateTimeUtc, lat, lon, name, pivotalTheme, freeForecast, freeForecastId, deviceId } = parseResult.data;

    // ========== CRITICAL: STRIPE PAYMENT VERIFICATION ==========
    logStep("Verifying Stripe payment", { sessionId: sessionId.slice(0, 20) + "..." });

    // Check for replay attack (session already used)
    if (usedSessionIds.has(sessionId)) {
      logStep("SECURITY: Replay attack detected", { sessionId: sessionId.slice(0, 20) });
      return new Response(
        JSON.stringify({ error: "This payment session has already been processed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      logStep("ERROR: Invalid Stripe session", { error: stripeError instanceof Error ? stripeError.message : String(stripeError) });
      return new Response(
        JSON.stringify({ error: "Invalid payment session" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify payment status
    if (session.payment_status !== "paid") {
      logStep("SECURITY: Payment not completed", { status: session.payment_status });
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify amount received
    if (!session.amount_total || session.amount_total < EXPECTED_AMOUNT) {
      logStep("SECURITY: Insufficient payment amount", { amount: session.amount_total, expected: EXPECTED_AMOUNT });
      return new Response(
        JSON.stringify({ error: "Invalid payment amount" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify session is not too old (max 1 hour)
    const sessionCreated = session.created * 1000;
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - sessionCreated > maxAge) {
      logStep("SECURITY: Session expired", { created: new Date(sessionCreated).toISOString() });
      return new Response(
        JSON.stringify({ error: "Payment session expired. Please purchase again." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark session as used (prevent replay)
    usedSessionIds.add(sessionId);
    
    // Cleanup old session IDs (keep last 1000)
    if (usedSessionIds.size > 1000) {
      const toDelete = Array.from(usedSessionIds).slice(0, 500);
      toDelete.forEach(id => usedSessionIds.delete(id));
    }

    const customerEmail = session.customer_details?.email || "";
    const sessionMetadata = session.metadata || {};

    logStep("Payment verified", { 
      amount: session.amount_total,
      email: customerEmail ? customerEmail.slice(0, 3) + "***" : "none",
      sessionAge: Math.round((Date.now() - sessionCreated) / 1000) + "s"
    });

    // Check if forecast already exists for this session (idempotency)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: existingForecast } = await supabase
      .from('paid_forecasts')
      .select('id, generation_status, strategic_forecast')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingForecast) {
      if (existingForecast.generation_status === 'complete' && existingForecast.strategic_forecast) {
        logStep("Returning existing forecast", { id: existingForecast.id });
        return new Response(JSON.stringify({
          success: true,
          forecast: existingForecast.strategic_forecast,
          forecastId: existingForecast.id,
          cached: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // If previous attempt failed, we'll regenerate
      logStep("Previous attempt found, regenerating", { status: existingForecast.generation_status });
    }

    // ========== GENERATE FORECAST ==========
    logStep("Starting forecast generation");

    const userName = name || sessionMetadata.name || "the seeker";
    const targetYear = "2026";
    const priorYear = "2025";

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
    let generationError: string | null = null;

    // Try primary model with retries
    try {
      logStep(`Starting generation with primary model: ${PRIMARY_MODEL}`);
      const payload = createPayload(PRIMARY_MODEL);
      
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
      logStep(`Attempting fallback model: ${FALLBACK_MODEL}`);
      modelUsed = FALLBACK_MODEL;
      usedFallback = true;
      
      try {
        const fallbackPayload = createPayload(FALLBACK_MODEL);
        const fallbackResult = await fetchWithRetry(
          "https://api.openai.com/v1/chat/completions",
          fetchOptions(fallbackPayload),
          FALLBACK_MODEL,
          1
        );
        resp = fallbackResult.response;
        totalAttempts += fallbackResult.attempts;
        
        if (!resp.ok) {
          const errorText = await resp.text();
          generationError = `Fallback model failed: ${resp.status}`;
          throw new Error(generationError);
        }
      } catch (fallbackError) {
        generationError = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        
        // Save failed attempt
        await saveForecastToDb(supabase, {
          sessionId,
          customerEmail,
          birthDateTimeUtc,
          lat,
          lon,
          name: userName,
          freeForecast,
          strategicForecast: null,
          modelUsed,
          generationStatus: 'failed',
          generationError,
          totalAttempts,
          tokenUsage: null,
          deviceId,
        });

        return new Response(
          JSON.stringify({ error: "Unable to generate forecast. Our team has been notified." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    logStep(`Generation succeeded`, { model: modelUsed, attempts: totalAttempts, usedFallback });

    const data = await resp.json();
    const tokenUsage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : null;

    const generatedContent = data?.choices?.[0]?.message?.content ?? "";

    if (!generatedContent.trim()) {
      generationError = "Empty content in response";
      await saveForecastToDb(supabase, {
        sessionId,
        customerEmail,
        birthDateTimeUtc,
        lat,
        lon,
        name: userName,
        freeForecast,
        strategicForecast: null,
        modelUsed,
        generationStatus: 'failed',
        generationError,
        totalAttempts,
        tokenUsage,
        deviceId,
      });

      return new Response(
        JSON.stringify({ error: "Unable to generate forecast. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let forecast: unknown;
    try {
      forecast = extractFirstJsonObject(generatedContent);
    } catch (parseError) {
      console.error("Failed to parse strategic forecast JSON:", parseError);
      generationError = "JSON parse error";
      
      await saveForecastToDb(supabase, {
        sessionId,
        customerEmail,
        birthDateTimeUtc,
        lat,
        lon,
        name: userName,
        freeForecast,
        strategicForecast: null,
        modelUsed,
        generationStatus: 'failed',
        generationError,
        totalAttempts,
        tokenUsage,
        deviceId,
      });

      return new Response(
        JSON.stringify({ error: "Unable to process forecast response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== SAVE TO DATABASE ==========
    const forecastId = await saveForecastToDb(supabase, {
      sessionId,
      customerEmail,
      birthDateTimeUtc,
      lat,
      lon,
      name: userName,
      freeForecast,
      strategicForecast: forecast,
      modelUsed,
      generationStatus: 'complete',
      generationError: null,
      totalAttempts,
      tokenUsage,
      deviceId,
    });

    logStep("Forecast saved successfully", { forecastId });

    // Update free forecast email if provided
    if (freeForecastId && customerEmail) {
      try {
        await supabase
          .from('free_forecasts')
          .update({ email: customerEmail })
          .eq('id', freeForecastId);
        logStep("Free forecast email updated");
      } catch (updateErr) {
        console.error("Failed to update free forecast email:", updateErr);
      }
    }

    // Fetch guest token for the saved forecast
    const { data: forecastData } = await supabase
      .from('paid_forecasts')
      .select('guest_token')
      .eq('id', forecastId)
      .single();

    return new Response(JSON.stringify({
      success: true,
      forecast,
      forecastId,
      guestToken: forecastData?.guest_token,
      modelUsed,
      totalAttempts,
      tokenUsage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-paid-forecast:", error);
    return new Response(
      JSON.stringify({ error: "Unable to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to save forecast to database
// deno-lint-ignore no-explicit-any
async function saveForecastToDb(
  supabase: any,
  params: {
    sessionId: string;
    customerEmail: string;
    birthDateTimeUtc: string;
    lat: number;
    lon: number;
    name: string;
    freeForecast?: string;
    strategicForecast: unknown;
    modelUsed: string;
    generationStatus: string;
    generationError: string | null;
    totalAttempts: number;
    tokenUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | null;
    deviceId?: string;
  }
): Promise<string | null> {
  // Extract birth date/time from UTC string
  const birthDate = params.birthDateTimeUtc.split('T')[0];
  const birthTime = params.birthDateTimeUtc.split('T')[1]?.slice(0, 5) || "00:00";
  const zodiacSign = getZodiacSign(params.birthDateTimeUtc);

  // Upsert to handle both new inserts and updates for failed retries
  const { data, error } = await supabase
    .from('paid_forecasts')
    .upsert({
      stripe_session_id: params.sessionId,
      customer_email: params.customerEmail,
      customer_name: params.name !== "the seeker" ? params.name : null,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_time_utc: params.birthDateTimeUtc,
      birth_place: `${params.lat},${params.lon}`, // Store coords as fallback
      latitude: params.lat,
      longitude: params.lon,
      free_forecast: params.freeForecast || null,
      strategic_forecast: params.strategicForecast,
      amount_paid: EXPECTED_AMOUNT,
      model_used: params.modelUsed,
      generation_status: params.generationStatus,
      generation_error: params.generationError,
      retry_count: params.totalAttempts,
      prompt_tokens: params.tokenUsage?.promptTokens || null,
      completion_tokens: params.tokenUsage?.completionTokens || null,
      total_tokens: params.tokenUsage?.totalTokens || null,
      zodiac_sign: zodiacSign,
      payment_status: 'paid',
      tier: 'paid',
      device_id: params.deviceId || null,
    }, {
      onConflict: 'stripe_session_id',
    })
    .select('id, guest_token')
    .single();

  if (error) {
    console.error("Database save error:", error);
    return null;
  }

  return data?.id || null;
}
