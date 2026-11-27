// GA4 custom event helper.
// Usage: trackEvent('signup_complete', { method: 'email' })
// No-op when gtag is not loaded (dev, preview, no GA_MEASUREMENT_ID).
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, params);
  }
}
