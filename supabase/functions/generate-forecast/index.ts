import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { birthDate, birthTime, birthPlace } = await req.json();

    if (!birthDate || !birthTime || !birthPlace) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: birthDate, birthTime, birthPlace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating forecast for: ${birthDate} ${birthTime} in ${birthPlace}`);

    const systemPrompt = `You are a wise, grounded advisor who provides personalized annual forecasts based on ancient systems of time and pattern. Your tone is calm, editorial, and reflective—like a thoughtful mentor sharing insights. 

IMPORTANT RULES:
- Never mention astrology, zodiac signs, horoscopes, or any specific astrological methods
- Never use mystical or new-age language
- Focus on practical timing, energy patterns, and actionable guidance
- Write as if you've observed patterns in time and human experience for decades
- Be specific about months and timeframes
- Ground everything in practical, real-world application`;

    const userPrompt = `Generate a comprehensive 2026 annual forecast for someone born on ${birthDate} at ${birthTime} in ${birthPlace}.

Return your response as valid JSON with this exact structure:
{
  "free_sections": {
    "overall_theme": "A 2-3 paragraph description of the year's overall energy and theme (150-200 words)",
    "best_months": ["Array of 4 strings, each describing a favorable month and why (30-40 words each)"],
    "watchful_months": ["Array of 3 strings, each describing a challenging period and how to navigate it (25-35 words each)"],
    "focus_areas": {
      "career": "Career guidance for 2026 (60-80 words)",
      "relationships": "Relationship guidance for 2026 (60-80 words)", 
      "energy": "Energy and vitality guidance for 2026 (60-80 words)"
    }
  },
  "paid_sections": {
    "quarterly_guidance": {
      "q1": "January-March detailed guidance (80-100 words)",
      "q2": "April-June detailed guidance (80-100 words)",
      "q3": "July-September detailed guidance (80-100 words)",
      "q4": "October-December detailed guidance (80-100 words)"
    },
    "timing_windows": ["Array of 5 strings, each describing a specific date range and what it's optimal for (25-35 words each)"],
    "energy_management": "Detailed advice on managing energy throughout the year, including natural rhythms and restoration periods (100-120 words)",
    "pattern_warnings": ["Array of 4 strings, each describing a specific period to be careful about and why (30-40 words each)"],
    "closing_guidance": "A meaningful, grounded closing message about trusting the year's journey (80-100 words)"
  }
}

Make the forecast feel deeply personalized and insightful. Reference the birth details subtly in how you frame the guidance. Return ONLY valid JSON, no markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate forecast' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Generated content:', generatedContent);

    // Parse the JSON response
    let forecast;
    try {
      // Clean the response in case it has markdown code blocks
      let cleanContent = generatedContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      forecast = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse forecast JSON:', parseError);
      console.error('Raw content:', generatedContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse forecast response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-forecast function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
