// types.ts

export interface SaturnTransit {
  sign: string;
  start: string;
  end: string;
}

export interface JupiterTransit {
  sign: string;
  start: string;
  end: string;
  notes?: string;
}

export interface RahuKetuTransit {
  rahu_sign: string;
  ketu_sign: string;
  shift_date: string;
  rahu_sign_after?: string;
  ketu_sign_after?: string;
}

export interface EclipseTransit {
  date: string;
  type: string;
  sign: string;
}

export interface MercuryRetrogradeTransit {
  start: string;
  end: string;
}

export interface MahaDasha {
  planet: string;
  start: string;
  end: string;
}

export interface AntarDasha {
  planet: string;
  start: string;
  end: string;
}

export interface DashaChange {
  type: 'maha' | 'antar';
  planet?: string;
  from_planet?: string;
  to_planet?: string;
  date: string;
  maha?: string;
  description: string;
}

export interface TransitLookupRow {
  id: string;
  year: number;
  transit_data: string; // JSON string
}

export interface DashaJson {
  name: string;
  start: string;
  end: string;
  antardasha: {
    name: string;
    start: string;
    end: string;
  }[];
}

export interface UserData {
  birth_date: string;
  birth_location: string;
  sun_sign: string;
  moon_sign: string;
  nakshatra: string;
}

export interface ForecastInputs {
  birth_date: string;
  birth_location: string;
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
  rahu_ketu_2025: string;
  antar_dasha_2025: string;
  sade_sati_2026: string;
  rahu_ketu_2026: string;
  saturn_2026: string;
}
