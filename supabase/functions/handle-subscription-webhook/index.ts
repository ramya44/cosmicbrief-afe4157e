import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type Stripe from "https://esm.sh/stripe@13.10.0";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { getStripeConfig } from "../_shared/lib/stripe-config.ts";

const logStep = createLogger("SUBSCRIPTION-WEBHOOK");

// Helper to determine subscription type from metadata
function getSubscriptionType(metadata: Record<string, string> | null): "weekly" | "chatbot" {
  return metadata?.subscription_type === "chatbot" ? "chatbot" : "weekly";
}

// Helper to get the correct table name
function getTableName(subscriptionType: "weekly" | "chatbot"): string {
  return subscriptionType === "chatbot" ? "chatbot_subscriptions" : "weekly_forecast_subscriptions";
}

Deno.serve(async (req) => {
  // Allow POST only
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    logStep("Webhook received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { stripe, isTestMode, webhookSecret } = getStripeConfig();

    if (!webhookSecret) {
      throw new Error("Stripe webhook secret is not configured");
    }

    logStep("Stripe mode", { isTestMode });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Missing signature");
      return errorResponse("Missing stripe-signature header", 400);
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logStep("Signature verification failed", { error: message });
      return errorResponse(`Webhook signature verification failed: ${message}`, 400);
    }

    logStep("Event verified", { type: event.type });

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const kundliId = session.metadata?.kundli_id;
        const subscriptionType = getSubscriptionType(session.metadata as Record<string, string> | null);
        const tableName = getTableName(subscriptionType);

        if (!kundliId) {
          logStep("No kundli_id in session metadata");
          break;
        }

        logStep("Checkout completed", { kundli_id: kundliId, subscription_type: subscriptionType });

        // Get subscription details
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Update subscription record
        const { error } = await supabase
          .from(tableName)
          .update({
            status: 'active',
            stripe_subscription_id: subscriptionId,
            subscription_started_at: new Date().toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("kundli_id", kundliId);

        if (error) {
          logStep("Failed to update subscription", { error: error.message, table: tableName });
        } else {
          logStep("Subscription activated", { kundli_id: kundliId, type: subscriptionType });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Extract metadata - try subscription first, then invoice parent
        let kundliId = subscription.metadata?.kundli_id;
        let subscriptionType = getSubscriptionType(subscription.metadata as Record<string, string> | null);

        // Fallback: check invoice parent metadata (for first invoice)
        if (!kundliId && (invoice as any).parent?.subscription_details?.metadata?.kundli_id) {
          kundliId = (invoice as any).parent.subscription_details.metadata.kundli_id;
          subscriptionType = getSubscriptionType((invoice as any).parent.subscription_details.metadata);
        }

        const tableName = getTableName(subscriptionType);

        if (!kundliId) {
          // Try database lookup as last resort
          const { data: subData } = await supabase
            .from(tableName)
            .select("kundli_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (!subData) {
            logStep("Subscription not found for invoice", { subscription_id: subscriptionId, table: tableName });
            break;
          }
          kundliId = subData.kundli_id;
        }

        // Update subscription - use kundli_id which is more reliable than stripe_subscription_id
        const { error } = await supabase
          .from(tableName)
          .update({
            status: 'active',
            stripe_subscription_id: subscriptionId,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("kundli_id", kundliId);

        if (error) {
          logStep("Failed to update subscription period", { error: error.message });
        } else {
          logStep("Subscription renewed", { kundli_id: kundliId, type: subscriptionType });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Get subscription details from Stripe to determine type
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subscriptionType = getSubscriptionType(subscription.metadata as Record<string, string> | null);
        const tableName = getTableName(subscriptionType);

        // Mark subscription as past_due
        const { error } = await supabase
          .from(tableName)
          .update({ status: 'past_due' })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          logStep("Failed to update subscription status", { error: error.message });
        } else {
          logStep("Subscription marked past_due", { type: subscriptionType });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const kundliId = subscription.metadata?.kundli_id;
        const subscriptionType = getSubscriptionType(subscription.metadata as Record<string, string> | null);
        const tableName = getTableName(subscriptionType);

        // Mark subscription as canceled
        const { error } = await supabase
          .from(tableName)
          .update({ status: 'canceled' })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Failed to cancel subscription", { error: error.message });
        } else {
          logStep("Subscription canceled", { kundli_id: kundliId, type: subscriptionType });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return jsonResponse({ received: true });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
