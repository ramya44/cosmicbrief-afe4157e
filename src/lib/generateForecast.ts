import { FreeForecast, BirthData } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';

export const generateForecast = async (
  birthData: BirthData
): Promise<FreeForecast> => {
  console.log('Calling generate-forecast (with integrated save)...');
  
  const { data, error } = await supabase.functions.invoke('generate-forecast', {
    body: {
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthPlace: birthData.birthPlace,
      name: birthData.name,
      birthTimeUtc: birthData.birthDateTimeUtc,
    },
  });

  if (error) {
    console.error('Error calling generate-forecast function:', error);
    throw new Error('Failed to generate forecast. Please try again.');
  }

  console.log('Received forecast data:', data);

  return { 
    forecast: data.forecast, 
    pivotalTheme: data.pivotalTheme,
    id: data.freeForecastId,
  };
};
