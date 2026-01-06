import { FreeForecast, BirthData } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';

export const generateForecast = async (
  birthData: BirthData
): Promise<FreeForecast> => {
  console.log('Calling OpenAI to generate forecast...');
  
  const { data, error } = await supabase.functions.invoke('generate-forecast', {
    body: {
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthPlace: birthData.birthPlace,
      name: birthData.name,
    },
  });

  if (error) {
    console.error('Error calling generate-forecast function:', error);
    throw new Error('Failed to generate forecast. Please try again.');
  }

  console.log('Received forecast data:', data);

  // Save the free forecast to database
  let freeForecastId: string | undefined;
  try {
    const { data: saveData, error: saveError } = await supabase.functions.invoke('save-free-forecast', {
      body: {
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthPlace: birthData.birthPlace,
        birthTimeUtc: birthData.birthDateTimeUtc,
        customerName: birthData.name,
        forecastText: data.forecast,
        pivotalTheme: data.pivotalTheme,
      },
    });

    if (saveError) {
      console.error('Error saving free forecast:', saveError);
    } else {
      freeForecastId = saveData?.id;
      console.log('Free forecast saved with ID:', freeForecastId);
    }
  } catch (saveErr) {
    console.error('Failed to save free forecast:', saveErr);
    // Don't fail the whole flow, just log it
  }

  return { 
    forecast: data.forecast, 
    pivotalTheme: data.pivotalTheme,
    id: freeForecastId,
  };
};
