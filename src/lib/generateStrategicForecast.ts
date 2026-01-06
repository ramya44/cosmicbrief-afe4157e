import { StrategicForecast, BirthData } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';

export interface StrategicForecastResult {
  forecast: StrategicForecast;
  modelUsed: string;
  totalAttempts: number;
}

export const generateStrategicForecast = async (
  birthData: BirthData,
  pivotalTheme?: string
): Promise<StrategicForecastResult> => {
  console.log('Calling OpenAI to generate strategic forecast...');
  
  const { data, error } = await supabase.functions.invoke('generate-strategic-forecast', {
    body: {
      birthDateTimeUtc: birthData.birthDateTimeUtc,
      lat: birthData.lat,
      lon: birthData.lon,
      name: birthData.name,
      pivotalTheme,
    },
  });

  if (error) {
    console.error('Error calling generate-strategic-forecast function:', error);
    throw new Error('Failed to generate strategic forecast. Please try again.');
  }

  console.log('Received strategic forecast data:', data);

  // Handle new response structure with metadata
  if (data.forecast) {
    return {
      forecast: data.forecast as StrategicForecast,
      modelUsed: data.modelUsed || 'unknown',
      totalAttempts: data.totalAttempts || 1,
    };
  }

  // Fallback for backwards compatibility (if response is just the forecast)
  return {
    forecast: data as StrategicForecast,
    modelUsed: 'unknown',
    totalAttempts: 1,
  };
};
