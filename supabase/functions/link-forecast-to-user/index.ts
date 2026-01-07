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

    const { stripeSessionId, userId } = await req.json();

    logStep("Received data", { stripeSessionId, userId });

    if (!stripeSessionId || !userId) {
      throw new Error("Missing stripeSessionId or userId");
    }

    // Update the paid_forecasts record to link to the user
    const { data, error } = await supabase
      .from('paid_forecasts')
      .update({ user_id: userId })
      .eq('stripe_session_id', stripeSessionId)
      .select()
      .single();

    if (error) {
      logStep("Database error", { error: error.message });
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
