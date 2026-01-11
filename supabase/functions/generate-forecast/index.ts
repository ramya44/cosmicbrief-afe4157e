import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
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

    if (!openaiApiKey) {
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
      moonSignLord?: string;
      sunSign?: string;
      sunSignId?: number;
      sunSignLord?: string;
      nakshatra?: string;
      nakshatraId?: number;
      nakshatraPada?: number;
      nakshatraLord?: string;
      nakshatraGender?: string;
      // Additional info from birth-details
      deity?: string;
      ganam?: string;
      birthSymbol?: string;
      animalSign?: string;
      nadi?: string;
      luckyColor?: string;
      bestDirection?: string;
      syllables?: string;
      birthStone?: string;
      westernZodiac?: string;
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
            westernZodiac: chartResult.westernZodiac,
          };
          logStep("Birth chart fetched successfully", {
            moonSign: birthChartData.moonSign,
            sunSign: birthChartData.sunSign,
            nakshatra: birthChartData.nakshatra,
            nakshatraLord: birthChartData.nakshatraLord,
            ganam: birthChartData.ganam,
            nadi: birthChartData.nadi,
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

    // ============= LOOKUP TABLE QUERIES =============
    // Fetch interpretive context from lookup tables
    interface SunLookup {
      default_orientation: string;
      identity_limit: string;
      effort_misfire: string;
    }
    interface MoonLookup {
      emotional_pacing: string;
      sensitivity_point: string;
      strain_leak: string;
    }
    interface NakshatraLookup {
      intensity_reason: string;
      moral_cost_limit: string;
      strain_accumulation: string;
    }

    let sunLookup: SunLookup | null = null;
    let moonLookup: MoonLookup | null = null;
    let nakshatraLookup: NakshatraLookup | null = null;

    // Query sun orientation lookup
    if (birthChartData.sunSign) {
      const { data: sunData, error: sunError } = await supabase
        .from("vedic_sun_orientation_lookup")
        .select("default_orientation, identity_limit, effort_misfire")
        .eq("sun_sign", birthChartData.sunSign)
        .maybeSingle();

      if (sunError) {
        logStep("Sun lookup error", { error: sunError.message });
      } else if (sunData) {
        sunLookup = sunData;
        logStep("Sun lookup success", { sunSign: birthChartData.sunSign });
      }
    }

    // Query moon pacing lookup
    if (birthChartData.moonSign) {
      const { data: moonData, error: moonError } = await supabase
        .from("vedic_moon_pacing_lookup")
        .select("emotional_pacing, sensitivity_point, strain_leak")
        .eq("moon_sign", birthChartData.moonSign)
        .maybeSingle();

      if (moonError) {
        logStep("Moon lookup error", { error: moonError.message });
      } else if (moonData) {
        moonLookup = moonData;
        logStep("Moon lookup success", { moonSign: birthChartData.moonSign });
      }
    }

    // Query nakshatra pressure lookup
    if (birthChartData.nakshatra) {
      const { data: nakData, error: nakError } = await supabase
        .from("nakshatra_pressure_lookup")
        .select("intensity_reason, moral_cost_limit, strain_accumulation")
        .eq("nakshatra", birthChartData.nakshatra)
        .maybeSingle();

      if (nakError) {
        logStep("Nakshatra lookup error", { error: nakError.message });
      } else if (nakData) {
        nakshatraLookup = nakData;
        logStep("Nakshatra lookup success", { nakshatra: birthChartData.nakshatra });
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
      `Generating forecast for: age ${age}, zodiac ${zodiacSign}, ${formattedDob} ${birthTime} in ${birthPlace}, UTC=${birthTimeUtc || "N/A"}, styleSeed: ${styleSeed}, pivotalLifeElement: ${pivotalLifeElement}, deviceId: ${deviceId || "none"}, sunLookup: ${JSON.stringify(sunLookup)}, moonLookup: ${JSON.stringify(moonLookup)}, nakshatraLookup: ${JSON.stringify(nakshatraLookup)}`,
    );

    const systemPrompt = `You are a deeply intuitive guide who understands human psychology and life patterns. You create personalized readings that make people feel profoundly seen and understood.

# YOUR WRITING RULES

**NEVER use:**

- Astrological terms (signs, houses, planets, aspects, nakshatras, charts)

- Em dashes (use periods or commas instead)

- Phrases like "That's your [sign] nature" or "Your [sign] side"

- Gentle, vague language like "perhaps" or "you might be"

- Bullet points or lists

- Generic horoscope language

- Therapy-speak terms ("optimize," "processing style," "moral compromises")

- Repetitive restatements of the same idea

- Multiple phrases that mean the same thing ("reflexive accommodations" + "peace-keeping performance" = redundant, pick one)

- Ornate language when simple is clearer ("delicate dance" → "strategy")

**ALWAYS:**

- Write in direct, confident statements

- Use "you" and address the person directly

- Name specific internal experiences and tensions WITH CONCRETE EXAMPLES

- Focus on CONTRADICTIONS and PARADOXES (this creates accuracy)

- Use concrete, visceral language over abstract concepts

- Keep sentences relatively short and punchy

- Build tension without resolution

- Leave them wanting more

- Be ruthlessly efficient—cut any sentence that doesn't add new information

- Ground abstract patterns in specific, recognizable moments or scenarios

- ONE SENTENCE PER IDEA: If two sentences express the same core point using different words, delete one

- Avoid "throat-clearing" phrases like "This isn't just about X" or "The real issue is" - state the point directly

**TONE MATCHING:**

Match emotional intensity to the person's psychological makeup:

- For intense, transformative types: Use "fire," "burning away," "seeing through," "hollow," "false"

- For nurturing, stable types: Use "create," "build," "stability," "beauty," "roots"

- For quick, action types: Use "now," "move," "act," "push," "breakthrough"

- For intellectual, detached types: Use "clarity," "understand," "observe," "patterns," "distance"

**STRUCTURE:**

Each paragraph should:

1. Make a direct statement about them

2. Add nuance or contradiction

3. Name the tension this creates

4. Show current impact with a concrete example or specific scenario

**SPECIFICITY REQUIREMENT:**

Every paragraph must include at least one concrete detail:

- A specific type of situation they encounter

- A recognizable moment or interaction

- A particular kind of relationship or context

- An actual behavior or response pattern

Avoid: "situations that demand boundaries"

Use: "when someone asks for more than you can give, you say yes anyway and resent them later"

**AGE-BASED PIVOTAL LIFE ELEMENT (STRICT):**

You must select exactly ONE pivotal life element from the allowed list for the user's age.

Allowed lists:

- Age < 35: [career, education, identity]

- Age 35–49: [career, relationships, family, health]

- Age 50–59: [health, family, relationships, purpose]

- Age >= 60: [health, family, relationships, meaning, stewardship]

Rule: if age >= 60, never choose career.

Example: "You read people instantly. Walk into a room and you know who's angry, who's lying, who needs something they won't ask for. This serves you well until someone needs you to stop being perceptive and start being direct. You keep trying to find the compassionate angle, the way to handle it that doesn't hurt anyone. But some situations don't have a gentle solution. The compromise you keep making is costing you something real."

`;

    const userPrompt = `

Generate a free forecast for the reader based on these inputs:

- Sun orientation context: ${sunLookup?.default_orientation || "unknown"}

- Sun identity limit: ${sunLookup?.identity_limit || "unknown"}

- Sun effort misfire: ${sunLookup?.effort_misfire || "unknown"}

- Moon emotional pacing: ${moonLookup?.emotional_pacing || "unknown"}

- Moon sensitivity point: ${moonLookup?.sensitivity_point || "unknown"}

- Moon strain leak: ${moonLookup?.strain_leak || "unknown"}

- Nakshatra pressure context: ${nakshatraLookup?.intensity_reason || "unknown"}

- Nakshatra moral limit: ${nakshatraLookup?.moral_cost_limit || "unknown"}

- Nakshatra strain pattern: ${nakshatraLookup?.strain_accumulation || "unknown"}

- Pivotal life theme: ${pivotalLifeElement}

CRITICAL INSTRUCTIONS:

1. Synthesize these data points into a cohesive psychological portrait—do not list them separately

2. Include at least one concrete, specific example or scenario per section

3. Avoid repeating the same core insight across multiple paragraphs

4. Use everyday language, not clinical or abstract terminology

5. Keep total length tight—eliminate any redundancy

6. BEFORE FINALIZING: Read each section and delete any sentence that restates a point already made in that section

7. If two sentences express the same idea with different words, keep only the stronger one

8. Cut ornate phrases ("delicate dance of connection") in favor of direct language ("your connection strategy")

Call the save_forecast function with your response.

`.trim();

    // Define the tool for structured output
    const forecastTool = {
      name: "save_forecast",
      description: "Save the forecast sections for the reader",
      input_schema: {
        type: "object",
        properties: {
          who_you_are_right_now: {
            type: "string",
            description:
              "1-2 concise paragraphs (max 150 words each) describing the reader's current internal state. Synthesize identity orientation (Sun), emotional pacing (Moon), and moral pressure (Nakshatra) into ONE unified portrait with NO repetition between paragraphs. CRITICAL: Each paragraph must introduce a NEW dimension—if paragraph 2 says 'you absorb emotions and get overwhelmed,' paragraph 1 cannot also make this point. Include at least one specific, concrete scenario that illustrates the pattern. Emphasize contradictions, show how usual strengths create friction, describe strain as lived experience. End implying a turning point without naming what happens next. Avoid therapy-speak and abstraction. Delete any sentence that repeats a point already made.",
          },
          whats_happening_in_your_life: {
            type: "string",
            description:
              "1-2 concise paragraphs (max 120 words each) describing the broader pattern unfolding. Localize pressure around current life stage and pivotal theme with specific reference to what this looks like in practice. Show how identity limits and emotional sensitivities are being tested through concrete situations. Hint at a moral or internal limit approaching. End with clarity increasing but full picture not yet available. Each paragraph must advance the narrative, not restate. Eliminate phrases that mean the same thing—if you say 'peace-keeping performance' don't also say 'reflexive accommodations' in the same section.",
          },
          pivotal_life_theme_2026: {
            type: "string",
            description:
              "1 paragraphs (max 150 words total) stating the pivotal life theme clearly and concretely. Describe why attention is gathering here this year using specific language tied to their actual experience. Contrast last year's logic with this year's pressure. Emphasize cost if same approach is repeated, with tangible examples of what that cost looks like. Do not explain how to fix anything. Avoid vague language like 'situations' or 'contexts'—name actual relationship types, work scenarios, or life circumstances.",
          },
          what_is_becoming_tighter: {
            type: "string",
            description:
              "1-2 paragraphs (max 130 words total) describing the main constraint now in effect. Anchor in moral or internal cost with concrete stakes. Make clear that endurance alone no longer keeps things neutral. Use specific language about what's actually happening in their life. Keep language calm, precise, unsentimental. End with one sentence suggesting a specific decision or tradeoff ahead without naming the solution. Avoid abstraction—reference actual choices, relationships, or circumstances. CRITICAL: Do not restate the same consequence twice—if paragraph 1 says 'you're paying a psychological toll,' paragraph 2 cannot repeat this in different words. One statement of cost per section.",
          },
        },
        required: [
          "who_you_are_right_now",
          "whats_happening_in_your_life",
          "pivotal_life_theme_2026",
          "what_is_becoming_tighter",
        ],
      },
    };

    // Convert tool schema from Anthropic format to OpenAI format
    const openAITool = {
      type: "function",
      function: {
        name: forecastTool.name,
        description: forecastTool.description,
        parameters: forecastTool.input_schema,
      },
    };

    const payload = {
      model: "gpt-4.1-mini",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [openAITool],
      tool_choice: { type: "function", function: { name: "save_forecast" } },
    };

    console.log("OpenAI payload:", JSON.stringify(payload));

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey!}`,
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
        model: "gpt-4.1-mini",
        errorStatus: resp.status,
        errorText: errorText,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const tokenUsage = data.usage || null;

    // Extract structured forecast from OpenAI tool_calls response
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let forecastSections:
      | {
          who_you_are_right_now?: string;
          whats_happening_in_your_life?: string;
          pivotal_life_theme_2026?: string;
          what_is_becoming_tighter?: string;
        }
      | undefined;

    if (toolCall?.function?.arguments) {
      try {
        forecastSections = JSON.parse(toolCall.function.arguments);
      } catch (parseErr) {
        logStep("JSON parse error", { error: parseErr instanceof Error ? parseErr.message : String(parseErr) });
      }
    }

    if (!forecastSections || !forecastSections.who_you_are_right_now) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "empty_response",
        ip: clientIP,
        deviceId: deviceId || null,
        model: "gpt-4.1-mini",
        tokens: tokenUsage,
        finishReason: data?.choices?.[0]?.finish_reason,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a combined text version for database storage (backwards compatibility)
    const forecastText = [
      `## WHO YOU ARE RIGHT NOW\n\n${forecastSections.who_you_are_right_now}`,
      `## WHAT'S HAPPENING IN YOUR LIFE\n\n${forecastSections.whats_happening_in_your_life}`,
      `## 2026 PIVOTAL LIFE THEME\n\n${forecastSections.pivotal_life_theme_2026}`,
      `## WHAT IS BECOMING TIGHTER\n\n${forecastSections.what_is_becoming_tighter}`,
    ].join("\n\n");

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
          moon_sign_lord: birthChartData.moonSignLord ?? null,
          sun_sign: birthChartData.sunSign ?? null,
          sun_sign_id: birthChartData.sunSignId ?? null,
          sun_sign_lord: birthChartData.sunSignLord ?? null,
          nakshatra: birthChartData.nakshatra ?? null,
          nakshatra_id: birthChartData.nakshatraId ?? null,
          nakshatra_pada: birthChartData.nakshatraPada ?? null,
          nakshatra_lord: birthChartData.nakshatraLord ?? null,
          nakshatra_gender: birthChartData.nakshatraGender ?? null,
          deity: birthChartData.deity ?? null,
          ganam: birthChartData.ganam ?? null,
          birth_symbol: birthChartData.birthSymbol ?? null,
          animal_sign: birthChartData.animalSign ?? null,
          nadi: birthChartData.nadi ?? null,
          lucky_color: birthChartData.luckyColor ?? null,
          best_direction: birthChartData.bestDirection ?? null,
          syllables: birthChartData.syllables ?? null,
          birth_stone: birthChartData.birthStone ?? null,
          model_used: "gpt-4.1-mini",
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
      model: "gpt-4.1-mini",
      tokens: tokenUsage,
      latencyMs: Date.now() - requestStartTime,
    });

    return new Response(
      JSON.stringify({
        forecast: forecastText,
        forecastSections,
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
