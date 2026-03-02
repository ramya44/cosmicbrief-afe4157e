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

const logStep = createLogger("CHAT-WITH-MAYA");

// Input validation schema
const ChatRequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  session_id: z.string().uuid("Invalid session ID format").optional(),
});

const RATE_LIMIT_PER_HOUR = 30;

const MAYA_SYSTEM_PROMPT = `You are Maya, a warm and knowledgeable Vedic astrologer. You have access to the user's complete birth chart and planetary periods (dashas).

**Your Personality:**
- Warm, personable, and supportive—like a trusted advisor
- You speak with confidence but humility, acknowledging astrology's role as guidance, not fate
- You use accessible language, avoiding jargon unless specifically asked
- You're empowering, not fatalistic—you help people work WITH their cosmic energy

**Language Guidelines:**
- Use "rising sign" instead of "ascendant" (unless they use technical terms)
- Use "life chapter" or "planetary period" instead of "dasha" in casual conversation
- Explain concepts when introducing them
- Be conversational, not academic

**Your Approach:**
1. Answer questions directly and personally, referencing their specific chart
2. Connect astrological insights to practical life guidance
3. When discussing timing, be specific but frame it as "favorable energy" rather than guarantees
4. Validate their experiences while offering perspective
5. Keep responses focused and digestible (2-4 paragraphs for most questions)

**Important:**
- You have their complete birth chart data provided in the conversation
- Reference their specific planetary placements when relevant
- If they ask about something you can't determine from their chart, be honest about it
- Never make up chart details—only use what's provided

Remember: You're having a conversation, not giving a lecture. Listen, connect, and guide.`;

function buildChartContext(kundliData: any): string {
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

  return `**${kundliData.name || "User"}'s Birth Chart:**
Birth: ${kundliData.birth_date} at ${kundliData.birth_time}
Location: ${kundliData.birth_place}

**Rising Sign:** ${ascendantSign}
${lordInfo}

**${moonInfo}**

**Planetary Placements:**
${planetaryPositionsText}

**${currentDashaText}**`;
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

    // Check subscription status
    const { data: subscription, error: subError } = await supabase
      .from("chatbot_subscriptions")
      .select("id, status")
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

    // Fetch last 10 messages for context
    const { data: historyMessages, error: historyError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", currentSessionId)
      .order("created_at", { ascending: true })
      .limit(10);

    if (historyError) {
      logStep("Failed to fetch history", { error: historyError.message });
    }

    // Build chart context
    const chartContext = buildChartContext(kundliData);

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

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: claudeMessages,
        system: MAYA_SYSTEM_PROMPT,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      logStep("Claude API error", { status: claudeResponse.status, error: errorText });

      if (claudeResponse.status === 429) {
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

    const claudeData = await claudeResponse.json();
    const assistantResponse = claudeData.content?.[0]?.text || "";
    const tokensUsed = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0);

    logStep("Response generated", { tokens: tokensUsed });

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
