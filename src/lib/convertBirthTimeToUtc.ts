import { supabase } from "@/integrations/supabase/client";

/**
 * Converts offset seconds to ISO 8601 offset string (e.g., 19800 -> "+05:30")
 */
function formatOffsetString(offsetSeconds: number): string {
  const sign = offsetSeconds >= 0 ? '+' : '-';
  const absSeconds = Math.abs(offsetSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Fallback: Calculate offset using longitude-based solar time.
 * Less accurate but works without external API.
 * Returns local time with approximate offset.
 */
function calculateFallback(
  birthDate: string,
  birthTime: string,
  lon: number
): string {
  // Calculate offset based on longitude (15° per hour)
  const offsetHours = lon / 15;
  const offsetSeconds = Math.round(offsetHours * 3600);
  const offsetString = formatOffsetString(offsetSeconds);
  
  // Return local time with calculated offset
  return `${birthDate}T${birthTime}:00${offsetString}`;
}

/**
 * Formats birth date/time with proper timezone offset for Prokerala API.
 * Returns ISO 8601 format with local time and offset (e.g., "2000-01-15T10:30:00+05:30")
 * Falls back to longitude-based calculation if timezone API fails.
 */
export async function convertBirthTimeToUtc(
  birthDate: string,  // YYYY-MM-DD
  birthTime: string,  // HH:MM
  lat: number,
  lon: number
): Promise<string> {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  
  // Create a Unix timestamp for the local time (treating it as UTC temporarily)
  const tempDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  const timestampMs = tempDate.getTime();
  
  // For dates before Unix epoch (1970), use longitude-based fallback
  // TimeZoneDB API requires positive timestamps
  if (timestampMs < 0) {
    return calculateFallback(birthDate, birthTime, lon);
  }
  
  const timestamp = Math.floor(timestampMs / 1000);

  try {
    const { data, error } = await supabase.functions.invoke('get-timezone', {
      body: { lat, lon, timestamp }
    });

    if (error || !data || data.error) {
      return calculateFallback(birthDate, birthTime, lon);
    }

    const gmtOffsetSeconds = data.gmtOffset;
    const offsetString = formatOffsetString(gmtOffsetSeconds);

    // Format as local time with timezone offset (ISO 8601)
    return `${birthDate}T${birthTime}:00${offsetString}`;
  } catch {
    return calculateFallback(birthDate, birthTime, lon);
  }
}
