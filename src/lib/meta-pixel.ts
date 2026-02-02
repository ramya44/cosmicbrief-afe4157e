// Meta Pixel tracking utility
// Pixel ID: 929280579784427

declare global {
  interface Window {
    fbq: (
      action: 'track' | 'trackCustom' | 'init',
      event: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
  }
}

/**
 * Generate a unique event ID for deduplication with Conversions API
 */
export function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Track a standard Meta Pixel event with optional eventID for CAPI deduplication
 */
export function trackEvent(
  event: 'Lead' | 'InitiateCheckout' | 'Purchase' | 'ViewContent' | 'CompleteRegistration',
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window !== 'undefined' && window.fbq) {
    if (eventId) {
      window.fbq('track', event, params, { eventID: eventId });
    } else {
      window.fbq('track', event, params);
    }
  }
}

/**
 * Track a custom named event (shows with your custom name in Events Manager)
 */
export function trackCustomEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window !== 'undefined' && window.fbq) {
    if (eventId) {
      window.fbq('trackCustom', eventName, params, { eventID: eventId });
    } else {
      window.fbq('trackCustom', eventName, params);
    }
  }
}

/**
 * Track when a user generates their free forecast
 * @param params - Event parameters
 * @param eventId - Unique ID for deduplication with server-side CAPI (should match the ID sent to server)
 */
export function trackLead(params?: { content_name?: string; value?: number }, eventId?: string) {
  // Standard event for Meta optimization (with eventID for CAPI deduplication)
  trackEvent('Lead', params, eventId);
  // Custom event for clear dashboard visibility
  trackCustomEvent('FreeForcastGenerated', params, eventId ? `${eventId}_custom` : undefined);
}

/**
 * Track when a user initiates checkout for paid forecast
 */
export function trackInitiateCheckout(params: { value: number; currency: string }, eventId?: string) {
  // Standard event for Meta optimization
  trackEvent('InitiateCheckout', params, eventId);
  // Custom event for clear dashboard visibility
  trackCustomEvent('UpgradeClicked', params, eventId ? `${eventId}_custom` : undefined);
}

/**
 * Track a successful purchase
 */
export function trackPurchase(params: { value: number; currency: string }, eventId?: string) {
  // Standard event for Meta optimization
  trackEvent('Purchase', params, eventId);
  // Custom event for clear dashboard visibility
  trackCustomEvent('PaidForecastPurchased', params, eventId ? `${eventId}_custom` : undefined);
}

/**
 * Track a blog page view
 */
export function trackBlogView(params: { article_name: string; category?: string }) {
  trackCustomEvent('BlogArticleViewed', params);
}
