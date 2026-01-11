// Rate limiting logic
// supabase/functions/generate-forecast/lib/rate_limit.ts
import type { RateLimitResult } from "../../_shared/lib/types.ts";

const IP_BURST_LIMIT = 1;
const IP_BURST_WINDOW_MS = 60_000;

const IP_DAILY_LIMIT = 10;
const IP_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const DEVICE_DAILY_LIMIT = 10;
const DEVICE_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const CAPTCHA_IP_THRESHOLD = 5;
const SUSPICIOUS_USER_AGENTS = ["curl", "wget", "python", "httpie", "postman", "insomnia", "bot", "crawler", "spider"];

const ipBurstLimiter = new Map<string, { count: number; resetAt: number }>();
const ipDailyLimiter = new Map<string, { count: number; resetAt: number }>();
const deviceDailyLimiter = new Map<string, { count: number; resetAt: number }>();

const recentRequestTimestamps: number[] = [];
const SPIKE_WINDOW_MS = 5 * 60 * 1000;
const SPIKE_THRESHOLD = 100;

function cleanupMap(map: Map<string, { count: number; resetAt: number }>, now: number, maxSize = 10_000) {
  if (map.size > maxSize) {
    for (const [key, value] of map.entries()) {
      if (now > value.resetAt) map.delete(key);
    }
  }
}

export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") || "";
}

export function isSuspiciousUserAgent(userAgent: string): boolean {
  const lower = userAgent.toLowerCase();
  return SUSPICIOUS_USER_AGENTS.some((p) => lower.includes(p));
}

export function detectTrafficSpike(): boolean {
  const now = Date.now();
  while (recentRequestTimestamps.length > 0 && recentRequestTimestamps[0] < now - SPIKE_WINDOW_MS) {
    recentRequestTimestamps.shift();
  }
  recentRequestTimestamps.push(now);
  return recentRequestTimestamps.length > SPIKE_THRESHOLD;
}

export function checkRateLimits(ip: string, deviceId: string | undefined): RateLimitResult {
  const now = Date.now();

  cleanupMap(ipBurstLimiter, now);
  cleanupMap(ipDailyLimiter, now);
  cleanupMap(deviceDailyLimiter, now);

  const burst = ipBurstLimiter.get(ip);
  if (burst && now <= burst.resetAt && burst.count >= IP_BURST_LIMIT) {
    const waitSeconds = Math.ceil((burst.resetAt - now) / 1000);
    return {
      allowed: false,
      requireCaptcha: false,
      message: `Please wait ${waitSeconds} seconds before generating another forecast.`,
    };
  }
  if (!burst || now > burst.resetAt) ipBurstLimiter.set(ip, { count: 1, resetAt: now + IP_BURST_WINDOW_MS });
  else burst.count++;

  const daily = ipDailyLimiter.get(ip);
  if (daily && now <= daily.resetAt && daily.count >= IP_DAILY_LIMIT) {
    return { allowed: false, requireCaptcha: false, message: "Daily limit reached. Please try again tomorrow." };
  }
  if (!daily || now > daily.resetAt) ipDailyLimiter.set(ip, { count: 1, resetAt: now + IP_DAILY_WINDOW_MS });
  else daily.count++;

  if (deviceId) {
    const device = deviceDailyLimiter.get(deviceId);
    if (device && now <= device.resetAt && device.count >= DEVICE_DAILY_LIMIT) {
      return {
        allowed: false,
        requireCaptcha: false,
        message: "You've reached the maximum free previews for today. Please try again tomorrow.",
      };
    }
    if (!device || now > device.resetAt)
      deviceDailyLimiter.set(deviceId, { count: 1, resetAt: now + DEVICE_DAILY_WINDOW_MS });
    else device.count++;
  }

  const currentDailyCount = ipDailyLimiter.get(ip)?.count || 0;
  const requireCaptcha = currentDailyCount > CAPTCHA_IP_THRESHOLD;

  return { allowed: true, requireCaptcha };
}
