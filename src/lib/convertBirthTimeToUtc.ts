import { supabase } from "@/integrations/supabase/client";

/**
 * Converts a local birth date/time to UTC using proper timezone lookup.
 * The birth time is treated as local time at the given coordinates.
 */
export async function convertBirthTimeToUtc(
  birthDate: string,  // YYYY-MM-DD
  birthTime: string,  // HH:MM
  lat: number,
  lon: number
): Promise<string> {
  // Parse date and time components
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  
  // Create a Unix timestamp for the local time (treating it as UTC temporarily)
  // This is used to query the timezone at that specific historical moment
  const tempDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  const timestamp = Math.floor(tempDate.getTime() / 1000);

  try {
    // Call the get-timezone edge function to get the actual timezone offset
    const { data, error } = await supabase.functions.invoke('get-timezone', {
      body: { lat, lon, timestamp }
    });

    if (error) {
      console.error('Timezone lookup failed:', error);
      throw new Error('Timezone lookup failed');
    }

    if (!data || data.error) {
      console.error('Timezone API error:', data?.error);
      throw new Error(data?.error || 'Timezone lookup failed');
    }

    // gmtOffset is in seconds, convert local time to UTC
    const gmtOffsetSeconds = data.gmtOffset;
    
    console.log('Timezone lookup result:', {
      zoneName: data.zoneName,
      abbreviation: data.abbreviation,
      gmtOffset: gmtOffsetSeconds,
      dst: data.dst
    });

    // Calculate UTC time by subtracting the offset from local time
    // If local time is 12:30 and offset is -32400 (UTC-9), UTC is 12:30 - (-9h) = 21:30
    const localTotalSeconds = (hours * 3600) + (minutes * 60);
    const utcTotalSeconds = localTotalSeconds - gmtOffsetSeconds;
    
    // Handle day rollover
    let utcHours = Math.floor(utcTotalSeconds / 3600);
    let utcMinutes = Math.floor((utcTotalSeconds % 3600) / 60);
    let utcDay = day;
    let utcMonth = month;
    let utcYear = year;
    
    // Handle negative time (previous day)
    if (utcHours < 0) {
      utcHours += 24;
      utcDay -= 1;
    } else if (utcHours >= 24) {
      utcHours -= 24;
      utcDay += 1;
    }
    
    // Use Date to handle month/year boundaries correctly
    const utcDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHours, utcMinutes, 0));
    
    console.log('UTC conversion:', {
      input: `${birthDate} ${birthTime}`,
      localOffset: `${gmtOffsetSeconds / 3600} hours`,
      output: utcDate.toISOString()
    });
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting birth time to UTC:', error);
    // Re-throw to let caller handle the error
    throw error;
  }
}
