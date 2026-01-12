// Sade Sati status calculation utilities
// calculate-sade-sati-status.ts

import type { TransitLookupRow, SaturnTransit } from "./types";
import { getTransitData } from "./get-transit-data";

export function calculateSadeSatiStatus(
  moonSign: string,
  year: number,
  transitsLookupTable: TransitLookupRow[],
): string {
  /**
   * Calculate Sade Sati status for a given year
   *
   * @param moonSign - e.g., "Aquarius", "Pisces"
   * @param year - 2025 or 2026
   * @param transitsLookupTable - your database table
   * @returns string describing the phase
   */
  // Get Saturn position from table
  const saturnData = getTransitData("saturn", year, transitsLookupTable) as SaturnTransit;

  if (!saturnData) {
    return "Unknown";
  }

  const saturnSign = saturnData.sign;

  // Sign order for calculation
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  const moonIdx = signs.indexOf(moonSign);
  const saturnIdx = signs.indexOf(saturnSign);

  if (moonIdx === -1 || saturnIdx === -1) {
    return "Invalid sign";
  }

  // Calculate position relative to Moon
  const diff = (saturnIdx - moonIdx + 12) % 12;

  if (diff === 0) {
    // Phase 2 - Saturn over Moon
    if (year === 2025) {
      return `Phase 2 begins March 2025 (Saturn over Moon in ${moonSign})`;
    }
    return `Phase 2 (Saturn over Moon in ${moonSign})`;
  } else if (diff === 11) {
    return `Phase 1 (Saturn in 12th from Moon)`;
  } else if (diff === 1) {
    return `Phase 3 (Saturn in 2nd from Moon)`;
  } else {
    return "Not in Sade Sati";
  }
}
