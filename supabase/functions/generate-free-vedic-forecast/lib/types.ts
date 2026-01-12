// Type definitions for the forecast generation system

export interface UserData {
  birth_date: string;
  birth_location: string;
  ascendant: string;
  sun_sign: string;
  moon_sign: string;
  nakshatra: string;
}

export interface TransitLookupRow {
  id: number;
  year: number;
  transit_data: string; // JSON string
}

export interface ForecastInputs {
  birth_date: string;
  birth_location: string;
  ascendant: string;
  sun_sign: string;
  moon_sign: string;
  nakshatra: string;
  maha_dasha_planet: string;
  maha_dasha_start: string;
  maha_dasha_end: string;
  antar_dasha_planet: string;
  antar_dasha_start: string;
  antar_dasha_end: string;
  dasha_changes_2026: string;
  sade_sati_2025: string;
  sade_sati_2026: string;
  rahu_ketu_2025: string;
  rahu_ketu_2026: string;
  saturn_2026: string;
  antar_dasha_2025: string;
}

// Planetary position from ProKerala API
export interface PlanetaryPosition {
  id: number;
  name: string;
  sign: string;
  sign_id: number;
  sign_lord: string;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
}

// These types are no longer needed since we're calculating dashas ourselves
// but keeping them here in case you have legacy code that references them

/**
 * @deprecated Use DashaPeriod from dasha-calculator.ts instead
 */
export interface MahaDasha {
  planet: string;
  start: string;
  end: string;
}

/**
 * @deprecated Use AntarDashaPeriod from dasha-calculator.ts instead
 */
export interface AntarDasha {
  planet: string;
  start: string;
  end: string;
}

/**
 * @deprecated No longer used - we calculate dashas from Moon position
 */
export interface DashaJson {
  name: string;
  start: string;
  end: string;
  antardasha: AntarDasha[];
}

/**
 * @deprecated No longer needed with new calculation method
 */
export interface DashaChange {
  type: "maha" | "antar";
  planet?: string;
  from_planet?: string;
  to_planet?: string;
  date: string;
  maha?: string;
  description: string;
}
