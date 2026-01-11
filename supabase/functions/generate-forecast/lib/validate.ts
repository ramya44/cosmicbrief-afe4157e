// Input validation logic
// supabase/functions/generate-forecast/lib/validate.ts
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import type { ParsedInput } from "../../_shared/lib/types.ts";

const MAX_BIRTH_PLACE_LENGTH = 200;
const MAX_CAPTCHA_TOKEN_LENGTH = 2000;

const InputSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format. Use HH:MM"),
  birthPlace: z
    .string()
    .min(2, "Birth place too short")
    .max(MAX_BIRTH_PLACE_LENGTH, `Birth place too long (max ${MAX_BIRTH_PLACE_LENGTH} chars)`),
  birthTimeUtc: z.string().max(50).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceId: z.string().uuid("Invalid device ID").optional(),
  captchaToken: z.string().max(MAX_CAPTCHA_TOKEN_LENGTH).optional(),
});

export function parseAndValidate(rawBody: string): { ok: true; data: ParsedInput } | { ok: false; error: string } {
  let rawInput: unknown;
  try {
    rawInput = JSON.parse(rawBody);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }

  const result = InputSchema.safeParse(rawInput);
  if (!result.success) {
    const errorMessages = result.error.errors.map((e) => e.message).join(", ");
    return { ok: false, error: `Invalid input: ${errorMessages}` };
  }

  return { ok: true, data: result.data };
}
