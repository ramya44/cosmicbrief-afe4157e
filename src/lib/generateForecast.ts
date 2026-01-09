import { FreeForecast, BirthData } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from './deviceId';

export interface GenerateForecastResult {
  forecast?: FreeForecast;
  captchaRequired?: boolean;
  message?: string;
}

export const generateForecast = async (
  birthData: BirthData,
  captchaToken?: string
): Promise<GenerateForecastResult> => {
  console.log('Calling generate-forecast (with integrated save)...');
  
  const deviceId = getDeviceId();
  
  const { data, error } = await supabase.functions.invoke('generate-forecast', {
    body: {
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthPlace: birthData.birthPlace,
      birthTimeUtc: birthData.birthDateTimeUtc,
      deviceId,
      captchaToken,
    },
  });

  if (error) {
    console.error('Error calling generate-forecast function:', error);
    throw new Error('Failed to generate forecast. Please try again.');
  }

  console.log('Received forecast data:', data);

  // Check if CAPTCHA is required
  if (data.captcha_required) {
    return {
      captchaRequired: true,
      message: data.message || 'Please complete verification to continue.',
    };
  }

  return { 
    forecast: {
      forecast: data.forecast, 
      pivotalTheme: data.pivotalTheme,
      id: data.freeForecastId,
    }
  };
};
