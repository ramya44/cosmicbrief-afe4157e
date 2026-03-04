import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import {
  formatPlanetaryPositionsForPrompt,
  getSignLord,
} from "../_shared/lib/planetary-positions.ts";
import {
  getCurrentDasha,
  formatCurrentDashaForPrompt,
  type DashaJson,
} from "../_shared/lib/dasha-helpers.ts";
import {
  calculateMangalDosha,
  calculateKaalSarp,
  type MangalDoshaResult,
  type PlanetsForKaalSarp,
} from "../_shared/lib/life-arc-calculations.ts";

const logStep = createLogger("CHAT-WITH-MAYA");

// Input validation schema
const ChatRequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  session_id: z.string().uuid("Invalid session ID format").optional(),
});

const RATE_LIMIT_PER_HOUR = 30;

const MAYA_SYSTEM_PROMPT = `You are Maya, a confident Vedic astrologer. You have access to the user's complete birth chart and planetary periods (dashas).

**Your Style:**
- Skip the preamble. No "Hi! I'm glad you're asking about..." — jump straight into the reading
- Trust your users. They're here for astrology — don't explain basics like "Jupiter is the planet of expansion." State what Jupiter is doing in THEIR chart
- Be direct and specific. Give timeframes, name the planets and houses involved, explain why this period matters for them
- Keep it tight. 2-3 focused paragraphs max

**Language:**
- Use "rising sign" not "ascendant", "life chapter" not "dasha" — unless they use technical terms first
- Avoid generic inspirational lines ("the cosmos opens doors"). Make insights specific to their chart
- No therapist energy. You're a skilled reader, not a life coach

**Structure for timing questions:**
1. State what's active in their chart right now (dasha/sub-period, relevant houses)
2. Give the practical timeframe and why it matters
3. Give them something actionable or conclusive — don't always ask a follow-up

**Closing conversations:**
- Not every response needs a question. When you've given a complete answer, end it.
- After 2-3 exchanges on a topic, wrap it up with a clear takeaway rather than another prompt
- Good closers: a specific timeframe, a concrete action, or a clear "this is what your chart shows"
- Bad closers: "Let me know if you have more questions!" or endless follow-up prompts
- Trust that they'll ask if they want more

**Important:**
- Reference their specific planetary placements — that's what makes this personal
- If you can't determine something from their chart, say so directly
- Never make up chart details
- If user memory/context is provided, reference it naturally (e.g., "You mentioned you're targeting a promotion...")

**CRITICAL - Birth Date Rule:**
- The user's birth year is provided in their chart data. NEVER mention any dasha/life chapter periods with dates before their birth year.
- If a dasha technically started before birth (e.g., Venus 1984-2004 for someone born 1989), only reference the portion AFTER birth: "Venus period from birth through 2004"
- When discussing past periods, always check: is this date after their birth year? If not, don't mention it.

**Off-limits topics:**
- NEVER predict death, serious illness, or catastrophic events
- NEVER make definitive negative predictions ("you will fail", "this will end badly")
- If asked about death/mortality, redirect: "Vedic astrology focuses on life guidance, not predicting endpoints. Let's talk about what's ahead for you."
- Frame challenges as "periods requiring extra care" not certainties of bad outcomes`;

// Prompt for extracting user insights
const INSIGHT_EXTRACTION_PROMPT = `Extract key insights about this user from the conversation. Return a JSON object with these fields (only include fields where you learned something new):

{
  "career": "their job, goals, industry (e.g., 'software engineer targeting senior role')",
  "relationship": "status, concerns (e.g., 'married 5 years, considering children')",
  "family": "relevant family context (e.g., 'caring for elderly parent')",
  "concerns": ["array of current worries or focus areas"],
  "life_context": "major life situation (e.g., 'just relocated to new city')",
  "goals": ["array of stated goals or aspirations"]
}

IMPORTANT - Never extract or store:
- Mentions of suicide, self-harm, or death
- Mental health crises or severe distress
- Any content that would be inappropriate to reference in future conversations

Only extract facts the user explicitly stated. Don't infer or assume. If nothing new was learned, return {}.
Return ONLY valid JSON, no other text.`;

interface MayaMemory {
  career?: string;
  relationship?: string;
  family?: string;
  concerns?: string[];
  life_context?: string;
  goals?: string[];
  updated_at?: string;
}

function formatMemoryContext(memory: MayaMemory | null): string {
  if (!memory || Object.keys(memory).length === 0) {
    return "";
  }

  const parts: string[] = [];

  if (memory.career) parts.push(`Career: ${memory.career}`);
  if (memory.relationship) parts.push(`Relationship: ${memory.relationship}`);
  if (memory.family) parts.push(`Family: ${memory.family}`);
  if (memory.life_context) parts.push(`Life context: ${memory.life_context}`);
  if (memory.concerns?.length) parts.push(`Current concerns: ${memory.concerns.join(", ")}`);
  if (memory.goals?.length) parts.push(`Goals: ${memory.goals.join(", ")}`);

  if (parts.length === 0) return "";

  return `\n**What you know about them from previous conversations:**\n${parts.join("\n")}`;
}

function buildChartContext(kundliData: any, memory: MayaMemory | null = null): string {
  const planetaryPositions = kundliData.planetary_positions || [];
  const dashaPeriods: DashaJson[] = kundliData.dasha_periods || [];

  // Format planetary positions
  const ascendant = planetaryPositions.find((p: any) => p.name === "Ascendant");
  const ascendantSign = ascendant?.sign || kundliData.ascendant_sign || "Unknown";
  const ascendantSignId = ascendant?.sign_id || 1;

  const planetaryPositionsText = formatPlanetaryPositionsForPrompt(
    planetaryPositions,
    ascendantSign,
    ascendantSignId,
    {
      includeRulership: true,
      includeDegree: true,
      includeRetrograde: true,
      useWesternSigns: false,
    },
  );

  // Get current dasha
  const currentDasha = getCurrentDasha(dashaPeriods);
  const currentDashaText = currentDasha
    ? formatCurrentDashaForPrompt(currentDasha)
    : "Current planetary period: Unknown";

  // Get Moon info
  const moon = planetaryPositions.find((p: any) => p.name === "Moon");
  const moonInfo = moon
    ? `Moon in ${moon.sign}${moon.nakshatra ? `, ${moon.nakshatra} nakshatra` : ""}`
    : "Moon position: Unknown";

  // Get ascendant lord info
  const ascendantLord = getSignLord(ascendantSign);
  const lordPosition = planetaryPositions.find((p: any) => p.name === ascendantLord);
  const lordInfo = lordPosition
    ? `Chart Ruler: ${ascendantLord} in ${lordPosition.sign}`
    : "";

  // Calculate doshas
  const mars = planetaryPositions.find((p: any) => p.name === "Mars");
  const venus = planetaryPositions.find((p: any) => p.name === "Venus");
  const rahu = planetaryPositions.find((p: any) => p.name === "Rahu");
  const ketu = planetaryPositions.find((p: any) => p.name === "Ketu");

  let doshaText = "";
  if (mars && moon && venus) {
    const mangalDosha = calculateMangalDosha(
      mars.sign,
      ascendantSign,
      moon.sign,
      venus.sign
    );

    if (mangalDosha.present) {
      const sources: string[] = [];
      if (mangalDosha.fromLagna.present) sources.push(`from Lagna (${mangalDosha.fromLagna.house}th house)`);
      if (mangalDosha.fromMoon.present) sources.push(`from Moon (${mangalDosha.fromMoon.house}th house)`);
      if (mangalDosha.fromVenus.present) sources.push(`from Venus (${mangalDosha.fromVenus.house}th house)`);
      doshaText = `\n**Mangal Dosha:** Present ${sources.join(", ")} - Mars energy affects partnerships, requiring awareness in relationships`;
    } else {
      doshaText = `\n**Mangal Dosha:** Not present`;
    }
  }

  // Check Kaal Sarp if all planets are available
  const sun = planetaryPositions.find((p: any) => p.name === "Sun");
  const mercury = planetaryPositions.find((p: any) => p.name === "Mercury");
  const jupiter = planetaryPositions.find((p: any) => p.name === "Jupiter");
  const saturn = planetaryPositions.find((p: any) => p.name === "Saturn");

  if (sun && moon && mars && mercury && jupiter && venus && saturn && rahu && ketu) {
    const planetsForKaalSarp: PlanetsForKaalSarp = {
      sun: { sign: sun.sign },
      moon: { sign: moon.sign },
      mars: { sign: mars.sign },
      mercury: { sign: mercury.sign },
      jupiter: { sign: jupiter.sign },
      venus: { sign: venus.sign },
      saturn: { sign: saturn.sign },
      rahu: { sign: rahu.sign },
      ketu: { sign: ketu.sign },
      lagna: { sign: ascendantSign },
    };
    const kaalSarp = calculateKaalSarp(planetsForKaalSarp);
    if (kaalSarp.present) {
      doshaText += `\n**Kaal Sarp Dosha:** Present (${kaalSarp.type}) - All planets hemmed between Rahu-Ketu axis, indicating karmic intensity`;
    }
  }

  // Format current date for context
  const today = new Date();
  const currentDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const memoryContext = formatMemoryContext(memory);

  // Extract birth year for prominence
  const birthYear = kundliData.birth_date?.split('-')[0] || kundliData.birth_date?.split('/').pop() || "Unknown";

  return `**Today's Date:** ${currentDate}

**${kundliData.name || "User"}'s Birth Chart:**
**BIRTH YEAR: ${birthYear}** (Never reference any dates before this year)
Birth: ${kundliData.birth_date} at ${kundliData.birth_time}
Location: ${kundliData.birth_place}

**Rising Sign:** ${ascendantSign}
${lordInfo}

**${moonInfo}**

**Planetary Placements:**
${planetaryPositionsText}

**${currentDashaText}**
${doshaText}${memoryContext}`;
}

async function extractAndSaveInsights(
  apiKey: string,
  userMessage: string,
  assistantResponse: string,
  existingMemory: MayaMemory | null,
  supabase: any,
  kundliId: string
): Promise<string> {
  const logStep = createLogger("MAYA-MEMORY");

  logStep("Starting insight extraction", { kundliId, messageLength: userMessage.length });

  try {
    // Call Claude to extract insights
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse}"\n\n${INSIGHT_EXTRACTION_PROMPT}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Extraction API failed", { status: response.status, error: errorText });
      return `API failed: ${response.status} - ${errorText}`;
    }

    const data = await response.json();
    let extractedText = data.content?.[0]?.text || "{}";

    // Strip markdown code blocks if present
    extractedText = extractedText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    logStep("Extraction response", { text: extractedText.substring(0, 200) });

    // Parse the extracted insights
    let newInsights: MayaMemory;
    try {
      newInsights = JSON.parse(extractedText);
    } catch (parseErr) {
      logStep("Failed to parse insights", { text: extractedText });
      return `Parse failed: ${extractedText}`;
    }

    // Skip if no new insights
    if (Object.keys(newInsights).length === 0) {
      logStep("No new insights extracted");
      return "No new insights";
    }

    // Merge with existing memory
    const updatedMemory: MayaMemory = {
      ...existingMemory,
      ...newInsights,
      updated_at: new Date().toISOString(),
    };

    // Merge arrays instead of replacing
    if (existingMemory?.concerns && newInsights.concerns) {
      updatedMemory.concerns = [...new Set([...existingMemory.concerns, ...newInsights.concerns])];
    }
    if (existingMemory?.goals && newInsights.goals) {
      updatedMemory.goals = [...new Set([...existingMemory.goals, ...newInsights.goals])];
    }

    // Save to database
    const { error } = await supabase
      .from("chatbot_subscriptions")
      .update({ maya_memory: updatedMemory })
      .eq("kundli_id", kundliId);

    if (error) {
      logStep("Failed to save memory", { error: error.message });
      return `DB error: ${error.message}`;
    } else {
      logStep("Memory updated", { insights: Object.keys(newInsights) });
      return `Saved: ${JSON.stringify(newInsights)}`;
    }
  } catch (err) {
    logStep("Extraction error", { error: err instanceof Error ? err.message : "Unknown" });
    return `Exception: ${err instanceof Error ? err.message : "Unknown"}`;
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const validationResult = ChatRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id, message, session_id } = validationResult.data;
    logStep("Request validated", { kundli_id, has_session: !!session_id });

    // Check subscription status and get memory
    const { data: subscription, error: subError } = await supabase
      .from("chatbot_subscriptions")
      .select("id, status, maya_memory")
      .eq("kundli_id", kundli_id)
      .single();

    if (subError && subError.code !== "PGRST116") {
      logStep("Subscription check failed", { error: subError.message });
      throw new Error("Failed to verify subscription");
    }

    if (!subscription || subscription.status !== 'active') {
      logStep("No active subscription", { status: subscription?.status });
      return errorResponse("Active subscription required to chat with Maya", 403);
    }

    // Check rate limit (30 messages per hour)
    const hourBucket = new Date();
    hourBucket.setMinutes(0, 0, 0);

    const { data: rateLimit, error: rlError } = await supabase
      .from("chat_rate_limits")
      .select("message_count")
      .eq("kundli_id", kundli_id)
      .eq("hour_bucket", hourBucket.toISOString())
      .single();

    if (rlError && rlError.code !== "PGRST116") {
      logStep("Rate limit check failed", { error: rlError.message });
    }

    const currentCount = rateLimit?.message_count || 0;
    if (currentCount >= RATE_LIMIT_PER_HOUR) {
      logStep("Rate limit exceeded", { count: currentCount });
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "You've reached the limit of 30 messages per hour. Please try again later.",
          retry_after: 3600,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

    // Fetch kundli data
    const { data: kundliData, error: kundliError } = await supabase
      .from("user_kundli_details")
      .select("*")
      .eq("id", kundli_id)
      .single();

    if (kundliError || !kundliData) {
      logStep("Kundli not found", { error: kundliError?.message });
      return errorResponse("Birth chart not found", 404);
    }

    // Get or create session
    let currentSessionId = session_id;
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          kundli_id,
        })
        .select("id")
        .single();

      if (sessionError || !newSession) {
        logStep("Failed to create session", { error: sessionError?.message });
        throw new Error("Failed to create chat session");
      }

      currentSessionId = newSession.id;
      logStep("New session created", { session_id: currentSessionId });
    }

    // Fetch last 20 messages for context
    const { data: historyMessages, error: historyError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", currentSessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (historyError) {
      logStep("Failed to fetch history", { error: historyError.message });
    }

    // Build chart context with memory
    const mayaMemory = (subscription?.maya_memory as MayaMemory) || null;
    const chartContext = buildChartContext(kundliData, mayaMemory);

    // Build messages array for Claude
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Add chart context as first user message if this is a new conversation
    if (!historyMessages || historyMessages.length === 0) {
      claudeMessages.push({
        role: "user",
        content: `[Birth Chart Context - not a message from the user, but their chart data for you to reference]\n\n${chartContext}`,
      });
      claudeMessages.push({
        role: "assistant",
        content: "I have your complete birth chart. I'm ready to answer any questions you have about your cosmic path, timing, relationships, career, or anything else you'd like to explore. What's on your mind?",
      });
    } else {
      // Add chart context first, then history
      claudeMessages.push({
        role: "user",
        content: `[Birth Chart Context]\n\n${chartContext}`,
      });
      claudeMessages.push({
        role: "assistant",
        content: "I have your chart ready. How can I help you today?",
      });

      // Add conversation history
      for (const msg of historyMessages) {
        claudeMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add the new user message
    claudeMessages.push({
      role: "user",
      content: message,
    });

    logStep("Calling Claude", { message_count: claudeMessages.length });

    // Call Claude API with retry for overload errors
    let claudeResponse: Response | null = null;
    let lastError = "";
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: claudeMessages,
          system: MAYA_SYSTEM_PROMPT,
        }),
      });

      if (claudeResponse.ok) {
        break;
      }

      // Handle retryable errors (429 rate limit, 529 overloaded)
      if (claudeResponse.status === 429 || claudeResponse.status === 529) {
        lastError = `API ${claudeResponse.status === 429 ? 'rate limited' : 'overloaded'}`;
        logStep(`Claude API ${lastError}, attempt ${attempt}/${maxRetries}`);

        if (attempt < maxRetries) {
          // Wait before retry: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
          continue;
        }
      }

      // Non-retryable error or max retries reached
      const errorText = await claudeResponse.text();
      logStep("Claude API error", { status: claudeResponse.status, error: errorText, attempt });

      if (claudeResponse.status === 429 || claudeResponse.status === 529) {
        return new Response(
          JSON.stringify({
            error: "Service temporarily busy",
            message: "Maya is helping many people right now. Please try again in a moment.",
            retry_after: 30,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 503,
          }
        );
      }

      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    if (!claudeResponse || !claudeResponse.ok) {
      throw new Error(`Claude API failed after ${maxRetries} attempts: ${lastError}`);
    }

    const claudeData = await claudeResponse.json();
    let assistantResponse = claudeData.content?.[0]?.text || "";
    const tokensUsed = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0);

    // Check if we've reached the conversation limit (20 messages = 10 exchanges)
    const messageCount = (historyMessages?.length || 0) + 2; // +2 for current exchange
    if (messageCount >= 20) {
      assistantResponse += "\n\n---\n\n*This conversation has reached its limit. Please start a new chat to continue exploring your chart with fresh context.*";
    }

    logStep("Response generated", { tokens: tokensUsed, messageCount });

    // Save both messages to database
    const { error: saveError } = await supabase
      .from("chat_messages")
      .insert([
        {
          session_id: currentSessionId,
          kundli_id,
          role: "user",
          content: message,
        },
        {
          session_id: currentSessionId,
          kundli_id,
          role: "assistant",
          content: assistantResponse,
          tokens_used: tokensUsed,
        },
      ]);

    if (saveError) {
      logStep("Failed to save messages", { error: saveError.message });
    }

    // Update session
    await supabase
      .from("chat_sessions")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (historyMessages?.length || 0) + 2,
      })
      .eq("id", currentSessionId);

    // Update rate limit
    const { error: rlUpdateError } = await supabase
      .from("chat_rate_limits")
      .upsert(
        {
          kundli_id,
          hour_bucket: hourBucket.toISOString(),
          message_count: currentCount + 1,
        },
        {
          onConflict: "kundli_id,hour_bucket",
        }
      );

    if (rlUpdateError) {
      logStep("Failed to update rate limit", { error: rlUpdateError.message });
    }

    // Extract insights from conversation (runs before response to ensure completion)
    try {
      await extractAndSaveInsights(
        anthropicApiKey,
        message,
        assistantResponse,
        mayaMemory,
        supabase,
        kundli_id
      );
    } catch (err) {
      logStep("Insight extraction failed", { error: err instanceof Error ? err.message : "Unknown" });
    }

    return jsonResponse({
      response: assistantResponse,
      session_id: currentSessionId,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
