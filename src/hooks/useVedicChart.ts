import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { convertBirthTimeToUtc } from '@/lib/convertBirthTimeToUtc';

// Input type for the hook
export interface BirthInput {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
}

// Planetary position type
export interface PlanetPosition {
  id: number;
  name: string;
  sign: string;
  sign_id: number;
  sign_lord: string;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
  nakshatra?: string;
  nakshatra_id?: number;
  nakshatra_pada?: number;
  nakshatra_lord?: string;
}

// Dasha period type
export interface DashaPeriod {
  planet: string;
  start_date: string;
  end_date: string;
  years: number;
}

// Antar dasha type
export interface AntarDashaPeriod {
  planet: string;
  start_date: string;
  end_date: string;
  maha_dasha_lord: string;
}

// Complete chart data returned by the hook
export interface VedicChartData {
  // Nakshatra details
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

  // Signs
  moon_sign: string;
  moon_sign_id: number;
  moon_sign_lord: string;
  sun_sign: string;
  sun_sign_id: number;
  sun_sign_lord: string;
  zodiac_sign: string;

  // Ascendant (Lagna)
  ascendant_sign: string;
  ascendant_sign_id: number;
  ascendant_sign_lord: string;

  // Planetary positions
  planetary_positions: PlanetPosition[];

  // Dasha periods
  dasha_periods?: DashaPeriod[];
  current_dasha?: {
    maha_dasha: string;
    antar_dasha: string;
    maha_dasha_start: string;
    maha_dasha_end: string;
    antar_dasha_start: string;
    antar_dasha_end: string;
  };
}

export interface UseVedicChartResult {
  calculate: (birthDetails: BirthInput) => Promise<VedicChartData>;
  isCalculating: boolean;
  error: string | null;
  clearError: () => void;
}

export function useVedicChart(): UseVedicChartResult {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const calculate = useCallback(async (birthDetails: BirthInput): Promise<VedicChartData> => {
    setIsCalculating(true);
    setError(null);

    try {
      // Convert birth time to UTC
      let birthDateTimeUtc: string | undefined;
      try {
        birthDateTimeUtc = await convertBirthTimeToUtc(
          birthDetails.birthDate,
          birthDetails.birthTime,
          birthDetails.latitude,
          birthDetails.longitude
        );
      } catch {
        // Continue with local time if UTC conversion fails
      }

      const datetimeForApi = birthDateTimeUtc || `${birthDetails.birthDate}T${birthDetails.birthTime}:00`;

      // Call get-kundli-data edge function
      const { data, error: apiError } = await supabase.functions.invoke('get-kundli-data', {
        body: {
          datetime: datetimeForApi,
          latitude: birthDetails.latitude,
          longitude: birthDetails.longitude,
          ayanamsa: 1, // Lahiri
        },
      });

      if (apiError) {
        throw new Error(apiError.message || 'Failed to fetch Kundli data');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as VedicChartData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate chart';
      setError(errorMessage);
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    calculate,
    isCalculating,
    error,
    clearError,
  };
}

// Helper to get the UTC datetime string for a birth input
export async function getBirthDateTimeUtc(birthDetails: BirthInput): Promise<string | undefined> {
  try {
    return await convertBirthTimeToUtc(
      birthDetails.birthDate,
      birthDetails.birthTime,
      birthDetails.latitude,
      birthDetails.longitude
    );
  } catch {
    return undefined;
  }
}

export type { BirthInput, VedicChartData, PlanetPosition, DashaPeriod, AntarDashaPeriod };
