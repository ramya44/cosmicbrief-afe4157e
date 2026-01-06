/**
 * Converts a local birth date/time to UTC using longitude-based offset.
 * The birth time is treated as local time at the given coordinates.
 */
export async function convertBirthTimeToUtc(
  birthDate: string,  // YYYY-MM-DD
  birthTime: string,  // HH:MM
  lat: number,
  lon: number
): Promise<string> {
  // Parse date and time components directly (avoid browser timezone interpretation)
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  
  // Calculate UTC offset based on longitude (15° per hour)
  // Positive longitude = east of UTC = positive offset
  const offsetHours = lon / 15;
  
  // Convert local time components to total minutes since midnight
  const localTotalMinutes = hours * 60 + minutes;
  
  // Subtract the offset to get UTC time in minutes
  const utcTotalMinutes = localTotalMinutes - (offsetHours * 60);
  
  // Handle day rollover
  let utcHours = Math.floor(utcTotalMinutes / 60);
  let utcMinutes = Math.round(utcTotalMinutes % 60);
  let utcDay = day;
  let utcMonth = month;
  let utcYear = year;
  
  // Handle negative minutes (round to previous hour)
  if (utcMinutes < 0) {
    utcMinutes += 60;
    utcHours -= 1;
  }
  
  // Handle hour overflow/underflow
  if (utcHours < 0) {
    utcHours += 24;
    utcDay -= 1;
  } else if (utcHours >= 24) {
    utcHours -= 24;
    utcDay += 1;
  }
  
  // Handle day overflow/underflow (simplified - use Date for accuracy)
  // Create a Date object in UTC to handle month/year boundaries correctly
  const utcDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHours, utcMinutes, 0));
  
  return utcDate.toISOString();
}
