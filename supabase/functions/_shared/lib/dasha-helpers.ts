/**
 * Shared dasha helper functions for Vedic forecast prompts
 * Used by both free and paid forecast generation
 */

// ============= Types =============

export interface DashaJson {
  id?: number;
  name: string;
  start: string;
  end: string;
  antardasha?: AntardashaJson[];
}

export interface AntardashaJson {
  id?: number;
  name: string;
  start: string;
  end: string;
  pratyantardasha?: PratyantardashaJson[];
}

export interface PratyantardashaJson {
  id?: number;
  name: string;
  start: string;
  end: string;
}

export interface MahadashaInfo {
  name: string;
  dateRange: string;
  startDate: string;
  endDate: string;
}

export interface CurrentDashaInfo {
  mahadasha: {
    name: string;
    start: string;
    end: string;
  };
  antardasha: {
    name: string;
    start: string;
    end: string;
  } | null;
}

export interface CurrentDashaWithPratyantardashaInfo {
  mahadasha: {
    name: string;
    start: string;
    end: string;
  };
  antardasha: {
    name: string;
    start: string;
    end: string;
  } | null;
  pratyantardasha: {
    name: string;
    start: string;
    end: string;
  } | null;
}

export interface PratyantardashaInfo {
  mahadasha: string;
  antardasha: string;
  pratyantardasha: string;
  start: string;
  end: string;
  dateRange: string;
}

// ============= Date Formatting Helpers =============

/**
 * Format date range for display (e.g., "1998-2015")
 */
export function formatDateRange(start: Date, end: Date): string {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  return `${startYear}-${endYear}`;
}

/**
 * Format detailed date range (e.g., "Jan 12 - Feb 25, 2026")
 */
export function formatDateRangeDetailed(start: Date, end: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const endMonth = monthNames[end.getMonth()];
  const endDay = end.getDate();
  const year = end.getFullYear();
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay}, ${start.getFullYear()} - ${endMonth} ${endDay}, ${year}`;
  }
}

// ============= Dasha Extraction Functions =============

/**
 * Extract the past 3 mahadashas from a full dasha list
 * 
 * @param dashas - Full dasha array from the uploaded JSON structure
 * @param currentDate - Current date or birth date (defaults to now)
 * @returns Array of past 3 mahadashas with name and date range
 */
export function getPast3Mahadashas(
  dashas: DashaJson[],
  currentDate: Date | string = new Date()
): MahadashaInfo[] {
  const now = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  
  // Extract all mahadashas with their basic info
  const allMahadashas = dashas.map(dasha => ({
    id: dasha.id,
    name: dasha.name,
    start: new Date(dasha.start),
    end: new Date(dasha.end),
    startStr: dasha.start,
    endStr: dasha.end
  }));
  
  // Sort by start date (should already be sorted, but just in case)
  allMahadashas.sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Find current or most recent past mahadasha
  let currentIndex = -1;
  for (let i = 0; i < allMahadashas.length; i++) {
    if (now >= allMahadashas[i].start && now <= allMahadashas[i].end) {
      // Currently in this mahadasha
      currentIndex = i;
      break;
    } else if (now > allMahadashas[i].end) {
      // This mahadasha is in the past
      currentIndex = i;
    }
  }
  
  // If no current/past dasha found, return empty
  if (currentIndex === -1) {
    return [];
  }
  
  // Get the 3 mahadashas before the current one (including current)
  const startIndex = Math.max(0, currentIndex - 2);
  const past3 = allMahadashas.slice(startIndex, currentIndex + 1);
  
  // Format for output
  return past3.map(dasha => ({
    name: dasha.name,
    dateRange: formatDateRange(dasha.start, dasha.end),
    startDate: dasha.startStr,
    endDate: dasha.endStr
  }));
}

/**
 * Get current mahadasha and antardasha
 */
export function getCurrentDasha(
  dashas: DashaJson[],
  currentDate: Date | string = new Date()
): CurrentDashaInfo | null {
  const now = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  
  // Find current mahadasha
  const currentMahadasha = dashas.find(dasha => {
    const start = new Date(dasha.start);
    const end = new Date(dasha.end);
    return now >= start && now <= end;
  });
  
  if (!currentMahadasha) {
    return null;
  }
  
  // Find current antardasha within the mahadasha
  const currentAntardasha = currentMahadasha.antardasha?.find(ad => {
    const start = new Date(ad.start);
    const end = new Date(ad.end);
    return now >= start && now <= end;
  });
  
  return {
    mahadasha: {
      name: currentMahadasha.name,
      start: currentMahadasha.start,
      end: currentMahadasha.end
    },
    antardasha: currentAntardasha ? {
      name: currentAntardasha.name,
      start: currentAntardasha.start,
      end: currentAntardasha.end
    } : null
  };
}

/**
 * Get current mahadasha, antardasha, and pratyantardasha (for paid forecasts)
 */
export function getCurrentDashaWithPratyantardasha(
  dashas: DashaJson[],
  currentDate: Date | string = new Date()
): CurrentDashaWithPratyantardashaInfo | null {
  const now = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  
  // Find current mahadasha
  const currentMahadasha = dashas.find(dasha => {
    const start = new Date(dasha.start);
    const end = new Date(dasha.end);
    return now >= start && now <= end;
  });
  
  if (!currentMahadasha) {
    return null;
  }
  
  // Find current antardasha
  const currentAntardasha = currentMahadasha.antardasha?.find(ad => {
    const start = new Date(ad.start);
    const end = new Date(ad.end);
    return now >= start && now <= end;
  });
  
  // Find current pratyantardasha
  let currentPratyantardasha = null;
  if (currentAntardasha?.pratyantardasha) {
    currentPratyantardasha = currentAntardasha.pratyantardasha.find(pd => {
      const start = new Date(pd.start);
      const end = new Date(pd.end);
      return now >= start && now <= end;
    });
  }
  
  return {
    mahadasha: {
      name: currentMahadasha.name,
      start: currentMahadasha.start,
      end: currentMahadasha.end
    },
    antardasha: currentAntardasha ? {
      name: currentAntardasha.name,
      start: currentAntardasha.start,
      end: currentAntardasha.end
    } : null,
    pratyantardasha: currentPratyantardasha ? {
      name: currentPratyantardasha.name,
      start: currentPratyantardasha.start,
      end: currentPratyantardasha.end
    } : null
  };
}

/**
 * Get all pratyantardashas for a specific year
 */
export function getPratyantardashasForYear(
  dashas: DashaJson[],
  year: number
): PratyantardashaInfo[] {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  
  const pratyantardashas: PratyantardashaInfo[] = [];
  
  // Iterate through all mahadashas
  for (const mahadasha of dashas) {
    if (!mahadasha.antardasha) continue;
    
    // Iterate through all antardashas
    for (const antardasha of mahadasha.antardasha) {
      if (!antardasha.pratyantardasha) continue;
      
      // Iterate through all pratyantardashas
      for (const pratyantar of antardasha.pratyantardasha) {
        const start = new Date(pratyantar.start);
        const end = new Date(pratyantar.end);
        
        // Check if this pratyantardasha overlaps with the target year
        if (end >= yearStart && start <= yearEnd) {
          pratyantardashas.push({
            mahadasha: mahadasha.name,
            antardasha: antardasha.name,
            pratyantardasha: pratyantar.name,
            start: pratyantar.start,
            end: pratyantar.end,
            dateRange: formatDateRangeDetailed(start, end)
          });
        }
      }
    }
  }
  
  // Sort by start date
  pratyantardashas.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  
  return pratyantardashas;
}

// ============= Prompt Formatting Functions =============

/**
 * Format past dashas for prompt
 */
export function formatPastDashasForPrompt(pastDashas: MahadashaInfo[]): string {
  return pastDashas.map(d => `- ${d.name} Mahadasha: ${d.dateRange}`).join('\n');
}

/**
 * Format current dasha for prompt (free forecast version - maha + antar only)
 */
export function formatCurrentDashaForPrompt(currentDasha: CurrentDashaInfo | null): string {
  if (!currentDasha) return 'Unknown';
  
  const mahaStart = currentDasha.mahadasha.start.split('T')[0];
  const mahaEnd = currentDasha.mahadasha.end.split('T')[0];
  const antarStart = currentDasha.antardasha?.start.split('T')[0] || '?';
  const antarEnd = currentDasha.antardasha?.end.split('T')[0] || '?';
  
  return `- Mahadasha: ${currentDasha.mahadasha.name} (${mahaStart} to ${mahaEnd})
- Antardasha: ${currentDasha.antardasha?.name || 'Unknown'} (${antarStart} to ${antarEnd})`;
}

/**
 * Format current dasha with pratyantardasha for prompt (paid forecast version)
 */
export function formatCurrentDashaWithPratyantardashaForPrompt(
  currentDasha: CurrentDashaWithPratyantardashaInfo | null
): string {
  if (!currentDasha) return 'Unknown';
  
  const mahaStart = currentDasha.mahadasha.start.split('T')[0];
  const mahaEnd = currentDasha.mahadasha.end.split('T')[0];
  const antarStart = currentDasha.antardasha?.start.split('T')[0] || '?';
  const antarEnd = currentDasha.antardasha?.end.split('T')[0] || '?';
  const pratyantarStart = currentDasha.pratyantardasha?.start.split('T')[0] || '?';
  const pratyantarEnd = currentDasha.pratyantardasha?.end.split('T')[0] || '?';
  
  return `- Mahadasha: ${currentDasha.mahadasha.name} (${mahaStart} to ${mahaEnd})
- Antardasha: ${currentDasha.antardasha?.name || 'Unknown'} (${antarStart} to ${antarEnd})
- Pratyantardasha: ${currentDasha.pratyantardasha?.name || 'Unknown'} (${pratyantarStart} to ${pratyantarEnd})`;
}

/**
 * Format pratyantardashas for prompt
 */
export function formatPratyantardashasForPrompt(pratyantardashas: PratyantardashaInfo[]): string {
  return pratyantardashas.map(p => 
    `- ${p.mahadasha}-${p.antardasha}-${p.pratyantardasha}: ${p.dateRange}`
  ).join('\n');
}

// ============= Data Building Functions =============

/**
 * Build the data needed for the free forecast prompt
 */
export function buildFreeForecastData<T, U>(
  dashas: DashaJson[],
  birthDetails: T,
  planetaryPositions: U
): {
  birthDetails: T;
  planetaryPositions: U;
  currentDasha: CurrentDashaInfo | null;
  pastDashas: MahadashaInfo[];
} {
  const past3 = getPast3Mahadashas(dashas);
  const current = getCurrentDasha(dashas);
  
  return {
    birthDetails,
    planetaryPositions,
    currentDasha: current,
    pastDashas: past3
  };
}

/**
 * Build the data needed for the paid forecast prompt
 */
export function buildPaidForecastData<T, U>(
  dashas: DashaJson[],
  year: number,
  birthDetails: T,
  planetaryPositions: U
): {
  birthDetails: T;
  planetaryPositions: U;
  currentDasha: CurrentDashaWithPratyantardashaInfo | null;
  yearPratyantardashas: PratyantardashaInfo[];
} {
  const current = getCurrentDashaWithPratyantardasha(dashas);
  const pratyantardashas = getPratyantardashasForYear(dashas, year);
  
  return {
    birthDetails,
    planetaryPositions,
    currentDasha: current,
    yearPratyantardashas: pratyantardashas
  };
}
