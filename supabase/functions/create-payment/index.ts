import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

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

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { freeForecastId, guestToken, freeForecastText } = await req.json();
    
    // Database-first approach: only require IDs, not full birth data
    if (!freeForecastId) throw new Error("Free forecast ID is required");
    if (!guestToken) throw new Error("Guest token is required");
    
    logStep("Received forecast reference", { 
      freeForecastId: freeForecastId.slice(0, 8) + "...",
      hasGuestToken: !!guestToken,
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const origin = req.headers.get("origin") || "https://lovable.dev";
    logStep("Creating checkout session", { origin });

    // HashRouter compatibility: Stripe must redirect to a hash-based route on static hosts.
    const successUrl = `${origin}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/#/results`;

    // Truncate free forecast text for Stripe display (500 char metadata limit)
    const truncatedForecast = freeForecastText && freeForecastText.length > 500 
      ? freeForecastText.substring(0, 497) + "..." 
      : (freeForecastText || "");

    // Database-first: Store only IDs in Stripe metadata
    // The generate-paid-forecast function will fetch all birth data from free_forecasts table
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1SoFOPCxgYskbggmpyVquT2X",
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        freeForecastId,
        guestToken,
        freeForecast: truncatedForecast,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
