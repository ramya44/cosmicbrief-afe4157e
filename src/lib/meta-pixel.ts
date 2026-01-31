// Meta Pixel tracking utility
// Pixel ID: 929280579784427

declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Track a Meta Pixel event
 */
export function trackEvent(
  event: 'Lead' | 'InitiateCheckout' | 'Purchase' | 'ViewContent' | 'CompleteRegistration',
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
}

/**
 * Track when a user generates their free forecast (Lead)
 */
export function trackLead(params?: { content_name?: string; value?: number }) {
  trackEvent('Lead', params);
}

/**
 * Track when a user initiates checkout for paid forecast
 */
export function trackInitiateCheckout(params: { value: number; currency: string }) {
  trackEvent('InitiateCheckout', params);
}

/**
 * Track a successful purchase
 */
export function trackPurchase(params: { value: number; currency: string }) {
  trackEvent('Purchase', params);
}
