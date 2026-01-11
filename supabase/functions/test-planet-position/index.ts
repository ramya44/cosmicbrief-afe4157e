import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PROKERALA_CLIENT_ID = Deno.env.get("PROKERALA_CLIENT_ID");
const PROKERALA_CLIENT_SECRET = Deno.env.get("PROKERALA_CLIENT_SECRET");
const PROKERALA_TOKEN_URL = "https://api.prokerala.com/token";
const PROKERALA_API_BASE = "https://api.prokerala.com/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get access token from Prokerala OAuth2
async function getAccessToken(): Promise<string> {
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
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test data from free_forecasts id: d0f55e21-f83c-4be3-b610-152bafc9400d
    // birth_time_utc: 1989-04-04 15:00:00+00
    // Need to format as ISO 8601 with timezone offset
    // Original local time was 20:30 in Hyderabad (UTC+5:30)
    const datetime = "1989-04-04T20:30:00+05:30";
    const latitude = 17.360589;
    const longitude = 78.4740613;
    const ayanamsa = 1; // Lahiri

    console.log("Getting access token...");
    const accessToken = await getAccessToken();
    console.log("Access token obtained");

    // Call planet-position API
    const coordinates = `${latitude},${longitude}`;
    const url = new URL(`${PROKERALA_API_BASE}/astrology/planet-position`);
    url.searchParams.set("datetime", datetime);
    url.searchParams.set("coordinates", coordinates);
    url.searchParams.set("ayanamsa", ayanamsa.toString());
    url.searchParams.set("la", "en");

    console.log("Calling planet-position API:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("API failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `API failed: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Full response received");

    // Return the full raw response
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
