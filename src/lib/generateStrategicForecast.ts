import { StrategicForecast, BirthData } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';

export const generateStrategicForecast = async (
  birthData: BirthData
): Promise<StrategicForecast> => {
  console.log('Calling OpenAI to generate strategic forecast...');
  
  const { data, error } = await supabase.functions.invoke('generate-strategic-forecast', {
    body: {
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthPlace: birthData.birthPlace,
      name: birthData.name,
    },
  });

  if (error) {
    console.error('Error calling generate-strategic-forecast function:', error);
    throw new Error('Failed to generate strategic forecast. Please try again.');
  }

  console.log('Received strategic forecast data:', data);

  return data as StrategicForecast;
};
