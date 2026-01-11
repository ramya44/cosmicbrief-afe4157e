/**
 * Shared type definitions for edge functions
 */

export interface RateLimitResult {
  allowed: boolean;
  requireCaptcha: boolean;
  message?: string;
}

export interface BirthChartData {
  moonSign?: string;
  moonSignId?: number;
  moonSignLord?: string;
  sunSign?: string;
  sunSignId?: number;
  sunSignLord?: string;
  nakshatra?: string;
  nakshatraId?: number;
  nakshatraPada?: number;
  nakshatraLord?: string;
  nakshatraGender?: string;
  deity?: string;
  ganam?: string;
  birthSymbol?: string;
  animalSign?: string;
  nadi?: string;
  luckyColor?: string;
  bestDirection?: string;
  syllables?: string;
  birthStone?: string;
  westernZodiac?: string;
}

export interface ForecastSections {
  who_you_are_right_now?: string;
  whats_happening_in_your_life?: string;
  pivotal_life_theme?: string;
  what_is_becoming_tighter_or_less_forgiving?: string;
  upgrade_hook?: string;
}

export interface SunLookup {
  default_orientation: string;
  identity_limit: string;
  effort_misfire: string;
  summary_interpretation?: string;
}

export interface MoonLookup {
  emotional_pacing: string;
  sensitivity_point: string;
  strain_leak: string;
  summary_interpretation?: string;
}

export interface NakshatraLookup {
  intensity_reason: string;
  moral_cost_limit: string;
  strain_accumulation: string;
  summary_interpretation?: string;
}

export interface NakshatraAnimalLookup {
  nakshatra_animal: string;
  phrase: string;
  image_url?: string;
}
