import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 3 requests per minute per IP (email spam protection)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60000;

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(ip);
  
  if (rateLimiter.size > 10000) {
    for (const [key, value] of rateLimiter.entries()) {
      if (now > value.resetAt) rateLimiter.delete(key);
    }
  }
  
  if (!record || now > record.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-FORECAST-EMAIL] ${step}${detailsStr}`);
};

interface ForecastEmailRequest {
  customerEmail: string;
  customerName?: string;
  forecastId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    logStep("Function started");

    const { customerEmail, customerName, forecastId }: ForecastEmailRequest = await req.json();

    logStep("Received request", { customerEmail, customerName, forecastId });

    if (!customerEmail || !forecastId) {
      throw new Error("Missing required fields: customerEmail or forecastId");
    }

    // Build the results URL
    const appUrl = Deno.env.get("APP_URL") || "https://astroyearcompass.lovable.app";
    const resultsUrl = `${appUrl}/results?forecastId=${forecastId}`;

    logStep("Sending email", { to: customerEmail, resultsUrl });

    const emailResponse = await resend.emails.send({
      from: "AstroYear Compass <onboarding@resend.dev>",
      to: [customerEmail],
      subject: "Your Strategic Year Map is Ready! ✨",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: Georgia, 'Times New Roman', serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a1a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(218, 165, 32, 0.3); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
                      <h1 style="color: #f5f5dc; font-size: 28px; margin: 0; font-weight: normal;">
                        ${customerName ? `Dear ${customerName},` : 'Dear Stargazer,'}
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <p style="color: #d4d4c4; font-size: 16px; line-height: 1.8; margin: 0 0 24px;">
                        Your personalized <strong style="color: #daa520;">Strategic Year Map</strong> has been crafted and is ready for you to explore.
                      </p>
                      <p style="color: #d4d4c4; font-size: 16px; line-height: 1.8; margin: 0 0 32px;">
                        This comprehensive guide includes your complete astrological analysis with monthly guidance, key planetary influences, and strategic recommendations for the year ahead.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 0 40px 32px; text-align: center;">
                      <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(135deg, #daa520 0%, #b8860b 100%); color: #0a0a1a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(218, 165, 32, 0.3);">
                        View Your Strategic Year Map
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Bookmark reminder -->
                  <tr>
                    <td style="padding: 0 40px 32px;">
                      <div style="background: rgba(218, 165, 32, 0.1); border: 1px solid rgba(218, 165, 32, 0.2); border-radius: 8px; padding: 20px;">
                        <p style="color: #daa520; font-size: 14px; margin: 0; text-align: center;">
                          💡 <strong>Tip:</strong> Bookmark this link to access your forecast anytime!
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; border-top: 1px solid rgba(218, 165, 32, 0.2); text-align: center;">
                      <p style="color: #888; font-size: 12px; margin: 0;">
                        May the stars guide your path ✨
                      </p>
                      <p style="color: #666; font-size: 11px; margin: 12px 0 0;">
                        AstroYear Compass
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
