import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createLogger } from "../_shared/lib/logger.ts";
import {
  buildWeeklyHoroscopeEmailHtml,
  buildWeeklyHoroscopeEmailText,
  WeeklyHoroscopeContent,
} from "../_shared/lib/email-templates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const logStep = createLogger("SEND-WEEKLY-HOROSCOPE");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map Vedic sign names to match what's stored in the database
const VEDIC_SIGN_MAP: Record<string, string> = {
  Mesha: "Mesha",
  Vrishabha: "Vrishabha",
  Mithuna: "Mithuna",
  Karka: "Karka",
  Simha: "Simha",
  Kanya: "Kanya",
  Tula: "Tula",
  Vrishchika: "Vrishchika",
  Dhanu: "Dhanu",
  Makara: "Makara",
  Kumbha: "Kumbha",
  Meena: "Meena",
  // Western name fallbacks
  Aries: "Mesha",
  Taurus: "Vrishabha",
  Gemini: "Mithuna",
  Cancer: "Karka",
  Leo: "Simha",
  Virgo: "Kanya",
  Libra: "Tula",
  Scorpio: "Vrishchika",
  Sagittarius: "Dhanu",
  Capricorn: "Makara",
  Aquarius: "Kumbha",
  Pisces: "Meena",
};

interface WeeklyHoroscopeData {
  week_start: string;
  week_end: string;
  master_overview: string;
  moon_signs: Record<string, string>;
  nakshatras: Record<string, string>;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  kundli_id: string | null;
  moon_sign: string | null;
  nakshatra: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body - can optionally pass weekly_content directly
    let weeklyContent: WeeklyHoroscopeData | null = null;
    let testMode = false;
    let testEmail: string | null = null;

    try {
      const body = await req.json();
      weeklyContent = body.weekly_content;
      testMode = body.test_mode === true;
      testEmail = body.test_email;
    } catch {
      // No body provided, will fetch from storage
    }

    // If no content provided, fetch from weekly_horoscope_content table
    if (!weeklyContent) {
      logStep("Fetching weekly content from storage");

      const { data: contentData, error: contentError } = await supabase
        .from("weekly_horoscope_content")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      if (contentError || !contentData) {
        throw new Error(
          `Failed to fetch weekly content: ${contentError?.message || "No content found"}`
        );
      }

      weeklyContent = contentData.content as WeeklyHoroscopeData;
    }

    logStep("Weekly content loaded", {
      weekStart: weeklyContent.week_start,
      weekEnd: weeklyContent.week_end,
    });

    // Format dates for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    const weekStart = formatDate(weeklyContent.week_start);
    const weekEnd = formatDate(weeklyContent.week_end);

    // Fetch active subscribers with their kundli details
    let subscriberQuery = supabase
      .from("weekly_horoscope_subscribers")
      .select(
        `
        id,
        email,
        name,
        kundli_id,
        user_kundli_details!weekly_horoscope_subscribers_kundli_id_fkey (
          moon_sign,
          nakshatra
        )
      `
      )
      .eq("is_active", true)
      .is("unsubscribed_at", null);

    // In test mode, only send to the test email
    if (testMode && testEmail) {
      subscriberQuery = subscriberQuery.eq("email", testEmail);
    }

    const { data: subscribersData, error: subscribersError } =
      await subscriberQuery;

    if (subscribersError) {
      throw new Error(`Failed to fetch subscribers: ${subscribersError.message}`);
    }

    // Transform subscriber data
    const subscribers: Subscriber[] = (subscribersData || []).map((sub: any) => ({
      id: sub.id,
      email: sub.email,
      name: sub.name,
      kundli_id: sub.kundli_id,
      moon_sign: sub.user_kundli_details?.moon_sign || null,
      nakshatra: sub.user_kundli_details?.nakshatra || null,
    }));

    logStep("Subscribers fetched", { count: subscribers.length });

    if (subscribers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active subscribers found",
          sent: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send emails to each subscriber
    const results: { email: string; success: boolean; error?: string }[] = [];
    const appUrl = Deno.env.get("APP_URL") || "https://cosmicbrief.com";

    for (const subscriber of subscribers) {
      try {
        // Get personalized content based on moon sign and nakshatra
        const moonSign = subscriber.moon_sign
          ? VEDIC_SIGN_MAP[subscriber.moon_sign] || subscriber.moon_sign
          : null;

        const moonSignContent =
          moonSign && weeklyContent.moon_signs[moonSign]
            ? weeklyContent.moon_signs[moonSign]
            : "Your personalized moon sign forecast will be available once you complete your birth details on our website.";

        const nakshatraContent =
          subscriber.nakshatra && weeklyContent.nakshatras[subscriber.nakshatra]
            ? weeklyContent.nakshatras[subscriber.nakshatra]
            : "Your nakshatra-specific insights will be available once you complete your birth details on our website.";

        const content: WeeklyHoroscopeContent = {
          weekStart,
          weekEnd,
          masterOverview: weeklyContent.master_overview,
          moonSignContent,
          nakshatraContent,
        };

        const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&id=${subscriber.id}`;

        const htmlContent = buildWeeklyHoroscopeEmailHtml(
          subscriber.name || undefined,
          content,
          unsubscribeUrl
        );

        const textContent = buildWeeklyHoroscopeEmailText(
          subscriber.name || undefined,
          content,
          unsubscribeUrl
        );

        // Send the email
        const emailResponse = await resend.emails.send({
          from: "Cosmic Brief <noreply@notifications.cosmicbrief.com>",
          to: [subscriber.email],
          subject: `Your Week Ahead: ${weekStart} – ${weekEnd} ✨`,
          html: htmlContent,
          text: textContent,
        });

        logStep("Email sent", { email: subscriber.email, response: emailResponse });
        results.push({ email: subscriber.email, success: true });

        // Small delay between emails to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (emailError: any) {
        logStep("Email failed", {
          email: subscriber.email,
          error: emailError.message,
        });
        results.push({
          email: subscriber.email,
          success: false,
          error: emailError.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logStep("Batch complete", { successCount, failureCount });

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results: testMode ? results : undefined, // Only include details in test mode
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
