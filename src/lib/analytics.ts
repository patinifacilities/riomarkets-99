import { getSessionId, getDeviceInfo } from './session';

export const track = (event: string, props: Record<string, unknown> = {}) => {
  const enrichedProps = {
    session_id: getSessionId(),
    device: getDeviceInfo(),
    ts: Date.now(),
    ...props
  };
  
  // Placeholder for analytics provider (PostHog, GA4, etc.)
  console.log('[Analytics]', event, enrichedProps);
  
  // Dispatch custom event for debugging
  window?.dispatchEvent(new CustomEvent('analytics', { 
    detail: { event, ...enrichedProps } 
  }));
  
  // Future integration example:
  // window.gtag?.('event', event, enrichedProps);
  // window.posthog?.capture(event, enrichedProps);
};