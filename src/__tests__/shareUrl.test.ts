import { describe, it, expect, beforeEach } from 'vitest';
import { buildShareUrl } from '@/lib/shareUrl';

// Mock window.location.origin for vitest (jsdom not configured, so we set it manually)
beforeEach(() => {
  // @ts-ignore
  if (!globalThis.window) globalThis.window = {} as any;
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://www.cosmicbrief.com' },
    writable: true,
    configurable: true,
  });
});

describe('buildShareUrl', () => {
  it('adds utm_source, utm_medium, and utm_campaign', () => {
    const url = buildShareUrl('/birth-chart?id=abc', 'birth_chart', 'copy_link');
    expect(url).toContain('utm_source=share');
    expect(url).toContain('utm_medium=copy_link');
    expect(url).toContain('utm_campaign=birth_chart');
  });

  it('preserves existing query params', () => {
    const url = buildShareUrl('/birth-chart?id=abc', 'birth_chart', 'whatsapp');
    expect(url).toContain('id=abc');
    expect(url).toContain('utm_medium=whatsapp');
  });

  it('uses window.location.origin as base', () => {
    const url = buildShareUrl('/vedic/results?id=xyz', 'vedic_forecast', 'native_share');
    expect(url).toMatch(/^https:\/\/www\.cosmicbrief\.com\/vedic\/results/);
  });

  it('works with hash-based paths', () => {
    const url = buildShareUrl('/#/results?forecastId=f1&guestToken=t1', 'cosmic_brief', 'copy_link');
    expect(url).toContain('utm_campaign=cosmic_brief');
  });

  it('produces a valid URL', () => {
    const url = buildShareUrl('/birth-chart?id=abc', 'birth_chart', 'image');
    expect(() => new URL(url)).not.toThrow();
  });
});
