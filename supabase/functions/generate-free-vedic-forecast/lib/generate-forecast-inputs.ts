// Generate forecast inputs from user data and calculated dashas
import type { UserData, ForecastInputs, TransitLookupRow } from "./types.ts";
import type { DashaPeriod, AntarDashaPeriod } from "./dasha-calculator.ts";
import { formatDate } from "./dasha-calculator.ts";

interface DashaInfo {
  currentMahaDasha: DashaPeriod;
  currentAntarDasha: AntarDashaPeriod;
  changes2025: AntarDashaPeriod[];
  changes2026: AntarDashaPeriod[];
}

function formatDashaChanges(changes: AntarDashaPeriod[]): string {
  if (changes.length === 0) {
    return "No major Dasha changes";
  }

  return changes
    .map((change) => {
      const date = formatDate(change.start_date);
      return `${change.maha_dasha_lord} Maha Dasha → ${change.planet} Antar Dasha (${date})`;
    })
    .join("; ");
}

function getAntarDashaAtDate(
  changes2025: AntarDashaPeriod[],
  targetDate: Date = new Date(2025, 6, 1), // Mid-2025
): string {
  // Find the antar dasha active at the target date
  const activeAntar = changes2025.find((change) => change.start_date <= targetDate && change.end_date >= targetDate);

  return activeAntar ? activeAntar.planet : "Unknown";
}

export function generateForecastInputs(
  userData: UserData,
  dashaInfo: DashaInfo,
  transitsLookupTable: TransitLookupRow[],
): ForecastInputs {
  const { currentMahaDasha, currentAntarDasha, changes2025, changes2026 } = dashaInfo;

  // Get transit data for 2025 and 2026
  const transit2025 = transitsLookupTable.find((t) => t.year === 2025);
  const transit2026 = transitsLookupTable.find((t) => t.year === 2026);

  let transit2025Data: any = {};
  let transit2026Data: any = {};

  try {
    if (transit2025) {
      transit2025Data =
        typeof transit2025.transit_data === "string" ? JSON.parse(transit2025.transit_data) : transit2025.transit_data;
    }
    if (transit2026) {
      transit2026Data =
        typeof transit2026.transit_data === "string" ? JSON.parse(transit2026.transit_data) : transit2026.transit_data;
    }
  } catch (e) {
    console.error("Error parsing transit data:", e);
  }

  // Determine Sade Sati status based on Moon sign
  const sadeSatiSigns2025 = transit2025Data.sade_sati_signs || [];
  const sadeSatiSigns2026 = transit2026Data.sade_sati_signs || [];

  const sadeSati2025 = sadeSatiSigns2025.includes(userData.moon_sign)
    ? `Sade Sati active (Saturn transiting ${userData.moon_sign})`
    : "Not in Sade Sati";

  const sadeSati2026 = sadeSatiSigns2026.includes(userData.moon_sign)
    ? `Sade Sati active (Saturn transiting ${userData.moon_sign})`
    : "Not in Sade Sati";

  // Get Rahu/Ketu positions
  const rahuKetu2025 = transit2025Data.rahu_ketu || "Rahu in Meena, Ketu in Kanya";
  const rahuKetu2026 = transit2026Data.rahu_ketu || "Rahu in Kumbha, Ketu in Simha";

  // Get Saturn position
  const saturn2026 = transit2026Data.saturn || "Saturn in Meena";

  // Get the Antar Dasha that was active in 2025
  const antarDasha2025 = getAntarDashaAtDate(changes2025);

  // Format dasha changes for 2026
  const dashaChanges2026 = formatDashaChanges(changes2026);

  return {
    birth_date: userData.birth_date,
    birth_location: userData.birth_location,
    ascendant: userData.ascendant,
    sun_sign: userData.sun_sign,
    moon_sign: userData.moon_sign,
    nakshatra: userData.nakshatra,
    maha_dasha_planet: currentMahaDasha.planet,
    maha_dasha_start: formatDate(currentMahaDasha.start_date),
    maha_dasha_end: formatDate(currentMahaDasha.end_date),
    antar_dasha_planet: currentAntarDasha.planet,
    antar_dasha_start: formatDate(currentAntarDasha.start_date),
    antar_dasha_end: formatDate(currentAntarDasha.end_date),
    dasha_changes_2026: dashaChanges2026,
    sade_sati_2025: sadeSati2025,
    sade_sati_2026: sadeSati2026,
    rahu_ketu_2025: rahuKetu2025,
    rahu_ketu_2026: rahuKetu2026,
    saturn_2026: saturn2026,
    antar_dasha_2025: antarDasha2025,
  };
}
