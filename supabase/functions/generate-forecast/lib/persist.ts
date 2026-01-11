// Database persistence logic
// supabase/functions/generate-forecast/lib/persist.ts
import type { BirthChartData, ForecastSections } from "./types.ts";

export function buildForecastText(sections: ForecastSections): string {
  return [
    `## WHO YOU ARE RIGHT NOW\n\n${sections.who_you_are_right_now}`,
    `## WHAT'S HAPPENING IN YOUR LIFE\n\n${sections.whats_happening_in_your_life}`,
    `## 2026 PIVOTAL LIFE THEME\n\n${sections.pivotal_life_theme}`,
    `## WHAT IS BECOMING TIGHTER OR LESS FORGIVING\n\n${sections.what_is_becoming_tighter_or_less_forgiving}`,
    `## UPGRADE HOOK\n\n${sections.upgrade_hook}`,
  ].join("\n\n");
}

export async function saveFreeForecast(args: {
  supabase: any;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthTimeUtc?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  zodiacSign: string;
  pivotalLifeElement: string;
  birthChartData: BirthChartData;
  forecastText: string;
  modelUsed: string;
  logStep: (step: string, details?: Record<string, unknown>) => void;
}): Promise<{ freeForecastId?: string; guestToken?: string }> {
  const {
    supabase,
    birthDate,
    birthTime,
    birthPlace,
    birthTimeUtc,
    latitude,
    longitude,
    deviceId,
    zodiacSign,
    pivotalLifeElement,
    birthChartData,
    forecastText,
    modelUsed,
    logStep,
  } = args;

  try {
    const { data, error } = await supabase
      .from("free_forecasts")
      .insert({
        birth_date: birthDate,
        birth_time: birthTime,
        birth_place: birthPlace,
        birth_time_utc: birthTimeUtc || null,
        forecast_text: forecastText,
        pivotal_theme: pivotalLifeElement,
        zodiac_sign: zodiacSign,
        device_id: deviceId || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,

        moon_sign: birthChartData.moonSign ?? null,
        moon_sign_id: birthChartData.moonSignId ?? null,
        moon_sign_lord: birthChartData.moonSignLord ?? null,
        sun_sign: birthChartData.sunSign ?? null,
        sun_sign_id: birthChartData.sunSignId ?? null,
        sun_sign_lord: birthChartData.sunSignLord ?? null,
        nakshatra: birthChartData.nakshatra ?? null,
        nakshatra_id: birthChartData.nakshatraId ?? null,
        nakshatra_pada: birthChartData.nakshatraPada ?? null,
        nakshatra_lord: birthChartData.nakshatraLord ?? null,
        nakshatra_gender: birthChartData.nakshatraGender ?? null,
        deity: birthChartData.deity ?? null,
        ganam: birthChartData.ganam ?? null,
        birth_symbol: birthChartData.birthSymbol ?? null,
        animal_sign: birthChartData.animalSign ?? null,
        nadi: birthChartData.nadi ?? null,
        lucky_color: birthChartData.luckyColor ?? null,
        best_direction: birthChartData.bestDirection ?? null,
        syllables: birthChartData.syllables ?? null,
        birth_stone: birthChartData.birthStone ?? null,

        model_used: modelUsed,
      })
      .select("id, guest_token")
      .single();

    if (error) {
      logStep("Database save error", { error: error.message });
      return {};
    }

    return { freeForecastId: data?.id, guestToken: data?.guest_token };
  } catch (e) {
    logStep("Database save exception", { error: e instanceof Error ? e.message : String(e) });
    return {};
  }
}
