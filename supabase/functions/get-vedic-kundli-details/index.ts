import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[get-vedic-kundli-details] ${step}${detailsStr}`);
}

interface RequestBody {
  kundli_id: string;
  device_id?: string;
  shared?: boolean; // Flag to indicate this is a shared link access
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Backend configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    const { kundli_id, device_id, shared } = body;

    if (!kundli_id) {
      return new Response(JSON.stringify({ error: "kundli_id is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    logStep("Fetching kundli", { kundli_id, shared: !!shared });

    const { data, error } = await supabase
      .from("user_kundli_details")
      .select(
        "id, birth_date, birth_time, birth_place, moon_sign, sun_sign, nakshatra, ascendant_sign, animal_sign, name, user_id, free_vedic_forecast, paid_vedic_forecast, forecast_generated_at, email, device_id, shareable_link"
      )
      .eq("id", kundli_id)
      .maybeSingle();

    if (error) {
      logStep("Query error", { error: error.message });
      return new Response(JSON.stringify({ error: "Failed to load forecast" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For shared links: allow read-only access without device_id verification
    // For normal access: require device_id match
    const isSharedAccess = shared === true;
    const isOwner = data.device_id && data.device_id === device_id;

    if (!isSharedAccess && !isOwner) {
      // Deliberately 404 (not 403) to avoid leaking existence of rows
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't return device_id or email to client (privacy)
    const { device_id: _omitDevice, email: _omitEmail, ...safe } = data as any;

    // For shared access, also indicate it's read-only
    const response = {
      ...safe,
      is_owner: isOwner,
    };

    logStep("Returning kundli data", { is_owner: isOwner, shared: isSharedAccess });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    logStep("Unhandled error", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
