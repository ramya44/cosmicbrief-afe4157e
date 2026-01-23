import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number]; // [lon, lat]
  relevance: number;
  place_type: string[];
};

type MapboxResponse = {
  features: MapboxFeature[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const MAPBOX_ACCESS_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error("MAPBOX_ACCESS_TOKEN not configured");
    return new Response(
      JSON.stringify({ error: "Geocoding service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));

    // Validate query - must be string between 2-200 characters
    if (typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize and encode the query
    const sanitizedQuery = encodeURIComponent(query.trim().slice(0, 200));

    // Mapbox Geocoding API
    // types=place filters to cities, towns, villages (no streets, addresses, POIs)
    // autocomplete=true enables partial matching for better autocomplete UX
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${sanitizedQuery}.json?` +
      `access_token=${MAPBOX_ACCESS_TOKEN}` +
      `&types=place` +
      `&limit=5` +
      `&autocomplete=true`;

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("Mapbox error:", resp.status, text);
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = (await resp.json()) as MapboxResponse;

    // Map Mapbox response to our Place interface
    // Mapbox center is [lon, lat], we need to return lat/lon separately
    const results = Array.isArray(data?.features)
      ? data.features.map((f) => ({
          place_id: f.id,
          display_name: f.place_name,
          lat: String(f.center[1]), // latitude is second element
          lon: String(f.center[0]), // longitude is first element
        }))
      : [];

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in geocode-place:", error);
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
