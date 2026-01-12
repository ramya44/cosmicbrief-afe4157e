// generate-forecast-inputs.ts

import type { UserData, DashaJson, TransitLookupRow, ForecastInputs, SaturnTransit } from "./types.ts";
import { getCurrentDasha } from "./current_dasha.ts";
import { findDashaChangesIn2026, formatDashaChanges } from "./dasha_changes_2026.ts";
import { calculateSadeSatiStatus } from "./sade_sati_status.ts";
import { describeRahuKetuImpact } from "./rahu_ketu_impact.ts";
import { getTransitData } from "./transit_data.ts";

export function generateForecastInputs(
  userData: UserData,
  dashaJson: DashaJson[],
  transitsLookupTable: TransitLookupRow[],
): ForecastInputs {
  /**
   * Generate all inputs needed for LLM forecast generation
   *
   * @param userData - User's birth data
   * @param dashaJson - The full dasha JSON
   * @param transitsLookupTable - your database table
   * @returns Complete forecast inputs object
   */

  // Get current Dashas
  const [maha2025, antar2025] = getCurrentDasha(dashaJson, "2025-01-01");
  const [maha2026, antar2026] = getCurrentDasha(dashaJson, "2026-01-01");

  if (!maha2025 || !antar2025 || !maha2026 || !antar2026) {
    throw new Error("Could not determine Dasha periods");
  }

  // Get Dasha changes
  const dashaChanges = findDashaChangesIn2026(dashaJson);

  // Calculate Sade Sati status
  const sadeSati2025 = calculateSadeSatiStatus(userData.moon_sign, 2025, transitsLookupTable);
  const sadeSati2026 = calculateSadeSatiStatus(userData.moon_sign, 2026, transitsLookupTable);

  // Get Rahu/Ketu impact
  const rk2025 = describeRahuKetuImpact(userData.moon_sign, userData.sun_sign, 2025, transitsLookupTable);
  const rk2026 = describeRahuKetuImpact(userData.moon_sign, userData.sun_sign, 2026, transitsLookupTable);

  // Get Saturn info
  const saturn2026 = getTransitData("saturn", 2026, transitsLookupTable) as SaturnTransit;
  const saturnDesc = saturn2026 ? `${saturn2026.sign} all year` : "Unknown";

  // Format everything
  return {
    birth_date: userData.birth_date,
    birth_location: userData.birth_location,
    sun_sign: userData.sun_sign,
    moon_sign: userData.moon_sign,
    nakshatra: userData.nakshatra,
    maha_dasha_planet: maha2026.planet,
    maha_dasha_start: maha2026.start,
    maha_dasha_end: maha2026.end,
    antar_dasha_planet: antar2026.planet,
    antar_dasha_start: antar2026.start,
    antar_dasha_end: antar2026.end,
    dasha_changes_2026: formatDashaChanges(dashaChanges),
    sade_sati_2025: sadeSati2025,
    rahu_ketu_2025: rk2025,
    antar_dasha_2025: antar2025.planet,
    sade_sati_2026: sadeSati2026,
    rahu_ketu_2026: rk2026,
    saturn_2026: saturnDesc,
  };
}
