/**
 * Stripe configuration with test/production mode toggle
 *
 * Set STRIPE_TEST_MODE=true in Supabase secrets to use test keys
 */

import Stripe from "https://esm.sh/stripe@13.10.0";

export interface StripeConfig {
  stripe: Stripe;
  isTestMode: boolean;
  priceIds: {
    weekly: string;
    vedic: string;
    cosmicBrief: string;
    chatbot: string;
  };
  webhookSecret: string;
}

export function getStripeConfig(): StripeConfig {
  const isTestMode = Deno.env.get("STRIPE_TEST_MODE") === "true";

  // Select the appropriate secret key
  const stripeSecretKey = isTestMode
    ? Deno.env.get("STRIPE_TEST_SECRET_KEY")
    : Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeSecretKey) {
    throw new Error(
      isTestMode
        ? "STRIPE_TEST_SECRET_KEY is not configured"
        : "STRIPE_SECRET_KEY is not configured"
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

  // Select appropriate price IDs
  const priceIds = {
    weekly: isTestMode
      ? (Deno.env.get("STRIPE_TEST_WEEKLY_PRICE_ID") || "price_test_weekly")
      : (Deno.env.get("STRIPE_WEEKLY_PRICE_ID") || "price_1T1gpBCxgYskbggmVK3Ac7iI"),
    vedic: isTestMode
      ? (Deno.env.get("STRIPE_TEST_VEDIC_PRICE_ID") || "price_test_vedic")
      : (Deno.env.get("STRIPE_VEDIC_PRICE_ID") || "price_1QqILfCxgYskbggmziPZPJHg"),
    cosmicBrief: isTestMode
      ? (Deno.env.get("STRIPE_TEST_COSMIC_BRIEF_PRICE_ID") || "price_test_cosmic")
      : (Deno.env.get("STRIPE_COSMIC_BRIEF_PRICE_ID") || "price_1R3t2KCxgYskbggm1g7YXP7U"),
    chatbot: isTestMode
      ? (Deno.env.get("STRIPE_TEST_CHATBOT_PRICE_ID") || "price_test_chatbot")
      : (Deno.env.get("STRIPE_CHATBOT_PRICE_ID") || "price_1T6J4RCxgYskbggmDjrH4okM"),
  };

  // Select appropriate webhook secret
  const webhookSecret = isTestMode
    ? (Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET") || "")
    : (Deno.env.get("STRIPE_WEBHOOK_SECRET") || "");

  return {
    stripe,
    isTestMode,
    priceIds,
    webhookSecret,
  };
}

export function getAppUrl(): string {
  // APP_URL_OVERRIDE takes precedence - useful for local dev with production payments
  const override = Deno.env.get("APP_URL_OVERRIDE");
  if (override) {
    return override;
  }

  const isTestMode = Deno.env.get("STRIPE_TEST_MODE") === "true";
  return isTestMode
    ? (Deno.env.get("APP_URL_TEST") || "http://localhost:8081")
    : (Deno.env.get("APP_URL") || "https://www.cosmicbrief.com");
}
