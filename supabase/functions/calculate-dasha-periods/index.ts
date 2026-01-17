import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[calculate-dasha-periods] ${step}${detailsStr}`);
}

// ============ DASHA CALCULATOR (inline to avoid import issues) ============

// Nakshatra data: [name, ruling planet, start degree, end degree]
const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", start: 0, end: 13.333333 },
  { name: "Bharani", lord: "Venus", start: 13.333333, end: 26.666667 },
  { name: "Krittika", lord: "Sun", start: 26.666667, end: 40 },
  { name: "Rohini", lord: "Moon", start: 40, end: 53.333333 },
  { name: "Mrigashira", lord: "Mars", start: 53.333333, end: 66.666667 },
  { name: "Ardra", lord: "Rahu", start: 66.666667, end: 80 },
  { name: "Punarvasu", lord: "Jupiter", start: 80, end: 93.333333 },
  { name: "Pushya", lord: "Saturn", start: 93.333333, end: 106.666667 },
  { name: "Ashlesha", lord: "Mercury", start: 106.666667, end: 120 },
  { name: "Magha", lord: "Ketu", start: 120, end: 133.333333 },
  { name: "Purva Phalguni", lord: "Venus", start: 133.333333, end: 146.666667 },
  { name: "Uttara Phalguni", lord: "Sun", start: 146.666667, end: 160 },
  { name: "Hasta", lord: "Moon", start: 160, end: 173.333333 },
  { name: "Chitra", lord: "Mars", start: 173.333333, end: 186.666667 },
  { name: "Swati", lord: "Rahu", start: 186.666667, end: 200 },
  { name: "Vishakha", lord: "Jupiter", start: 200, end: 213.333333 },
  { name: "Anuradha", lord: "Saturn", start: 213.333333, end: 226.666667 },
  { name: "Jyeshtha", lord: "Mercury", start: 226.666667, end: 240 },
  { name: "Mula", lord: "Ketu", start: 240, end: 253.333333 },
  { name: "Purva Ashadha", lord: "Venus", start: 253.333333, end: 266.666667 },
  { name: "Uttara Ashadha", lord: "Sun", start: 266.666667, end: 280 },
  { name: "Shravana", lord: "Moon", start: 280, end: 293.333333 },
  { name: "Dhanishta", lord: "Mars", start: 293.333333, end: 306.666667 },
  { name: "Shatabhisha", lord: "Rahu", start: 306.666667, end: 320 },
  { name: "Purva Bhadrapada", lord: "Jupiter", start: 320, end: 333.333333 },
  { name: "Uttara Bhadrapada", lord: "Saturn", start: 333.333333, end: 346.666667 },
  { name: "Revati", lord: "Mercury", start: 346.666667, end: 360 }
];

// Vimshottari Dasha periods in years
const DASHA_PERIODS: Record<string, number> = {
  "Sun": 6,
  "Moon": 10,
  "Mars": 7,
  "Rahu": 18,
  "Jupiter": 16,
  "Saturn": 19,
  "Mercury": 17,
  "Ketu": 7,
  "Venus": 20
};

// Dasha sequence starting from Ketu
const DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

interface DashaPeriod {
  planet: string;
  start_date: Date;
  end_date: Date;
  years: number;
}

interface AntarDashaPeriod {
  planet: string;
  start_date: Date;
  end_date: Date;
  maha_dasha_lord: string;
}

function getMoonNakshatra(moonLongitude: number): { name: string; lord: string; progress: number } {
  const nakshatra = NAKSHATRAS.find(n => moonLongitude >= n.start && moonLongitude < n.end);
  
  if (!nakshatra) {
    throw new Error(`Invalid moon longitude: ${moonLongitude}`);
  }
  
  const nakshatraSpan = 13.333333;
  const progress = (moonLongitude - nakshatra.start) / nakshatraSpan;
  
  return {
    name: nakshatra.name,
    lord: nakshatra.lord,
    progress
  };
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  const days = years * 365.25;
  result.setTime(result.getTime() + days * 24 * 60 * 60 * 1000);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calculateMahaDashas(birthDate: Date, moonLongitude: number): DashaPeriod[] {
  const nakshatra = getMoonNakshatra(moonLongitude);
  const startingPlanet = nakshatra.lord;
  const startIndex = DASHA_SEQUENCE.indexOf(startingPlanet);
  
  const firstDashaTotalYears = DASHA_PERIODS[startingPlanet];
  const elapsedYears = nakshatra.progress * firstDashaTotalYears;
  const remainingYears = firstDashaTotalYears - elapsedYears;
  
  const dashas: DashaPeriod[] = [];
  let currentDate = new Date(birthDate);
  
  const firstDashaEnd = addYears(currentDate, remainingYears);
  dashas.push({
    planet: startingPlanet,
    start_date: new Date(currentDate),
    end_date: firstDashaEnd,
    years: remainingYears
  });
  
  currentDate = firstDashaEnd;
  
  let totalYears = remainingYears;
  let currentIndex = (startIndex + 1) % DASHA_SEQUENCE.length;
  
  while (totalYears < 120) {
    const planet = DASHA_SEQUENCE[currentIndex];
    const years = DASHA_PERIODS[planet];
    const endDate = addYears(currentDate, years);
    
    dashas.push({
      planet,
      start_date: new Date(currentDate),
      end_date: endDate,
      years
    });
    
    currentDate = endDate;
    totalYears += years;
    currentIndex = (currentIndex + 1) % DASHA_SEQUENCE.length;
  }
  
  return dashas;
}

function calculateAntarDashas(mahaDasha: DashaPeriod): AntarDashaPeriod[] {
  const mahaDashaLord = mahaDasha.planet;
  const mahaDashaYears = mahaDasha.years;
  const startDate = mahaDasha.start_date;
  const startIndex = DASHA_SEQUENCE.indexOf(mahaDashaLord);
  
  const antarDashas: AntarDashaPeriod[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < DASHA_SEQUENCE.length; i++) {
    const antarPlanetIndex = (startIndex + i) % DASHA_SEQUENCE.length;
    const antarPlanet = DASHA_SEQUENCE[antarPlanetIndex];
    const antarPlanetPeriod = DASHA_PERIODS[antarPlanet];
    
    const antarYears = (mahaDashaYears * antarPlanetPeriod) / 120;
    const endDate = addYears(currentDate, antarYears);
    
    antarDashas.push({
      planet: antarPlanet,
      start_date: new Date(currentDate),
      end_date: endDate,
      maha_dasha_lord: mahaDashaLord
    });
    
    currentDate = endDate;
  }
  
  return antarDashas;
}

// ============ END DASHA CALCULATOR ============

interface PlanetaryPosition {
  id: number;
  name: string;
  sign: string;
  sign_id: number;
  sign_lord: string;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
}

interface DashaPeriod2026 {
  maha_dasha: string;
  maha_start: string;
  maha_end: string;
  antar_dashas_in_2026: { name: string; start: string; end: string }[];
}

function get2026Dashas(allMahaDashas: DashaPeriod[]): DashaPeriod2026[] {
  const year2026Start = new Date("2026-01-01T00:00:00Z");
  const year2026End = new Date("2026-12-31T23:59:59Z");

  return allMahaDashas
    .filter(maha => maha.start_date <= year2026End && maha.end_date >= year2026Start)
    .map(maha => {
      const antarDashas = calculateAntarDashas(maha);
      const antarDashasIn2026 = antarDashas.filter(
        antar => antar.start_date <= year2026End && antar.end_date >= year2026Start
      );
      return {
        maha_dasha: maha.planet,
        maha_start: formatDate(maha.start_date),
        maha_end: formatDate(maha.end_date),
        antar_dashas_in_2026: antarDashasIn2026.map(antar => ({
          name: antar.planet,
          start: formatDate(antar.start_date),
          end: formatDate(antar.end_date),
        })),
      };
    });
}

// Input validation
const RequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
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

    const validationResult = RequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message).join(", ");
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { kundli_id } = validationResult.data;
    logStep("Calculating dashas for kundli", { kundli_id });

    // Fetch the kundli
    const { data: kundliData, error: fetchError } = await supabase
      .from("user_kundli_details")
      .select("id, birth_date, planetary_positions, dasha_periods")
      .eq("id", kundli_id)
      .single();

    if (fetchError || !kundliData) {
      logStep("Kundli not found", { error: fetchError?.message });
      return new Response(
        JSON.stringify({ error: "Kundli not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if dasha periods already exist
    if (kundliData.dasha_periods && Array.isArray(kundliData.dasha_periods) && kundliData.dasha_periods.length > 0) {
      logStep("Dasha periods already calculated, skipping", { count: kundliData.dasha_periods.length });
      return new Response(
        JSON.stringify({ 
          success: true, 
          already_calculated: true,
          dasha_count: kundliData.dasha_periods.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get planetary positions
    const planetaryPositions: PlanetaryPosition[] = kundliData.planetary_positions || [];
    const moonPosition = planetaryPositions.find(p => p.name === "Moon");

    if (!moonPosition) {
      logStep("Moon position not found");
      return new Response(
        JSON.stringify({ error: "Moon position not found in kundli data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse birth date
    const birthDate = new Date(kundliData.birth_date);
    const moonLongitude = moonPosition.full_degree;

    logStep("Calculating dasha periods", { 
      birth_date: kundliData.birth_date,
      moon_longitude: moonLongitude 
    });

    // Calculate full 120-year dasha timeline
    const allMahaDashas = calculateMahaDashas(birthDate, moonLongitude);

    // Format for storage (matching existing format in save-kundli-details)
    const formattedDashaPeriods = allMahaDashas.map(maha => {
      const antarDashas = calculateAntarDashas(maha);
      return {
        name: maha.planet,
        start: formatDate(maha.start_date),
        end: formatDate(maha.end_date),
        antardasha: antarDashas.map(antar => ({
          name: antar.planet,
          start: formatDate(antar.start_date),
          end: formatDate(antar.end_date),
        })),
      };
    });

    // Extract 2026-specific periods
    const dashaPeriods2026 = get2026Dashas(allMahaDashas);

    logStep("Dasha periods calculated", { 
      total_periods: formattedDashaPeriods.length,
      periods_2026: dashaPeriods2026.length 
    });

    // Update the kundli record
    const { error: updateError } = await supabase
      .from("user_kundli_details")
      .update({
        dasha_periods: formattedDashaPeriods,
        dasha_periods_2026: dashaPeriods2026,
      })
      .eq("id", kundli_id);

    if (updateError) {
      logStep("Failed to update dasha periods", { error: updateError.message });
      throw new Error(`Failed to save dasha periods: ${updateError.message}`);
    }

    logStep("Dasha periods saved successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        dasha_count: formattedDashaPeriods.length,
        periods_2026_count: dashaPeriods2026.length,
      }),
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
