import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { getStripeConfig, getAppUrl } from "../_shared/lib/stripe-config.ts";
import { corsHeaders } from "../_shared/lib/http.ts";

const logStep = createLogger("CREATE-VEDIC-PAYMENT");

// Input validation schema
const PaymentRequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { stripe, isTestMode, priceIds } = getStripeConfig();
    const appUrl = getAppUrl();

    logStep("Stripe mode", { isTestMode });

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = PaymentRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { kundli_id } = validationResult.data;
    logStep("Request validated", { kundli_id });

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

    // Check if customer exists
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    // Create checkout session with metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: priceIds.vedic,
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${appUrl}/#/vedic/payment-success?session_id={CHECKOUT_SESSION_ID}&kundli_id=${kundli_id}`,
      cancel_url: `${appUrl}/#/vedic/results?id=${kundli_id}`,
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
