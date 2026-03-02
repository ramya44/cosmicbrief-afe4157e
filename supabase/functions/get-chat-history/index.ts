import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";

const logStep = createLogger("GET-CHAT-HISTORY");

// Input validation schema
const RequestSchema = z.object({
  kundli_id: z.string().uuid("Invalid kundli ID format"),
  session_id: z.string().uuid("Invalid session ID format").optional(),
});

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const validationResult = RequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      return errorResponse(`Invalid input: ${errorMessages}`, 400);
    }

    const { kundli_id, session_id } = validationResult.data;
    logStep("Request validated", { kundli_id, session_id });

    // If session_id is provided, return messages for that session
    if (session_id) {
      // Verify session belongs to this kundli
      const { data: session, error: sessionError } = await supabase
        .from("chat_sessions")
        .select("id, kundli_id, created_at, last_message_at, message_count")
        .eq("id", session_id)
        .eq("kundli_id", kundli_id)
        .single();

      if (sessionError || !session) {
        logStep("Session not found", { error: sessionError?.message });
        return errorResponse("Chat session not found", 404);
      }

      // Fetch messages for this session
      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", session_id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        logStep("Failed to fetch messages", { error: messagesError.message });
        throw new Error("Failed to fetch chat messages");
      }

      logStep("Messages fetched", { count: messages?.length || 0 });

      return jsonResponse({
        session,
        messages: messages || [],
      });
    }

    // No session_id provided, return list of sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("chat_sessions")
      .select("id, created_at, last_message_at, message_count")
      .eq("kundli_id", kundli_id)
      .order("last_message_at", { ascending: false })
      .limit(20);

    if (sessionsError) {
      logStep("Failed to fetch sessions", { error: sessionsError.message });
      throw new Error("Failed to fetch chat sessions");
    }

    // For each session, get the first message as a preview
    const sessionsWithPreviews = await Promise.all(
      (sessions || []).map(async (session) => {
        const { data: firstMessage } = await supabase
          .from("chat_messages")
          .select("content")
          .eq("session_id", session.id)
          .eq("role", "user")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        return {
          ...session,
          preview: firstMessage?.content
            ? firstMessage.content.slice(0, 100) + (firstMessage.content.length > 100 ? "..." : "")
            : "New conversation",
        };
      })
    );

    logStep("Sessions fetched", { count: sessionsWithPreviews.length });

    return jsonResponse({
      sessions: sessionsWithPreviews,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
