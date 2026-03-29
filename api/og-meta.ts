/**
 * Vercel Edge Function that serves HTML with personalized OG meta tags
 * for social media crawlers. Regular users never hit this — they're
 * routed to the SPA via vercel.json rewrites.
 */

export const config = {
  runtime: "edge",
};

interface KundliData {
  name?: string;
  sun_sign?: string;
  moon_sign?: string;
  ascendant_sign?: string;
  nakshatra?: string;
}

async function fetchKundliData(kundliId: string): Promise<KundliData | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/user_kundli_details?id=eq.${encodeURIComponent(kundliId)}&select=name,sun_sign,moon_sign,ascendant_sign,nakshatra`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOgTitle(data: KundliData | null, route: string): string {
  const name = data?.name?.trim();
  if (route === "/birth-chart") {
    return name ? `${name}'s Vedic Birth Chart` : "Vedic Birth Chart | Cosmic Brief";
  }
  if (route === "/weekly/results") {
    return name ? `${name}'s Weekly Vedic Forecast` : "Weekly Vedic Forecast | Cosmic Brief";
  }
  return name ? `${name}'s 2026 Cosmic Brief` : "2026 Cosmic Brief | Vedic Astrology Forecast";
}

function buildOgDescription(data: KundliData | null): string {
  if (!data?.sun_sign) {
    return "Discover what the stars reveal with a personalized Vedic astrology forecast based on exact birth details.";
  }
  const parts = [`Sun in ${data.sun_sign}`];
  if (data.moon_sign) parts.push(`Moon in ${data.moon_sign}`);
  if (data.ascendant_sign) parts.push(`${data.ascendant_sign} Rising`);
  return `${parts.join(" | ")} — See what Vedic astrology reveals in this personalized cosmic reading.`;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "/vedic/results";
  const kundliId = url.searchParams.get("id");
  const type = url.searchParams.get("type");

  // Reconstruct the canonical user-facing URL
  const canonicalParams = new URLSearchParams();
  if (kundliId) canonicalParams.set("id", kundliId);
  if (type) canonicalParams.set("type", type);
  const paid = url.searchParams.get("paid");
  if (paid) canonicalParams.set("paid", paid);
  const canonicalUrl = `https://www.cosmicbrief.com${path}${canonicalParams.toString() ? "?" + canonicalParams.toString() : ""}`;

  const data = kundliId ? await fetchKundliData(kundliId) : null;
  const title = escapeHtml(buildOgTitle(data, path));
  const description = escapeHtml(buildOgDescription(data));

  // Build dynamic OG image URL
  const ogImageParams = new URLSearchParams();
  if (data?.name) ogImageParams.set("name", data.name);
  if (data?.sun_sign) ogImageParams.set("sun", data.sun_sign);
  if (data?.moon_sign) ogImageParams.set("moon", data.moon_sign);
  if (data?.ascendant_sign) ogImageParams.set("asc", data.ascendant_sign);
  if (data?.nakshatra) ogImageParams.set("nak", data.nakshatra);
  ogImageParams.set(
    "type",
    path === "/birth-chart" ? "chart" : path === "/weekly/results" ? "weekly" : "forecast"
  );
  const imageUrl = `https://www.cosmicbrief.com/api/og-image?${ogImageParams.toString()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="Cosmic Brief" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@CosmicBrief" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
