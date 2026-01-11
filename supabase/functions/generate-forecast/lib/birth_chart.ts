// Birth chart fetching logic
// supabase/functions/generate-forecast/lib/birth_chart.ts
import type { BirthChartData } from "../../_shared/lib/types.ts";

export async function fetchBirthChart(args: {
  supabaseUrl: string;
  supabaseServiceKey: string;
  birthTimeUtc?: string;
  latitude?: number;
  longitude?: number;
  logStep: (step: string, details?: Record<string, unknown>) => void;
}): Promise<BirthChartData> {
  const { supabaseUrl, supabaseServiceKey, birthTimeUtc, latitude, longitude, logStep } = args;

  if (!birthTimeUtc || latitude === undefined || longitude === undefined) return {};

  try {
    logStep("Fetching birth chart", { datetime: birthTimeUtc, lat: latitude, lon: longitude });

    const resp = await fetch(`${supabaseUrl}/functions/v1/get-birth-chart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        datetime: birthTimeUtc,
        latitude,
        longitude,
        ayanamsa: 1,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      logStep("Birth chart fetch failed", { status: resp.status, error: errorText });
      return {};
    }

    const r = await resp.json();

    const birthChartData: BirthChartData = {
      moonSign: r.moonSign,
      moonSignId: r.moonSignId,
      moonSignLord: r.moonSignLord,
      sunSign: r.sunSign,
      sunSignId: r.sunSignId,
      sunSignLord: r.sunSignLord,
      nakshatra: r.nakshatra,
      nakshatraId: r.nakshatraId,
      nakshatraPada: r.nakshatraPada,
      nakshatraLord: r.nakshatraLord,
      nakshatraGender: r.nakshatraGender,
      deity: r.deity,
      ganam: r.ganam,
      birthSymbol: r.birthSymbol,
      animalSign: r.animalSign,
      nadi: r.nadi,
      luckyColor: r.luckyColor,
      bestDirection: r.bestDirection,
      syllables: r.syllables,
      birthStone: r.birthStone,
    };

    logStep("Birth chart fetched successfully", {
      moonSign: birthChartData.moonSign,
      sunSign: birthChartData.sunSign,
      nakshatra: birthChartData.nakshatra,
      nakshatraLord: birthChartData.nakshatraLord,
      ganam: birthChartData.ganam,
      nadi: birthChartData.nadi,
    });

    return birthChartData;
  } catch (err) {
    logStep("Birth chart fetch exception", { error: err instanceof Error ? err.message : String(err) });
    return {};
  }
}
