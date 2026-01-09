import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 5 requests per minute per IP
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60000;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  // Clean up old entries to prevent memory leak
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

// Input validation schema
const InputSchema = z.object({
  freeForecastId: z.string().uuid("Invalid forecast ID format"),
  customerEmail: z.string().email("Invalid email format").max(255, "Email too long"),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-FREE-FORECAST-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
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
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawInput = await req.json();
    
    // Validate input with zod
    const parseResult = InputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(", ");
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { freeForecastId, customerEmail } = parseResult.data;

    logStep("Received data", { freeForecastId, customerEmail: "***" });

    // Update the free_forecasts table with the email
    const { data, error } = await supabase
      .from('free_forecasts')
      .update({ customer_email: customerEmail })
      .eq('id', freeForecastId)
      .select()
      .single();

    if (error) {
      logStep("Database error", { error: error.message });
      throw new Error(`Failed to update forecast: ${error.message}`);
    }

    logStep("Free forecast email updated successfully", { id: data.id });

    return new Response(JSON.stringify({ 
      success: true,
      id: data.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
