import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 5 requests per minute per IP
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
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
  console.log(`[NOTIFY-SUPPORT] ${step}${detailsStr}`);
};

serve(async (req) => {
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    const { 
      customerEmail, 
      customerName, 
      birthDate,
      birthTime,
      birthPlace,
      errorMessage,
      stripeSessionId,
      totalAttempts,
    } = await req.json();

    logStep("Received data", { 
      customerEmail, 
      customerName,
      stripeSessionId,
      errorMessage,
    });

    // Send alert email to support
    const { data, error } = await resend.emails.send({
      from: "Astrology Support <support@yourdomain.com>",
      to: ["support@yourdomain.com"], // Replace with actual support email
      subject: `⚠️ URGENT: Failed Forecast Generation - ${customerEmail}`,
      html: `
        <h2>Strategic Forecast Generation Failed</h2>
        <p>A paid customer's forecast failed to generate after all retry attempts.</p>
        
        <h3>Customer Details</h3>
        <ul>
          <li><strong>Email:</strong> ${customerEmail}</li>
          <li><strong>Name:</strong> ${customerName || 'Not provided'}</li>
          <li><strong>Stripe Session ID:</strong> ${stripeSessionId}</li>
        </ul>
        
        <h3>Birth Data</h3>
        <ul>
          <li><strong>Date:</strong> ${birthDate}</li>
          <li><strong>Time:</strong> ${birthTime}</li>
          <li><strong>Place:</strong> ${birthPlace}</li>
        </ul>
        
        <h3>Error Details</h3>
        <ul>
          <li><strong>Total Attempts:</strong> ${totalAttempts || 'Unknown'}</li>
          <li><strong>Error:</strong> ${errorMessage || 'Unknown error'}</li>
        </ul>
        
        <p><strong>Action Required:</strong> Please manually generate this customer's Strategic Year Map and send it to them within 24 hours.</p>
      `,
    });

    if (error) {
      logStep("Failed to send support notification", { error });
      throw new Error(`Failed to send notification: ${error.message}`);
    }

    logStep("Support notification sent successfully", { emailId: data?.id });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
