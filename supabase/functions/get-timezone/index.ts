import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 10 requests per minute per IP
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { lat, lon, timestamp } = await req.json();

    if (lat === undefined || lon === undefined || timestamp === undefined) {
      console.error('Missing required parameters:', { lat, lon, timestamp });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: lat, lon, timestamp' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('TIMEZONEDB_API_KEY');
    if (!apiKey) {
      console.error('TIMEZONEDB_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Timezone API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call TimeZoneDB API
    const url = `http://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=position&lat=${lat}&lng=${lon}&time=${timestamp}`;
    
    console.log('Calling TimeZoneDB API for:', { lat, lon, timestamp });
    
    const response = await fetch(url);
    const data = await response.json();

    console.log('TimeZoneDB response:', data);

    if (data.status !== 'OK') {
      console.error('TimeZoneDB API error:', data.message);
      return new Response(
        JSON.stringify({ error: data.message || 'Timezone lookup failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return timezone info
    return new Response(
      JSON.stringify({
        zoneName: data.zoneName,        // e.g., "America/New_York"
        abbreviation: data.abbreviation, // e.g., "EST"
        gmtOffset: data.gmtOffset,       // Offset in seconds from UTC
        dst: data.dst,                   // "1" if DST is active, "0" otherwise
        formatted: data.formatted,       // Local time formatted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-timezone function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
