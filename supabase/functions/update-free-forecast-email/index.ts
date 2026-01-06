import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-FREE-FORECAST-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { freeForecastId, customerEmail } = await req.json();

    logStep("Received data", { freeForecastId, customerEmail });

    // Validate required fields
    if (!freeForecastId || !customerEmail) {
      throw new Error("Missing required fields");
    }

    // Update the free_forecasts table with the email
    const { data, error } = await supabase
      .from('free_forecasts')
      .update({ customer_email: customerEmail })
      .eq('id', freeForecastId)
      .select()
      .single();

    if (error) {
      logStep("Database error", { error: error.message });
      throw new Error(`Failed to update forecast: ${error.message}`);
    }

    logStep("Free forecast email updated successfully", { id: data.id });

    return new Response(JSON.stringify({ 
      success: true,
      id: data.id 
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
