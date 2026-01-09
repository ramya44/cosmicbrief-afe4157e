import { supabase } from '@/integrations/supabase/client';

export interface BirthChartResult {
  moonSign: string;
  moonSignId: number;
  risingSign: string;
  risingSignId: number;
  sunSign?: string;
  sunSignId?: number;
  nakshatra?: string;
  nakshatraId?: number;
  nakshatraPada?: number;
}

/**
 * Fetches moon sign and rising sign (ascendant) from Prokerala API
 * based on birth date, time, and location coordinates.
 * 
 * @param birthDateTimeUtc - ISO 8601 datetime with timezone (e.g., "2000-01-15T10:30:00+05:30")
 * @param latitude - Latitude of birth location
 * @param longitude - Longitude of birth location
 * @param ayanamsa - Ayanamsa system (1 = Lahiri, default for Vedic astrology)
 * @returns Birth chart data including moon sign and rising sign
 */
export const getBirthChart = async (
  birthDateTimeUtc: string,
  latitude: number,
  longitude: number,
  ayanamsa: number = 1
): Promise<BirthChartResult | null> => {
  console.log('Calling get-birth-chart edge function...', { birthDateTimeUtc, latitude, longitude });

  try {
    const { data, error } = await supabase.functions.invoke('get-birth-chart', {
      body: {
        datetime: birthDateTimeUtc,
        latitude,
        longitude,
        ayanamsa,
      },
    });

    if (error) {
      console.error('Error calling get-birth-chart function:', error);
      return null;
    }

    console.log('Birth chart data received:', data);
    return data as BirthChartResult;
  } catch (err) {
    console.error('Exception calling get-birth-chart:', err);
    return null;
  }
};
