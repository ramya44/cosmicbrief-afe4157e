// Style seed and pivotal element generation
// supabase/functions/generate-forecast/lib/style.ts
import type { ThemeCacheResult } from "../../_shared/lib/types.ts";

// short hash used for deterministic theme selection
export async function generateStyleSeed(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeUtcDatetime(utcDatetime: string): string {
  const date = new Date(utcDatetime);
  const minutes = date.getUTCMinutes();
  const normalizedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
  const normalizedHours = minutes >= 45 ? date.getUTCHours() + 1 : date.getUTCHours();

  date.setUTCHours(normalizedHours % 24, normalizedMinutes, 0, 0);
  if (normalizedHours >= 24) {
    date.setUTCDate(date.getUTCDate() + 1);
    date.setUTCHours(0);
  }
  return date.toISOString();
}

export function pickPivotalLifeElement(age: number, styleSeed: string): string {
  const seedNum = Array.from(styleSeed).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let options: string[];
  if (age < 35) options = ["career", "education", "identity"];
  else if (age < 50) options = ["career", "relationships", "family", "health"];
  else if (age < 60) options = ["health", "family", "relationships", "purpose"];
  else options = ["health", "family", "relationships", "meaning", "stewardship"];
  return options[seedNum % options.length];
}

// your current implementation (fast). If you want accurate age, we can swap later.
export function calculateAge(birthDatetimeUtc: string, targetYear: number): number {
  const birthDate = new Date(birthDatetimeUtc);
  return targetYear - birthDate.getUTCFullYear();
}

// Optional: keep if you still store this; not used in prompt logic
export function getWesternZodiacSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

// theme cache helper
export async function getOrCreatePivotalTheme(args: {
  supabase: any;
  birthTimeUtc?: string;
  targetYear: number;
  age: number;
  styleSeed: string;
}): Promise<ThemeCacheResult> {
  const { supabase, birthTimeUtc, targetYear, age, styleSeed } = args;

  if (!birthTimeUtc) {
    return { pivotalLifeElement: pickPivotalLifeElement(age, styleSeed) };
  }

  const normalizedUtc = normalizeUtcDatetime(birthTimeUtc);

  const { data: cachedTheme } = await supabase
    .from("theme_cache")
    .select("pivotal_theme")
    .eq("birth_datetime_utc", normalizedUtc)
    .eq("target_year", String(targetYear))
    .maybeSingle();

  if (cachedTheme?.pivotal_theme) {
    return { pivotalLifeElement: cachedTheme.pivotal_theme, normalizedUtc, cacheHit: true };
  }

  const pivotalLifeElement = pickPivotalLifeElement(age, styleSeed);

  await supabase.from("theme_cache").insert({
    birth_datetime_utc: normalizedUtc,
    target_year: String(targetYear),
    pivotal_theme: pivotalLifeElement,
  });

  return { pivotalLifeElement, normalizedUtc, cacheHit: false };
}
