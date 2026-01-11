/**
 * Shared logging utilities for edge functions
 */

/**
 * Factory function for consistent logging across functions
 * @param prefix - The prefix to use for log messages (e.g., "GENERATE-FORECAST")
 */
export function createLogger(prefix: string) {
  return (step: string, details?: Record<string, unknown>) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
    console.log(`[${prefix}] ${step}${detailsStr}`);
  };
}

/**
 * Hash token for secure logging (first 8 chars of SHA-256)
 * Used to log tokens without exposing the full value
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
