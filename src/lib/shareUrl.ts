/**
 * Builds share URLs with UTM tracking parameters.
 *
 * Usage:
 *   buildShareUrl('/birth-chart?id=abc', 'birth_chart', 'whatsapp')
 *   → "https://www.cosmicbrief.com/birth-chart?id=abc&utm_source=share&utm_medium=whatsapp&utm_campaign=birth_chart"
 */

export type ShareMedium = 'copy_link' | 'whatsapp' | 'native_share' | 'image';

export type ShareCampaign =
  | 'birth_chart'
  | 'vedic_forecast'
  | 'cosmic_brief';

export function buildShareUrl(
  basePath: string,
  campaign: ShareCampaign,
  medium: ShareMedium,
): string {
  const url = new URL(basePath, window.location.origin);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}
