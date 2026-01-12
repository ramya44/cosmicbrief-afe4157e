import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[get-kundli-data] ${step}${detailsStr}`);
}

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

interface PlanetPosition {
  id: number;
  name: string;
  sign: string;
  sign_id: number;
  sign_lord: string;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
  nakshatra?: string;
  nakshatra_id?: number;
  nakshatra_pada?: number;
  nakshatra_lord?: string;
}

interface KundliResult {
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
  
  // Ascendant (Lagna)
  ascendant_sign: string;
  ascendant_sign_id: number;
  ascendant_sign_lord: string;
  
  // Planetary positions
  planetary_positions: PlanetPosition[];
  
}

// Get birth details (nakshatra, signs, etc.)
async function getBirthDetails(
  accessToken: string,
  datetime: string,
  latitude: number,
  longitude: number,
  ayanamsa: number
): Promise<{
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
  moon_sign: string;
  moon_sign_id: number;
  moon_sign_lord: string;
  sun_sign: string;
  sun_sign_id: number;
  sun_sign_lord: string;
  zodiac_sign: string;
}> {
  const params = new URLSearchParams({
    datetime,
    coordinates: `${latitude},${longitude}`,
    ayanamsa: ayanamsa.toString(),
    la: "en",
  });

  const url = `https://api.prokerala.com/v2/astrology/birth-details?${params}`;
  logStep("Calling birth-details API", { url });

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Birth details API error", { status: response.status, error: errorText });
    throw new Error(`Birth details API error: ${response.status}`);
  }

  const data = await response.json();
  logStep("Birth details received", { status: data.status });

  const nakshatraInfo = data.data?.nakshatra || {};
  const chandraRasi = data.data?.chandra_rasi || {};
  const sooryaRasi = data.data?.soorya_rasi || {};
  const additionalInfo = data.data?.additional_info || {};
  const zodiac = data.data?.zodiac || {};

  return {
    nakshatra: nakshatraInfo?.name || "",
    nakshatra_id: nakshatraInfo?.id || 0,
    nakshatra_pada: nakshatraInfo?.pada || 0,
    nakshatra_lord: nakshatraInfo?.lord?.vedic_name || nakshatraInfo?.lord?.name || "",
    nakshatra_gender: additionalInfo?.gender || "",
    deity: additionalInfo?.deity || "",
    ganam: additionalInfo?.ganam || "",
    birth_symbol: additionalInfo?.symbol || "",
    animal_sign: additionalInfo?.animal_sign || "",
    nadi: additionalInfo?.nadi || "",
    lucky_color: additionalInfo?.color || "",
    best_direction: additionalInfo?.best_direction || "",
    syllables: additionalInfo?.syllables || "",
    birth_stone: additionalInfo?.birth_stone || "",
    moon_sign: chandraRasi?.name || "",
    moon_sign_id: chandraRasi?.id || 0,
    moon_sign_lord: chandraRasi?.lord?.vedic_name || chandraRasi?.lord?.name || "",
    sun_sign: sooryaRasi?.name || "",
    sun_sign_id: sooryaRasi?.id || 0,
    sun_sign_lord: sooryaRasi?.lord?.vedic_name || sooryaRasi?.lord?.name || "",
    zodiac_sign: zodiac?.name || "",
  };
}

// Get planet positions (includes Ascendant/Lagna)
async function getPlanetPositions(
  accessToken: string,
  datetime: string,
  latitude: number,
  longitude: number,
  ayanamsa: number
): Promise<{
  ascendant_sign: string;
  ascendant_sign_id: number;
  ascendant_sign_lord: string;
  planetary_positions: PlanetPosition[];
}> {
  const params = new URLSearchParams({
    datetime,
    coordinates: `${latitude},${longitude}`,
    ayanamsa: ayanamsa.toString(),
    la: "en",
  });

  const url = `https://api.prokerala.com/v2/astrology/planet-position?${params}`;
  logStep("Calling planet-position API", { url });

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Planet position API error", { status: response.status, error: errorText });
    throw new Error(`Planet position API error: ${response.status}`);
  }

  const data = await response.json();
  
  // The API returns planet_position (singular), not planet_positions
  const planetPositionsArray = data.data?.planet_position || data.data?.planet_positions || [];
  
  // Log raw response structure for debugging
  logStep("Planet positions raw response", { 
    hasData: !!data.data,
    dataKeys: data.data ? Object.keys(data.data) : [],
    planetCount: planetPositionsArray.length,
    rawSample: planetPositionsArray[0] ? JSON.stringify(planetPositionsArray[0]).substring(0, 300) : null
  });
  
  // Extract planets and find Ascendant
  let ascendant_sign = "";
  let ascendant_sign_id = 0;
  let ascendant_sign_lord = "";
  
  const positions: PlanetPosition[] = [];
  
  for (const planet of planetPositionsArray) {
    const position: PlanetPosition = {
      id: planet.id,
      name: planet.name,
      sign: planet.rasi?.name || "",
      sign_id: planet.rasi?.id || 0,
      sign_lord: planet.rasi?.lord?.vedic_name || planet.rasi?.lord?.name || "",
      degree: planet.degree || 0,
      full_degree: planet.longitude || 0,
      is_retrograde: planet.is_retrograde || false,
      nakshatra: planet.nakshatra?.name,
      nakshatra_id: planet.nakshatra?.id,
      nakshatra_pada: planet.nakshatra?.pada,
      nakshatra_lord: planet.nakshatra?.lord?.vedic_name || planet.nakshatra?.lord?.name,
    };
    
    positions.push(position);
    
    // Ascendant is id: 0
    if (planet.id === 0) {
      ascendant_sign = position.sign;
      ascendant_sign_id = position.sign_id;
      ascendant_sign_lord = position.sign_lord;
    }
  }

  return {
    ascendant_sign,
    ascendant_sign_id,
    ascendant_sign_lord,
    planetary_positions: positions,
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

    // Call both APIs in parallel for speed
    const [birthDetails, planetData] = await Promise.all([
      getBirthDetails(accessToken, input.datetime, input.latitude, input.longitude, input.ayanamsa),
      getPlanetPositions(accessToken, input.datetime, input.latitude, input.longitude, input.ayanamsa),
    ]);

    const result: KundliResult = {
      ...birthDetails,
      ...planetData,
    };

    logStep("Kundli data retrieved successfully", {
      nakshatra: result.nakshatra,
      moon_sign: result.moon_sign,
      ascendant_sign: result.ascendant_sign,
      planetCount: result.planetary_positions.length,
    });

    return new Response(JSON.stringify(result), {
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
