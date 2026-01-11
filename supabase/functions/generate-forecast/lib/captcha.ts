// CAPTCHA verification logic
// supabase/functions/generate-forecast/lib/captcha.ts

export async function verifyCaptchaToken(token: string, clientIP: string): Promise<boolean> {
  const captchaSecretKey = Deno.env.get("CAPTCHA_SECRET_KEY");
  if (!captchaSecretKey) {
    console.warn("CAPTCHA_SECRET_KEY not configured - skipping verification");
    return true;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${captchaSecretKey}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(clientIP)}`,
    });

    const result = await response.json();
    return result.success === true;
  } catch (err) {
    console.error("CAPTCHA verification error:", err);
    return false;
  }
}
