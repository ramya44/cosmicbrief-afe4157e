import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/lib/http.ts";
import { createLogger } from "../_shared/lib/logger.ts";
import {
  buildWeeklyForecastEmailHtml,
  buildWeeklyForecastEmailText,
  type WeeklyForecastEmailContent
} from "../_shared/lib/email-templates.ts";

const logStep = createLogger("SEND-WEEKLY-FORECASTS");

const APP_URL = Deno.env.get("APP_URL") || "https://www.cosmicbrief.com";

interface ForecastContent {
  week_summary: string;
  money_days: Array<{ day: string; date: string; quality: string; reason: string }>;
  conversation_days: Array<{ day: string; date: string; quality: string; reason: string }>;
  lucky_days: Array<{ day: string; date: string; area: string; reason: string }>;
  look_forward_to: string[];
  avoid: string[];
}

/**
 * Get the Monday of next week
 */
function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    logStep("Request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Calculate next week's dates
    const nextMonday = getNextMonday();
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextSunday.getDate() + 6);

    const weekStartStr = formatDate(nextMonday);
    const weekEndStr = formatDate(nextSunday);

    logStep("Processing week", { week_start: weekStartStr, week_end: weekEndStr });

    // Query active subscribers (trial + active)
    const { data: subscribers, error: subError } = await supabase
      .from("weekly_forecast_subscriptions")
      .select(`
        id,
        kundli_id,
        email,
        status,
        trial_ends_at
      `)
      .in("status", ["trial", "active"]);

    if (subError) {
      logStep("Failed to fetch subscribers", { error: subError.message });
      throw new Error("Failed to fetch subscribers");
    }

    if (!subscribers || subscribers.length === 0) {
      logStep("No active subscribers found");
      return jsonResponse({ success: true, sent: 0, message: "No active subscribers" });
    }

    logStep("Found subscribers", { count: subscribers.length });

    // Filter out expired trials
    const now = new Date();
    const activeSubscribers = subscribers.filter(sub => {
      if (sub.status === 'active') return true;
      if (sub.status === 'trial' && sub.trial_ends_at) {
        return new Date(sub.trial_ends_at) > now;
      }
      return false;
    });

    logStep("Active subscribers after filtering", { count: activeSubscribers.length });

    let sentCount = 0;
    let errorCount = 0;

    for (const subscriber of activeSubscribers) {
      try {
        // Check if forecast already exists for this week
        const { data: existingForecast } = await supabase
          .from("personalized_weekly_forecasts")
          .select("id, forecast_content, email_sent_at")
          .eq("kundli_id", subscriber.kundli_id)
          .eq("week_start", weekStartStr)
          .single();

        let forecastContent: ForecastContent;

        if (existingForecast) {
          // If already sent, skip
          if (existingForecast.email_sent_at) {
            logStep("Email already sent", { kundli_id: subscriber.kundli_id });
            continue;
          }
          forecastContent = existingForecast.forecast_content as ForecastContent;
        } else {
          // Generate forecast
          logStep("Generating forecast", { kundli_id: subscriber.kundli_id });

          const { data: genResult, error: genError } = await supabase.functions.invoke(
            'generate-weekly-forecast',
            { body: { kundli_id: subscriber.kundli_id, week_start: weekStartStr } }
          );

          if (genError) {
            logStep("Failed to generate forecast", { kundli_id: subscriber.kundli_id, error: genError.message });
            errorCount++;
            continue;
          }

          forecastContent = genResult.forecast as ForecastContent;
        }

        // Get kundli details for name
        const { data: kundliData } = await supabase
          .from("user_kundli_details")
          .select("name")
          .eq("id", subscriber.kundli_id)
          .single();

        // Build email content
        const resultsUrl = `${APP_URL}/weekly/results?id=${subscriber.kundli_id}`;
        const unsubscribeUrl = `${APP_URL}/unsubscribe?type=weekly&id=${subscriber.id}`;

        const emailContent: WeeklyForecastEmailContent = {
          weekStart: formatDisplayDate(weekStartStr),
          weekEnd: formatDisplayDate(weekEndStr),
          weekSummary: forecastContent.week_summary || '',
          moneyDays: forecastContent.money_days || [],
          conversationDays: forecastContent.conversation_days || [],
          luckyDays: forecastContent.lucky_days || [],
          lookForwardTo: forecastContent.look_forward_to || [],
          avoid: forecastContent.avoid || [],
          isTrial: subscriber.status === 'trial',
          resultsUrl,
        };

        const emailHtml = buildWeeklyForecastEmailHtml(kundliData?.name, emailContent, unsubscribeUrl);
        const emailText = buildWeeklyForecastEmailText(kundliData?.name, emailContent, unsubscribeUrl);

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: "Cosmic Brief <noreply@notifications.cosmicbrief.com>",
          to: [subscriber.email],
          subject: `Your Week Ahead: ${emailContent.weekStart} – ${emailContent.weekEnd}`,
          html: emailHtml,
          text: emailText,
        });

        if (emailError) {
          logStep("Failed to send email", { email: subscriber.email, error: emailError.message });
          errorCount++;
          continue;
        }

        // Update email_sent_at
        await supabase
          .from("personalized_weekly_forecasts")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("kundli_id", subscriber.kundli_id)
          .eq("week_start", weekStartStr);

        sentCount++;
        logStep("Email sent", { email: subscriber.email });

      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unknown error";
        logStep("Error processing subscriber", { kundli_id: subscriber.kundli_id, error: errMessage });
        errorCount++;
      }
    }

    logStep("Completed", { sent: sentCount, errors: errorCount });

    return jsonResponse({
      success: true,
      sent: sentCount,
      errors: errorCount,
      total_subscribers: activeSubscribers.length,
      week_start: weekStartStr,
      week_end: weekEndStr,
    });

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errMessage });
    return errorResponse(errMessage, 500);
  }
});
