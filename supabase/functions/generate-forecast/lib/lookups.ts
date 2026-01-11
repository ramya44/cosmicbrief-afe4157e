// Database lookup logic (Sun, Moon, Nakshatra tables)
// supabase/functions/generate-forecast/lib/lookups.ts
import type { MoonLookup, NakshatraLookup, SunLookup } from "./types.ts";

export async function fetchLookups(args: {
  supabase: any;
  sunSign?: string;
  moonSign?: string;
  nakshatra?: string;
  logStep: (step: string, details?: Record<string, unknown>) => void;
}): Promise<{ sunLookup: SunLookup | null; moonLookup: MoonLookup | null; nakshatraLookup: NakshatraLookup | null }> {
  const { supabase, sunSign, moonSign, nakshatra, logStep } = args;

  let sunLookup: SunLookup | null = null;
  let moonLookup: MoonLookup | null = null;
  let nakshatraLookup: NakshatraLookup | null = null;

  if (sunSign) {
    const { data, error } = await supabase
      .from("vedic_sun_orientation_lookup")
      .select("default_orientation, identity_limit, effort_misfire")
      .eq("sun_sign", sunSign)
      .maybeSingle();

    if (error) logStep("Sun lookup error", { error: error.message });
    else if (data) {
      sunLookup = data;
      logStep("Sun lookup success", { sunSign });
    }
  }

  if (moonSign) {
    const { data, error } = await supabase
      .from("vedic_moon_pacing_lookup")
      .select("emotional_pacing, sensitivity_point, strain_leak")
      .eq("moon_sign", moonSign)
      .maybeSingle();

    if (error) logStep("Moon lookup error", { error: error.message });
    else if (data) {
      moonLookup = data;
      logStep("Moon lookup success", { moonSign });
    }
  }

  if (nakshatra) {
    const { data, error } = await supabase
      .from("nakshatra_pressure_lookup")
      .select("intensity_reason, moral_cost_limit, strain_accumulation")
      .eq("nakshatra", nakshatra)
      .maybeSingle();

    if (error) logStep("Nakshatra lookup error", { error: error.message });
    else if (data) {
      nakshatraLookup = data;
      logStep("Nakshatra lookup success", { nakshatra });
    }
  }

  return { sunLookup, moonLookup, nakshatraLookup };
}
