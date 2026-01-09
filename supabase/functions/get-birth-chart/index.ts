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
  risingSign: string;
  risingSignId: number;
  sunSign?: string;
  sunSignId?: number;
  nakshatra?: string;
  nakshatraId?: number;
  nakshatraPada?: number;
}

// Call Prokerala birth-details API to get moon sign and nakshatra
async function getBirthDetails(
  accessToken: string,
  datetime: string,
  latitude: number,
  longitude: number,
  ayanamsa: number
): Promise<{ moonSign: string; moonSignId: number; sunSign: string; sunSignId: number; nakshatra: string; nakshatraId: number; nakshatraPada: number }> {
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

  // Extract moon sign (chandra_rasi) and sun sign (soorya_rasi)
  const chandraRasi = data.data.chandra_rasi;
  const sooryaRasi = data.data.soorya_rasi;
  const nakshatra = data.data.nakshatra;

  return {
    moonSign: chandraRasi.name,
    moonSignId: chandraRasi.id,
    sunSign: sooryaRasi.name,
    sunSignId: sooryaRasi.id,
    nakshatra: nakshatra.name,
    nakshatraId: nakshatra.id,
    nakshatraPada: nakshatra.pada,
  };
}

// Call Prokerala kundli API to get ascendant/lagna
async function getKundli(
  accessToken: string,
  datetime: string,
  latitude: number,
  longitude: number,
  ayanamsa: number
): Promise<{ risingSign: string; risingSignId: number }> {
  const coordinates = `${latitude},${longitude}`;
  const url = new URL(`${PROKERALA_API_BASE}/astrology/kundli`);
  url.searchParams.set("datetime", datetime);
  url.searchParams.set("coordinates", coordinates);
  url.searchParams.set("ayanamsa", ayanamsa.toString());
  url.searchParams.set("la", "en");

  logStep("Calling kundli API for ascendant", { url: url.toString() });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("Kundli API failed", { status: response.status, error: errorText });
    throw new Error(`Kundli API failed: ${response.status}`);
  }

  const data = await response.json();
  logStep("Kundli data received", { status: data.status });

  // The kundli response includes chart_rasi which contains planet positions
  // The lagna (ascendant) is typically represented by the first house
  // In the Prokerala API, we need to find the ascendant from the chart data
  
  // Looking at the kundli response structure:
  // - chart_rasi contains the rasi chart with planet positions
  // - The ascendant should be in the nakshatra_details or we need to derive it
  
  // For now, let's check if there's a lagna field or derive from chart
  // Based on API docs, the kundli endpoint might have lagna info in planet positions
  
  // Check for planet positions - Ascendant is often at index 0 or has special marker
  const chartRasi = data.data?.chart_rasi;
  
  if (chartRasi) {
    // In Vedic astrology chart, the house with "As" or Ascendant marker indicates rising sign
    // The chart_rasi is typically an array of 12 houses
    // Each house contains planets, and the first house (index 0) is the ascendant house
    // The rasi of the first house IS the rising sign
    
    // Alternative: Check planet_positions for Ascendant
    const planetPositions = data.data?.planet_position;
    if (planetPositions) {
      // Find the Ascendant entry
      const ascendant = planetPositions.find(
        (p: { id: number; name: string }) => p.name === "Ascendant" || p.id === 100
      );
      if (ascendant && ascendant.rasi) {
        return {
          risingSign: ascendant.rasi.name,
          risingSignId: ascendant.rasi.id,
        };
      }
    }
  }

  // Fallback: If we can't find ascendant in kundli, we need to use a different approach
  // The kundli/advanced endpoint might have more details
  logStep("Attempting kundli/advanced for ascendant");
  
  const advancedUrl = new URL(`${PROKERALA_API_BASE}/astrology/kundli/advanced`);
  advancedUrl.searchParams.set("datetime", datetime);
  advancedUrl.searchParams.set("coordinates", coordinates);
  advancedUrl.searchParams.set("ayanamsa", ayanamsa.toString());
  advancedUrl.searchParams.set("la", "en");

  const advancedResponse = await fetch(advancedUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  if (advancedResponse.ok) {
    const advancedData = await advancedResponse.json();
    logStep("Kundli advanced data received");
    
    // Check planet positions in advanced response
    const planetPositions = advancedData.data?.planet_position;
    if (planetPositions) {
      const ascendant = planetPositions.find(
        (p: { id: number; name: string }) => p.name === "Ascendant" || p.id === 100
      );
      if (ascendant && ascendant.rasi) {
        return {
          risingSign: ascendant.rasi.name,
          risingSignId: ascendant.rasi.id,
        };
      }
    }
  }

  // If still not found, throw error
  throw new Error("Could not determine rising sign from Prokerala API");
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

    // Call both APIs in parallel for efficiency
    const [birthDetails, kundliDetails] = await Promise.all([
      getBirthDetails(accessToken, datetime, latitude, longitude, ayanamsa),
      getKundli(accessToken, datetime, latitude, longitude, ayanamsa),
    ]);

    const result: BirthChartResult = {
      moonSign: birthDetails.moonSign,
      moonSignId: birthDetails.moonSignId,
      risingSign: kundliDetails.risingSign,
      risingSignId: kundliDetails.risingSignId,
      sunSign: birthDetails.sunSign,
      sunSignId: birthDetails.sunSignId,
      nakshatra: birthDetails.nakshatra,
      nakshatraId: birthDetails.nakshatraId,
      nakshatraPada: birthDetails.nakshatraPada,
    };

    logStep("Birth chart computed successfully", {
      moonSign: result.moonSign,
      risingSign: result.risingSign,
      sunSign: result.sunSign,
    });

    return new Response(JSON.stringify(result), {
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
