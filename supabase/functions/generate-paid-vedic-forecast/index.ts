import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { buildVedicPaidEmailHtml } from "../_shared/lib/email-templates.ts";
import { generateForecastPdf } from "../_shared/lib/pdf-generator.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: Record<string, unknown>) {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[generate-paid-vedic-forecast] ${step}${detailsStr}`);
}

const SYSTEM_PROMPT = `You are an expert Vedic astrologer who writes comprehensive, detailed forecasts in accessible, engaging language. Your writing style is:

- Conversational and warm, never academic or preachy
- Focused on practical implications before technical details
- Empowering and growth-oriented, never fatalistic
- Clear and concise—every sentence adds value
- Extremely thorough in the paid forecast - this is a premium product

When writing forecasts:
1. Lead with WHAT the person will experience (the practical reality)
2. Follow with WHY (the astrological explanation) in separate "astrology" or "astrology_note" sections
3. Use plain language for the main content
4. Save technical terms for the astrology sections
5. Make predictions specific and actionable with exact dates
6. Describe personality traits directly without using phrases like "the Pisces in you"

Return ONLY valid JSON. No markdown code blocks, no additional text before or after the JSON.`;

interface PlanetaryPosition {
  name: string;
  sign: string;
  sign_id: number;
  degree: number;
  full_degree: number;
  is_retrograde: boolean;
}

interface PratyantardashaInfo {
  mahadasha: string;
  antardasha: string;
  pratyantardasha: string;
  start: string;
  end: string;
  dateRange: string;
}

function calculateHouseFromAscendant(planetSignId: number, ascendantSignId: number): number {
  let house = planetSignId - ascendantSignId + 1;
  if (house <= 0) house += 12;
  return house;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getSignLord(sign: string): string {
  const signLords: Record<string, string> = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Mars", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter",
  };
  return signLords[sign] || "Unknown";
}

function formatDateRangeDetailed(start: Date, end: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

function getPratyantardashasForYear(dashas: any[], year: number): PratyantardashaInfo[] {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const pratyantardashas: PratyantardashaInfo[] = [];
  
  for (const mahadasha of dashas) {
    if (!mahadasha.antardasha) continue;
    for (const antardasha of mahadasha.antardasha) {
      if (!antardasha.pratyantardasha) continue;
      for (const pratyantar of antardasha.pratyantardasha) {
        const start = new Date(pratyantar.start);
        const end = new Date(pratyantar.end);
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
  pratyantardashas.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return pratyantardashas;
}

function getCurrentDashaFromList(dashas: any[], currentDate: Date = new Date()) {
  const currentMahadasha = dashas.find(d => {
    const start = new Date(d.start);
    const end = new Date(d.end);
    return currentDate >= start && currentDate <= end;
  });
  if (!currentMahadasha) return null;
  
  const currentAntardasha = currentMahadasha.antardasha?.find((ad: any) => {
    const start = new Date(ad.start);
    const end = new Date(ad.end);
    return currentDate >= start && currentDate <= end;
  });
  
  let currentPratyantardasha = null;
  if (currentAntardasha?.pratyantardasha) {
    currentPratyantardasha = currentAntardasha.pratyantardasha.find((pd: any) => {
      const start = new Date(pd.start);
      const end = new Date(pd.end);
      return currentDate >= start && currentDate <= end;
    });
  }
  
  return {
    mahadasha: currentMahadasha,
    antardasha: currentAntardasha,
    pratyantardasha: currentPratyantardasha
  };
}

function buildPaidUserPrompt(inputs: {
  name?: string;
  year: number;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  planetary_positions: string;
  current_dasha: string;
  pratyantardashas: string;
  transits: string;
}): string {
  const personReference = inputs.name ? `for ${inputs.name}` : "for this person";
  return `Create a comprehensive paid astrology forecast ${personReference} for ${inputs.year}. Return ONLY valid JSON (no markdown code blocks, no additional text).

CRITICAL INSTRUCTION - LIFE AREA BALANCE:
This forecast should focus on the life areas that are ACTUALLY activated by this person's chart, not force coverage of everything.

Analyze which houses are emphasized by:
- Current dasha lords and their house RULERSHIPS (shown in planetary positions)
- Planets involved in current periods and which houses they RULE
- House placements of active planets
- Major transits affecting specific houses

Then focus your narrative on the 2-4 most relevant life areas for each period from:
- Personal relationships (7th house, Venus)
- Career and professional development (10th house, Sun, Saturn)
- Financial matters and resources (2nd, 11th houses)
- Health and physical well-being (1st, 6th houses)
- Spiritual growth and inner development (9th, 12th houses, Jupiter, Ketu)
- Creative expression and hobbies (5th house)
- Home and living situation (4th house, Moon)
- Personal transformation and psychology (8th house, Rahu)

IMPORTANT: Different months will emphasize different areas. Don't force all 8 areas into every month.
DO NOT default to career unless there's clear 10th house or Sun/Saturn rulership emphasis.
Quality > Quantity: Better to give deep, actionable guidance on 2-3 relevant areas than surface coverage of everything.

CRITICAL - AVOID ASSUMPTIONS ABOUT PROFESSION/LIFESTYLE:
- DO NOT assume the person is a healer, teacher, spiritual practitioner, or wants to be
- DO NOT assume they work in healthcare, wellness, or spiritual counseling
- Offer BOTH spiritual AND secular interpretations of house activations
- Use conditional language: "This could manifest as..." not "You will become..."
- Examples:
  * 6th house: "improving daily routines, health focus, service at work, OR healing/wellness practices"
  * 9th house: "higher education, travel, philosophy, OR spiritual studies"
  * 12th house: "rest/retreat, foreign connections, behind-the-scenes work, OR meditation/spirituality"

BALANCE POSITIVE AND CHALLENGING PERIODS:
- Not every month is amazing - life has natural ups and downs
- Include 1-2 periods that are more challenging or require caution/patience
- Note difficult transits, retrogrades, or malefic dasha combinations
- Be honest: "This month requires patience" or "Expect some friction in..."
- Challenging periods make the positive ones more credible

ASSESS YEAR CHARACTER HONESTLY:
Look at the dasha structure for ${inputs.year}:
- Same Mahadasha + Same Antardasha all year = "Continuation/Consolidation Year" (building on established themes)
- Antardasha changes but Mahadasha stays = "Subtle Shift Year" (evolution within familiar territory)
- Mahadasha changes during year = "Major Transformation Year" (significant life chapter change)
- Multiple Antardasha changes = "Dynamic/Transitional Year" (varied experiences)

DO NOT call every year "transformative" or "pivotal" - be truthful about the year's actual energy.

DIVERSIFY MONTHLY THEMES:
Each monthly period should emphasize DIFFERENT aspects, even if same houses are active.

Example: If 6th house is active in 3 consecutive months:
- Month 1: Focus on health/wellness routines and body awareness
- Month 2: Focus on service/helping others at work or in community
- Month 3: Focus on problem-solving skills and overcoming obstacles

Avoid repetition like "healing abilities" or "spiritual growth" in every single month.

The JSON should include:

**1. OVERVIEW: ${inputs.year} Theme**
- 2-3 paragraphs honestly characterizing the year's energy (use assessment above)
- Focus on the most emphasized life domains based on dasha/transit analysis
- CRITICAL: Write in PLAIN LANGUAGE without astrological jargon
  * Bad: "Your 6th house (daily routines) and 8th house (transformation) take center stage"
  * Good: "This year emphasizes daily routines, practical problem-solving, and deep investigation"
  * Bad: "With Saturn transiting your 5th house..."
  * Good: "Expect a more structured approach to creative projects and learning"
- Save all technical astrology for the "astrology_note" section
- One "astrology_note" explaining the dasha context and major patterns (HERE you can use house numbers, transits, etc.)

**2. MONTH-BY-MONTH BREAKDOWN**
For each pratyantardasha period in ${inputs.year}, create a "period" object with:
- **date_range**: The exact dates
- **title**: A descriptive name for the period that reflects its unique energy
- **what_happening**: 2-3 paragraphs focusing on the 2-4 life areas most activated by this specific period:
  * Identify which houses are being activated by the dasha lords
  * Focus deeply on those specific life themes
  * Provide both spiritual AND practical/secular interpretations
  * Include realistic challenges or cautions where appropriate
  * CRITICAL: Write in PLAIN LANGUAGE - NO house numbers, NO transit jargon in this section
  * Bad: "Your 7th house is activated, bringing relationship focus"
  * Good: "Relationships and partnerships become a central focus"
  * Bad: "Jupiter transits your 10th house, so career opportunities expand"
  * Good: "Career opportunities expand significantly this period"
  * Example: Venus-Mars period in 7th/2nd houses = relationships + finances (skip career/spirituality)
- **astrology**: 1 paragraph explaining which planets are active, which houses they rule, and why this creates these specific effects
  * THIS is where you use house numbers, technical terms, and astrological reasoning
  * Keep it concise but informative for those who want to understand the mechanics
- **key_actions**: 2-3 SPECIFIC, actionable recommendations that feel like natural next steps (no arbitrary numbers)
  * Good: "Identify one area of expertise to develop this quarter and commit focused time to it"
  * Good: "Set up systems that support your most productive work—whether that's time-blocking, workspace organization, or energy management"
  * Good: "Reach out to professionals in your field for informational conversations or mentorship"
  * Bad: "Research 3 courses and enroll in one by month-end" (too prescriptive with numbers)
  * Bad: "Talk to 5 people about X" (feels like homework)
  * Bad: "Be open to growth" (not actionable)
  
  Aim for: Specific enough to act on, flexible enough to personalize, natural enough to not feel like a checklist.

Group periods intelligently - combine very short periods (under 3 weeks).

**3. KEY TRANSITIONS**
- Create "transitions_table" type
- Include 8-12 most important dates (pratyantardasha changes + major transits)
- Each entry: date (short format) + significance (1-2 sentences)
- Include both positive transitions AND challenging ones (retrogrades, difficult aspects)
- Mark the most critical 2-3 transitions with bold emphasis

**4. PIVOTAL THEMES**
- 4-5 "theme" objects covering the MOST EMPHASIZED life dimensions from the chart
- Vary the themes - don't make them all spiritual/healing unless chart overwhelmingly indicates it
- Use conditional framing: "If you're drawn to X..." or "This could manifest as..."
- Each: bold title + 1 paragraph explanation
- Connect to specific time periods when relevant

**5. KEY DECISIONS**
- 4 "decision" objects (Q1, Q2, Q3, Q4)
- Each: quarter label, bold question, 1 paragraph guidance
- Questions should reflect the ACTUAL house activations for that quarter
- Offer 2-3 options or paths, not just one assumption
- Example: "How should I use my 6th house activation?" with options for health focus, service work, or problem-solving

**6. FINAL GUIDANCE**
- 3-4 paragraphs of closing wisdom
- Acknowledge both opportunities AND challenges of the year
- Encourage flexibility and personal interpretation of astrological influences
- End with grounded, inspiring statement that respects their autonomy

**Birth Details:**
${inputs.name ? `Name: ${inputs.name}` : ""}
Date: ${inputs.birth_date}
Time: ${inputs.birth_time}
Location: ${inputs.birth_location}

**Full Planetary Positions:**
${inputs.planetary_positions}

**Current Dasha Hierarchy:**
${inputs.current_dasha}

**${inputs.year} Pratyantardasha Schedule:**
${inputs.pratyantardashas}

**Major Transits in ${inputs.year}:**
${inputs.transits}

Return valid JSON only. Use markdown within text fields for emphasis (**bold**, *italic*).

Output format:
{
  "title": "Your Complete ${inputs.year} Forecast",
  "subtitle": "Born [date] • [location]",
  "sections": [
    {
      "heading": "${inputs.year}: Your Year of [Honest Theme Based on Dasha Analysis]",
      "content": [
        { "type": "paragraph", "text": "..." },
        { "type": "astrology_note", "label": "The Astrology Behind ${inputs.year}:", "text": "..." }
      ]
    },
    {
      "heading": "Month-by-Month: Your ${inputs.year} Roadmap",
      "content": [
        {
          "type": "period",
          "date_range": "January 12 - February 25",
          "title": "The [Unique Theme] Period",
          "what_happening": "...",
          "astrology": "...",
          "key_actions": "..."
        }
      ]
    },
    {
      "heading": "Key Transitions: The Turning Points",
      "content": [
        {
          "type": "transitions_table",
          "transitions": [
            { "date": "Feb 25", "significance": "..." }
          ]
        }
      ]
    },
    {
      "heading": "Pivotal Themes: What Matters Most",
      "content": [
        { "type": "theme", "title": "[Theme Based on Actual Chart Emphasis]", "text": "..." }
      ]
    },
    {
      "heading": "Key Decisions: Where to Focus Your Energy",
      "content": [
        { "type": "decision", "quarter": "Q1 (January-March)", "question": "[Question Based on Q1 House Activations]", "guidance": "..." }
      ]
    },
    {
      "heading": "Final Guidance: Trust the Timing",
      "content": [
        { "type": "paragraph", "text": "..." }
      ]
    }
  ]
}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase configuration missing");
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { session_id, kundli_id } = await req.json();
    logStep("Request body parsed", { session_id, kundli_id });

    if (!session_id || !kundli_id) {
      return new Response(JSON.stringify({ error: "session_id and kundli_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify Stripe payment
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { status: session.payment_status, amount: session.amount_total });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if forecast already generated for this session
    const { data: existingForecast } = await supabase
      .from("user_kundli_details")
      .select("paid_vedic_forecast, stripe_session_id")
      .eq("id", kundli_id)
      .single();

    if (existingForecast?.stripe_session_id === session_id && existingForecast?.paid_vedic_forecast) {
      logStep("Returning existing forecast");
      return new Response(JSON.stringify({ 
        forecast: existingForecast.paid_vedic_forecast,
        cached: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch kundli details
    const { data: kundliData, error: kundliError } = await supabase
      .from("user_kundli_details")
      .select("*")
      .eq("id", kundli_id)
      .single();

    if (kundliError || !kundliData) {
      throw new Error("Kundli not found");
    }

    logStep("Kundli data fetched", { birth_date: kundliData.birth_date });

    const planetaryPositions: PlanetaryPosition[] = kundliData.planetary_positions || [];
    const dashaPeriods = kundliData.dasha_periods || [];
    const targetYear = 2026;

    // Find ascendant
    const ascendantPosition = planetaryPositions.find(p => p.name === "Ascendant");
    const ascendantSignId = ascendantPosition?.sign_id || 1;

    // Format planetary positions for prompt
    const keyPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];
    const planetaryPositionsText = planetaryPositions
      .filter(p => keyPlanets.includes(p.name))
      .map(p => {
        const house = calculateHouseFromAscendant(p.sign_id, ascendantSignId);
        return `- ${p.name} in ${p.sign} (${getOrdinal(house)} house)${p.is_retrograde ? " [R]" : ""} at ${p.degree.toFixed(1)}°`;
      })
      .join("\n");

    // Get current dasha hierarchy
    const currentDasha = getCurrentDashaFromList(dashaPeriods);
    const currentDashaText = currentDasha ? `- Mahadasha: ${currentDasha.mahadasha.name} (${currentDasha.mahadasha.start.split("T")[0]} to ${currentDasha.mahadasha.end.split("T")[0]})
- Antardasha: ${currentDasha.antardasha?.name || "Unknown"} (${currentDasha.antardasha?.start.split("T")[0] || "?"} to ${currentDasha.antardasha?.end.split("T")[0] || "?"})
- Pratyantardasha: ${currentDasha.pratyantardasha?.name || "Unknown"} (${currentDasha.pratyantardasha?.start.split("T")[0] || "?"} to ${currentDasha.pratyantardasha?.end.split("T")[0] || "?"})` : "Unknown";

    // Get pratyantardashas for target year
    const pratyantardashas = getPratyantardashasForYear(dashaPeriods, targetYear);
    const pratyantardashText = pratyantardashas
      .map(p => `- ${p.mahadasha}-${p.antardasha}-${p.pratyantardasha}: ${p.dateRange}`)
      .join("\n");

    logStep("Pratyantardashas calculated", { count: pratyantardashas.length });

    // Fetch transit data
    const { data: transitsData } = await supabase
      .from("transits_lookup")
      .select("*")
      .eq("year", targetYear);

    let transitsText = "No major transit data available";
    if (transitsData && transitsData.length > 0) {
      const transitParts: string[] = [];
      for (const row of transitsData) {
        const data = typeof row.transit_data === "string" ? JSON.parse(row.transit_data) : row.transit_data;
        if (row.id === "jupiter" && data) {
          transitParts.push(`Jupiter: ${data.sign} (${data.start} to ${data.end})`);
        }
        if (row.id === "saturn" && data) {
          transitParts.push(`Saturn: ${data.sign} (${data.start} to ${data.end})`);
        }
        if (row.id === "rahu_ketu" && data) {
          transitParts.push(`Rahu/Ketu shift: ${data.shift_date} (Rahu moves to ${data.rahu_sign_after || data.rahu_sign})`);
        }
      }
      if (transitParts.length > 0) {
        transitsText = transitParts.join("\n");
      }
    }

    logStep("Building paid prompt");

    const userPrompt = buildPaidUserPrompt({
      name: kundliData.name || undefined,
      year: targetYear,
      birth_date: kundliData.birth_date,
      birth_time: kundliData.birth_time,
      birth_location: kundliData.birth_place,
      planetary_positions: planetaryPositionsText,
      current_dasha: currentDashaText,
      pratyantardashas: pratyantardashText,
      transits: transitsText,
    });

    logStep("Calling Claude Sonnet 4.5", { prompt_length: userPrompt.length });

    // Call Claude API with higher token limit for paid forecast
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 12000,
        messages: [{ role: "user", content: userPrompt }],
        system: SYSTEM_PROMPT,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      const isRateLimited = claudeResponse.status === 429;
      
      logStep("Claude API error", { 
        status: claudeResponse.status, 
        error: errorText,
        is_rate_limit: isRateLimited 
      });
      
      // Log to alerts table with rate limit context
      await supabase.from("vedic_generation_alerts").insert({
        kundli_id,
        error_message: isRateLimited 
          ? "Anthropic rate limit hit (429)" 
          : `Claude API error: ${claudeResponse.status} - ${errorText}`,
        error_type: isRateLimited ? "rate_limit" : "paid_generation",
      });
      
      if (isRateLimited) {
        return new Response(JSON.stringify({
          high_demand: true,
          retry_after: 60,
          message: "We're experiencing high demand. Your forecast will be ready shortly - please refresh in 1-2 minutes.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 so frontend handles gracefully
        });
      }
      
      // Return friendly error with manual_generation flag for other errors
      return new Response(JSON.stringify({
        manual_generation: true,
        message: "Your Cosmic Brief is being manually prepared and will be emailed to you shortly.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 so frontend handles gracefully
      });
    }

    const claudeData = await claudeResponse.json();
    const forecastText = claudeData.content?.[0]?.text || "";

    logStep("Forecast generated", {
      length: forecastText.length,
      model: claudeData.model,
      usage: claudeData.usage,
    });

    // Generate shareable link for paid forecast (includes paid=true)
    const shareableLink = `https://cosmicbrief.com/#/vedic/results?id=${kundli_id}&paid=true`;

    // Save the paid forecast
    const { error: updateError } = await supabase
      .from("user_kundli_details")
      .update({
        paid_vedic_forecast: forecastText,
        stripe_session_id: session_id,
        paid_amount: session.amount_total,
        paid_at: new Date().toISOString(),
        shareable_link: shareableLink,
        paid_prompt_tokens: claudeData.usage?.input_tokens || null,
        paid_completion_tokens: claudeData.usage?.output_tokens || null,
      })
      .eq("id", kundli_id);

    if (updateError) {
      logStep("Failed to save forecast", { error: updateError.message });
    } else {
      logStep("Paid forecast saved to database");
    }

    // Send email with link and PDF attachment
    const customerEmail = kundliData.email;
    if (customerEmail) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          const emailHtml = buildVedicPaidEmailHtml(kundliData.name, shareableLink);
          
          // Generate PDF
          let pdfAttachment: { filename: string; content: string } | null = null;
          try {
            const pdfBytes = await generateForecastPdf(forecastText, {
              name: kundliData.name,
              birth_date: kundliData.birth_date,
              birth_time: kundliData.birth_time,
              birth_location: kundliData.birth_location,
            });
            // Convert to base64
            const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
            pdfAttachment = {
              filename: "Your-2026-Cosmic-Brief.pdf",
              content: pdfBase64,
            };
            logStep("PDF generated successfully", { size: pdfBytes.length });
          } catch (pdfError) {
            const pdfErrMsg = pdfError instanceof Error ? pdfError.message : "Unknown PDF error";
            logStep("PDF generation failed, sending email without attachment", { error: pdfErrMsg });
          }
          
          const emailOptions: any = {
            from: "Cosmic Brief <noreply@cosmicbrief.com>",
            to: [customerEmail],
            subject: "Your Complete Vedic Cosmic Brief is Ready! ✨",
            html: emailHtml,
          };
          
          if (pdfAttachment) {
            emailOptions.attachments = [pdfAttachment];
          }
          
          const emailResponse = await resend.emails.send(emailOptions);
          logStep("Email sent successfully", { emailId: emailResponse?.data?.id, hasPdf: !!pdfAttachment });
        } else {
          logStep("RESEND_API_KEY not configured, skipping email");
        }
      } catch (emailError) {
        const emailErrMsg = emailError instanceof Error ? emailError.message : "Unknown email error";
        logStep("Failed to send email", { error: emailErrMsg });
      }
    } else {
      logStep("No email address provided, skipping email");
    }

    return new Response(JSON.stringify({
      forecast: forecastText,
      model: claudeData.model,
      usage: claudeData.usage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    
    // Try to log to alerts table
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.kundli_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseServiceKey) {
          const alertSupabase = createClient(supabaseUrl, supabaseServiceKey);
          await alertSupabase.from("vedic_generation_alerts").insert({
            kundli_id: body.kundli_id,
            error_message: errMessage,
            error_type: "paid_generation",
          });
        }
      }
    } catch (alertError) {
      logStep("Failed to log alert", { error: alertError });
    }
    
    // Return friendly error
    return new Response(JSON.stringify({
      manual_generation: true,
      message: "Your Cosmic Brief is being manually prepared and will be emailed to you shortly.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
