// get-transit-data.ts

import type { TransitLookupRow } from "./types.ts";

export function getTransitData(category: string, year: number, transitsLookupTable: TransitLookupRow[]): any {
  /**
   * Query transit data from your table
   *
   * @param category - 'rahu_ketu', 'jupiter', 'saturn', 'eclipses', 'mercury_retrograde'
   * @param year - 2025 or 2026
   * @param transitsLookupTable - your database table array
   * @returns transit_data parsed from JSON
   */
  const result = transitsLookupTable.find((row) => row.id === category && row.year === year);

  if (!result) {
    return null;
  }

  // Parse the JSON string
  return JSON.parse(result.transit_data);
}
