import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createLogger } from "../_shared/lib/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("GET-ADVANCED-KUNDLI");

const InputSchema = z.object({
  datetime: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  ayanamsa: z.number().default(1),
});

// Cache for Prokerala access token
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    logStep("Using cached Prokerala token");
    return cachedToken.token;
  }

  const clientId = Deno.env.get("PROKERALA_CLIENT_ID");
  const clientSecret = Deno.env.get("PROKERALA_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Prokerala API credentials not configured");
  }

  logStep("Fetching new Prokerala access token");

  const tokenResponse = await fetch("https://api.prokerala.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get Prokerala token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

interface AdvancedKundliResult {
  // Nakshatra details
  nakshatra: string;
  nakshatra_id: number;
  nakshatra_pada: number;
  nakshatra_lord: string;
  nakshatra_gender: string;
  deity: string;
  ganam: string;
  birth_symbol: string;
  animal_sign: string;
  nadi: string;
  lucky_color: string;
  best_direction: string;
  syllables: string;
  birth_stone: string;
  
  // Signs
  moon_sign: string;
  moon_sign_id: number;
  moon_sign_lord: string;
  sun_sign: string;
  sun_sign_id: number;
  sun_sign_lord: string;
  zodiac_sign: string;
  
  // Mangal Dosha
  has_mangal_dosha: boolean;
  mangal_dosha_description: string;
  has_mangal_exception: boolean;
  mangal_dosha_type: string | null;
  mangal_dosha_exceptions: unknown[];
  mangal_dosha_remedies: unknown[];
  
  // Yogas
  major_yogas: unknown[];
  chandra_yogas: unknown[];
  soorya_yogas: unknown[];
  inauspicious_yogas: unknown[];
  
  // Dasha
  dasha_periods: unknown;
}

async function getAdvancedKundli(
  accessToken: string,
  datetime: string,
  latitude: number,
  longitude: number,
  ayanamsa: number
): Promise<AdvancedKundliResult> {
  const params = new URLSearchParams({
    datetime,
    coordinates: `${latitude},${longitude}`,
    ayanamsa: ayanamsa.toString(),
  });

  const url = `https://api.prokerala.com/v2/astrology/kundli/advanced?${params}`;
  logStep("Calling Prokerala Advanced Kundli API", { url });

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Prokerala API error", { status: response.status, error: errorText });
    throw new Error(`Prokerala API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  logStep("Prokerala API response received", { 
    hasNakshatraInfo: !!data.data?.nakshatra_details,
    hasMangalDosha: !!data.data?.mangal_dosha,
    hasYogaDetails: !!data.data?.yoga_details,
    hasDashaPeriods: !!data.data?.dasha_periods
  });

  const nakshatraDetails = data.data?.nakshatra_details || {};
  const mangalDosha = data.data?.mangal_dosha || {};
  const yogaDetails = data.data?.yoga_details || {};
  const dashaPeriods = data.data?.dasha_periods || {};

  // Extract nakshatra info
  const nakshatraInfo = nakshatraDetails?.nakshatra || {};
  const chandraRasi = nakshatraDetails?.chandra_rasi || {};
  const sooryaRasi = nakshatraDetails?.soorya_rasi || {};
  const additionalInfo = nakshatraDetails?.additional_info || {};

  return {
    // Nakshatra details
    nakshatra: nakshatraInfo?.name || "",
    nakshatra_id: nakshatraInfo?.id || 0,
    nakshatra_pada: nakshatraInfo?.pada || 0,
    nakshatra_lord: nakshatraInfo?.lord?.name || "",
    nakshatra_gender: additionalInfo?.nakshatra_gender || "",
    deity: additionalInfo?.deity || "",
    ganam: additionalInfo?.ganam || "",
    birth_symbol: additionalInfo?.birth_symbol || "",
    animal_sign: additionalInfo?.animal_sign || "",
    nadi: additionalInfo?.nadi || "",
    lucky_color: additionalInfo?.lucky_color || "",
    best_direction: additionalInfo?.best_direction || "",
    syllables: additionalInfo?.syllables || "",
    birth_stone: additionalInfo?.birth_stone || "",
    
    // Signs
    moon_sign: chandraRasi?.name || "",
    moon_sign_id: chandraRasi?.id || 0,
    moon_sign_lord: chandraRasi?.lord?.name || "",
    sun_sign: sooryaRasi?.name || "",
    sun_sign_id: sooryaRasi?.id || 0,
    sun_sign_lord: sooryaRasi?.lord?.name || "",
    zodiac_sign: nakshatraDetails?.zodiac?.name || "",
    
    // Mangal Dosha
    has_mangal_dosha: mangalDosha?.has_dosha || false,
    mangal_dosha_description: mangalDosha?.description || "",
    has_mangal_exception: mangalDosha?.has_exception || false,
    mangal_dosha_type: mangalDosha?.dosha_type || null,
    mangal_dosha_exceptions: mangalDosha?.exceptions || [],
    mangal_dosha_remedies: mangalDosha?.remedies || [],
    
    // Yogas
    major_yogas: yogaDetails?.major_yogas || [],
    chandra_yogas: yogaDetails?.chandra_yogas || [],
    soorya_yogas: yogaDetails?.soorya_yogas || [],
    inauspicious_yogas: yogaDetails?.inauspicious_yogas || [],
    
    // Dasha
    dasha_periods: dashaPeriods,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Request received");

    const clientId = Deno.env.get("PROKERALA_CLIENT_ID");
    const clientSecret = Deno.env.get("PROKERALA_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Prokerala API credentials not configured");
    }

    const body = await req.json();
    logStep("Request body parsed", body);

    const input = InputSchema.parse(body);
    logStep("Input validated", input);

    const accessToken = await getAccessToken();
    const kundliData = await getAdvancedKundli(
      accessToken,
      input.datetime,
      input.latitude,
      input.longitude,
      input.ayanamsa
    );

    logStep("Advanced Kundli data retrieved successfully");

    return new Response(JSON.stringify(kundliData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    const errStack = error instanceof Error ? error.stack : undefined;
    logStep("Error", { message: errMessage, stack: errStack });
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
