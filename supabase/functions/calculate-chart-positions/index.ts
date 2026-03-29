/**
 * Calculate Vedic chart positions from birth data
 * Used for batch chart image generation
 */

import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { calculateBirthChart } from "../_shared/lib/vedic-calculator.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { date, time, latitude, longitude } = body;

    if (!date || !time || latitude === undefined || longitude === undefined) {
      return errorResponse("Missing required fields: date, time, latitude, longitude", 400);
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    // Create date object (assume local time for the location)
    const birthDate = new Date(year, month - 1, day, hour, minute);

    // Calculate chart
    const chart = calculateBirthChart(birthDate, latitude, longitude);

    // Format positions for the chart generator
    const positions = chart.planets.map((p, idx) => ({
      id: idx,
      name: p.name,
      sign: p.sign.western,
      sign_id: p.sign.index + 1, // 1-indexed
      degree: p.longitude % 30,
      is_retrograde: p.isRetrograde || false,
      nakshatra: p.nakshatra?.name,
    }));

    return jsonResponse({
      positions,
      ascendant_sign_id: chart.ascendant.sign.index + 1,
      date,
      time,
      latitude,
      longitude,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(errMessage, 500);
  }
});
