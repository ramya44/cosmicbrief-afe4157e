// Current Dasha period utilities
// get-current-dasha.ts

import type { DashaJson, MahaDasha, AntarDasha } from "./types";

export function getCurrentDasha(dashaJson: DashaJson[], targetDate?: string): [MahaDasha | null, AntarDasha | null] {
  /**
   * Get Maha and Antar Dasha for a specific date
   *
   * @param dashaJson - The full dasha JSON you have
   * @param targetDate - String like "2026-01-01" or undefined for today
   * @returns [maha_dict, antar_dict] or [null, null]
   */
  const target = targetDate ? new Date(targetDate.replace("+05:30", "")) : new Date();

  for (const maha of dashaJson) {
    const mahaStart = new Date(maha.start.replace("+05:30", ""));
    const mahaEnd = new Date(maha.end.replace("+05:30", ""));

    if (mahaStart <= target && target <= mahaEnd) {
      const mahaInfo: MahaDasha = {
        planet: maha.name,
        start: maha.start.substring(0, 10), // Just YYYY-MM-DD
        end: maha.end.substring(0, 10),
      };

      // Find current Antar Dasha
      for (const antar of maha.antardasha) {
        const antarStart = new Date(antar.start.replace("+05:30", ""));
        const antarEnd = new Date(antar.end.replace("+05:30", ""));

        if (antarStart <= target && target <= antarEnd) {
          const antarInfo: AntarDasha = {
            planet: antar.name,
            start: antar.start.substring(0, 10),
            end: antar.end.substring(0, 10),
          };
          return [mahaInfo, antarInfo];
        }
      }
    }
  }

  return [null, null];
}
