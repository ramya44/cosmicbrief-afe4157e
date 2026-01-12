// 2026 Dasha transition utilities
// find-dasha-changes-in-2026.ts

import type { DashaJson, DashaChange } from "./types";

export function findDashaChangesIn2026(dashaJson: DashaJson[]): DashaChange[] {
  /**
   * Find all Maha and Antar Dasha changes that occur in 2026
   *
   * @param dashaJson - The full dasha JSON you have
   * @returns array of change objects
   */
  const changes: DashaChange[] = [];

  for (const maha of dashaJson) {
    // Check for Maha Dasha changes in 2026
    const mahaStart = new Date(maha.start.replace("+05:30", ""));
    if (mahaStart.getFullYear() === 2026) {
      changes.push({
        type: "maha",
        planet: maha.name,
        date: maha.start.substring(0, 10),
        description: `Maha Dasha shifts to ${maha.name}`,
      });
    }

    // Check for Antar Dasha changes in 2026
    let prevAntar: { name: string } | null = null;
    for (const antar of maha.antardasha) {
      const antarStart = new Date(antar.start.replace("+05:30", ""));

      if (antarStart.getFullYear() === 2026) {
        changes.push({
          type: "antar",
          from_planet: prevAntar?.name || "unknown",
          to_planet: antar.name,
          date: antar.start.substring(0, 10),
          maha: maha.name,
          description: `Antar Dasha shifts from ${prevAntar?.name || "?"} to ${antar.name} (within ${maha.name} Maha Dasha)`,
        });
      }

      prevAntar = antar;
    }
  }

  // Sort by date
  changes.sort((a, b) => a.date.localeCompare(b.date));
  return changes;
}
