import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { getStripeConfig, getAppUrl } from "../_shared/lib/stripe-config.ts";

const logStep = createLogger("CREATE-BILLING-PORTAL");

// Input validation schema
const PortalRequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
});

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { stripe, isTestMode } = getStripeConfig();
    const appUrl = getAppUrl();

    logStep("Stripe mode", { isTestMode });

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const validationResult = PortalRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id } = validationResult.data;
    logStep("Request validated", { kundli_id });

    // Look up chatbot subscription to get stripe_customer_id
    const { data: subscription, error: subError } = await supabase
      .from("chatbot_subscriptions")
      .select("stripe_customer_id")
      .eq("kundli_id", kundli_id)
      .single();

    if (subError || !subscription) {
      logStep("Subscription not found", { error: subError?.message });
      return errorResponse("No subscription found for this account", 404);
    }

    if (!subscription.stripe_customer_id) {
      return errorResponse("No Stripe customer associated with this subscription", 400);
    }

    logStep("Found Stripe customer", { customer_id: subscription.stripe_customer_id });

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/chat`,
    });

    logStep("Portal session created", { session_id: portalSession.id });

    return jsonResponse({
      portal_url: portalSession.url,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
