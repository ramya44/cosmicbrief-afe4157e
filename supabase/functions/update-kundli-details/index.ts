import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schemas for different update types
const LinkUserSchema = z.object({
  type: z.literal("link_user"),
  kundli_id: z.string().uuid("Invalid kundli ID"),
  user_id: z.string().uuid("Invalid user ID"),
  email: z.string().email("Invalid email").max(255),
  name: z.string().max(100).optional(),
  device_id: z.string().max(100),
});

const UpdateNameSchema = z.object({
  type: z.literal("update_name"),
  kundli_id: z.string().uuid("Invalid kundli ID"),
  name: z.string().trim().min(1).max(100, "Name must be 100 characters or less"),
  device_id: z.string().max(100),
});

const RequestSchema = z.discriminatedUnion("type", [LinkUserSchema, UpdateNameSchema]);

function logStep(step: string, details?: Record<string, unknown>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    step,
    ...details,
  }));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("update-kundli-details-started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = RequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      logStep("validation-failed", { errors: validationResult.error.errors });
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = validationResult.data;

    // Fetch the existing kundli record to validate ownership
    const { data: existing, error: fetchError } = await supabase
      .from("user_kundli_details")
      .select("id, device_id, user_id")
      .eq("id", body.kundli_id)
      .single();

    if (fetchError || !existing) {
      logStep("kundli-not-found", { kundli_id: body.kundli_id });
      return new Response(
        JSON.stringify({ error: "Kundli record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate ownership via device_id for anonymous users
    // For authenticated users linking their account, we also check device_id
    const isDeviceOwner = existing.device_id === body.device_id;
    
    // Check if user is authenticated and owns this record
    let isAuthenticatedOwner = false;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
        const { data: userData } = await anonClient.auth.getUser(token);
        if (userData?.user && existing.user_id === userData.user.id) {
          isAuthenticatedOwner = true;
        }
      } catch (e) {
        logStep("auth-check-failed", { error: String(e) });
      }
    }

    // Must be either device owner OR authenticated owner
    if (!isDeviceOwner && !isAuthenticatedOwner) {
      logStep("ownership-validation-failed", {
        kundli_id: body.kundli_id,
        existing_device: existing.device_id?.substring(0, 8) + "...",
        provided_device: body.device_id?.substring(0, 8) + "...",
      });
      return new Response(
        JSON.stringify({ error: "Not authorized to update this record" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different update types
    if (body.type === "link_user") {
      // Link user account to kundli
      // Only allow if record is not already linked to a different user
      if (existing.user_id && existing.user_id !== body.user_id) {
        logStep("already-linked", { existing_user_id: existing.user_id });
        return new Response(
          JSON.stringify({ error: "This record is already linked to another account" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData: Record<string, unknown> = {
        user_id: body.user_id,
        email: body.email,
      };
      if (body.name) {
        updateData.name = body.name;
      }

      const { error: updateError } = await supabase
        .from("user_kundli_details")
        .update(updateData)
        .eq("id", body.kundli_id);

      if (updateError) {
        logStep("update-failed", { error: updateError.message });
        return new Response(
          JSON.stringify({ error: "Failed to link account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      logStep("user-linked-successfully", { kundli_id: body.kundli_id, user_id: body.user_id });
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.type === "update_name") {
      // Update just the name
      const { error: updateError } = await supabase
        .from("user_kundli_details")
        .update({ name: body.name })
        .eq("id", body.kundli_id);

      if (updateError) {
        logStep("name-update-failed", { error: updateError.message });
        return new Response(
          JSON.stringify({ error: "Failed to update name" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      logStep("name-updated-successfully", { kundli_id: body.kundli_id });
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Should never reach here due to discriminated union
    return new Response(
      JSON.stringify({ error: "Unknown operation type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("unexpected-error", { error: String(error) });
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
