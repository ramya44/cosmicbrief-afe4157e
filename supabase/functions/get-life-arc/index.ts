import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createLogger } from "../_shared/lib/logger.ts";
import { calculateBirthChart, formatAsProkeralaResponse } from "../_shared/lib/vedic-calculator.ts";
import {
  generateLifeArcPrediction,
  generateLifeArcReport,
  getQuickInsight,
  ChartData,
  LIFE_EVENT_CATEGORIES,
} from "../_shared/lib/life-arc-predictor.ts";
import {
  calculateMahaDashas,
  calculateAntarDashas,
  formatDate,
} from "../generate-free-vedic-forecast/lib/dasha-calculator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("GET-LIFE-ARC");

/**
 * Convert local birth time to UTC datetime string
 * Uses longitude to calculate timezone offset (15° = 1 hour)
 */
function convertToUtcDatetime(birthDate: string, birthTime: string, longitude: number): string {
  // Calculate timezone offset from longitude (15° per hour)
  const offsetHours = longitude / 15;
  const offsetMinutes = offsetHours * 60;

  // Parse local date and time
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);

  // Create date in local time, then adjust for timezone
  // Local time - offset = UTC
  const localMinutes = hours * 60 + minutes;
  const utcMinutes = localMinutes - offsetMinutes;

  // Handle day rollover
  let utcHours = Math.floor(utcMinutes / 60);
  let utcMins = Math.round(utcMinutes % 60);
  let utcDay = day;
  let utcMonth = month;
  let utcYear = year;

  if (utcHours < 0) {
    utcHours += 24;
    utcDay -= 1;
    if (utcDay < 1) {
      utcMonth -= 1;
      if (utcMonth < 1) {
        utcMonth = 12;
        utcYear -= 1;
      }
      // Simplified: assume 30 days for day rollback
      utcDay = 30;
    }
  } else if (utcHours >= 24) {
    utcHours -= 24;
    utcDay += 1;
    // Simplified: assume 30 days max
    if (utcDay > 30) {
      utcDay = 1;
      utcMonth += 1;
      if (utcMonth > 12) {
        utcMonth = 1;
        utcYear += 1;
      }
    }
  }

  if (utcMins < 0) utcMins = 0;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${utcYear}-${pad(utcMonth)}-${pad(utcDay)}T${pad(utcHours)}:${pad(utcMins)}:00Z`;
}

const InputSchema = z.object({
  // Either provide kundli_id to look up existing data
  kundli_id: z.string().uuid().optional(),
  // Or provide birth details directly
  birth_date: z.string().optional(),
  birth_time: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Options
  years_ahead: z.number().min(1).max(30).default(10),
  // Report type: "life_arc_report" for structured past/future, "full_prediction" for timeline, "quick_insight" for specific event
  report_type: z.enum(["life_arc_report", "full_prediction", "quick_insight"]).default("life_arc_report"),
  // Only used when report_type is "quick_insight"
  event_type: z.enum([
    "marriage",
    "children",
    "career",
    "wealth",
    "health",
    "spirituality",
    "education",
    "home_property",
    "travel_foreign",
    "transformation",
    "social_gains",
    "losses_liberation",
  ]).optional(),
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

    const body = await req.json();
    const input = InputSchema.parse(body);
    logStep("Input validated", input);

    let birthDate: Date;
    let moonLongitude: number;
    let chartData: ChartData;

    // Get birth data either from database or from input
    if (input.kundli_id) {
      const { data: kundli, error } = await supabase
        .from("user_kundli_details")
        .select("birth_date, birth_time, latitude, longitude, planetary_positions, ascendant_sign, ascendant_sign_id")
        .eq("id", input.kundli_id)
        .single();

      if (error || !kundli) {
        throw new Error("Kundli not found");
      }

      // Convert local time to UTC using longitude-based timezone
      const utcDatetime = convertToUtcDatetime(kundli.birth_date, kundli.birth_time, kundli.longitude);
      birthDate = new Date(utcDatetime);

      // Check if we have stored chart data
      if (kundli.planetary_positions && kundli.ascendant_sign_id) {
        const moon = kundli.planetary_positions.find((p: any) => p.name === "Moon");
        moonLongitude = moon?.full_degree || moon?.longitude || 0;

        chartData = {
          ascendant_sign: kundli.ascendant_sign,
          ascendant_sign_id: kundli.ascendant_sign_id,
          planetary_positions: kundli.planetary_positions,
        };
      } else {
        // Recalculate from birth details with UTC datetime
        const chart = calculateBirthChart(utcDatetime, kundli.latitude, kundli.longitude);
        const prokeralaFormat = formatAsProkeralaResponse(chart);
        const moon = chart.planets.find(p => p.name === "Moon");
        moonLongitude = moon?.longitude || 0;

        chartData = {
          ascendant_sign: prokeralaFormat.ascendant_sign,
          ascendant_sign_id: prokeralaFormat.ascendant_sign_id,
          planetary_positions: prokeralaFormat.planetary_positions,
        };
      }
    } else if (input.birth_date && input.birth_time && input.latitude !== undefined && input.longitude !== undefined) {
      // Convert local time to UTC using longitude-based timezone
      const utcDatetime = convertToUtcDatetime(input.birth_date, input.birth_time, input.longitude);
      birthDate = new Date(utcDatetime);
      const chart = calculateBirthChart(utcDatetime, input.latitude, input.longitude);
      const prokeralaFormat = formatAsProkeralaResponse(chart);
      const moon = chart.planets.find(p => p.name === "Moon");
      moonLongitude = moon?.longitude || 0;

      chartData = {
        ascendant_sign: prokeralaFormat.ascendant_sign,
        ascendant_sign_id: prokeralaFormat.ascendant_sign_id,
        planetary_positions: prokeralaFormat.planetary_positions,
      };
    } else {
      throw new Error("Either kundli_id or birth details (birth_date, birth_time, latitude, longitude) required");
    }

    logStep("Birth data obtained", {
      birthDate: birthDate.toISOString(),
      moonLongitude,
      ascendant: chartData.ascendant_sign,
    });

    // Calculate dasha periods
    const mahaDashas = calculateMahaDashas(birthDate, moonLongitude);

    // Format dasha periods with antardashas for the life arc predictor
    const dashaPeriods = mahaDashas.map(maha => {
      const antarDashas = calculateAntarDashas(maha);
      return {
        planet: maha.planet,
        start: formatDate(maha.start_date),
        end: formatDate(maha.end_date),
        years: maha.years,
        antardasha: antarDashas.map(antar => ({
          planet: antar.planet,
          start: formatDate(antar.start_date),
          end: formatDate(antar.end_date),
          maha_lord: antar.maha_dasha_lord,
        })),
      };
    });

    logStep("Dasha periods calculated", { totalMahaDashas: dashaPeriods.length });

    let result;

    if (input.report_type === "quick_insight" && input.event_type) {
      // Quick insight for a specific life event category
      result = {
        type: "quick_insight",
        event: input.event_type,
        ...getQuickInsight(input.event_type, chartData, dashaPeriods, birthDate, input.years_ahead),
      };
    } else if (input.report_type === "full_prediction") {
      // Full timeline prediction (legacy format)
      result = {
        type: "full_prediction",
        ...generateLifeArcPrediction(chartData, dashaPeriods, birthDate, input.years_ahead),
      };
    } else {
      // Life Arc Report - structured past/future analysis (default)
      result = {
        type: "life_arc_report",
        ...generateLifeArcReport(chartData, dashaPeriods, birthDate, input.years_ahead),
      };
    }

    logStep("Life arc prediction generated");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
