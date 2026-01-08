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

// Compute zodiac sign from birth date string (YYYY-MM-DD format)
function getZodiacSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

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

    // Compute zodiac sign
    const zodiacSign = getZodiacSign(birthDate);
    logStep("Computed zodiac sign", { zodiacSign });

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
        zodiac_sign: zodiacSign,
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
