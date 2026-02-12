import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createLogger } from "../_shared/lib/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("LINK-KUNDLI-TO-USER");

const InputSchema = z.object({
  device_id: z.string().uuid("Invalid device ID"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("User authenticated", { userId: user.id });

    // Parse input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = InputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { device_id } = validationResult.data;

    // Check if user already has a kundli
    const { data: existingUserKundli } = await supabaseAdmin
      .from("user_kundli_details")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (existingUserKundli) {
      logStep("User already has kundli", { kundliId: existingUserKundli.id });
      return new Response(
        JSON.stringify({
          linked: false,
          reason: "user_has_kundli",
          kundli_id: existingUserKundli.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find kundli by device_id that doesn't have a user_id
    const { data: deviceKundli, error: findError } = await supabaseAdmin
      .from("user_kundli_details")
      .select("id")
      .eq("device_id", device_id)
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !deviceKundli) {
      logStep("No unlinked kundli found for device", { device_id });
      return new Response(
        JSON.stringify({ linked: false, reason: "no_kundli_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link the kundli to the user
    const { error: updateError } = await supabaseAdmin
      .from("user_kundli_details")
      .update({ user_id: user.id })
      .eq("id", deviceKundli.id);

    if (updateError) {
      logStep("Failed to link kundli", { error: updateError.message });
      throw new Error(`Failed to link kundli: ${updateError.message}`);
    }

    logStep("Kundli linked successfully", { kundliId: deviceKundli.id, userId: user.id });

    return new Response(
      JSON.stringify({ linked: true, kundli_id: deviceKundli.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
