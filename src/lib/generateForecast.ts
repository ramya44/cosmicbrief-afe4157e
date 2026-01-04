import { FreeForecast, PaidForecast, BirthData } from '@/store/forecastStore';
import { supabase } from '@/integrations/supabase/client';

export const generateForecast = async (
  birthData: BirthData
): Promise<{ free: FreeForecast; paid: PaidForecast }> => {
  console.log('Calling OpenAI to generate forecast...');
  
  const { data, error } = await supabase.functions.invoke('generate-forecast', {
    body: {
      birthDate: birthData.birthDate,
      birthTime: birthData.birthTime,
      birthPlace: birthData.birthPlace,
    },
  });

  if (error) {
    console.error('Error calling generate-forecast function:', error);
    throw new Error('Failed to generate forecast. Please try again.');
  }

  console.log('Received forecast data:', data);

  // Transform the API response to match our store types
  const free: FreeForecast = {
    overallTheme: data.free_sections.overall_theme,
    bestMonths: data.free_sections.best_months,
    watchfulMonths: data.free_sections.watchful_months,
    focusAreas: {
      career: data.free_sections.focus_areas.career,
      relationships: data.free_sections.focus_areas.relationships,
      energy: data.free_sections.focus_areas.energy,
    },
  };

  const paid: PaidForecast = {
    quarterlyGuidance: {
      q1: data.paid_sections.quarterly_guidance.q1,
      q2: data.paid_sections.quarterly_guidance.q2,
      q3: data.paid_sections.quarterly_guidance.q3,
      q4: data.paid_sections.quarterly_guidance.q4,
    },
    timingWindows: data.paid_sections.timing_windows,
    energyManagement: data.paid_sections.energy_management,
    patternWarnings: data.paid_sections.pattern_warnings,
    closingGuidance: data.paid_sections.closing_guidance,
  };

  return { free, paid };
};
