import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";

const logStep = createLogger("GET-CHATBOT-SUBSCRIPTION-STATUS");

// Input validation schema
const RequestSchema = z.object({
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

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const validationResult = RequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id } = validationResult.data;
    logStep("Request validated", { kundli_id });

    // Check for existing subscription
    const { data: subscription, error } = await supabase
      .from("chatbot_subscriptions")
      .select("id, status, current_period_end")
      .eq("kundli_id", kundli_id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      logStep("Database error", { error: error.message });
      throw new Error("Failed to fetch subscription status");
    }

    const hasActiveSubscription = subscription?.status === 'active';
    const currentPeriodEnd = subscription?.current_period_end || null;

    logStep("Status fetched", {
      hasActive: hasActiveSubscription,
      status: subscription?.status || 'none'
    });

    return jsonResponse({
      hasActiveSubscription,
      status: subscription?.status || 'inactive',
      currentPeriodEnd,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
