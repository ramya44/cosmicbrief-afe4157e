import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import { calculateBirthChart } from "../_shared/lib/vedic-calculator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = createLogger("GET-BIRTH-CHART");

// Input validation schema
const InputSchema = z.object({
  datetime: z.string().min(1, "Datetime is required"), // ISO 8601 format with timezone
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  ayanamsa: z.number().optional().default(1), // 1 = Lahiri (most common for Vedic)
});

// Additional nakshatra details
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

// Birth chart response interface
interface BirthChartResult {
  moonSign: string;
  moonSignId: number;
  moonSignLord: string;
  sunSign: string;
  sunSignId: number;
  sunSignLord: string;
  nakshatra: string;
  nakshatraId: number;
  nakshatraPada: number;
  nakshatraLord: string;
  nakshatraGender: string;
  // Additional info
  deity: string;
  ganam: string;
  birthSymbol: string;
  animalSign: string;
  nadi: string;
  luckyColor: string;
  bestDirection: string;
  syllables: string;
  birthStone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawInput = await req.json();
    const parseResult = InputSchema.safeParse(rawInput);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(", ");
      return new Response(
        JSON.stringify({ error: `Invalid input: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { datetime, latitude, longitude } = parseResult.data;

    logStep("Processing birth chart request", { datetime, latitude, longitude });

    // Calculate birth chart using internal calculator
    const chart = calculateBirthChart(datetime, latitude, longitude);

    // Get additional nakshatra details
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

    const birthDetails: BirthChartResult = {
      moonSign: chart.moonSign.vedic,
      moonSignId: chart.moonSign.index + 1,
      moonSignLord: chart.moonSign.lord,
      sunSign: chart.sunSign.vedic,
      sunSignId: chart.sunSign.index + 1,
      sunSignLord: chart.sunSign.lord,
      nakshatra: chart.moonNakshatra.name,
      nakshatraId: chart.moonNakshatra.index + 1,
      nakshatraPada: chart.moonNakshatra.pada,
      nakshatraLord: chart.moonNakshatra.lord,
      nakshatraGender: nakshatraDetails.gender,
      // Additional info
      deity: chart.moonNakshatra.deity,
      ganam: nakshatraDetails.ganam,
      birthSymbol: nakshatraDetails.symbol,
      animalSign: chart.moonNakshatra.animal,
      nadi: nakshatraDetails.nadi,
      luckyColor: nakshatraDetails.color,
      bestDirection: nakshatraDetails.direction,
      syllables: nakshatraDetails.syllables,
      birthStone: nakshatraDetails.birthstone,
    };

    logStep("Birth chart computed successfully", {
      moonSign: birthDetails.moonSign,
      sunSign: birthDetails.sunSign,
      nakshatra: birthDetails.nakshatra,
      nakshatraLord: birthDetails.nakshatraLord,
      ganam: birthDetails.ganam,
      nadi: birthDetails.nadi,
    });

    return new Response(JSON.stringify(birthDetails), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error processing request", { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage || "Failed to compute birth chart" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
