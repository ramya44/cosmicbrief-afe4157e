import { FreeForecast, BirthData } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceId } from './deviceId';

export interface GenerateForecastResult {
  forecast?: FreeForecast;
  guestToken?: string;
  captchaRequired?: boolean;
  rateLimited?: boolean;
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

  // Check for rate limit (429) response
  if (error) {
    // Supabase functions.invoke doesn't directly expose status code in error
    // Check if error message indicates rate limiting
    const errorMessage = error.message?.toLowerCase() || '';
    if (
      errorMessage.includes('rate') ||
      errorMessage.includes('limit') ||
      errorMessage.includes('429') ||
      errorMessage.includes('too many') ||
      errorMessage.includes('daily limit') ||
      errorMessage.includes('wait')
    ) {
      console.log('Rate limit detected:', error.message);
      return {
        rateLimited: true,
        message: error.message || "You've reached your free preview limit for today.",
      };
    }
    
    console.error('Error calling generate-forecast function:', error);
    throw new Error('Failed to generate forecast. Please try again.');
  }

  // Check for error in data response (edge function returns 429 as JSON)
  if (data?.error) {
    const errorMessage = (data.error as string).toLowerCase();
    if (
      errorMessage.includes('rate') ||
      errorMessage.includes('limit') ||
      errorMessage.includes('daily') ||
      errorMessage.includes('wait') ||
      errorMessage.includes('maximum free previews')
    ) {
      return {
        rateLimited: true,
        message: data.error || "You've reached your free preview limit for today.",
      };
    }
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
    },
    guestToken: data.guestToken,
  };
};
