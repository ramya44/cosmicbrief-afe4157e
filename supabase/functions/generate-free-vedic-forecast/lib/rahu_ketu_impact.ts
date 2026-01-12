// Rahu-Ketu transit impact utilities
// describe-rahu-ketu-impact.ts

import type { TransitLookupRow, RahuKetuTransit } from "./types.ts";
import { getTransitData } from "./transit_data.ts";

export function describeRahuKetuImpact(
  moonSign: string,
  sunSign: string,
  year: number,
  transitsLookupTable: TransitLookupRow[],
): string {
  /**
   * Describe how Rahu/Ketu affects this user
   *
   * @param moonSign - e.g., "Aquarius"
   * @param sunSign - e.g., "Pisces"
   * @param year - 2025 or 2026
   * @param transitsLookupTable - your database table
   * @returns string description
   */
  const rkData = getTransitData("rahu_ketu", year, transitsLookupTable) as RahuKetuTransit;

  if (!rkData) {
    return "Unknown";
  }

  const rahuSign = rkData.rahu_sign;
  const ketuSign = rkData.ketu_sign;

  const impacts: string[] = [];

  if (rahuSign === moonSign) {
    impacts.push(`Rahu transits your Moon sign (${moonSign}), amplifying emotions and ambitions`);
  } else if (rahuSign === sunSign) {
    impacts.push(`Rahu transits your Sun sign (${sunSign}), intensifying identity and desires`);
  }

  if (ketuSign === moonSign) {
    impacts.push(`Ketu transits your Moon sign (${moonSign}), bringing detachment`);
  } else if (ketuSign === sunSign) {
    impacts.push(`Ketu transits your Sun sign (${sunSign}), spiritual lessons around ego`);
  }

  return impacts.length > 0 ? impacts.join("; ") : `Rahu in ${rahuSign}, Ketu in ${ketuSign}`;
}
