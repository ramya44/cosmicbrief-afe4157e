import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createLogger } from "../_shared/lib/logger.ts";
import { calculateBirthChart, formatAsProkeralaResponse } from "../_shared/lib/vedic-calculator.ts";
import { calculateDashaPeriods, type DashaPeriod, type CurrentDashaInfo } from "../_shared/lib/dasha-calculator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("GET-KUNDLI-DATA");

const InputSchema = z.object({
  datetime: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  ayanamsa: z.number().default(1), // 1 = Lahiri (default and most common)
});

// Additional nakshatra info not computed internally
const NAKSHATRA_DETAILS: Record<string, {
  gender: string;
  ganam: string;
  symbol: string;
  nadi: string;
  color: string;
  direction: string;
  syllables: string;
  birthstone: string;
}> = {
  "Ashwini": { gender: "Male", ganam: "Deva", symbol: "Horse's Head", nadi: "Vata", color: "Red", direction: "South", syllables: "Chu, Che, Cho, La", birthstone: "Cat's Eye" },
  "Bharani": { gender: "Female", ganam: "Manushya", symbol: "Yoni", nadi: "Pitta", color: "Red", direction: "West", syllables: "Li, Lu, Le, Lo", birthstone: "Diamond" },
  "Krittika": { gender: "Female", ganam: "Rakshasa", symbol: "Razor", nadi: "Kapha", color: "White", direction: "North", syllables: "A, I, U, E", birthstone: "Ruby" },
  "Rohini": { gender: "Female", ganam: "Manushya", symbol: "Cart", nadi: "Kapha", color: "White", direction: "East", syllables: "O, Va, Vi, Vu", birthstone: "Pearl" },
  "Mrigashira": { gender: "Neutral", ganam: "Deva", symbol: "Deer's Head", nadi: "Pitta", color: "Silver", direction: "South", syllables: "Ve, Vo, Ka, Ki", birthstone: "Coral" },
  "Ardra": { gender: "Female", ganam: "Manushya", symbol: "Teardrop", nadi: "Vata", color: "Green", direction: "West", syllables: "Ku, Gha, Ng, Chha", birthstone: "Hessonite" },
  "Punarvasu": { gender: "Male", ganam: "Deva", symbol: "Bow", nadi: "Vata", color: "Lead", direction: "North", syllables: "Ke, Ko, Ha, Hi", birthstone: "Yellow Sapphire" },
  "Pushya": { gender: "Male", ganam: "Deva", symbol: "Flower", nadi: "Pitta", color: "Red", direction: "East", syllables: "Hu, He, Ho, Da", birthstone: "Blue Sapphire" },
  "Ashlesha": { gender: "Female", ganam: "Rakshasa", symbol: "Serpent", nadi: "Kapha", color: "Red", direction: "South", syllables: "Di, Du, De, Do", birthstone: "Emerald" },
  "Magha": { gender: "Female", ganam: "Rakshasa", symbol: "Throne", nadi: "Kapha", color: "Cream", direction: "West", syllables: "Ma, Mi, Mu, Me", birthstone: "Cat's Eye" },
  "Purva Phalguni": { gender: "Female", ganam: "Manushya", symbol: "Hammock", nadi: "Pitta", color: "Light Brown", direction: "North", syllables: "Mo, Ta, Ti, Tu", birthstone: "Diamond" },
  "Uttara Phalguni": { gender: "Female", ganam: "Manushya", symbol: "Bed", nadi: "Vata", color: "Bright Blue", direction: "East", syllables: "Te, To, Pa, Pi", birthstone: "Ruby" },
  "Hasta": { gender: "Male", ganam: "Deva", symbol: "Hand", nadi: "Vata", color: "Deep Green", direction: "South", syllables: "Pu, Sha, Na, Tha", birthstone: "Pearl" },
  "Chitra": { gender: "Female", ganam: "Rakshasa", symbol: "Pearl", nadi: "Pitta", color: "Black", direction: "West", syllables: "Pe, Po, Ra, Ri", birthstone: "Coral" },
  "Swati": { gender: "Female", ganam: "Deva", symbol: "Coral", nadi: "Kapha", color: "Black", direction: "North", syllables: "Ru, Re, Ro, Ta", birthstone: "Hessonite" },
  "Vishakha": { gender: "Female", ganam: "Rakshasa", symbol: "Arch", nadi: "Kapha", color: "Golden", direction: "East", syllables: "Ti, Tu, Te, To", birthstone: "Yellow Sapphire" },
  "Anuradha": { gender: "Male", ganam: "Deva", symbol: "Lotus", nadi: "Pitta", color: "Reddish Brown", direction: "South", syllables: "Na, Ni, Nu, Ne", birthstone: "Blue Sapphire" },
  "Jyeshtha": { gender: "Female", ganam: "Rakshasa", symbol: "Earring", nadi: "Vata", color: "Cream", direction: "West", syllables: "No, Ya, Yi, Yu", birthstone: "Emerald" },
  "Mula": { gender: "Neutral", ganam: "Rakshasa", symbol: "Roots", nadi: "Vata", color: "Brown", direction: "North", syllables: "Ye, Yo, Bha, Bhi", birthstone: "Cat's Eye" },
  "Purva Ashadha": { gender: "Female", ganam: "Manushya", symbol: "Fan", nadi: "Pitta", color: "Black", direction: "East", syllables: "Bhu, Dha, Pha, Da", birthstone: "Diamond" },
  "Uttara Ashadha": { gender: "Female", ganam: "Manushya", symbol: "Tusk", nadi: "Kapha", color: "Copper", direction: "South", syllables: "Be, Bo, Ja, Ji", birthstone: "Ruby" },
  "Shravana": { gender: "Male", ganam: "Deva", symbol: "Ear", nadi: "Kapha", color: "Light Blue", direction: "West", syllables: "Ju, Je, Jo, Gha", birthstone: "Pearl" },
  "Dhanishta": { gender: "Female", ganam: "Rakshasa", symbol: "Drum", nadi: "Pitta", color: "Silver", direction: "North", syllables: "Ga, Gi, Gu, Ge", birthstone: "Coral" },
  "Shatabhisha": { gender: "Neutral", ganam: "Rakshasa", symbol: "Circle", nadi: "Vata", color: "Blue-Green", direction: "East", syllables: "Go, Sa, Si, Su", birthstone: "Hessonite" },
  "Purva Bhadrapada": { gender: "Male", ganam: "Manushya", symbol: "Sword", nadi: "Vata", color: "Silver", direction: "South", syllables: "Se, So, Da, Di", birthstone: "Yellow Sapphire" },
  "Uttara Bhadrapada": { gender: "Male", ganam: "Manushya", symbol: "Twins", nadi: "Pitta", color: "Purple", direction: "West", syllables: "Du, Tha, Jha, Da", birthstone: "Blue Sapphire" },
  "Revati": { gender: "Female", ganam: "Deva", symbol: "Fish", nadi: "Kapha", color: "Brown", direction: "North", syllables: "De, Do, Cha, Chi", birthstone: "Emerald" },
};

interface KundliResult {
  // Nakshatra details
  nakshatra: string;
  nakshatra_id: number;
  nakshatra_pada: number;
  nakshatra_lord: string;
  nakshatra_gender: string;
  deity: string;
  ganam: string;
  birth_symbol: string;
  animal_sign: string;
  nadi: string;
  lucky_color: string;
  best_direction: string;
  syllables: string;
  birth_stone: string;

  // Signs
  moon_sign: string;
  moon_sign_id: number;
  moon_sign_lord: string;
  sun_sign: string;
  sun_sign_id: number;
  sun_sign_lord: string;
  zodiac_sign: string;

  // Ascendant (Lagna)
  ascendant_sign: string;
  ascendant_sign_id: number;
  ascendant_sign_lord: string;

  // Planetary positions
  planetary_positions: {
    id: number;
    name: string;
    sign: string;
    sign_id: number;
    sign_lord: string;
    degree: number;
    full_degree: number;
    is_retrograde: boolean;
    nakshatra?: string;
    nakshatra_id?: number;
    nakshatra_pada?: number;
    nakshatra_lord?: string;
  }[];

  // Dasha periods
  dasha_periods: DashaPeriod[];
  current_dasha: CurrentDashaInfo | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Request received");

    const body = await req.json();
    logStep("Request body parsed", body);

    const input = InputSchema.parse(body);
    logStep("Input validated", input);

    // Calculate birth chart using internal calculator
    logStep("Calculating birth chart internally");
    const chart = calculateBirthChart(input.datetime, input.latitude, input.longitude);
    const prokeralaFormat = formatAsProkeralaResponse(chart);

    // Add additional nakshatra details
    const nakshatraDetails = NAKSHATRA_DETAILS[chart.moonNakshatra.name] || {
      gender: "",
      ganam: "",
      symbol: "",
      nadi: "",
      color: "",
      direction: "",
      syllables: "",
      birthstone: "",
    };

    // Calculate dasha periods using Moon position
    let dashaData: { dasha_periods: DashaPeriod[]; current_dasha: CurrentDashaInfo | null } = {
      dasha_periods: [],
      current_dasha: null
    };

    try {
      // Extract birth date from the datetime string (format: YYYY-MM-DDTHH:MM:SS±HH:MM)
      const birthDateStr = input.datetime.split('T')[0];
      dashaData = calculateDashaPeriods(prokeralaFormat.planetary_positions, birthDateStr);
      logStep("Dasha periods calculated", {
        totalPeriods: dashaData.dasha_periods.length,
        currentMahaDasha: dashaData.current_dasha?.maha_dasha,
        currentAntarDasha: dashaData.current_dasha?.antar_dasha,
      });
    } catch (dashaError) {
      logStep("Dasha calculation failed (non-fatal)", {
        error: dashaError instanceof Error ? dashaError.message : "Unknown error"
      });
      // Continue without dasha data - it's optional
    }

    const result: KundliResult = {
      // Nakshatra details
      nakshatra: prokeralaFormat.nakshatra,
      nakshatra_id: prokeralaFormat.nakshatra_id,
      nakshatra_pada: prokeralaFormat.nakshatra_pada,
      nakshatra_lord: prokeralaFormat.nakshatra_lord,
      nakshatra_gender: nakshatraDetails.gender,
      deity: prokeralaFormat.deity,
      ganam: nakshatraDetails.ganam,
      birth_symbol: nakshatraDetails.symbol,
      animal_sign: prokeralaFormat.animal_sign,
      nadi: nakshatraDetails.nadi,
      lucky_color: nakshatraDetails.color,
      best_direction: nakshatraDetails.direction,
      syllables: nakshatraDetails.syllables,
      birth_stone: nakshatraDetails.birthstone,

      // Signs
      moon_sign: prokeralaFormat.moon_sign,
      moon_sign_id: prokeralaFormat.moon_sign_id,
      moon_sign_lord: prokeralaFormat.moon_sign_lord,
      sun_sign: prokeralaFormat.sun_sign,
      sun_sign_id: prokeralaFormat.sun_sign_id,
      sun_sign_lord: prokeralaFormat.sun_sign_lord,
      zodiac_sign: prokeralaFormat.zodiac_sign,

      // Ascendant
      ascendant_sign: prokeralaFormat.ascendant_sign,
      ascendant_sign_id: prokeralaFormat.ascendant_sign_id,
      ascendant_sign_lord: prokeralaFormat.ascendant_sign_lord,

      // Planetary positions
      planetary_positions: prokeralaFormat.planetary_positions,

      // Dasha periods
      dasha_periods: dashaData.dasha_periods,
      current_dasha: dashaData.current_dasha,
    };

    logStep("Kundli data calculated successfully", {
      nakshatra: result.nakshatra,
      moon_sign: result.moon_sign,
      ascendant_sign: result.ascendant_sign,
      planetCount: result.planetary_positions.length,
      dashaPeriodCount: result.dasha_periods.length,
      currentDasha: result.current_dasha?.maha_dasha,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    const errStack = error instanceof Error ? error.stack : undefined;
    logStep("Error", { message: errMessage, stack: errStack });
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
