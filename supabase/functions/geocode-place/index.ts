import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));

    if (typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", query.trim());
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        // Nominatim usage policy expects a valid User-Agent from server-side requests.
        // (Browsers cannot reliably set this header, which is why we proxy.)
        "User-Agent": "AstroForecastApp/1.0 (Lovable Cloud)",
        "Accept-Language": "en",
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("Nominatim error:", resp.status, text);
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = (await resp.json()) as NominatimResult[];

    const results = Array.isArray(data)
      ? data.map((r) => ({
          place_id: r.place_id,
          display_name: r.display_name,
          lat: r.lat,
          lon: r.lon,
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
