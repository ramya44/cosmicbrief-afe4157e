// supabase/functions/generate-forecast/index.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { createLogger, hashToken } from "../_shared/lib/logger.ts";
import { corsHeaders, getClientIP } from "../_shared/lib/http.ts";

import { parseAndValidate } from "./lib/validate.ts";
import { checkRateLimits, detectTrafficSpike, getUserAgent, isSuspiciousUserAgent } from "./lib/rate_limit.ts";
import { verifyCaptchaToken } from "./lib/captcha.ts";
import { generateStyleSeed, calculateAge, getOrCreatePivotalTheme, getWesternZodiacSign } from "./lib/style.ts";
import { fetchBirthChart } from "./lib/birth_chart.ts";
import { fetchLookups } from "./lib/lookups.ts";
import { buildSystemPrompt, buildUserPrompt } from "./lib/prompts.ts";
import { generateForecast } from "./lib/openai.ts";
import { buildForecastText, saveFreeForecast } from "./lib/persist.ts";
import { checkAndAlertAbuse } from "./lib/abuse.ts";

const logStep = createLogger("GENERATE-FORECAST");

const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_REQUEST_BODY_SIZE = 5000;

serve(async (req) => {
  const requestStartTime = Date.now();

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  logStep("Request started", { ip: clientIP });

  try {
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

    const parsed = parseAndValidate(rawBody);
    if (!parsed.ok) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "validation_error",
        ip: clientIP,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { birthDate, birthTime, birthPlace, birthTimeUtc, latitude, longitude, deviceId, captchaToken } = parsed.data;

    const isTrafficSpike = detectTrafficSpike();
    const isSuspiciousUA = isSuspiciousUserAgent(userAgent);

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
        JSON.stringify({ captcha_required: true, message: "Please complete the verification to continue." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (captchaToken) {
      const ok = await verifyCaptchaToken(captchaToken, clientIP);
      if (!ok) {
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

    const targetYear = new Date().getFullYear();

    let age: number;
    if (birthTimeUtc) age = calculateAge(birthTimeUtc, targetYear);
    else age = targetYear - new Date(birthDate).getFullYear();

    const styleSeedInput = birthTimeUtc || `${birthDate}+${birthTime}+${birthPlace}`;
    const styleSeed = await generateStyleSeed(styleSeedInput);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const birthChartData = await fetchBirthChart({
      supabaseUrl,
      supabaseServiceKey,
      birthTimeUtc,
      latitude,
      longitude,
      logStep,
    });

    const { sunLookup, moonLookup, nakshatraLookup } = await fetchLookups({
      supabase,
      sunSign: birthChartData.sunSign,
      moonSign: birthChartData.moonSign,
      nakshatra: birthChartData.nakshatra,
      logStep,
    });

    const themeRes = await getOrCreatePivotalTheme({
      supabase,
      birthTimeUtc,
      targetYear,
      age,
      styleSeed,
    });
    const pivotalLifeElement = themeRes.pivotalLifeElement;

    // Keep this only if you're still saving it to DB. Otherwise delete.
    const zodiacSign = getWesternZodiacSign(birthDate);

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      sunLookup,
      moonLookup,
      nakshatraLookup,
      birthChartData,
      pivotalLifeElement,
    });

    const gen = await generateForecast({
      openaiApiKey,
      systemPrompt,
      userPrompt,
      logStep,
    });

    if (!gen.ok) {
      logStep("REQUEST_COMPLETE", {
        outcome: "fail",
        reason: "openai_error",
        ip: clientIP,
        deviceId: deviceId || null,
        model: "gpt-4.1-mini",
        errorStatus: gen.status || null,
        errorText: gen.error,
        latencyMs: Date.now() - requestStartTime,
      });
      return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const forecastSections = gen.sections;
    const forecastText = buildForecastText(forecastSections);

    const saved = await saveFreeForecast({
      supabase,
      birthDate,
      birthTime,
      birthPlace,
      birthTimeUtc,
      latitude,
      longitude,
      deviceId,
      zodiacSign,
      pivotalLifeElement,
      birthChartData,
      forecastText,
      modelUsed: "gpt-4.1-mini",
      logStep,
    });

    await checkAndAlertAbuse(supabase, clientIP, deviceId, logStep);

    const guestTokenHash = saved.guestToken ? await hashToken(saved.guestToken) : null;

    logStep("REQUEST_COMPLETE", {
      outcome: "success",
      ip: clientIP,
      deviceId: deviceId || null,
      guestTokenHash,
      forecastId: saved.freeForecastId || null,
      model: "gpt-4.1-mini",
      tokens: gen.usage,
      latencyMs: Date.now() - requestStartTime,
    });

    return new Response(
      JSON.stringify({
        forecast: forecastText,
        forecastSections,
        pivotalTheme: pivotalLifeElement,
        freeForecastId: saved.freeForecastId,
        guestToken: saved.guestToken,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    logStep("REQUEST_COMPLETE", {
      outcome: "fail",
      reason: "uncaught_exception",
      ip: clientIP,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - requestStartTime,
    });
    return new Response(JSON.stringify({ error: "Unable to generate forecast. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
