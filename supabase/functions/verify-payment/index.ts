import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { getStripeConfig } from "../_shared/lib/stripe-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("VERIFY-PAYMENT");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { stripe, isTestMode } = getStripeConfig();
    logStep("Stripe mode", { isTestMode });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Received session ID", { sessionId });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Database-first approach: return only IDs from metadata
    // The generate-paid-forecast function will fetch birth data from free_forecasts table
    const freeForecastId = session.metadata?.freeForecastId || "";
    const guestToken = session.metadata?.guestToken || "";
    const freeForecast = session.metadata?.freeForecast || "";

    logStep("Data extracted", { 
      hasFreeForecastId: !!freeForecastId, 
      hasGuestToken: !!guestToken,
      hasFreeForecast: !!freeForecast 
    });

    return new Response(JSON.stringify({ 
      success: true,
      freeForecastId,
      guestToken,
      freeForecast,
      customerEmail: session.customer_details?.email || "",
      sessionId: session.id,
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
