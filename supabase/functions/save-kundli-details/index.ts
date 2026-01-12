import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[save-kundli-details] ${step}${detailsStr}`);
}

interface KundliInput {
  // Birth details
  birth_date: string;
  birth_time: string;
  birth_place: string;
  birth_time_utc?: string;
  latitude: number;
  longitude: number;
  email?: string;
  device_id?: string;
  
  // Kundli data from API
  kundli_data: {
    nakshatra: string;
    nakshatra_id: number;
    nakshatra_pada: number;
    nakshatra_lord: string;
    nakshatra_gender: string;
    deity: string;
    ganam: string;
    birth_symbol: string;
    animal_sign: string;
    nadi: string;
    lucky_color: string;
    best_direction: string;
    syllables: string;
    birth_stone: string;
    moon_sign: string;
    moon_sign_id: number;
    moon_sign_lord: string;
    sun_sign: string;
    sun_sign_id: number;
    sun_sign_lord: string;
    zodiac_sign: string;
    has_mangal_dosha: boolean;
    mangal_dosha_description: string;
    has_mangal_exception: boolean;
    mangal_dosha_type: string | null;
    mangal_dosha_exceptions: unknown[];
    mangal_dosha_remedies: unknown[];
    major_yogas: unknown[];
    chandra_yogas: unknown[];
    soorya_yogas: unknown[];
    inauspicious_yogas: unknown[];
    dasha_periods: unknown;
  };
}

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

    const body: KundliInput = await req.json();
    logStep("Request body parsed", { 
      birth_date: body.birth_date,
      birth_place: body.birth_place,
      hasKundliData: !!body.kundli_data 
    });

    const { kundli_data, ...birthDetails } = body;

    const insertData = {
      // Birth details
      birth_date: birthDetails.birth_date,
      birth_time: birthDetails.birth_time,
      birth_place: birthDetails.birth_place,
      birth_time_utc: birthDetails.birth_time_utc || null,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      email: birthDetails.email || null,
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
      
      // Mangal Dosha
      has_mangal_dosha: kundli_data.has_mangal_dosha,
      mangal_dosha_description: kundli_data.mangal_dosha_description,
      has_mangal_exception: kundli_data.has_mangal_exception,
      mangal_dosha_type: kundli_data.mangal_dosha_type,
      mangal_dosha_exceptions: kundli_data.mangal_dosha_exceptions,
      mangal_dosha_remedies: kundli_data.mangal_dosha_remedies,
      
      // Yogas
      major_yogas: kundli_data.major_yogas,
      chandra_yogas: kundli_data.chandra_yogas,
      soorya_yogas: kundli_data.soorya_yogas,
      inauspicious_yogas: kundli_data.inauspicious_yogas,
      
      // Dasha
      dasha_periods: kundli_data.dasha_periods,
    };

    logStep("Inserting kundli details into database");

    const { data, error } = await supabase
      .from("user_kundli_details")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      logStep("Database insert error", { error: error.message });
      throw new Error(`Failed to save kundli details: ${error.message}`);
    }

    logStep("Kundli details saved successfully", { id: data.id });

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
