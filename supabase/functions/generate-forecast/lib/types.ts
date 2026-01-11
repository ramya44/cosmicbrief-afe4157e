export type {
  RateLimitResult,
  BirthChartData,
  ForecastSections,
  SunLookup,
  MoonLookup,
  NakshatraLookup,
  NakshatraAnimalLookup,
} from "../../_shared/lib/types.ts";

// Local types for generate-forecast function
export interface ParsedInput {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthTimeUtc?: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  captchaToken?: string;
}

export interface ThemeCacheResult {
  pivotalLifeElement: string;
  normalizedUtc?: string;
  cacheHit?: boolean;
}
