import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VEDIC_PRICE_ID = "price_1SosMtCxgYskbggmpRArQdNq";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[create-vedic-payment] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { kundli_id } = await req.json();
    logStep("Request body parsed", { kundli_id });

    if (!kundli_id) {
      throw new Error("kundli_id is required");
    }

    // Fetch kundli details to get birth data and email
    const { data: kundliData, error: kundliError } = await supabase
      .from("user_kundli_details")
      .select("*")
      .eq("id", kundli_id)
      .single();

    if (kundliError || !kundliData) {
      throw new Error("Kundli not found");
    }

    // Use email from database (more secure than client-provided)
    const email = kundliData.email;
    logStep("Kundli data fetched", { birth_date: kundliData.birth_date, email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create checkout session with metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: VEDIC_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${origin}/#/vedic/payment-success?session_id={CHECKOUT_SESSION_ID}&kundli_id=${kundli_id}`,
      cancel_url: `${origin}/#/vedic/results?id=${kundli_id}`,
      metadata: {
        kundli_id,
        birth_date: kundliData.birth_date,
        birth_time: kundliData.birth_time,
        birth_place: kundliData.birth_place,
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
