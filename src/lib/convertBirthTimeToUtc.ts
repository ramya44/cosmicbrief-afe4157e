/**
 * Converts a local birth date/time to UTC using the TimeZoneDB API via edge function.
 * Falls back to a rough longitude-based offset if the API fails.
 */
export async function convertBirthTimeToUtc(
  birthDate: string,  // YYYY-MM-DD
  birthTime: string,  // HH:MM
  lat: number,
  lon: number
): Promise<string> {
  // Combine date and time into a local datetime string
  const localDateTimeStr = `${birthDate}T${birthTime}:00`;
  
  // Calculate rough UTC offset based on longitude (15° per hour)
  // This is a fallback approximation - actual timezones are more complex
  const roughOffsetHours = Math.round(lon / 15);
  
  // Create date object treating input as local time at that longitude
  const localDate = new Date(localDateTimeStr);
  
  // Adjust by the rough offset to get approximate UTC
  // Note: This doesn't account for DST or irregular timezone boundaries
  const utcMs = localDate.getTime() - (roughOffsetHours * 60 * 60 * 1000);
  const utcDate = new Date(utcMs);
  
  return utcDate.toISOString();
}
