import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAVE-FORECAST] ${step}${detailsStr}`);
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

    const { 
      stripeSessionId, 
      customerEmail, 
      customerName, 
      birthDate, 
      birthTime, 
      birthTimeUtc,
      birthPlace, 
      freeForecast, 
      strategicForecast,
      modelUsed,
      generationStatus,
      generationError,
      retryCount,
      tokenUsage,
      userId,
    } = await req.json();

    logStep("Received data", { 
      stripeSessionId, 
      customerEmail, 
      birthDate, 
      birthPlace,
      hasFreeForecast: !!freeForecast,
      hasStrategicForecast: !!strategicForecast,
      modelUsed,
      generationStatus,
      retryCount,
    });

    // For failed generation, we still save what we have
    const isFailed = generationStatus === 'failed';

    // Validate required fields (allow missing strategicForecast if failed)
    if (!stripeSessionId || !customerEmail || !birthDate || !birthTime || !birthPlace) {
      throw new Error("Missing required fields");
    }

    if (!isFailed && (!freeForecast || !strategicForecast)) {
      throw new Error("Missing forecast data for successful generation");
    }

    // Insert into paid_forecasts table
    const { data, error } = await supabase
      .from('paid_forecasts')
      .insert({
        stripe_session_id: stripeSessionId,
        customer_email: customerEmail,
        customer_name: customerName || null,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_time_utc: birthTimeUtc || null,
        birth_place: birthPlace,
        free_forecast: freeForecast || null,
        strategic_forecast: strategicForecast || null,
        amount_paid: 2000, // $20 in cents
        model_used: modelUsed || null,
        generation_status: generationStatus || 'complete',
        generation_error: generationError || null,
        retry_count: retryCount || 0,
        prompt_tokens: tokenUsage?.promptTokens || null,
        completion_tokens: tokenUsage?.completionTokens || null,
        total_tokens: tokenUsage?.totalTokens || null,
        user_id: userId || null,
      })
      .select()
      .single();

    if (error) {
      logStep("Database error", { error: error.message });
      throw new Error(`Failed to save forecast: ${error.message}`);
    }

    logStep("Forecast saved successfully", { id: data.id, generationStatus: generationStatus || 'complete' });

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
