import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { getStripeConfig, getAppUrl } from "../_shared/lib/stripe-config.ts";

const logStep = createLogger("CREATE-CHATBOT-SUBSCRIPTION");

// Input validation schema
const SubscriptionRequestSchema = z.object({
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
    const { stripe, isTestMode, priceIds } = getStripeConfig();
    const appUrl = getAppUrl();

    logStep("Stripe mode", { isTestMode });

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const validationResult = SubscriptionRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id } = validationResult.data;
    logStep("Request validated", { kundli_id });

    // Fetch kundli to get email
    const { data: kundliData, error: kundliError } = await supabase
      .from("user_kundli_details")
      .select("id, email, name")
      .eq("id", kundli_id)
      .single();

    if (kundliError || !kundliData) {
      logStep("Kundli not found", { error: kundliError?.message });
      return errorResponse("Kundli not found", 404);
    }

    if (!kundliData.email) {
      return errorResponse("Email is required for subscription", 400);
    }

    logStep("Kundli fetched", { email: kundliData.email });

    // Check for existing subscription
    const { data: existingSub } = await supabase
      .from("chatbot_subscriptions")
      .select("*")
      .eq("kundli_id", kundli_id)
      .single();

    // If already has active subscription, return error
    if (existingSub?.status === 'active') {
      return errorResponse("Already have an active chatbot subscription", 400);
    }

    // Get or create Stripe customer
    let stripeCustomerId = existingSub?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Check if customer already exists by email
      const customers = await stripe.customers.list({
        email: kundliData.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: kundliData.email,
          name: kundliData.name || undefined,
          metadata: {
            kundli_id: kundli_id,
          },
        });
        stripeCustomerId = customer.id;
      }

      logStep("Stripe customer", { id: stripeCustomerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceIds.chatbot,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${appUrl}/chat?subscription=success`,
      cancel_url: `${appUrl}/chat?subscription=canceled`,
      metadata: {
        kundli_id: kundli_id,
        subscription_type: "chatbot",
      },
      subscription_data: {
        metadata: {
          kundli_id: kundli_id,
          subscription_type: "chatbot",
        },
      },
    });

    logStep("Checkout session created", { session_id: session.id });

    // Update or create subscription record
    if (existingSub) {
      const { error: updateError } = await supabase
        .from("chatbot_subscriptions")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", existingSub.id);

      if (updateError) {
        logStep("Failed to update subscription record", { error: updateError.message });
      }
    } else {
      const { error: insertError } = await supabase
        .from("chatbot_subscriptions")
        .insert({
          kundli_id,
          email: kundliData.email,
          stripe_customer_id: stripeCustomerId,
          status: 'inactive',
        });

      if (insertError) {
        logStep("Failed to create subscription record", { error: insertError.message });
        // Don't fail the whole flow - checkout can still work, webhook will create record
      } else {
        logStep("Subscription record created");
      }
    }

    return jsonResponse({
      checkout_url: session.url,
      session_id: session.id,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
