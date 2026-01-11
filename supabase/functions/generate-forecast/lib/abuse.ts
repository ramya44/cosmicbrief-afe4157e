// Abuse detection and alerting logic
// supabase/functions/generate-forecast/lib/abuse.ts

const ABUSE_ALERT_THRESHOLD = 50;
const hourlyGenerationCount = { count: 0, hourStart: Date.now() };
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;
let lastAlertTime = 0;

// deno-lint-ignore no-explicit-any
export async function checkAndAlertAbuse(
  supabase: any,
  ip: string,
  deviceId: string | undefined,
  logStep: (step: string, details?: Record<string, unknown>) => void,
): Promise<void> {
  const now = Date.now();

  if (now - hourlyGenerationCount.hourStart > 60 * 60 * 1000) {
    hourlyGenerationCount.count = 0;
    hourlyGenerationCount.hourStart = now;
  }

  hourlyGenerationCount.count++;

  if (hourlyGenerationCount.count < ABUSE_ALERT_THRESHOLD) return;
  if (now - lastAlertTime <= ALERT_COOLDOWN_MS) return;

  lastAlertTime = now;

  logStep("ABUSE_THRESHOLD_EXCEEDED", {
    hourlyCount: hourlyGenerationCount.count,
    threshold: ABUSE_ALERT_THRESHOLD,
  });

  try {
    await (supabase as any).from("abuse_events").insert({
      event_type: "hourly_threshold_exceeded",
      ip_address: ip,
      device_id: deviceId || null,
      hourly_count: hourlyGenerationCount.count,
      threshold: ABUSE_ALERT_THRESHOLD,
      details: { function: "generate-forecast", timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error("Failed to write abuse event:", err);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cosmic Brief Alerts <alerts@cosmicbrief.com>",
        to: ["contact@cosmicbrief.com"],
        subject: `⚠️ Abuse Alert: Free Forecast Threshold Exceeded`,
        html: `
          <h2>Abuse Threshold Exceeded</h2>
          <p><strong>Function:</strong> generate-forecast</p>
          <p><strong>Hourly Count:</strong> ${hourlyGenerationCount.count}</p>
          <p><strong>Threshold:</strong> ${ABUSE_ALERT_THRESHOLD}</p>
          <p><strong>Last IP:</strong> ${ip}</p>
          <p><strong>Device ID:</strong> ${deviceId || "N/A"}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `,
      }),
    });

    logStep("Abuse alert email sent");
  } catch (emailErr) {
    console.error("Failed to send abuse alert email:", emailErr);
  }
}
