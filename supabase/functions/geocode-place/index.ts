import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 20 requests per minute per IP (more lenient for autocomplete)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60000;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  if (rateLimiter.size > 10000) {
    for (const [key, value] of rateLimiter.entries()) {
      if (now > value.resetAt) rateLimiter.delete(key);
    }
  }
  
  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
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
      JSON.stringify({ error: "Too many requests. Please try again later." }),
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
    
    // Add maximum length check
    const sanitizedQuery = query.trim().slice(0, 200);

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", sanitizedQuery);
    url.searchParams.set("limit", "10"); // Fetch more to allow for deduplication
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("featureType", "settlement"); // Only cities, towns, villages

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

    const mapped = Array.isArray(data)
      ? data.map((r) => ({
          place_id: r.place_id,
          display_name: r.display_name,
          lat: r.lat,
          lon: r.lon,
        }))
      : [];

    // Deduplicate by display_name
    const seen = new Set<string>();
    const results = mapped.filter((r) => {
      if (seen.has(r.display_name)) return false;
      seen.add(r.display_name);
      return true;
    }).slice(0, 5); // Return max 5 results

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
