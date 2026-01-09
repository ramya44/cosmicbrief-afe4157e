import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LINK-FORECAST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { stripeSessionId, userId, guestToken } = await req.json();

    logStep("Received data", { stripeSessionId, userId, hasGuestToken: !!guestToken });

    if (!stripeSessionId || !userId) {
      throw new Error("Missing stripeSessionId or userId");
    }

    // First, fetch the existing forecast to verify guest_token
    const { data: existing, error: fetchError } = await supabase
      .from('paid_forecasts')
      .select('id, guest_token')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle();

    if (fetchError) {
      logStep("Database fetch error", { error: fetchError.message });
      throw new Error(`Failed to fetch forecast: ${fetchError.message}`);
    }

    if (!existing) {
      logStep("Forecast not found", { stripeSessionId });
      return new Response(JSON.stringify({ error: "Forecast not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verify guest_token matches
    if (existing.guest_token && existing.guest_token !== guestToken) {
      logStep("Guest token mismatch", { 
        forecastId: existing.id, 
        providedToken: guestToken ? 'provided' : 'missing' 
      });
      return new Response(JSON.stringify({ error: "Access denied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Update the paid_forecasts record to link to the user
    const { data, error } = await supabase
      .from('paid_forecasts')
      .update({ user_id: userId })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logStep("Database update error", { error: error.message });
      throw new Error(`Failed to link forecast: ${error.message}`);
    }

    logStep("Forecast linked successfully", { forecastId: data.id, userId });

    return new Response(JSON.stringify({ 
      success: true,
      forecastId: data.id 
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
