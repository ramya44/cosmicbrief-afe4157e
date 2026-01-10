import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const PROKERALA_CLIENT_ID = Deno.env.get("PROKERALA_CLIENT_ID");
const PROKERALA_CLIENT_SECRET = Deno.env.get("PROKERALA_CLIENT_SECRET");
const PROKERALA_TOKEN_URL = "https://api.prokerala.com/token";
const PROKERALA_API_BASE = "https://api.prokerala.com/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Consistent logging helper
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-BIRTH-CHART] ${step}${detailsStr}`);
};

// Input validation schema
const InputSchema = z.object({
  datetime: z.string().min(1, "Datetime is required"), // ISO 8601 format with timezone
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  ayanamsa: z.number().optional().default(1), // 1 = Lahiri (most common for Vedic)
});

// Token cache
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// Get access token from Prokerala OAuth2
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.accessToken;
  }

  logStep("Fetching new Prokerala access token");

  const response = await fetch(PROKERALA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: PROKERALA_CLIENT_ID!,
      client_secret: PROKERALA_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Token request failed", { status: response.status, error: errorText });
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the token (expires_in is in seconds)
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  logStep("Access token obtained", { expiresIn: data.expires_in });
  return data.access_token;
}

// Birth chart response interface
interface BirthChartResult {
  moonSign: string;
  moonSignId: number;
  moonSignLord: string;
  sunSign: string;
  sunSignId: number;
  sunSignLord: string;
  nakshatra: string;
  nakshatraId: number;
  nakshatraPada: number;
  nakshatraLord: string;
  nakshatraGender: string;
  // Additional info from birth-details
  deity: string;
  ganam: string;
  birthSymbol: string;
  animalSign: string;
  nadi: string;
  luckyColor: string;
  bestDirection: string;
  syllables: string;
  birthStone: string;
  westernZodiac: string;
}

// Call Prokerala birth-details API to get moon sign, sun sign, nakshatra, and additional info
async function getBirthDetails(
  accessToken: string,
  datetime: string,
  latitude: number,
  longitude: number,
  ayanamsa: number
): Promise<BirthChartResult> {
  const coordinates = `${latitude},${longitude}`;
  const url = new URL(`${PROKERALA_API_BASE}/astrology/birth-details`);
  url.searchParams.set("datetime", datetime);
  url.searchParams.set("coordinates", coordinates);
  url.searchParams.set("ayanamsa", ayanamsa.toString());
  url.searchParams.set("la", "en");

  logStep("Calling birth-details API", { url: url.toString() });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Birth details API failed", { status: response.status, error: errorText });
    throw new Error(`Birth details API failed: ${response.status}`);
  }

  const data = await response.json();
  logStep("Birth details received", { status: data.status });

  // Extract all available data from the response
  const chandraRasi = data.data.chandra_rasi;
  const sooryaRasi = data.data.soorya_rasi;
  const nakshatra = data.data.nakshatra;
  const additionalInfo = data.data.additional_info || {};
  const zodiac = data.data.zodiac;

  return {
    moonSign: chandraRasi.name,
    moonSignId: chandraRasi.id,
    moonSignLord: chandraRasi.lord?.vedic_name || chandraRasi.lord?.name || "",
    sunSign: sooryaRasi.name,
    sunSignId: sooryaRasi.id,
    sunSignLord: sooryaRasi.lord?.vedic_name || sooryaRasi.lord?.name || "",
    nakshatra: nakshatra.name,
    nakshatraId: nakshatra.id,
    nakshatraPada: nakshatra.pada,
    nakshatraLord: nakshatra.lord?.vedic_name || nakshatra.lord?.name || "",
    nakshatraGender: additionalInfo.gender || "",
    // Additional info
    deity: additionalInfo.deity || "",
    ganam: additionalInfo.ganam || "",
    birthSymbol: additionalInfo.symbol || "",
    animalSign: additionalInfo.animal_sign || "",
    nadi: additionalInfo.nadi || "",
    luckyColor: additionalInfo.color || "",
    bestDirection: additionalInfo.best_direction || "",
    syllables: additionalInfo.syllables || "",
    birthStone: additionalInfo.birth_stone || "",
    westernZodiac: zodiac?.name || "",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required credentials
    if (!PROKERALA_CLIENT_ID || !PROKERALA_CLIENT_SECRET) {
      logStep("Missing Prokerala credentials");
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
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { datetime, latitude, longitude, ayanamsa } = parseResult.data;

    logStep("Processing birth chart request", { datetime, latitude, longitude, ayanamsa });

    // Get access token
    const accessToken = await getAccessToken();

    // Call birth-details API
    const birthDetails = await getBirthDetails(accessToken, datetime, latitude, longitude, ayanamsa);

    logStep("Birth chart computed successfully", {
      moonSign: birthDetails.moonSign,
      sunSign: birthDetails.sunSign,
      nakshatra: birthDetails.nakshatra,
      nakshatraLord: birthDetails.nakshatraLord,
      ganam: birthDetails.ganam,
      nadi: birthDetails.nadi,
    });

    return new Response(JSON.stringify(birthDetails), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error processing request", { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage || "Failed to compute birth chart" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
