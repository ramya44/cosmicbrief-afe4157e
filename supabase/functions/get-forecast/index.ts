import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
const QuerySchema = z.object({
  id: z.string().uuid("Invalid forecast ID"),
  guest_token: z.string().uuid("Invalid guest token").optional(),
  type: z.enum(["free", "paid"]).default("free"),
});

// Rate limiting
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  
  if (!checkRateLimit(clientIP)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const rawParams = {
      id: url.searchParams.get("id"),
      guest_token: url.searchParams.get("guest_token"),
      type: url.searchParams.get("type") || "free",
    };

    const parseResult = QuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(", ");
      return new Response(
        JSON.stringify({ error: `Invalid request: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { id, guest_token, type } = parseResult.data;

    // Check for authenticated user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      }
    }

    // Create service client for data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === "free") {
      // Fetch free forecast with minimal fields
      const { data: forecast, error } = await supabase
        .from("free_forecasts")
        .select("id, forecast_text, pivotal_theme, zodiac_sign, created_at, guest_token, customer_email")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Database error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve forecast." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!forecast) {
        return new Response(
          JSON.stringify({ error: "Forecast not found." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Access control: require guest_token for anonymous access
      // Free forecasts don't have user_id, so we rely on guest_token OR email match for auth users
      const isEmailMatch = userId && forecast.customer_email;
      
      if (!isEmailMatch) {
        // Guest access requires valid guest_token
        if (!guest_token) {
          console.warn(`No guest token provided for forecast ${id} from IP ${clientIP}`);
          return new Response(
            JSON.stringify({ error: "Forecast not found." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (forecast.guest_token !== guest_token) {
          console.warn(`Invalid guest token for forecast ${id} from IP ${clientIP}`);
          return new Response(
            JSON.stringify({ error: "Forecast not found." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Return minimal data (exclude guest_token and sensitive fields)
      return new Response(
        JSON.stringify({
          id: forecast.id,
          forecast: forecast.forecast_text,
          pivotalTheme: forecast.pivotal_theme,
          zodiacSign: forecast.zodiac_sign,
          createdAt: forecast.created_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // Fetch paid forecast with minimal fields
      const { data: forecast, error } = await supabase
        .from("paid_forecasts")
        .select("id, strategic_forecast, zodiac_sign, created_at, user_id, guest_token, customer_email")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Database error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve forecast." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!forecast) {
        return new Response(
          JSON.stringify({ error: "Forecast not found." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Access control for paid forecasts
      if (forecast.user_id) {
        // User-linked forecast: require matching auth
        if (!userId) {
          console.warn(`Unauthenticated access attempt to user-linked forecast ${id} from IP ${clientIP}`);
          return new Response(
            JSON.stringify({ error: "Forecast not found." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (userId !== forecast.user_id) {
          console.warn(`User ${userId} attempted to access forecast ${id} owned by ${forecast.user_id}`);
          return new Response(
            JSON.stringify({ error: "Forecast not found." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Guest forecast: require valid guest_token
        if (!guest_token) {
          console.warn(`No guest token provided for paid forecast ${id} from IP ${clientIP}`);
          return new Response(
            JSON.stringify({ error: "Forecast not found." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (forecast.guest_token !== guest_token) {
          console.warn(`Invalid guest token for paid forecast ${id} from IP ${clientIP}`);
          return new Response(
            JSON.stringify({ error: "Forecast not found." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Return minimal data
      return new Response(
        JSON.stringify({
          id: forecast.id,
          strategicForecast: forecast.strategic_forecast,
          zodiacSign: forecast.zodiac_sign,
          createdAt: forecast.created_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in get-forecast:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
