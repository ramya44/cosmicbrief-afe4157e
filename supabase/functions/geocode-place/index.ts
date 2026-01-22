import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 1 request per second per IP (Nominatim requirement)
const rateLimiter = new Map<string, number>();
const RATE_LIMIT_MS = 1000;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimiter.get(ip);

  // Clean up old entries periodically
  if (rateLimiter.size > 10000) {
    const cutoff = now - 60000;
    for (const [key, value] of rateLimiter.entries()) {
      if (value < cutoff) rateLimiter.delete(key);
    }
  }

  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    return false;
  }

  rateLimiter.set(ip, now);
  return true;
}

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

  // Rate limiting check
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Nominatim API - free geocoding service from OpenStreetMap
    // featuretype=settlement filters to cities, towns, villages only (no airports, landmarks, etc.)
    const url = `https://nominatim.openstreetmap.org/search?q=${sanitizedQuery}&format=json&limit=5&addressdetails=0&featuretype=settlement`;

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "CosmicBrief/1.0 (astrology app)",
        "Accept": "application/json",
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
          place_id: String(r.place_id),
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
