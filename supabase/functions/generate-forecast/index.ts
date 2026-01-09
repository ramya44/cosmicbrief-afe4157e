import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Consistent logging helper
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GENERATE-FORECAST] ${step}${detailsStr}`);
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

// ============= INPUT VALIDATION & LIMITS =============
const MAX_BIRTH_PLACE_LENGTH = 200;
const MAX_CAPTCHA_TOKEN_LENGTH = 2000;
const MAX_REQUEST_BODY_SIZE = 5000; // 5KB max for free forecast requests

// Input validation schema with strict limits
const InputSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format. Use HH:MM"),
  birthPlace: z
    .string()
    .min(2, "Birth place too short")
    .max(MAX_BIRTH_PLACE_LENGTH, `Birth place too long (max ${MAX_BIRTH_PLACE_LENGTH} chars)`),
  birthTimeUtc: z.string().max(50).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceId: z.string().uuid("Invalid device ID").optional(),
  captchaToken: z.string().max(MAX_CAPTCHA_TOKEN_LENGTH).optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= ABUSE DETECTION & ALERTING =============
const ABUSE_ALERT_THRESHOLD = 50; // Alert if more than 50 forecasts per hour
const hourlyGenerationCount = { count: 0, hourStart: Date.now() };
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between alerts
let lastAlertTime = 0;

// deno-lint-ignore no-explicit-any
async function checkAndAlertAbuse(supabase: any, ip: string, deviceId: string | undefined): Promise<void> {
  const now = Date.now();

  // Reset hourly counter if hour has passed
  if (now - hourlyGenerationCount.hourStart > 60 * 60 * 1000) {
    hourlyGenerationCount.count = 0;
    hourlyGenerationCount.hourStart = now;
  }

  hourlyGenerationCount.count++;

  // Check if threshold exceeded and we haven't alerted recently
  if (hourlyGenerationCount.count >= ABUSE_ALERT_THRESHOLD && now - lastAlertTime > ALERT_COOLDOWN_MS) {
    lastAlertTime = now;

    logStep("ABUSE_THRESHOLD_EXCEEDED", {
      hourlyCount: hourlyGenerationCount.count,
      threshold: ABUSE_ALERT_THRESHOLD,
    });

    // Write abuse event to database
    try {
      // Using 'any' cast since abuse_events table was just created
      await (supabase as any).from("abuse_events").insert({
        event_type: "hourly_threshold_exceeded",
        ip_address: ip,
        device_id: deviceId || null,
        hourly_count: hourlyGenerationCount.count,
        threshold: ABUSE_ALERT_THRESHOLD,
        details: { function: "generate-forecast", timestamp: new Date().toISOString() },
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
            subject: `⚠️ Abuse Alert: Free Forecast Threshold Exceeded`,
            html: `
              <h2>Abuse Threshold Exceeded</h2>
              <p><strong>Function:</strong> generate-forecast</p>
              <p><strong>Hourly Count:</strong> ${hourlyGenerationCount.count}</p>
              <p><strong>Threshold:</strong> ${ABUSE_ALERT_THRESHOLD}</p>
              <p><strong>Last IP:</strong> ${ip}</p>
              <p><strong>Device ID:</strong> ${deviceId || "N/A"}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            `,
          }),
        });
        logStep("Abuse alert email sent");
      }
    } catch (emailErr) {
      console.error("Failed to send abuse alert email:", emailErr);
    }
  }
}

// ============= RATE LIMITING CONFIGURATION =============
// Tier 1: 1 request per minute per IP (burst protection)
const IP_BURST_LIMIT = 1;
const IP_BURST_WINDOW_MS = 60000;

// Tier 2: 10 requests per 24h per IP
const IP_DAILY_LIMIT = 10;
const IP_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

// Tier 3: 10 requests per 24h per device_id
const DEVICE_DAILY_LIMIT = 10;
const DEVICE_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

// CAPTCHA thresholds
const CAPTCHA_IP_THRESHOLD = 5; // Require CAPTCHA after 5 requests in 24h
const SUSPICIOUS_USER_AGENTS = ["curl", "wget", "python", "httpie", "postman", "insomnia", "bot", "crawler", "spider"];

// Rate limiting maps
const ipBurstLimiter = new Map<string, { count: number; resetAt: number }>();
const ipDailyLimiter = new Map<string, { count: number; resetAt: number }>();
const deviceDailyLimiter = new Map<string, { count: number; resetAt: number }>();

// Traffic spike detection (requests in last 5 minutes across all IPs)
const recentRequestTimestamps: number[] = [];
const SPIKE_WINDOW_MS = 5 * 60 * 1000;
const SPIKE_THRESHOLD = 100; // If more than 100 requests in 5 minutes, enable CAPTCHA

function cleanupMap(map: Map<string, { count: number; resetAt: number }>, now: number, maxSize: number = 10000) {
  if (map.size > maxSize) {
    for (const [key, value] of map.entries()) {
      if (now > value.resetAt) map.delete(key);
    }
  }
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") || "";
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return SUSPICIOUS_USER_AGENTS.some((pattern) => lowerUA.includes(pattern));
}

function detectTrafficSpike(): boolean {
  const now = Date.now();
  // Clean old timestamps
  while (recentRequestTimestamps.length > 0 && recentRequestTimestamps[0] < now - SPIKE_WINDOW_MS) {
    recentRequestTimestamps.shift();
  }
  recentRequestTimestamps.push(now);
  return recentRequestTimestamps.length > SPIKE_THRESHOLD;
}

interface RateLimitResult {
  allowed: boolean;
  requireCaptcha: boolean;
  message?: string;
}

function checkRateLimits(ip: string, deviceId: string | undefined): RateLimitResult {
  const now = Date.now();

  // Cleanup old entries
  cleanupMap(ipBurstLimiter, now);
  cleanupMap(ipDailyLimiter, now);
  cleanupMap(deviceDailyLimiter, now);

  // Tier 1: IP burst limit (1 per minute)
  const burstRecord = ipBurstLimiter.get(ip);
  if (burstRecord && now <= burstRecord.resetAt && burstRecord.count >= IP_BURST_LIMIT) {
    const waitSeconds = Math.ceil((burstRecord.resetAt - now) / 1000);
    return {
      allowed: false,
      requireCaptcha: false,
      message: `Please wait ${waitSeconds} seconds before generating another forecast.`,
    };
  }

  // Update burst counter
  if (!burstRecord || now > burstRecord.resetAt) {
    ipBurstLimiter.set(ip, { count: 1, resetAt: now + IP_BURST_WINDOW_MS });
  } else {
    burstRecord.count++;
  }

  // Tier 2: IP daily limit (10 per 24h)
  const dailyRecord = ipDailyLimiter.get(ip);
  if (dailyRecord && now <= dailyRecord.resetAt && dailyRecord.count >= IP_DAILY_LIMIT) {
    return {
      allowed: false,
      requireCaptcha: false,
      message: "Daily limit reached. Please try again tomorrow.",
    };
  }

  // Update daily counter
  if (!dailyRecord || now > dailyRecord.resetAt) {
    ipDailyLimiter.set(ip, { count: 1, resetAt: now + IP_DAILY_WINDOW_MS });
  } else {
    dailyRecord.count++;
  }

  // Tier 3: Device daily limit (3 per 24h)
  if (deviceId) {
    const deviceRecord = deviceDailyLimiter.get(deviceId);
    if (deviceRecord && now <= deviceRecord.resetAt && deviceRecord.count >= DEVICE_DAILY_LIMIT) {
      return {
        allowed: false,
        requireCaptcha: false,
        message: "You've reached the maximum free previews for today. Please try again tomorrow.",
      };
    }

    // Update device counter
    if (!deviceRecord || now > deviceRecord.resetAt) {
      deviceDailyLimiter.set(deviceId, { count: 1, resetAt: now + DEVICE_DAILY_WINDOW_MS });
    } else {
      deviceRecord.count++;
    }
  }

  // Check if CAPTCHA should be required
  const currentDailyCount = ipDailyLimiter.get(ip)?.count || 0;
  const requireCaptcha = currentDailyCount > CAPTCHA_IP_THRESHOLD;

  return { allowed: true, requireCaptcha };
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

// Compute zodiac sign from birth date string (YYYY-MM-DD format)
function getZodiacSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

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

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  let deviceId: string | undefined;

  logStep("Request started", { ip: clientIP });

  try {
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
      return new Response(JSON.stringify({ error: `Invalid input: ${errorMessages}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { birthDate, birthTime, birthPlace, birthTimeUtc, latitude, longitude, captchaToken } = parseResult.data;
    deviceId = parseResult.data.deviceId;

    // Check for traffic spike
    const isTrafficSpike = detectTrafficSpike();
    const isSuspiciousUA = isSuspiciousUserAgent(userAgent);

    // Check rate limits
    const rateLimitResult = checkRateLimits(clientIP, deviceId);

    if (!rateLimitResult.allowed) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "rate_limit",
        ip: clientIP,
        deviceId: deviceId || null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: rateLimitResult.message }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine if CAPTCHA is required
    const captchaRequired = rateLimitResult.requireCaptcha || isSuspiciousUA || isTrafficSpike;

    if (captchaRequired && !captchaToken) {
      logStep("REQUEST_COMPLETE", {
        outcome: "captcha_required",
        reason: `threshold=${rateLimitResult.requireCaptcha}, suspicious=${isSuspiciousUA}, spike=${isTrafficSpike}`,
        ip: clientIP,
        deviceId: deviceId || null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(
        JSON.stringify({
          captcha_required: true,
          message: "Please complete the verification to continue.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify CAPTCHA token if provided
    if (captchaToken) {
      const captchaValid = await verifyCaptchaToken(captchaToken, clientIP);
      if (!captchaValid) {
        logStep("REQUEST_COMPLETE", {
          outcome: "fail",
          reason: "captcha_verification_failed",
          ip: clientIP,
          deviceId: deviceId || null,
          latencyMs: Date.now() - requestStartTime,
        });
        return new Response(JSON.stringify({ error: "CAPTCHA verification failed. Please try again." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!openAIApiKey) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "missing_openai_key",
        ip: clientIP,
        deviceId: deviceId || null,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Service configuration error. Please try again later." }), {
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

    // Compute zodiac sign
    const zodiacSign = getZodiacSign(birthDate);

    // Generate style seed based on UTC datetime for consistency
    const styleSeedInput = birthTimeUtc || `${birthDate}+${birthTime}+${birthPlace}`;
    const styleSeed = await generateStyleSeed(styleSeedInput);

    // Create Supabase client for cache operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch birth chart from Prokerala API (non-blocking - continue even if it fails)
    interface BirthChartData {
      moonSign?: string;
      moonSignId?: number;
      sunSign?: string;
      sunSignId?: number;
      nakshatra?: string;
      nakshatraId?: number;
      nakshatraPada?: number;
    }
    let birthChartData: BirthChartData = {};

    if (birthTimeUtc && latitude !== undefined && longitude !== undefined) {
      try {
        logStep("Fetching birth chart", { datetime: birthTimeUtc, lat: latitude, lon: longitude });

        const birthChartResponse = await fetch(`${supabaseUrl}/functions/v1/get-birth-chart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            datetime: birthTimeUtc,
            latitude,
            longitude,
            ayanamsa: 1, // Lahiri
          }),
        });

        if (birthChartResponse.ok) {
          const chartResult = await birthChartResponse.json();
          birthChartData = {
            moonSign: chartResult.moonSign,
            moonSignId: chartResult.moonSignId,
            sunSign: chartResult.sunSign,
            sunSignId: chartResult.sunSignId,
            nakshatra: chartResult.nakshatra,
            nakshatraId: chartResult.nakshatraId,
            nakshatraPada: chartResult.nakshatraPada,
          };
          logStep("Birth chart fetched successfully", { ...birthChartData });
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
      `Generating forecast for: age ${age}, zodiac ${zodiacSign}, ${formattedDob} ${birthTime} in ${birthPlace}, UTC=${birthTimeUtc || "N/A"}, styleSeed: ${styleSeed}, pivotalLifeElement: ${pivotalLifeElement}, deviceId: ${deviceId || "none"}, birthChart: ${JSON.stringify(birthChartData)}`,
    );

    const systemPrompt = `
You generate concise, high-impact annual previews inspired by Indian Jyotish.

This is a free preview meant to feel personally resonant and slightly incomplete.

It should feel specific, grounded, and composed rather than mystical or analytical.

Tone:
- Grounded
- Clear
- Confident
- Observational, not therapeutic
- No reassurance, no motivation

Hard rules:
- Always produce visible text
- Plain language only
- No technical astrology terms
- Do NOT mention astrology, zodiac signs, systems, age, birthplace, or birth time
- Do NOT give advice, instructions, or solutions
- Do NOT predict specific events
- Abstract directional pressure is allowed (narrowing, accumulation, friction, exposure)
- Do NOT use em dashes

Internal logic rules (do not reveal to user):
- Sun sign influences instinctive orientation and default response to pressure
- Moon sign influences emotional pacing and internal tension
- Nakshatra biases intensity, moral pressure, and how strain accumulates
- Age defines life-stage context and which areas carry real stakes
- Reflect these through emphasis and consequences, not symbolism or explanation

AGE-BASED PIVOTAL LIFE ELEMENT (STRICT):
You must select exactly ONE pivotal life element from the allowed list for the user’s age.

Allowed lists:
- Age < 35: [career, education, identity]
- Age 35–49: [career, relationships, family, health]
- Age 50–59: [health, family, relationships, purpose]
- Age >= 60: [health, family, relationships, meaning, stewardship]

Rule: if age >= 60, never choose career.

Personalization should come from tone, pressure, and what feels costly if misread or delayed.
`;

    const userPrompt = `
Create a concise preview of the user's ${targetYear}.

This preview should feel specific, grounded, and slightly unfinished in a way that creates curiosity.

INPUTS:
- Age: ${age}
- Sun sign: ${birthChartData.sunSign || "unknown"}
- Moon sign: ${birthChartData.moonSign || "unknown"}
- Nakshatra: ${birthChartData.nakshatra || "unknown"}
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
- No reassurance
- No advice or instructions
- No specific event predictions
- No explanations of mechanisms or systems
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
- Describe how this orientation has generally helped them
- Name one way this same pattern is beginning to show a limit now
- Do not give advice or suggest change

Your ${priorYear}  
Write 2–3 sentences describing what the prior year felt like emotionally or psychologically.
- Focus on pacing, effort, and what was required to keep things moving
- Explicitly state what stopped working or felt increasingly costly
- Do not resolve the tension

Your Pivotal Life Theme  
Write 2–3 sentences describing how attention naturally gathers around "${pivotalLifeElement}" in ${targetYear}.
- Explicitly state what happens when last year's logic is applied to this year
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
      temperature: 0.65,
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
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "openai_error",
        ip: clientIP,
        deviceId: deviceId || null,
        model: "gpt-4.1-mini-2025-04-14",
        errorStatus: resp.status,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const tokenUsage = data.usage || null;

    const generatedContent = data?.choices?.[0]?.message?.content ?? "";

    if (!generatedContent.trim()) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "empty_response",
        ip: clientIP,
        deviceId: deviceId || null,
        model: "gpt-4.1-mini-2025-04-14",
        tokens: tokenUsage,
        finishReason: data?.choices?.[0]?.finish_reason,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const forecastText = generatedContent.trim();

    // Save to free_forecasts table (non-blocking failure)
    let freeForecastId: string | undefined;
    let guestToken: string | undefined;
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
          zodiac_sign: zodiacSign,
          device_id: deviceId || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          moon_sign: birthChartData.moonSign ?? null,
          moon_sign_id: birthChartData.moonSignId ?? null,
          sun_sign: birthChartData.sunSign ?? null,
          sun_sign_id: birthChartData.sunSignId ?? null,
          nakshatra: birthChartData.nakshatra ?? null,
          nakshatra_id: birthChartData.nakshatraId ?? null,
          nakshatra_pada: birthChartData.nakshatraPada ?? null,
        })
        .select("id, guest_token")
        .single();

      if (saveError) {
        logStep("Database save error", { error: saveError.message });
      } else {
        freeForecastId = saveData?.id;
        guestToken = saveData?.guest_token;
      }
    } catch (saveErr) {
      logStep("Database save exception", { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
    }

    // Check for abuse and alert if threshold exceeded
    await checkAndAlertAbuse(supabase, clientIP, deviceId);

    // Log successful completion
    const guestTokenHash = guestToken ? await hashToken(guestToken) : null;
    logStep("REQUEST_COMPLETE", {
      outcome: "success",
      ip: clientIP,
      deviceId: deviceId || null,
      guestTokenHash,
      forecastId: freeForecastId || null,
      model: "gpt-4.1-mini-2025-04-14",
      tokens: tokenUsage,
      latencyMs: Date.now() - requestStartTime,
    });

    return new Response(
      JSON.stringify({
        forecast: forecastText,
        pivotalTheme: pivotalLifeElement,
        freeForecastId,
        guestToken,
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
    return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Verify CAPTCHA token (placeholder - integrate with your CAPTCHA provider)
async function verifyCaptchaToken(token: string, clientIP: string): Promise<boolean> {
  // TODO: Integrate with actual CAPTCHA provider (e.g., hCaptcha, reCAPTCHA, Turnstile)
  // For now, accept any non-empty token for testing
  // In production, this should verify the token with the CAPTCHA provider's API

  const captchaSecretKey = Deno.env.get("CAPTCHA_SECRET_KEY");
  if (!captchaSecretKey) {
    console.warn("CAPTCHA_SECRET_KEY not configured - skipping verification");
    return true; // Skip verification if not configured
  }

  try {
    // Example for Cloudflare Turnstile:
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${captchaSecretKey}&response=${token}&remoteip=${clientIP}`,
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return false;
  }
}
