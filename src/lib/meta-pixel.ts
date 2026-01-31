// Meta Pixel tracking utility
// Pixel ID: 929280579784427

declare global {
  interface Window {
    fbq: (
      action: 'track' | 'trackCustom',
      event: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Track a standard Meta Pixel event
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
 * Track a custom named event (shows with your custom name in Events Manager)
 */
export function trackCustomEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}

/**
 * Track when a user generates their free forecast
 */
export function trackLead(params?: { content_name?: string; value?: number }) {
  // Standard event for Meta optimization
  trackEvent('Lead', params);
  // Custom event for clear dashboard visibility
  trackCustomEvent('FreeForcastGenerated', params);
}

/**
 * Track when a user initiates checkout for paid forecast
 */
export function trackInitiateCheckout(params: { value: number; currency: string }) {
  // Standard event for Meta optimization
  trackEvent('InitiateCheckout', params);
  // Custom event for clear dashboard visibility
  trackCustomEvent('UpgradeClicked', params);
}

/**
 * Track a successful purchase
 */
export function trackPurchase(params: { value: number; currency: string }) {
  // Standard event for Meta optimization
  trackEvent('Purchase', params);
  // Custom event for clear dashboard visibility
  trackCustomEvent('PaidForecastPurchased', params);
}

/**
 * Track a blog page view
 */
export function trackBlogView(params: { article_name: string; category?: string }) {
  trackCustomEvent('BlogArticleViewed', params);
}
