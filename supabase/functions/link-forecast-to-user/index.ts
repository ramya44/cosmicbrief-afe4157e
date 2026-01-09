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

    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logStep("Missing or invalid authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error("Supabase configuration is missing");
    }

    // Create client with user's auth to verify JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      logStep("JWT verification failed", { error: claimsError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const authenticatedUserId = claimsData.claims.sub;
    logStep("JWT verified", { userId: authenticatedUserId });

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { stripeSessionId, guestToken } = await req.json();

    logStep("Received data", { stripeSessionId, userId: authenticatedUserId, hasGuestToken: !!guestToken });

    if (!stripeSessionId) {
      throw new Error("Missing stripeSessionId");
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
      .update({ user_id: authenticatedUserId })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logStep("Database update error", { error: error.message });
      throw new Error(`Failed to link forecast: ${error.message}`);
    }

    logStep("Forecast linked successfully", { forecastId: data.id, userId: authenticatedUserId });

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
