import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= INPUT VALIDATION & LIMITS =============
const MAX_NAME_LENGTH = 100;
const MAX_FREE_FORECAST_LENGTH = 5000;
const MAX_REQUEST_BODY_SIZE = 10000; // 10KB max for paid forecast requests

// Input validation schema - birth data now optional (fetched from DB)
const InputSchema = z.object({
  sessionId: z.string().min(10, "Valid Stripe session ID required").max(200),
  birthDateTimeUtc: z.string().max(50).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  name: z.string().max(MAX_NAME_LENGTH).optional(),
  pivotalTheme: z.string().max(50).optional(),
  freeForecast: z.string().max(MAX_FREE_FORECAST_LENGTH).optional(),
  freeForecastId: z.string().uuid().optional(),
  deviceId: z.string().max(100).optional(),
});

// ============= ABUSE DETECTION & ALERTING =============
const PAID_ABUSE_ALERT_THRESHOLD = 20; // Alert if more than 20 paid forecasts per hour
const paidHourlyGenerationCount = { count: 0, hourStart: Date.now() };
const PAID_ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between alerts
let paidLastAlertTime = 0;

// deno-lint-ignore no-explicit-any
async function checkAndAlertPaidAbuse(supabase: any, ip: string, deviceId: string | undefined): Promise<void> {
  const now = Date.now();

  // Reset hourly counter if hour has passed
  if (now - paidHourlyGenerationCount.hourStart > 60 * 60 * 1000) {
    paidHourlyGenerationCount.count = 0;
    paidHourlyGenerationCount.hourStart = now;
  }

  paidHourlyGenerationCount.count++;

  // Check if threshold exceeded and we haven't alerted recently
  if (
    paidHourlyGenerationCount.count >= PAID_ABUSE_ALERT_THRESHOLD &&
    now - paidLastAlertTime > PAID_ALERT_COOLDOWN_MS
  ) {
    paidLastAlertTime = now;

    logStep("ABUSE_THRESHOLD_EXCEEDED", {
      hourlyCount: paidHourlyGenerationCount.count,
      threshold: PAID_ABUSE_ALERT_THRESHOLD,
    });

    // Write abuse event to database
    try {
      await supabase.from("abuse_events").insert({
        event_type: "paid_hourly_threshold_exceeded",
        ip_address: ip,
        device_id: deviceId || null,
        hourly_count: paidHourlyGenerationCount.count,
        threshold: PAID_ABUSE_ALERT_THRESHOLD,
        details: { function: "generate-paid-forecast", timestamp: new Date().toISOString() },
      });
    } catch (err) {
      console.error("Failed to write abuse event:", err);
    }

    // Send email alert
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Cosmic Brief Alerts <alerts@cosmicbrief.com>",
            to: ["contact@cosmicbrief.com"],
            subject: `🚨 Abuse Alert: Paid Forecast Threshold Exceeded`,
            html: `
              <h2>Paid Forecast Abuse Threshold Exceeded</h2>
              <p><strong>Function:</strong> generate-paid-forecast</p>
              <p><strong>Hourly Count:</strong> ${paidHourlyGenerationCount.count}</p>
              <p><strong>Threshold:</strong> ${PAID_ABUSE_ALERT_THRESHOLD}</p>
              <p><strong>Last IP:</strong> ${ip}</p>
              <p><strong>Device ID:</strong> ${deviceId || "N/A"}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              <p style="color: red;"><strong>⚠️ This is a high-priority alert - paid forecasts are expensive!</strong></p>
            `,
          }),
        });
        logStep("Paid abuse alert email sent");
      }
    } catch (emailErr) {
      console.error("Failed to send paid abuse alert email:", emailErr);
    }
  }
}

// Rate limiting: 2 requests per minute per IP (very strict for expensive paid endpoint)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 2;
const RATE_LIMIT_WINDOW_MS = 60000;

// Track used session IDs to prevent replay attacks (in-memory, resets on deploy)
const usedSessionIds = new Set<string>();

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
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
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GENERATE-PAID-FORECAST] ${step}${detailsStr}`);
};

// Hash token for logging (first 8 chars of SHA-256)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// OpenAI configuration
const PRIMARY_MODEL = "gpt-5-2025-08-07";
const FALLBACK_MODEL = "gpt-5-mini-2025-08-07";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];


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
  maxRetries: number = MAX_RETRIES,
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
  const requestStartTime = Date.now();
  let deviceId: string | undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    logStep("REQUEST_COMPLETE", {
      outcome: "fail",
      reason: "rate_limit",
      ip: clientIP,
      deviceId: null,
      latencyMs: Date.now() - requestStartTime,
    });
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    logStep("Request started", { ip: clientIP });

    // Validate environment
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "missing_env_vars",
        ip: clientIP,
        deviceId: null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check request body size
    const rawBody = await req.text();
    if (rawBody.length > MAX_REQUEST_BODY_SIZE) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "request_too_large",
        ip: clientIP,
        bodySize: rawBody.length,
        maxSize: MAX_REQUEST_BODY_SIZE,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Request too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = JSON.parse(rawBody);
    } catch {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "invalid_json",
        ip: clientIP,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parseResult = InputSchema.safeParse(rawInput);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map((e) => e.message).join(", ");
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "validation_error",
        ip: clientIP,
        deviceId: null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Invalid input data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sessionId, birthDateTimeUtc, lat, lon, name, pivotalTheme, freeForecast, freeForecastId } =
      parseResult.data;
    deviceId = parseResult.data.deviceId;

    // ========== CRITICAL: STRIPE PAYMENT VERIFICATION ==========
    logStep("Verifying Stripe payment", { sessionId: sessionId.slice(0, 20) + "..." });

    // Check for replay attack (session already used)
    if (usedSessionIds.has(sessionId)) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "replay_attack",
        ip: clientIP,
        deviceId: deviceId || null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "This payment session has already been processed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "invalid_stripe_session",
        ip: clientIP,
        deviceId: deviceId || null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Invalid payment session" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment status
    if (session.payment_status !== "paid") {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "payment_not_completed",
        ip: clientIP,
        deviceId: deviceId || null,
        paymentStatus: session.payment_status,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the amount paid (may be $0 if promotion code was applied)
    const amountPaid = session.amount_total || 0;
    logStep("Payment verified", { amountPaid, currency: session.currency });

    // Verify session is not too old (max 1 hour)
    const sessionCreated = session.created * 1000;
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - sessionCreated > maxAge) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "session_expired",
        ip: clientIP,
        deviceId: deviceId || null,
        sessionAge: Math.round((Date.now() - sessionCreated) / 1000),
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Payment session expired. Please purchase again." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark session as used (prevent replay)
    usedSessionIds.add(sessionId);

    // Cleanup old session IDs (keep last 1000)
    if (usedSessionIds.size > 1000) {
      const toDelete = Array.from(usedSessionIds).slice(0, 500);
      toDelete.forEach((id) => usedSessionIds.delete(id));
    }

    const customerEmail = session.customer_details?.email || "";
    const sessionMetadata = session.metadata || {};

    logStep("Payment verified", {
      amount: session.amount_total,
      email: customerEmail ? customerEmail.slice(0, 3) + "***" : "none",
      sessionAge: Math.round((Date.now() - sessionCreated) / 1000) + "s",
    });

    // Check if forecast already exists for this session (idempotency)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingForecast } = await supabase
      .from("paid_forecasts")
      .select("id, generation_status, strategic_forecast")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingForecast) {
      if (existingForecast.generation_status === "complete" && existingForecast.strategic_forecast) {
        logStep("Returning existing forecast", { id: existingForecast.id });
        return new Response(
          JSON.stringify({
            success: true,
            forecast: existingForecast.strategic_forecast,
            forecastId: existingForecast.id,
            cached: true,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      // If previous attempt failed, we'll regenerate
      logStep("Previous attempt found, regenerating", { status: existingForecast.generation_status });
    }

    // ========== FETCH BIRTH DATA FROM DATABASE IF NOT PROVIDED ==========
    let finalBirthDateTimeUtc = birthDateTimeUtc;
    let finalLat = lat;
    let finalLon = lon;
    let finalName = name;
    let finalFreeForecast = freeForecast;
    let finalPivotalTheme = pivotalTheme;

    // Store cached birth chart data from free_forecasts if available
    let cachedBirthChartData: {
      moonSign?: string;
      moonSignId?: number;
      moonSignLord?: string;
      sunSign?: string;
      sunSignId?: number;
      sunSignLord?: string;
      nakshatra?: string;
      nakshatraId?: number;
      nakshatraPada?: number;
      nakshatraLord?: string;
      nakshatraGender?: string;
      deity?: string;
      ganam?: string;
      birthSymbol?: string;
      animalSign?: string;
      nadi?: string;
      luckyColor?: string;
      bestDirection?: string;
      syllables?: string;
      birthStone?: string;
    } | null = null;

    // Get freeForecastId from request or Stripe metadata
    const freeForecastIdToUse = freeForecastId || sessionMetadata.freeForecastId;

    // If birth data not provided, fetch from free_forecasts table
    if ((!finalBirthDateTimeUtc || finalLat === undefined || finalLon === undefined) && freeForecastIdToUse) {
      logStep("Fetching birth data from database", { freeForecastId: freeForecastIdToUse });

      const { data: freeForecastRow, error: ffError } = await supabase
        .from("free_forecasts")
        .select("birth_time_utc, latitude, longitude, birth_place, forecast_text, pivotal_theme, customer_name, moon_sign, moon_sign_id, moon_sign_lord, sun_sign, sun_sign_id, sun_sign_lord, nakshatra, nakshatra_id, nakshatra_pada, nakshatra_lord, nakshatra_gender, deity, ganam, birth_symbol, animal_sign, nadi, lucky_color, best_direction, syllables, birth_stone")
        .eq("id", freeForecastIdToUse)
        .maybeSingle();

      if (ffError || !freeForecastRow) {
        logStep("REQUEST_COMPLETE", {
          outcome: "fail",
          reason: "free_forecast_not_found",
          ip: clientIP,
          deviceId: deviceId || null,
          freeForecastId: freeForecastIdToUse,
          latencyMs: Date.now() - requestStartTime,
        });
        return new Response(JSON.stringify({ error: "Birth data not found. Please contact support." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      finalBirthDateTimeUtc = finalBirthDateTimeUtc || freeForecastRow.birth_time_utc;
      finalLat = finalLat ?? freeForecastRow.latitude;
      finalLon = finalLon ?? freeForecastRow.longitude;
      finalName = finalName || freeForecastRow.customer_name || freeForecastRow.birth_place;
      finalFreeForecast = finalFreeForecast || freeForecastRow.forecast_text;
      finalPivotalTheme = finalPivotalTheme || freeForecastRow.pivotal_theme;

      // Cache birth chart data from free_forecasts if available
      if (freeForecastRow.moon_sign) {
        cachedBirthChartData = {
          moonSign: freeForecastRow.moon_sign,
          moonSignId: freeForecastRow.moon_sign_id,
          moonSignLord: freeForecastRow.moon_sign_lord,
          sunSign: freeForecastRow.sun_sign,
          sunSignId: freeForecastRow.sun_sign_id,
          sunSignLord: freeForecastRow.sun_sign_lord,
          nakshatra: freeForecastRow.nakshatra,
          nakshatraId: freeForecastRow.nakshatra_id,
          nakshatraPada: freeForecastRow.nakshatra_pada,
          nakshatraLord: freeForecastRow.nakshatra_lord,
          nakshatraGender: freeForecastRow.nakshatra_gender,
          deity: freeForecastRow.deity,
          ganam: freeForecastRow.ganam,
          birthSymbol: freeForecastRow.birth_symbol,
          animalSign: freeForecastRow.animal_sign,
          nadi: freeForecastRow.nadi,
          luckyColor: freeForecastRow.lucky_color,
          bestDirection: freeForecastRow.best_direction,
          syllables: freeForecastRow.syllables,
          birthStone: freeForecastRow.birth_stone,
        };
      }

      logStep("Birth data retrieved from database", {
        hasDateTime: !!finalBirthDateTimeUtc,
        hasCoords: finalLat !== undefined && finalLon !== undefined,
        hasBirthChart: !!cachedBirthChartData,
      });
    }

    // Validate we have required birth data
    if (!finalBirthDateTimeUtc || finalLat === undefined || finalLon === undefined) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "missing_birth_data",
        ip: clientIP,
        deviceId: deviceId || null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Birth data is required. Please contact support." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== GENERATE FORECAST ==========
    logStep("Starting forecast generation");

    const userName = finalName || sessionMetadata.name || "the seeker";
    const targetYear = "2026";
    const priorYear = "2025";

    // Birth chart data interface with all additional info fields
    interface BirthChartData {
      moonSign?: string;
      moonSignId?: number;
      moonSignLord?: string;
      sunSign?: string;
      sunSignId?: number;
      sunSignLord?: string;
      nakshatra?: string;
      nakshatraId?: number;
      nakshatraPada?: number;
      nakshatraLord?: string;
      nakshatraGender?: string;
      deity?: string;
      ganam?: string;
      birthSymbol?: string;
      animalSign?: string;
      nadi?: string;
      luckyColor?: string;
      bestDirection?: string;
      syllables?: string;
      birthStone?: string;
    }
    let birthChartData: BirthChartData = {};

    // First try to use cached data from free_forecasts if available
    if (cachedBirthChartData) {
      birthChartData = cachedBirthChartData;
      logStep("Using cached birth chart from free_forecasts", { 
        moonSign: birthChartData.moonSign, 
        sunSign: birthChartData.sunSign, 
        nakshatra: birthChartData.nakshatra 
      });
    } else {
      // Fetch fresh from Prokerala API
      try {
        logStep("Fetching birth chart", { datetime: finalBirthDateTimeUtc, lat: finalLat, lon: finalLon });

        const birthChartResponse = await fetch(`${supabaseUrl}/functions/v1/get-birth-chart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            datetime: finalBirthDateTimeUtc,
            latitude: finalLat,
            longitude: finalLon,
            ayanamsa: 1, // Lahiri
          }),
        });

        if (birthChartResponse.ok) {
          const chartResult = await birthChartResponse.json();
          birthChartData = {
            moonSign: chartResult.moonSign,
            moonSignId: chartResult.moonSignId,
            moonSignLord: chartResult.moonSignLord,
            sunSign: chartResult.sunSign,
            sunSignId: chartResult.sunSignId,
            sunSignLord: chartResult.sunSignLord,
            nakshatra: chartResult.nakshatra,
            nakshatraId: chartResult.nakshatraId,
            nakshatraPada: chartResult.nakshatraPada,
            nakshatraLord: chartResult.nakshatraLord,
            nakshatraGender: chartResult.nakshatraGender,
            deity: chartResult.deity,
            ganam: chartResult.ganam,
            birthSymbol: chartResult.birthSymbol,
            animalSign: chartResult.animalSign,
            nadi: chartResult.nadi,
            luckyColor: chartResult.luckyColor,
            bestDirection: chartResult.bestDirection,
            syllables: chartResult.syllables,
            birthStone: chartResult.birthStone,
          };
          logStep("Birth chart fetched successfully", { 
            moonSign: birthChartData.moonSign, 
            sunSign: birthChartData.sunSign, 
            nakshatra: birthChartData.nakshatra,
            nakshatraLord: birthChartData.nakshatraLord,
          });
        } else {
          const errorText = await birthChartResponse.text();
          logStep("Birth chart fetch failed", { status: birthChartResponse.status, error: errorText });
        }
      } catch (chartError) {
        logStep("Birth chart fetch exception", {
          error: chartError instanceof Error ? chartError.message : String(chartError),
        });
      }
    }

    const systemPrompt = `You generate premium, decision-oriented annual readings inspired by Indian Jyotish.

These readings are time-sensitive and birth-time-dependent in tone, pressure, and emphasis,
but all interpretation must be expressed in plain, human language.

Your voice is calm, grounded, authoritative, and discerning.
You do not sound mystical, promotional, motivational, or reassuring.

You do not predict literal events.
You describe timing, pressure, support, emotional load, and decision environments
as they are experienced internally by a person over the course of a year.

You may describe general wellbeing, energy, and resource themes.
Do not provide medical, legal, or financial advice.

LANGUAGE CONSTRAINT (CRITICAL):
You may internally rely on Jyotish-based reasoning, but the output must NOT mention or allude to:
- planets
- houses
- dashas
- nakshatras
- yogas
- degrees
- transits
- astrology systems, techniques, or calculations

All mechanics must be translated into lived experience, stakes, and tradeoffs.

INTERNAL INTERPRETATION ROLES (DO NOT REVEAL):
- Sun sign shapes identity pressure, strategic orientation, and what the person is trying to express or protect this year.
- Moon sign shapes emotional pacing, stress sensitivity, relational friction, and how pressure is processed internally.
- Nakshatra shapes intensity, moral pressure, and where costs accumulate if something is mishandled or delayed.
- Birth time affects timing sensitivity, readiness, and how quickly pressure builds or resolves.

These influences must show up through emphasis, constraints, and consequences,
never through explanation or symbolism.

PERSONALIZATION REQUIREMENTS (STRICT):
The reading must feel unmistakably personal and non-transferable.
It must include:
- one core emotional or psychological drive shaping the year
- one primary pressure or constraint specific to this person
- one growth or stabilization opportunity unique to this person
- at least three tensions that would not plausibly apply to a random individual
- at least one insight that would feel incorrect if applied to the wrong person

Avoid generic human dilemmas.
Avoid statements that could apply broadly without losing accuracy.

QUALITY CHECK (SILENT):
If this reading could reasonably be reused for another person without feeling wrong,
revise until it cannot.

FORMAT REQUIREMENT:
Output must follow the exact JSON schema provided by the user.
Return valid JSON only.`;

    const userPrompt = `Generate a Strategic Year Map for the target year.

This is a personal, decision-oriented interpretation, not a general forecast.

INPUTS:
- Name (optional): ${userName}
- Birth moment (UTC): ${finalBirthDateTimeUtc}
- Birth location latitude: ${finalLat}
- Birth location longitude: ${finalLon}
- Sun sign: ${birthChartData.sunSign || "unknown"}
- Moon sign: ${birthChartData.moonSign || "unknown"}
- Nakshatra: ${birthChartData.nakshatra || "unknown"}
- Target year: ${targetYear}
- Prior year: ${priorYear}
${finalPivotalTheme ? `- Pivotal life theme (must be ranked #1): ${finalPivotalTheme}` : ""}

WRITING RULES:
- Plain human language only
- No astrology mechanics or system names
- No literal event predictions
- No follow-up questions
- Write for an intelligent adult who wants clarity, not reassurance
- Be specific and opinionated without certainty

INTERNAL INTERPRETATION RULES (DO NOT REVEAL):
- Use Sun sign to shape strategic orientation and identity pressure this year.
- Use Moon sign to shape emotional pacing, stress response, and relational friction.
- Use Nakshatra to bias intensity, moral pressure, and where costs accumulate if mishandled.
- Let these influences appear through stakes, tradeoffs, and constraints, not symbolism or explanation.
- Do not mention astrology, signs, or systems explicitly.

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
Anchor this explanation in identity orientation, emotional pacing, and intensity or moral pressure without naming techniques or systems.

4) Life area prioritization  
Rank these areas from most to least important for alignment this year:
- Career and contribution
- Money and resources
- Relationships and boundaries
- Health and energy
- Personal growth and identity

Explain why each ranks where it does and what over- or under-investment looks like.
If a pivotal theme is provided, it must be ranked #1.

5) Deeper arc  
Place this year within a three-year arc:
why the prior year felt the way it did,
why this year is pivotal,
what it quietly prepares for next year.

6) Seasonal map  
Describe four human seasons as phases of lived experience.
Do not reference months, quarters, or business cycles.

For each phase include:
- what matters
- what to lean into
- what to protect
- what to watch for

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
  "deeper_arc": "...",
  "seasonal_map": [
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."},
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."},
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."},
    {"what_matters":"...","lean_into":"...","protect":"...","watch_for":"..."}
  ],
  "crossroads_moment": "...",
  "operating_principles": [
    {"principle":"...","meaning":"..."}
  ]
}`;

    // Generate a stable cache key based on the static system prompt version
    // This helps OpenAI route requests to servers with cached prompts
    const SYSTEM_PROMPT_VERSION = "v1.0"; // Increment when system prompt changes
    const promptCacheKey = `strategic-year-map-${SYSTEM_PROMPT_VERSION}`;

    const createPayload = (model: string) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8000,
      // Enable extended prompt caching (24h retention) for cost/latency savings
      prompt_cache_retention: "24h",
      // Consistent cache key helps route to servers with cached prompts
      prompt_cache_key: promptCacheKey,
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
        PRIMARY_MODEL,
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
          1,
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
          birthDateTimeUtc: finalBirthDateTimeUtc,
          lat: finalLat,
          lon: finalLon,
          name: userName,
          freeForecast: finalFreeForecast,
          strategicForecast: null,
          modelUsed,
          generationStatus: "failed",
          generationError,
          totalAttempts,
          tokenUsage: null,
          deviceId,
          amountPaid,
        });

        logStep("REQUEST_COMPLETE", {
          outcome: "fail",
          reason: "generation_failed_all_models",
          ip: clientIP,
          deviceId: deviceId || null,
          model: modelUsed,
          totalAttempts,
          error: generationError,
          latencyMs: Date.now() - requestStartTime,
        });

        return new Response(JSON.stringify({ error: "Unable to generate forecast. Our team has been notified." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    logStep(`Generation succeeded`, { model: modelUsed, attempts: totalAttempts, usedFallback });

    const data = await resp.json();

    // Extract cache metrics from OpenAI response
    const cachedTokens = data.usage?.prompt_tokens_details?.cached_tokens ?? 0;
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const cacheHitRate = promptTokens > 0 ? Math.round((cachedTokens / promptTokens) * 100) : 0;

    logStep("Prompt cache metrics", {
      cachedTokens,
      promptTokens,
      cacheHitRate: `${cacheHitRate}%`,
      completionTokens: data.usage?.completion_tokens ?? 0,
    });

    const tokenUsage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
          cachedTokens: cachedTokens, // Track cached tokens
        }
      : null;

    const generatedContent = data?.choices?.[0]?.message?.content ?? "";

    if (!generatedContent.trim()) {
      generationError = "Empty content in response";
      await saveForecastToDb(supabase, {
        sessionId,
        customerEmail,
        birthDateTimeUtc: finalBirthDateTimeUtc,
        lat: finalLat,
        lon: finalLon,
        name: userName,
        freeForecast: finalFreeForecast,
        strategicForecast: null,
        modelUsed,
        generationStatus: "failed",
        generationError,
        totalAttempts,
        tokenUsage,
        deviceId,
        amountPaid,
      });

      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "empty_response",
        ip: clientIP,
        deviceId: deviceId || null,
        model: modelUsed,
        tokens: tokenUsage,
        totalAttempts,
        latencyMs: Date.now() - requestStartTime,
      });

      return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        birthDateTimeUtc: finalBirthDateTimeUtc,
        lat: finalLat,
        lon: finalLon,
        name: userName,
        freeForecast: finalFreeForecast,
        strategicForecast: null,
        modelUsed,
        generationStatus: "failed",
        generationError,
        totalAttempts,
        tokenUsage,
        deviceId,
        amountPaid,
      });

      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "json_parse_error",
        ip: clientIP,
        deviceId: deviceId || null,
        model: modelUsed,
        tokens: tokenUsage,
        totalAttempts,
        latencyMs: Date.now() - requestStartTime,
      });

      return new Response(JSON.stringify({ error: "Unable to process forecast response. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== SAVE TO DATABASE ==========
    const forecastId = await saveForecastToDb(supabase, {
      sessionId,
      customerEmail,
      birthDateTimeUtc: finalBirthDateTimeUtc,
      lat: finalLat,
      lon: finalLon,
      name: userName,
      freeForecast: finalFreeForecast,
      strategicForecast: forecast,
      modelUsed,
      generationStatus: "complete",
      generationError: null,
      totalAttempts,
      tokenUsage,
      deviceId,
      amountPaid,
    });

    logStep("Forecast saved successfully", { forecastId });

    // Update free forecast email if provided
    if (freeForecastId && customerEmail) {
      try {
        await supabase.from("free_forecasts").update({ email: customerEmail }).eq("id", freeForecastId);
        logStep("Free forecast email updated");
      } catch (updateErr) {
        console.error("Failed to update free forecast email:", updateErr);
      }
    }

    // Fetch guest token for the saved forecast
    const { data: forecastData } = await supabase
      .from("paid_forecasts")
      .select("guest_token")
      .eq("id", forecastId)
      .single();

    // ========== SEND CONFIRMATION EMAIL ==========
    // Send email from backend for resilience (client may lose state)
    if (forecastId && customerEmail) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const appUrl = "https://cosmicbrief.com";
          const guestToken = forecastData?.guest_token;
          const tokenPart = guestToken ? `&guestToken=${encodeURIComponent(guestToken)}` : "";
          // Use hash-based URL for reliable routing on custom domains
          const resultsUrl = `${appUrl}/#/results?forecastId=${forecastId}${tokenPart}`;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Cosmic Brief <noreply@cosmicbrief.com>",
              to: [customerEmail],
              subject: "Your Cosmic Brief is Ready! ✨",
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: Georgia, 'Times New Roman', serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a1a; padding: 40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(218, 165, 32, 0.3); overflow: hidden;">
                          <tr>
                            <td style="padding: 40px 40px 20px; text-align: center;">
                              <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
                              <h1 style="color: #f5f5dc; font-size: 28px; margin: 0; font-weight: normal;">
                                ${userName && userName !== "the seeker" ? `Dear ${userName},` : "Dear Stargazer,"}
                              </h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 20px 40px;">
                              <p style="color: #d4d4c4; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
                                Your personalized <strong style="color: #daa520;">Cosmic Brief</strong> has been crafted and is ready for you to explore.
                              </p>
                              <p style="color: #d4d4c4; font-size: 16px; line-height: 1.8; margin: 0 0 32px;">
                                This comprehensive guide includes your complete astrological analysis with seasonal guidance, key planetary influences, and strategic recommendations for the year ahead.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 0 40px 32px; text-align: center;">
                              <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #daa520 0%, #b8860b 100%); color: #0a0a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(218, 165, 32, 0.3);">
                                View Your Cosmic Brief
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 0 40px 32px;">
                              <div style="background: rgba(218, 165, 32, 0.1); border: 1px solid rgba(218, 165, 32, 0.2); border-radius: 8px; padding: 20px;">
                                <p style="color: #daa520; font-size: 14px; margin: 0; text-align: center;">
                                  💡 <strong>Tip:</strong> Bookmark this link to access your forecast anytime!
                                </p>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 24px 40px; border-top: 1px solid rgba(218, 165, 32, 0.2); text-align: center;">
                              <p style="color: #888; font-size: 12px; margin: 0;">
                                May the stars guide your path ✨
                              </p>
                              <p style="color: #666; font-size: 11px; margin: 12px 0 0;">
                                Cosmic Brief
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
              `,
            }),
          });
          
          // Check if email actually sent successfully
          const emailResult = await emailResponse.json();
          if (!emailResponse.ok) {
            logStep("Email API error", { status: emailResponse.status, error: emailResult });
          } else {
            logStep("Confirmation email sent", { email: customerEmail.slice(0, 3) + "***", id: emailResult.id });
          }
        }
      } catch (emailErr) {
        // Log but don't fail the request for email errors
        console.error("Failed to send confirmation email:", emailErr);
        logStep("Email send failed (non-fatal)", { error: String(emailErr) });
      }
    }

    // Check for abuse and alert if threshold exceeded
    await checkAndAlertPaidAbuse(supabase, clientIP, deviceId);

    // Log successful completion
    const guestTokenHash = forecastData?.guest_token ? await hashToken(forecastData.guest_token) : null;
    logStep("REQUEST_COMPLETE", {
      outcome: "success",
      ip: clientIP,
      deviceId: deviceId || null,
      guestTokenHash,
      forecastId,
      model: modelUsed,
      tokens: tokenUsage,
      totalAttempts,
      latencyMs: Date.now() - requestStartTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        forecast,
        forecastId,
        customerEmail,
        guestToken: forecastData?.guest_token,
        modelUsed,
        totalAttempts,
        tokenUsage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logStep("REQUEST_COMPLETE", {
      outcome: "fail",
      reason: "uncaught_exception",
      ip: clientIP,
      deviceId: deviceId || null,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - requestStartTime,
    });
    return new Response(JSON.stringify({ error: "Unable to process request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    amountPaid: number;
  },
): Promise<string | null> {
  // Extract birth date/time from UTC string
  const birthDate = params.birthDateTimeUtc.split("T")[0];
  const birthTime = params.birthDateTimeUtc.split("T")[1]?.slice(0, 5) || "00:00";
  const zodiacSign = getZodiacSign(params.birthDateTimeUtc);

  // Upsert to handle both new inserts and updates for failed retries
  const { data, error } = await supabase
    .from("paid_forecasts")
    .upsert(
      {
        stripe_session_id: params.sessionId,
        customer_email: params.customerEmail,
        customer_name: params.name !== "the seeker" ? params.name : null,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_time_utc: params.birthDateTimeUtc,
        birth_place: `${params.lat},${params.lon}`, // Store coords as fallback
        free_forecast: params.freeForecast || "",
        strategic_forecast: params.strategicForecast || {},
        amount_paid: params.amountPaid,
        model_used: params.modelUsed,
        generation_status: params.generationStatus,
        generation_error: params.generationError,
        retry_count: params.totalAttempts,
        prompt_tokens: params.tokenUsage?.promptTokens || null,
        completion_tokens: params.tokenUsage?.completionTokens || null,
        total_tokens: params.tokenUsage?.totalTokens || null,
        zodiac_sign: zodiacSign,
        device_id: params.deviceId || null,
      },
      {
        onConflict: "stripe_session_id",
      },
    )
    .select("id, guest_token")
    .single();

  if (error) {
    console.error("Database save error:", error);
    return null;
  }

  return data?.id || null;
}
