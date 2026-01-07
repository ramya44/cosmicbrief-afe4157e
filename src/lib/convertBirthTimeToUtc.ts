import { supabase } from "@/integrations/supabase/client";

/**
 * Fallback: Calculate UTC using longitude-based solar time offset.
 * Less accurate but works without external API.
 */
function calculateUtcFallback(
  birthDate: string,
  birthTime: string,
  lat: number,
  lon: number
): string {
  console.warn('Using longitude-based UTC calculation (fallback)');
  
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  
  // Calculate UTC offset based on longitude (15° per hour)
  const offsetHours = lon / 15;
  
  const localTotalMinutes = hours * 60 + minutes;
  const utcTotalMinutes = localTotalMinutes - (offsetHours * 60);
  
  let utcHours = Math.floor(utcTotalMinutes / 60);
  let utcMinutes = Math.round(utcTotalMinutes % 60);
  let utcDay = day;
  
  if (utcMinutes < 0) {
    utcMinutes += 60;
    utcHours -= 1;
  }
  
  if (utcHours < 0) {
    utcHours += 24;
    utcDay -= 1;
  } else if (utcHours >= 24) {
    utcHours -= 24;
    utcDay += 1;
  }
  
  const utcDate = new Date(Date.UTC(year, month - 1, utcDay, utcHours, utcMinutes, 0));
  return utcDate.toISOString();
}

/**
 * Converts a local birth date/time to UTC using proper timezone lookup.
 * Falls back to longitude-based calculation if API fails.
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
  const timestamp = Math.floor(tempDate.getTime() / 1000);

  try {
    const { data, error } = await supabase.functions.invoke('get-timezone', {
      body: { lat, lon, timestamp }
    });

    if (error || !data || data.error) {
      console.error('Timezone lookup failed:', error || data?.error);
      return calculateUtcFallback(birthDate, birthTime, lat, lon);
    }

    const gmtOffsetSeconds = data.gmtOffset;
    
    console.log('Timezone lookup result:', {
      zoneName: data.zoneName,
      abbreviation: data.abbreviation,
      gmtOffset: gmtOffsetSeconds,
      dst: data.dst
    });

    const localTotalSeconds = (hours * 3600) + (minutes * 60);
    const utcTotalSeconds = localTotalSeconds - gmtOffsetSeconds;
    
    let utcHours = Math.floor(utcTotalSeconds / 3600);
    let utcMinutes = Math.floor((utcTotalSeconds % 3600) / 60);
    let utcDay = day;
    
    if (utcHours < 0) {
      utcHours += 24;
      utcDay -= 1;
    } else if (utcHours >= 24) {
      utcHours -= 24;
      utcDay += 1;
    }
    
    const utcDate = new Date(Date.UTC(year, month - 1, utcDay, utcHours, utcMinutes, 0));
    
    console.log('UTC conversion:', {
      input: `${birthDate} ${birthTime}`,
      localOffset: `${gmtOffsetSeconds / 3600} hours`,
      output: utcDate.toISOString()
    });
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting birth time to UTC:', error);
    return calculateUtcFallback(birthDate, birthTime, lat, lon);
  }
}
