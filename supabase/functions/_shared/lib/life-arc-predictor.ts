/**
 * Life Arc Predictor - House-Based Vedic Analysis
 * Identifies optimal windows for major life events based on house lordships,
 * planetary karakas, and dasha periods
 */

// ============================================
// TYPES
// ============================================

export interface PlanetPosition {
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
}

export interface DashaPeriod {
  planet: string;
  start: string;
  end: string;
  years: number;
  antardasha?: AntarDashaPeriod[];
}

export interface AntarDashaPeriod {
  planet: string;
  start: string;
  end: string;
  maha_lord: string;
}

export interface ChartData {
  ascendant_sign: string;
  ascendant_sign_id: number;
  planetary_positions: PlanetPosition[];
}

export interface LifeEventCategory {
  name: string;
  displayName: string;
  primary_houses: number[];
  karakas: string[];
  supporting_planets: string[];
  negative_indicators: string[];
}

export interface ComprehensiveLifeEventWindow {
  category: string;
  displayName: string;
  specific_event: string;
  period: string;
  maha_dasha: string;
  antar_dasha: string;
  start_date: string;
  end_date: string;
  age_at_start: number;
  age_at_end?: number;
  intensity: "low" | "moderate" | "high" | "very_high";
  probability: number;
  nature: "positive" | "challenging" | "transformative" | "mixed";
  reasons: string[];
  guidance: string;
  rating: number;
}

// Life Arc Report - structured past and future analysis
export interface LifeArcReport {
  user_age: number;
  birth_date: string;
  past: {
    education_career: ComprehensiveLifeEventWindow[];
    relationship_windows: ComprehensiveLifeEventWindow[];
    children_windows: ComprehensiveLifeEventWindow[];
    major_transformations: ComprehensiveLifeEventWindow[];
  };
  future: {
    marriage_windows: ComprehensiveLifeEventWindow[];
    children_windows: ComprehensiveLifeEventWindow[];
    wealth_windows: ComprehensiveLifeEventWindow[];
    career_breakthrough_windows: ComprehensiveLifeEventWindow[];
    travel_relocation_windows: ComprehensiveLifeEventWindow[];
    home_property_windows: ComprehensiveLifeEventWindow[];
    spirituality_windows: ComprehensiveLifeEventWindow[];
    health_focus_windows: ComprehensiveLifeEventWindow[];
  };
  current_period: {
    maha_dasha: string;
    antar_dasha: string;
    period_theme: string;
    active_areas: string[];
  };
  summary: string;
}

// ============================================
// CONSTANTS
// ============================================

// Sign order (1-indexed to match sign_id)
const SIGNS = [
  "", // 0 placeholder
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

// Sign to ID mapping
const SIGN_TO_ID: Record<string, number> = {
  "Mesha": 1, "Aries": 1,
  "Vrishabha": 2, "Taurus": 2,
  "Mithuna": 3, "Gemini": 3,
  "Karka": 4, "Cancer": 4,
  "Simha": 5, "Leo": 5,
  "Kanya": 6, "Virgo": 6,
  "Tula": 7, "Libra": 7,
  "Vrishchika": 8, "Scorpio": 8,
  "Dhanu": 9, "Sagittarius": 9,
  "Makara": 10, "Capricorn": 10,
  "Kumbha": 11, "Aquarius": 11,
  "Meena": 12, "Pisces": 12,
};

// Which planet rules which sign
const SIGN_LORDS: Record<number, string> = {
  1: "Mars",      // Aries
  2: "Venus",     // Taurus
  3: "Mercury",   // Gemini
  4: "Moon",      // Cancer
  5: "Sun",       // Leo
  6: "Mercury",   // Virgo
  7: "Venus",     // Libra
  8: "Mars",      // Scorpio (traditional)
  9: "Jupiter",   // Sagittarius
  10: "Saturn",   // Capricorn
  11: "Saturn",   // Aquarius
  12: "Jupiter",  // Pisces
};

// Life event categories with Vedic mappings
const LIFE_EVENT_CATEGORIES: LifeEventCategory[] = [
  {
    name: "marriage",
    displayName: "Marriage & Relationships",
    primary_houses: [7],
    karakas: ["Venus"],
    supporting_planets: ["Jupiter", "Moon"],
    negative_indicators: ["Saturn", "Rahu", "Ketu"],
  },
  {
    name: "children",
    displayName: "Children & Progeny",
    primary_houses: [5],
    karakas: ["Jupiter"],
    supporting_planets: ["Moon", "Venus"],
    negative_indicators: ["Saturn", "Rahu", "Ketu", "Sun"],
  },
  {
    name: "career",
    displayName: "Career & Profession",
    primary_houses: [10],
    karakas: ["Sun", "Saturn", "Mercury"],
    supporting_planets: ["Jupiter", "Mars"],
    negative_indicators: ["Rahu", "Ketu"],
  },
  {
    name: "wealth",
    displayName: "Wealth & Finances",
    primary_houses: [2, 11],
    karakas: ["Jupiter", "Venus"],
    supporting_planets: ["Mercury", "Moon"],
    negative_indicators: ["Saturn", "Rahu"],
  },
  {
    name: "health",
    displayName: "Health & Vitality",
    primary_houses: [1, 6],
    karakas: ["Sun", "Moon"],
    supporting_planets: ["Mars", "Jupiter"],
    negative_indicators: ["Saturn", "Rahu", "Ketu"],
  },
  {
    name: "spirituality",
    displayName: "Spirituality & Inner Growth",
    primary_houses: [9, 12],
    karakas: ["Jupiter", "Ketu"],
    supporting_planets: ["Moon", "Venus"],
    negative_indicators: ["Rahu"],
  },
  {
    name: "education",
    displayName: "Education & Learning",
    primary_houses: [4, 5, 9],
    karakas: ["Mercury", "Jupiter"],
    supporting_planets: ["Venus", "Moon"],
    negative_indicators: ["Saturn", "Rahu"],
  },
  {
    name: "home_property",
    displayName: "Home & Property",
    primary_houses: [4],
    karakas: ["Moon", "Mars"],
    supporting_planets: ["Venus", "Jupiter"],
    negative_indicators: ["Saturn", "Rahu"],
  },
  {
    name: "travel_foreign",
    displayName: "Travel & Foreign Connections",
    primary_houses: [9, 12],
    karakas: ["Rahu"],
    supporting_planets: ["Moon", "Jupiter"],
    negative_indicators: ["Saturn", "Ketu"],
  },
  {
    name: "transformation",
    displayName: "Transformation & Change",
    primary_houses: [8],
    karakas: ["Ketu", "Saturn"],
    supporting_planets: ["Mars", "Rahu"],
    negative_indicators: [],
  },
  {
    name: "social_gains",
    displayName: "Social Networks & Gains",
    primary_houses: [11],
    karakas: ["Jupiter", "Venus"],
    supporting_planets: ["Mercury", "Sun"],
    negative_indicators: ["Saturn"],
  },
  {
    name: "losses_liberation",
    displayName: "Endings & Liberation",
    primary_houses: [12],
    karakas: ["Ketu", "Saturn"],
    supporting_planets: ["Jupiter"],
    negative_indicators: ["Rahu", "Mars"],
  },
];

// ============================================
// HOUSE CALCULATION FUNCTIONS
// ============================================

/**
 * Get the sign ID for a given house number based on Ascendant
 */
function getHouseSign(ascendantSignId: number, houseNumber: number): number {
  // House 1 = Ascendant sign, then count forward
  let signId = ascendantSignId + (houseNumber - 1);
  if (signId > 12) signId -= 12;
  return signId;
}

/**
 * Get the lord of a specific house
 */
function getHouseLord(ascendantSignId: number, houseNumber: number): string {
  const houseSign = getHouseSign(ascendantSignId, houseNumber);
  return SIGN_LORDS[houseSign];
}

/**
 * Get all house lordships for a chart
 */
function getAllHouseLords(ascendantSignId: number): Record<number, string> {
  const lords: Record<number, string> = {};
  for (let house = 1; house <= 12; house++) {
    lords[house] = getHouseLord(ascendantSignId, house);
  }
  return lords;
}

/**
 * Get which house a planet is placed in
 */
function getPlanetHouse(planetSignId: number, ascendantSignId: number): number {
  let house = planetSignId - ascendantSignId + 1;
  if (house <= 0) house += 12;
  return house;
}

/**
 * Get which houses a planet rules (can rule 1 or 2 houses)
 */
function getHousesRuledByPlanet(planet: string, ascendantSignId: number): number[] {
  const houses: number[] = [];
  for (let house = 1; house <= 12; house++) {
    if (getHouseLord(ascendantSignId, house) === planet) {
      houses.push(house);
    }
  }
  return houses;
}

/**
 * Get planets placed in a specific house
 */
function getPlanetsInHouse(
  houseNumber: number,
  ascendantSignId: number,
  positions: PlanetPosition[]
): PlanetPosition[] {
  const houseSignId = getHouseSign(ascendantSignId, houseNumber);
  return positions.filter(p => p.sign_id === houseSignId);
}

// ============================================
// DASHA ANALYSIS FUNCTIONS
// ============================================

/**
 * Calculate how strongly a dasha period activates a life event category
 */
function calculateEventActivation(
  mahaPlanet: string,
  antarPlanet: string,
  category: LifeEventCategory,
  chartData: ChartData
): {
  score: number;
  reasons: string[];
  nature: "positive" | "challenging" | "transformative" | "mixed";
} {
  const ascendantSignId = chartData.ascendant_sign_id || SIGN_TO_ID[chartData.ascendant_sign] || 1;
  const houseLords = getAllHouseLords(ascendantSignId);
  const reasons: string[] = [];
  let positiveScore = 0;
  let negativeScore = 0;

  // Helper to check planet connections
  const checkPlanet = (planet: string, weight: number) => {
    const housesRuled = getHousesRuledByPlanet(planet, ascendantSignId);
    const planetPosition = chartData.planetary_positions.find(p => p.name === planet);
    const planetHouse = planetPosition ? getPlanetHouse(planetPosition.sign_id, ascendantSignId) : 0;

    // Check if planet rules any primary house
    for (const house of category.primary_houses) {
      if (housesRuled.includes(house)) {
        positiveScore += weight * 3;
        reasons.push(`${planet} rules ${house}th house (${category.displayName})`);
      }
    }

    // Check if planet is placed in any primary house
    if (category.primary_houses.includes(planetHouse)) {
      positiveScore += weight * 2;
      reasons.push(`${planet} is placed in ${planetHouse}th house`);
    }

    // Check if planet is a karaka
    if (category.karakas.includes(planet)) {
      positiveScore += weight * 2.5;
      reasons.push(`${planet} is the karaka (significator) for ${category.displayName}`);
    }

    // Check if planet is supporting
    if (category.supporting_planets.includes(planet)) {
      positiveScore += weight * 1.5;
      reasons.push(`${planet} supports ${category.displayName}`);
    }

    // Check if planet is a negative indicator
    if (category.negative_indicators.includes(planet)) {
      negativeScore += weight * 2;
      reasons.push(`${planet} can create challenges for ${category.displayName}`);
    }
  };

  // Analyze Maha Dasha lord (higher weight)
  checkPlanet(mahaPlanet, 1.0);

  // Analyze Antar Dasha lord (slightly lower weight)
  checkPlanet(antarPlanet, 0.7);

  // Calculate final score and nature
  const netScore = positiveScore - negativeScore;
  const totalActivity = positiveScore + negativeScore;

  let nature: "positive" | "challenging" | "transformative" | "mixed";
  if (positiveScore > 0 && negativeScore === 0) {
    nature = "positive";
  } else if (negativeScore > positiveScore) {
    nature = "challenging";
  } else if (positiveScore > 0 && negativeScore > 0) {
    nature = "mixed";
  } else if (category.name === "transformation" || category.name === "losses_liberation") {
    nature = "transformative";
  } else {
    nature = "mixed";
  }

  // Normalize score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, (netScore / 10) * 50 + 50));

  return {
    score: Math.round(normalizedScore),
    reasons: reasons.slice(0, 5), // Top 5 reasons
    nature,
  };
}

/**
 * Determine intensity based on score
 */
function getIntensity(score: number): "low" | "moderate" | "high" | "very_high" {
  if (score >= 80) return "very_high";
  if (score >= 65) return "high";
  if (score >= 45) return "moderate";
  return "low";
}

/**
 * Generate specific event description based on category and nature
 */
function getSpecificEvent(
  category: LifeEventCategory,
  nature: string,
  intensity: string
): string {
  const events: Record<string, Record<string, string>> = {
    marriage: {
      positive: "Strong potential for marriage or committed relationship",
      mixed: "Relationship developments with both opportunities and challenges",
      challenging: "Relationship tests and need for patience in partnerships",
      transformative: "Deep transformation in approach to relationships",
    },
    children: {
      positive: "Favorable period for conception or growth in children's lives",
      mixed: "Developments related to children with some adjustments needed",
      challenging: "Focus on children's health or education challenges",
      transformative: "Significant changes in parent-child dynamics",
    },
    career: {
      positive: "Career advancement, recognition, or new opportunities",
      mixed: "Career changes with both gains and adjustments",
      challenging: "Professional obstacles requiring strategic navigation",
      transformative: "Major career pivot or fundamental work changes",
    },
    wealth: {
      positive: "Financial growth and wealth accumulation opportunities",
      mixed: "Income fluctuations with opportunities for gains",
      challenging: "Financial caution advised, protect existing assets",
      transformative: "Complete restructuring of financial approach",
    },
    health: {
      positive: "Strong vitality and health improvements",
      mixed: "Health awareness period with ups and downs",
      challenging: "Health concerns requiring attention and care",
      transformative: "Major lifestyle or health transformation",
    },
    spirituality: {
      positive: "Deep spiritual insights and growth",
      mixed: "Spiritual seeking with periods of doubt and clarity",
      challenging: "Crisis of faith leading to deeper understanding",
      transformative: "Profound spiritual awakening or shift",
    },
    education: {
      positive: "Excellent learning and academic achievements",
      mixed: "Educational progress with some hurdles",
      challenging: "Learning difficulties or educational delays",
      transformative: "Complete shift in educational or learning path",
    },
    home_property: {
      positive: "Property acquisition or home improvements",
      mixed: "Property matters with complications and resolutions",
      challenging: "Domestic disturbances or property disputes",
      transformative: "Major relocation or complete home change",
    },
    travel_foreign: {
      positive: "Favorable foreign travel or international opportunities",
      mixed: "Travel with both adventures and inconveniences",
      challenging: "Travel obstacles or foreign matters complications",
      transformative: "Life-changing journey or permanent relocation",
    },
    transformation: {
      positive: "Empowering personal transformation",
      mixed: "Deep changes with resistance and acceptance",
      challenging: "Intense transformation through difficulties",
      transformative: "Complete metamorphosis of self or circumstances",
    },
    social_gains: {
      positive: "Expansion of social network and gains through connections",
      mixed: "Social opportunities with selective benefits",
      challenging: "Disappointments from friends or community",
      transformative: "Complete renewal of social circle",
    },
    losses_liberation: {
      positive: "Healthy letting go and spiritual liberation",
      mixed: "Losses that lead to eventual freedom",
      challenging: "Difficult losses or isolation period",
      transformative: "Major endings opening new chapters",
    },
  };

  return events[category.name]?.[nature] || `${intensity} activity in ${category.displayName}`;
}

/**
 * Generate guidance based on category, nature, and intensity
 */
function generateGuidance(
  category: LifeEventCategory,
  nature: string,
  intensity: string,
  reasons: string[]
): string {
  const guidance: Record<string, Record<string, string>> = {
    marriage: {
      positive: "This is an auspicious window for relationship commitments. Trust the timing and remain open to connections.",
      mixed: "Relationships can progress but require patience and clear communication. Address concerns early.",
      challenging: "Focus on self-development and avoid rushing into commitments. Strengthen existing bonds through understanding.",
    },
    children: {
      positive: "Highly favorable for family planning or nurturing children's growth. Natural timing supports conception.",
      mixed: "Children-related matters need extra attention. Balance hopes with practical planning.",
      challenging: "Prioritize children's wellbeing and health. Patience and consistent care are essential.",
    },
    career: {
      positive: "Take initiative in career matters. Seek promotions, showcase achievements, and embrace leadership.",
      mixed: "Navigate office dynamics carefully. Build alliances and document achievements for future growth.",
      challenging: "Maintain a low profile professionally. Focus on skill-building rather than advancement.",
    },
    wealth: {
      positive: "Expand investments and explore new income sources. Financial risks can yield rewards.",
      mixed: "Diversify finances and avoid putting all eggs in one basket. Moderate risk tolerance advised.",
      challenging: "Focus on preservation over growth. Avoid speculation and new financial commitments.",
    },
    health: {
      positive: "Excellent time to start health regimens. Body responds well to positive changes.",
      mixed: "Regular health monitoring advised. Address minor issues before they grow.",
      challenging: "Prioritize rest and preventive care. Seek medical guidance for persistent concerns.",
    },
    spirituality: {
      positive: "Deepen spiritual practices. Meditation, retreats, and study yield profound insights.",
      mixed: "Explore different spiritual paths. Questions lead to meaningful discoveries.",
      challenging: "Inner work may feel difficult but is transformative. Seek guidance from teachers.",
    },
    education: {
      positive: "Pursue new learning with confidence. Exams and certifications are favored.",
      mixed: "Study requires extra effort but progress is possible. Find the right mentors.",
      challenging: "Break learning into smaller goals. Patience and persistence matter more than speed.",
    },
    home_property: {
      positive: "Good time for property decisions. Home improvements or new purchases are supported.",
      mixed: "Proceed with thorough due diligence. Legal review of all documents essential.",
      challenging: "Delay major property decisions if possible. Focus on maintaining current assets.",
    },
    travel_foreign: {
      positive: "Travel brings opportunities and growth. International ventures are favored.",
      mixed: "Plan trips carefully with backup arrangements. Flexibility is key.",
      challenging: "Minimize non-essential travel. Virtual connections may work better than physical journeys.",
    },
    transformation: {
      positive: "Embrace change as a path to empowerment. Old patterns are ready to be released.",
      mixed: "Change is inevitable; your response determines outcomes. Stay adaptable.",
      challenging: "Difficult transformations build resilience. Seek support through transitions.",
    },
    social_gains: {
      positive: "Network actively. New connections bring tangible benefits and opportunities.",
      mixed: "Be selective about commitments. Quality connections matter more than quantity.",
      challenging: "Reassess social investments. Some relationships may need to end for growth.",
    },
    losses_liberation: {
      positive: "Letting go creates space for the new. Trust the process of release.",
      mixed: "Balance holding on with letting go. Discernment about what to release is key.",
      challenging: "Losses may feel painful but are clearing the path. Seek meaning in endings.",
    },
  };

  const natureFallback = nature === "transformative" ? "mixed" : nature;
  return guidance[category.name]?.[natureFallback] ||
         `Focus on ${category.displayName.toLowerCase()} with awareness of current planetary influences.`;
}

// ============================================
// AGE-APPROPRIATE EVENT CATEGORIZATION
// ============================================

/**
 * Life stages with appropriate event types
 * This prevents nonsensical interpretations like "career at age 4"
 */
interface LifeStage {
  name: string;
  minAge: number;
  maxAge: number;
  appropriateCategories: string[];
  inappropriateCategories: string[];
  eventDescriptionModifiers: Record<string, string>;
}

const LIFE_STAGES: LifeStage[] = [
  {
    name: "Early Childhood",
    minAge: 0,
    maxAge: 6,
    appropriateCategories: ["health", "transformation"],
    inappropriateCategories: ["career", "marriage", "children", "wealth", "home_property", "spirituality"],
    eventDescriptionModifiers: {
      health: "Foundation period for physical development and early health patterns",
      transformation: "Formative experiences shaping early personality",
    },
  },
  {
    name: "School Years",
    minAge: 6,
    maxAge: 18,
    appropriateCategories: ["education", "health", "transformation", "travel_foreign"],
    inappropriateCategories: ["career", "children", "wealth", "home_property", "spirituality", "social_gains"],
    eventDescriptionModifiers: {
      education: "Academic foundation and learning development",
      health: "Physical and emotional development focus",
      transformation: "Identity formation and personal growth",
      travel_foreign: "Family travel or educational exchange opportunities",
      marriage: "Early romantic interests or crushes", // Only after age 14
    },
  },
  {
    name: "Young Adult",
    minAge: 18,
    maxAge: 25,
    appropriateCategories: ["education", "career", "marriage", "travel_foreign", "health", "transformation", "social_gains"],
    inappropriateCategories: ["children"], // Generally wait until 21+ for children predictions
    eventDescriptionModifiers: {
      education: "Higher education or professional training",
      career: "Career launch and initial professional development",
      marriage: "Relationship exploration and potential early commitment",
      travel_foreign: "Study abroad or early career travel opportunities",
    },
  },
  {
    name: "Career Building",
    minAge: 25,
    maxAge: 35,
    appropriateCategories: ["career", "marriage", "children", "wealth", "home_property", "travel_foreign", "health", "transformation", "social_gains", "education"],
    inappropriateCategories: [],
    eventDescriptionModifiers: {
      career: "Career advancement and professional establishment",
      marriage: "Strong period for committed relationships and marriage",
      children: "Favorable timing for starting or growing family",
      wealth: "Financial foundation building and wealth accumulation",
      home_property: "First home purchase or property investment",
    },
  },
  {
    name: "Career Peak",
    minAge: 35,
    maxAge: 50,
    appropriateCategories: ["career", "wealth", "home_property", "children", "marriage", "spirituality", "travel_foreign", "health", "transformation", "social_gains", "education", "losses_liberation"],
    inappropriateCategories: [],
    eventDescriptionModifiers: {
      career: "Peak career achievements and leadership opportunities",
      wealth: "Maximum wealth accumulation potential",
      spirituality: "Growing interest in deeper meaning and purpose",
      children: "Children's milestones and family dynamics",
    },
  },
  {
    name: "Wisdom Years",
    minAge: 50,
    maxAge: 65,
    appropriateCategories: ["spirituality", "wealth", "health", "travel_foreign", "home_property", "transformation", "social_gains", "losses_liberation", "career"],
    inappropriateCategories: ["children"], // Unlikely to have new children
    eventDescriptionModifiers: {
      career: "Career transition, mentorship, or legacy building",
      spirituality: "Deepening spiritual practice and inner wisdom",
      health: "Health maintenance and vitality focus",
      children: "Grandchildren or adult children milestones",
      wealth: "Wealth preservation and legacy planning",
    },
  },
  {
    name: "Elder Years",
    minAge: 65,
    maxAge: 150,
    appropriateCategories: ["spirituality", "health", "transformation", "losses_liberation", "travel_foreign", "social_gains", "home_property"],
    inappropriateCategories: ["career", "children", "marriage", "wealth"],
    eventDescriptionModifiers: {
      spirituality: "Spiritual fulfillment and inner peace",
      health: "Health and vitality maintenance",
      travel_foreign: "Pilgrimage or meaningful travel",
      social_gains: "Community connections and legacy",
      transformation: "Life review and acceptance",
    },
  },
];

/**
 * Get the appropriate life stage for a given age
 */
function getLifeStage(age: number): LifeStage {
  for (const stage of LIFE_STAGES) {
    if (age >= stage.minAge && age < stage.maxAge) {
      return stage;
    }
  }
  return LIFE_STAGES[LIFE_STAGES.length - 1]; // Default to elder years
}

/**
 * Categorize a life event for age-appropriate interpretation
 */
function categorizeLifeEvent(
  event: ComprehensiveLifeEventWindow
): {
  isAppropriate: boolean;
  modifiedDescription: string | null;
  skipReason: string | null;
} {
  const age = event.age_at_start;
  const category = event.category;
  const stage = getLifeStage(age);

  // Check if category is inappropriate for this life stage
  if (stage.inappropriateCategories.includes(category)) {
    return {
      isAppropriate: false,
      modifiedDescription: null,
      skipReason: `${category} events not typically relevant at age ${age} (${stage.name} stage)`,
    };
  }

  // Special handling for marriage in School Years (only after 14)
  if (category === "marriage" && stage.name === "School Years") {
    if (age < 14) {
      return {
        isAppropriate: false,
        modifiedDescription: null,
        skipReason: "Romantic events not relevant before age 14",
      };
    }
  }

  // Special handling for children - require age 21+
  if (category === "children" && age < 21) {
    return {
      isAppropriate: false,
      modifiedDescription: null,
      skipReason: "Children predictions not appropriate before age 21",
    };
  }

  // Check if we have a modifier for this category at this life stage
  const modifier = stage.eventDescriptionModifiers[category];

  return {
    isAppropriate: true,
    modifiedDescription: modifier || null,
    skipReason: null,
  };
}

/**
 * Filter events by age appropriateness with comprehensive life stage logic
 */
function filterByAgeRelevance(
  events: ComprehensiveLifeEventWindow[],
  category: string,
  isPast: boolean
): ComprehensiveLifeEventWindow[] {
  return events.filter(e => {
    const categorization = categorizeLifeEvent(e);
    return categorization.isAppropriate;
  }).map(e => {
    // Optionally modify description based on life stage
    const categorization = categorizeLifeEvent(e);
    if (categorization.modifiedDescription && e.nature === "positive") {
      // Enhance guidance with life-stage specific context
      const stage = getLifeStage(e.age_at_start);
      return {
        ...e,
        guidance: `${stage.name} context: ${categorization.modifiedDescription}. ${e.guidance}`,
      };
    }
    return e;
  });
}

// ============================================
// EVENT DETECTION FUNCTIONS
// ============================================

/**
 * Check if a category is appropriate for a given age (quick check)
 */
function isCategoryAppropriateForAge(category: string, age: number): boolean {
  const stage = getLifeStage(age);

  // Check if explicitly inappropriate
  if (stage.inappropriateCategories.includes(category)) {
    return false;
  }

  // Special handling for marriage before 14
  if (category === "marriage" && age < 14) {
    return false;
  }

  // Special handling for children before 21
  if (category === "children" && age < 21) {
    return false;
  }

  return true;
}

/**
 * Detect events for a specific category
 */
function detectCategoryEvents(
  category: LifeEventCategory,
  chartData: ChartData,
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  minScore: number = 40
): ComprehensiveLifeEventWindow[] {
  const events: ComprehensiveLifeEventWindow[] = [];

  for (const maha of dashaPeriods) {
    if (!maha.antardasha) continue;

    for (const antar of maha.antardasha) {
      const startDate = new Date(antar.start);
      const ageAtStart = Math.floor(
        (startDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      );

      // Skip if this category is not appropriate for the person's age at this time
      if (!isCategoryAppropriateForAge(category.name, ageAtStart)) {
        continue;
      }

      const activation = calculateEventActivation(
        maha.planet,
        antar.planet,
        category,
        chartData
      );

      if (activation.score >= minScore && activation.reasons.length > 0) {
        const intensity = getIntensity(activation.score);
        const specificEvent = getSpecificEvent(category, activation.nature, intensity);
        const guidance = generateGuidance(category, activation.nature, intensity, activation.reasons);

        events.push({
          category: category.name,
          displayName: category.displayName,
          specific_event: specificEvent,
          period: `${maha.planet}-${antar.planet}`,
          maha_dasha: maha.planet,
          antar_dasha: antar.planet,
          start_date: antar.start,
          end_date: antar.end,
          age_at_start: ageAtStart,
          intensity,
          probability: activation.score,
          nature: activation.nature,
          reasons: activation.reasons,
          guidance,
          rating: Math.round(activation.score / 10),
        });
      }
    }
  }

  return events;
}

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Get future dasha periods
 */
export function getFutureDashas(
  dashaPeriods: DashaPeriod[],
  yearsAhead: number = 10,
  fromDate: Date = new Date()
): DashaPeriod[] {
  const endDate = new Date(fromDate);
  endDate.setFullYear(endDate.getFullYear() + yearsAhead);

  return dashaPeriods
    .filter(maha => {
      const mahaEnd = new Date(maha.end);
      const mahaStart = new Date(maha.start);
      return mahaEnd >= fromDate && mahaStart <= endDate;
    })
    .map(maha => ({
      ...maha,
      antardasha: maha.antardasha?.filter((antar: AntarDashaPeriod) => {
        const antarEnd = new Date(antar.end);
        const antarStart = new Date(antar.start);
        return antarEnd >= fromDate && antarStart <= endDate;
      }),
    }));
}

/**
 * Detect all life events across all categories
 */
export function detectAllLifeEvents(
  chartData: ChartData,
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  minScore: number = 40
): ComprehensiveLifeEventWindow[] {
  const allEvents: ComprehensiveLifeEventWindow[] = [];

  for (const category of LIFE_EVENT_CATEGORIES) {
    const categoryEvents = detectCategoryEvents(
      category,
      chartData,
      dashaPeriods,
      birthDate,
      minScore
    );
    allEvents.push(...categoryEvents);
  }

  // Sort by start date
  return allEvents.sort((a, b) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
}

/**
 * Detect events for a specific category only
 */
export function detectEventsForCategory(
  categoryName: string,
  chartData: ChartData,
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  minScore: number = 40
): ComprehensiveLifeEventWindow[] {
  const category = LIFE_EVENT_CATEGORIES.find(c => c.name === categoryName);
  if (!category) return [];

  return detectCategoryEvents(category, chartData, dashaPeriods, birthDate, minScore);
}

/**
 * Get best windows for a specific life event
 */
export function getBestWindowsForEvent(
  categoryName: string,
  chartData: ChartData,
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  limit: number = 5
): ComprehensiveLifeEventWindow[] {
  const events = detectEventsForCategory(categoryName, chartData, dashaPeriods, birthDate);

  // Sort by probability (highest first)
  const sorted = events.sort((a, b) => b.probability - a.probability);

  return sorted.slice(0, limit);
}

/**
 * Generate comprehensive life arc prediction
 */
export function generateLifeArcPrediction(
  chartData: ChartData,
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  yearsAhead: number = 10
): {
  timeframe: { start: string; end: string };
  summary: string;
  eventsByCategory: Record<string, ComprehensiveLifeEventWindow[]>;
  timeline: ComprehensiveLifeEventWindow[];
  highlights: ComprehensiveLifeEventWindow[];
  currentPeriodInsights: string[];
} {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + yearsAhead);

  const futureDashas = getFutureDashas(dashaPeriods, yearsAhead, now);
  const allEvents = detectAllLifeEvents(chartData, futureDashas, birthDate);

  // Group by category
  const eventsByCategory: Record<string, ComprehensiveLifeEventWindow[]> = {};
  for (const category of LIFE_EVENT_CATEGORIES) {
    eventsByCategory[category.name] = allEvents
      .filter(e => e.category === category.name)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
  }

  // Get highlights (high probability, positive or transformative)
  const highlights = allEvents
    .filter(e => e.probability >= 65 && (e.nature === "positive" || e.nature === "transformative"))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 10);

  // Current period insights
  const currentEvents = allEvents.filter(e => {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    return start <= now && end >= now;
  });

  const currentPeriodInsights = currentEvents
    .map(e => `${e.displayName}: ${e.specific_event} (${e.intensity} intensity)`)
    .slice(0, 5);

  // Generate summary
  const topHighlights = highlights.slice(0, 3);
  const summary = generateSummary(futureDashas, topHighlights, yearsAhead);

  return {
    timeframe: {
      start: now.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    },
    summary,
    eventsByCategory,
    timeline: allEvents,
    highlights,
    currentPeriodInsights,
  };
}

/**
 * Generate narrative summary
 */
function generateSummary(
  dashas: DashaPeriod[],
  highlights: ComprehensiveLifeEventWindow[],
  years: number
): string {
  const mahaSequence = [...new Set(dashas.map(d => d.planet))].join(" → ");

  let highlightText = "";
  if (highlights.length > 0) {
    const topAreas = [...new Set(highlights.map(h => h.displayName))].slice(0, 3);
    highlightText = `Key opportunities emerge in: ${topAreas.join(", ")}.`;
  }

  return `Over the next ${years} years, your journey moves through ${mahaSequence} periods, each bringing distinct themes and opportunities. ${highlightText} Understanding these windows helps you align major decisions with favorable cosmic timing.`;
}

/**
 * Quick insight for a specific life question
 */
export function getQuickInsight(
  categoryName: string,
  chartData: ChartData,
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  yearsAhead: number = 5
): {
  category: string;
  currentStatus: "favorable" | "neutral" | "challenging";
  bestWindow: ComprehensiveLifeEventWindow | null;
  currentWindow: ComprehensiveLifeEventWindow | null;
  recommendation: string;
} {
  const now = new Date();
  const futureDashas = getFutureDashas(dashaPeriods, yearsAhead, now);
  const events = detectEventsForCategory(categoryName, chartData, futureDashas, birthDate, 30);

  const currentWindow = events.find(e => {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    return start <= now && end >= now;
  }) || null;

  const futureEvents = events.filter(e => new Date(e.start_date) > now);
  const bestWindow = futureEvents.sort((a, b) => b.probability - a.probability)[0] || null;

  let currentStatus: "favorable" | "neutral" | "challenging";
  if (currentWindow) {
    if (currentWindow.nature === "positive" && currentWindow.probability >= 60) {
      currentStatus = "favorable";
    } else if (currentWindow.nature === "challenging" || currentWindow.probability < 40) {
      currentStatus = "challenging";
    } else {
      currentStatus = "neutral";
    }
  } else {
    currentStatus = "neutral";
  }

  let recommendation: string;
  if (currentStatus === "favorable") {
    recommendation = `Current period supports ${categoryName.replace("_", " ")}. ${currentWindow?.guidance || "Take advantage of this window."}`;
  } else if (bestWindow) {
    const startDate = new Date(bestWindow.start_date);
    const monthsAway = Math.round((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    recommendation = `Better timing arrives in ~${monthsAway} months during ${bestWindow.period}. Current focus: preparation and building foundations.`;
  } else {
    recommendation = `Focus on gradual progress in ${categoryName.replace("_", " ")}. Build foundations for future opportunities.`;
  }

  const category_obj = LIFE_EVENT_CATEGORIES.find(c => c.name === categoryName);

  return {
    category: category_obj?.displayName || categoryName,
    currentStatus,
    bestWindow,
    currentWindow,
    recommendation,
  };
}

// ============================================
// LIFE ARC REPORT FUNCTIONS
// ============================================

/**
 * Get past dasha periods (from birth to now)
 */
export function getPastDashas(
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  toDate: Date = new Date()
): DashaPeriod[] {
  return dashaPeriods
    .filter(maha => {
      const mahaEnd = new Date(maha.end);
      const mahaStart = new Date(maha.start);
      return mahaStart >= birthDate && mahaStart < toDate;
    })
    .map(maha => ({
      ...maha,
      antardasha: maha.antardasha?.filter((antar: AntarDashaPeriod) => {
        const antarEnd = new Date(antar.end);
        const antarStart = new Date(antar.start);
        return antarEnd <= toDate && antarStart >= birthDate;
      }),
    }));
}

/**
 * Get current dasha period
 */
function getCurrentDasha(
  dashaPeriods: DashaPeriod[],
  atDate: Date = new Date()
): { maha: DashaPeriod | null; antar: AntarDashaPeriod | null } {
  for (const maha of dashaPeriods) {
    const mahaStart = new Date(maha.start);
    const mahaEnd = new Date(maha.end);

    if (atDate >= mahaStart && atDate <= mahaEnd) {
      if (maha.antardasha) {
        for (const antar of maha.antardasha) {
          const antarStart = new Date(antar.start);
          const antarEnd = new Date(antar.end);
          if (atDate >= antarStart && atDate <= antarEnd) {
            return { maha, antar };
          }
        }
      }
      return { maha, antar: null };
    }
  }
  return { maha: null, antar: null };
}

/**
 * Generate past event description (for trust building)
 */
function getPastEventDescription(
  category: LifeEventCategory,
  nature: string,
  ageAtStart: number,
  ageAtEnd: number
): string {
  const ageRange = ageAtStart === ageAtEnd
    ? `around age ${ageAtStart}`
    : `between ages ${ageAtStart}-${ageAtEnd}`;

  const pastEvents: Record<string, Record<string, string>> = {
    marriage: {
      positive: `Strong relationship energy ${ageRange} - a favorable window for commitment`,
      mixed: `Relationship developments ${ageRange} with both opportunities and lessons`,
      challenging: `Relationship tests ${ageRange} that shaped your understanding of partnership`,
      transformative: `Significant shifts in relationship approach ${ageRange}`,
    },
    children: {
      positive: `Favorable period for children ${ageRange} - natural timing for family growth`,
      mixed: `Children-related developments ${ageRange} with learning experiences`,
      challenging: `Focus on family matters ${ageRange} that required patience`,
      transformative: `Significant changes in parent-child dynamics ${ageRange}`,
    },
    career: {
      positive: `Career growth and recognition ${ageRange}`,
      mixed: `Career transitions ${ageRange} with both gains and adjustments`,
      challenging: `Professional challenges ${ageRange} that built resilience`,
      transformative: `Major career shift or pivot ${ageRange}`,
    },
    education: {
      positive: `Strong learning and academic period ${ageRange}`,
      mixed: `Educational journey ${ageRange} with varied experiences`,
      challenging: `Academic challenges ${ageRange} that required perseverance`,
      transformative: `Significant shift in educational path ${ageRange}`,
    },
    wealth: {
      positive: `Financial growth opportunities ${ageRange}`,
      mixed: `Income fluctuations ${ageRange} with lessons learned`,
      challenging: `Financial caution period ${ageRange}`,
      transformative: `Major financial restructuring ${ageRange}`,
    },
    health: {
      positive: `Strong vitality ${ageRange}`,
      mixed: `Health awareness period ${ageRange}`,
      challenging: `Health focus required ${ageRange}`,
      transformative: `Health transformation ${ageRange}`,
    },
    transformation: {
      positive: `Empowering personal changes ${ageRange}`,
      mixed: `Life transitions ${ageRange}`,
      challenging: `Challenging but growth-inducing period ${ageRange}`,
      transformative: `Major life metamorphosis ${ageRange}`,
    },
    home_property: {
      positive: `Favorable for property/home matters ${ageRange}`,
      mixed: `Home-related changes ${ageRange}`,
      challenging: `Domestic challenges ${ageRange}`,
      transformative: `Major relocation or home change ${ageRange}`,
    },
    travel_foreign: {
      positive: `Favorable travel/foreign connections ${ageRange}`,
      mixed: `Travel experiences ${ageRange}`,
      challenging: `Travel complications ${ageRange}`,
      transformative: `Life-changing journey ${ageRange}`,
    },
    spirituality: {
      positive: `Spiritual insights ${ageRange}`,
      mixed: `Spiritual exploration ${ageRange}`,
      challenging: `Inner challenges ${ageRange}`,
      transformative: `Spiritual awakening ${ageRange}`,
    },
  };

  return pastEvents[category.name]?.[nature] || `Significant activity in ${category.displayName} ${ageRange}`;
}

/**
 * Get the theme for a dasha lord
 */
function getDashaTheme(planet: string): string {
  const themes: Record<string, string> = {
    "Sun": "Authority, leadership, recognition, and father-related matters",
    "Moon": "Emotions, nurturing, mother, and public connections",
    "Mars": "Energy, courage, property, and sibling matters",
    "Mercury": "Communication, intellect, business, and learning",
    "Jupiter": "Wisdom, expansion, children, and spiritual growth",
    "Venus": "Relationships, luxury, creativity, and pleasures",
    "Saturn": "Discipline, career, responsibilities, and long-term goals",
    "Rahu": "Ambition, foreign connections, unconventional paths, and desires",
    "Ketu": "Spirituality, detachment, past karma, and liberation",
  };
  return themes[planet] || "Varied life themes";
}

/**
 * Generate the complete Life Arc Report
 */
export function generateLifeArcReport(
  chartData: ChartData,
  dashaPeriods: DashaPeriod[],
  birthDate: Date,
  yearsAhead: number = 10
): LifeArcReport {
  const now = new Date();
  const userAge = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  // Get past and future dashas
  const pastDashas = getPastDashas(dashaPeriods, birthDate, now);
  const futureDashas = getFutureDashas(dashaPeriods, yearsAhead, now);

  // Get current dasha
  const { maha: currentMaha, antar: currentAntar } = getCurrentDasha(dashaPeriods, now);

  // Detect past events
  const pastEvents = detectAllLifeEvents(chartData, pastDashas, birthDate, 50);

  // Detect future events
  const futureEvents = detectAllLifeEvents(chartData, futureDashas, birthDate, 45);

  // Helper to get top windows for a category
  const getTopWindows = (
    events: ComprehensiveLifeEventWindow[],
    category: string,
    limit: number = 3,
    isPast: boolean = false
  ): ComprehensiveLifeEventWindow[] => {
    let filtered = events.filter(e => e.category === category);
    filtered = filterByAgeRelevance(filtered, category, isPast);

    // Update descriptions for past events
    if (isPast) {
      filtered = filtered.map(e => {
        const cat = LIFE_EVENT_CATEGORIES.find(c => c.name === category);
        if (cat) {
          const endDate = new Date(e.end_date);
          const ageAtEnd = Math.floor((endDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
          return {
            ...e,
            age_at_end: ageAtEnd,
            specific_event: getPastEventDescription(cat, e.nature, e.age_at_start, ageAtEnd),
          };
        }
        return e;
      });
    }

    return filtered
      .sort((a, b) => b.probability - a.probability)
      .slice(0, limit);
  };

  // Build the report
  const report: LifeArcReport = {
    user_age: userAge,
    birth_date: birthDate.toISOString().split("T")[0],

    past: {
      education_career: [
        ...getTopWindows(pastEvents, "education", 2, true),
        ...getTopWindows(pastEvents, "career", 2, true),
      ].sort((a, b) => a.age_at_start - b.age_at_start).slice(0, 4),

      relationship_windows: getTopWindows(pastEvents, "marriage", 3, true),

      children_windows: getTopWindows(pastEvents, "children", 3, true),

      major_transformations: [
        ...getTopWindows(pastEvents, "transformation", 2, true),
        ...getTopWindows(pastEvents, "career", 1, true).filter(e => e.nature === "transformative"),
      ].sort((a, b) => a.age_at_start - b.age_at_start).slice(0, 3),
    },

    future: {
      marriage_windows: getTopWindows(futureEvents, "marriage", 3),
      children_windows: getTopWindows(futureEvents, "children", 3),
      wealth_windows: getTopWindows(futureEvents, "wealth", 3),
      career_breakthrough_windows: getTopWindows(futureEvents, "career", 3),
      travel_relocation_windows: [
        ...getTopWindows(futureEvents, "travel_foreign", 2),
        ...getTopWindows(futureEvents, "home_property", 2).filter(e => e.nature === "transformative"),
      ].slice(0, 3),
      home_property_windows: getTopWindows(futureEvents, "home_property", 3),
      spirituality_windows: getTopWindows(futureEvents, "spirituality", 3),
      health_focus_windows: getTopWindows(futureEvents, "health", 3)
        .filter(e => e.nature === "challenging" || e.nature === "mixed"),
    },

    current_period: {
      maha_dasha: currentMaha?.planet || "Unknown",
      antar_dasha: currentAntar?.planet || "Unknown",
      period_theme: currentMaha ? getDashaTheme(currentMaha.planet) : "",
      active_areas: futureEvents
        .filter(e => {
          const start = new Date(e.start_date);
          const end = new Date(e.end_date);
          return start <= now && end >= now && e.probability >= 55;
        })
        .map(e => e.displayName)
        .filter((v, i, a) => a.indexOf(v) === i) // unique
        .slice(0, 4),
    },

    summary: generateLifeArcSummary(userAge, currentMaha?.planet || "", pastEvents, futureEvents, yearsAhead),
  };

  return report;
}

/**
 * Generate a narrative summary for the life arc report
 */
function generateLifeArcSummary(
  userAge: number,
  currentMaha: string,
  pastEvents: ComprehensiveLifeEventWindow[],
  futureEvents: ComprehensiveLifeEventWindow[],
  yearsAhead: number
): string {
  // Find most significant past area
  const pastHighlights = pastEvents
    .filter(e => e.probability >= 65)
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topPastArea = Object.entries(pastHighlights)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  // Find most promising future areas
  const futureHighlights = futureEvents
    .filter(e => e.probability >= 65 && e.nature === "positive")
    .map(e => e.displayName)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3);

  let summary = `At ${userAge}, you're currently in your ${currentMaha} Maha Dasha period. `;

  if (topPastArea) {
    const category = LIFE_EVENT_CATEGORIES.find(c => c.name === topPastArea);
    summary += `Your journey so far shows significant themes around ${category?.displayName.toLowerCase() || topPastArea}. `;
  }

  if (futureHighlights.length > 0) {
    summary += `Looking ahead over the next ${yearsAhead} years, promising opportunities emerge in ${futureHighlights.join(", ")}. `;
  }

  summary += "This personalized timeline helps you align major life decisions with favorable cosmic windows.";

  return summary;
}

// Export categories for reference
export { LIFE_EVENT_CATEGORIES };
