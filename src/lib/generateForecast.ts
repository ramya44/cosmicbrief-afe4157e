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
      name: birthData.name,
    },
  });

  if (error) {
    console.error('Error calling generate-forecast function:', error);
    throw new Error('Failed to generate forecast. Please try again.');
  }

  console.log('Received forecast data:', data);

  // Transform the API response to match our store types
  const free: FreeForecast = {
    year: data.year,
    summary: data.summary,
    comparisonToPriorYear: data.comparison_to_prior_year,
    sections: {
      careerAndContribution: data.sections.career_and_contribution,
      moneyAndResources: data.sections.money_and_resources,
      relationshipsAndBoundaries: data.sections.relationships_and_boundaries,
      energyAndWellbeing: data.sections.energy_and_wellbeing,
    },
  };

  const paid: PaidForecast = {
    strongMonths: data.strong_months,
    measuredAttentionMonths: data.measured_attention_months,
    closingArc: data.closing_arc,
  };

  return { free, paid };
};
