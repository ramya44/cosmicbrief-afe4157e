import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[save-birth-chart] ${step}${detailsStr}`);
}

// Input validation schema - Core birth chart data only, NO dasha periods
const PlanetPositionSchema = z.object({
  id: z.number(),
  name: z.string().max(50),
  sign: z.string().max(50),
  sign_id: z.number(),
  sign_lord: z.string().max(50),
  degree: z.number().min(0).max(360),
  full_degree: z.number().min(0).max(360),
  is_retrograde: z.boolean(),
  nakshatra: z.string().max(50).optional(),
  nakshatra_id: z.number().optional(),
  nakshatra_pada: z.number().min(1).max(4).optional(),
  nakshatra_lord: z.string().max(50).optional(),
});

const BirthChartInputSchema = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format. Use HH:MM"),
  birth_place: z.string().min(1, "Birth place is required").max(200, "Birth place too long"),
  birth_time_utc: z.string().max(50).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  email: z.string().email("Invalid email").max(255).toLowerCase().trim().optional().or(z.literal("")),
  name: z.string().max(100).trim().optional(),
  device_id: z.string().uuid("Invalid device ID").optional(),
  kundli_data: z.object({
    // Core Nakshatra data
    nakshatra: z.string().max(50),
    nakshatra_id: z.number(),
    nakshatra_pada: z.number().min(1).max(4),
    nakshatra_lord: z.string().max(50),
    // Optional extra nakshatra info
    nakshatra_gender: z.string().max(20).optional().default(""),
    deity: z.string().max(100).optional().default(""),
    ganam: z.string().max(50).optional().default(""),
    birth_symbol: z.string().max(100).optional().default(""),
    animal_sign: z.string().max(50).optional().default(""),
    nadi: z.string().max(50).optional().default(""),
    lucky_color: z.string().max(50).optional().default(""),
    best_direction: z.string().max(50).optional().default(""),
    syllables: z.string().max(100).optional().default(""),
    birth_stone: z.string().max(50).optional().default(""),
    // Moon sign
    moon_sign: z.string().max(50),
    moon_sign_id: z.number(),
    moon_sign_lord: z.string().max(50),
    // Sun sign
    sun_sign: z.string().max(50),
    sun_sign_id: z.number(),
    sun_sign_lord: z.string().max(50),
    zodiac_sign: z.string().max(50).optional().default(""),
    // Ascendant (Lagna) - Required for chart display
    ascendant_sign: z.string().max(50),
    ascendant_sign_id: z.number(),
    ascendant_sign_lord: z.string().max(50),
    // Planetary positions - Required for chart display
    planetary_positions: z.array(PlanetPositionSchema).max(15),
    // NO dasha_periods - that's for forecasts only
  }),
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = BirthChartInputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = validationResult.data;
    logStep("Request validated", { 
      birth_date: body.birth_date,
      birth_place: body.birth_place,
      hasKundliData: !!body.kundli_data 
    });

    const { kundli_data, ...birthDetails } = body;

    // Build insert data - NO dasha_periods, just birth chart data
    const insertData = {
      // Birth details
      birth_date: birthDetails.birth_date,
      birth_time: birthDetails.birth_time,
      birth_place: birthDetails.birth_place,
      birth_time_utc: birthDetails.birth_time_utc || null,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      email: birthDetails.email || null,
      name: birthDetails.name || null,
      device_id: birthDetails.device_id || null,
      
      // Basic Vedic data
      moon_sign: kundli_data.moon_sign,
      moon_sign_id: kundli_data.moon_sign_id,
      moon_sign_lord: kundli_data.moon_sign_lord,
      sun_sign: kundli_data.sun_sign,
      sun_sign_id: kundli_data.sun_sign_id,
      sun_sign_lord: kundli_data.sun_sign_lord,
      nakshatra: kundli_data.nakshatra,
      nakshatra_id: kundli_data.nakshatra_id,
      nakshatra_pada: kundli_data.nakshatra_pada,
      nakshatra_lord: kundli_data.nakshatra_lord,
      nakshatra_gender: kundli_data.nakshatra_gender,
      deity: kundli_data.deity,
      ganam: kundli_data.ganam,
      birth_symbol: kundli_data.birth_symbol,
      animal_sign: kundli_data.animal_sign,
      nadi: kundli_data.nadi,
      lucky_color: kundli_data.lucky_color,
      best_direction: kundli_data.best_direction,
      syllables: kundli_data.syllables,
      birth_stone: kundli_data.birth_stone,
      zodiac_sign: kundli_data.zodiac_sign,
      
      // Ascendant (Lagna)
      ascendant_sign: kundli_data.ascendant_sign,
      ascendant_sign_id: kundli_data.ascendant_sign_id,
      ascendant_sign_lord: kundli_data.ascendant_sign_lord,
      
      // Planetary positions
      planetary_positions: kundli_data.planetary_positions,
      
      // NO dasha_periods - will be calculated on-demand for forecasts
    };

    logStep("Inserting birth chart into database");

    const { data, error } = await supabase
      .from("user_kundli_details")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      logStep("Database insert error", { error: error.message });
      throw new Error(`Failed to save birth chart: ${error.message}`);
    }

    logStep("Birth chart saved successfully", { id: data.id });

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    const errStack = error instanceof Error ? error.stack : undefined;
    logStep("Error", { message: errMessage, stack: errStack });
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
