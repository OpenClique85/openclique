/**
 * Zapier Tracking Utility
 * 
 * Sends non-PII tracking events to Zapier for analytics.
 * Only tracks: event_type, timestamp, page_source
 * Does NOT track any personal information.
 */

import { ZAPIER_WEBHOOK_URL } from "@/constants/content";

interface TrackingEvent {
  event_type: string;
  page_source: string;
  button_label?: string;
  destination?: string;
}

export async function trackEvent(event: TrackingEvent): Promise<void> {
  // Don't track if no webhook URL is configured
  if (!ZAPIER_WEBHOOK_URL || ZAPIER_WEBHOOK_URL.includes("YOUR_WEBHOOK_ID")) {
    console.log("[Tracking] No webhook configured, skipping:", event);
    return;
  }

  try {
    await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors", // Required for Zapier webhooks
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        triggered_from: window.location.origin,
      }),
    });
    console.log("[Tracking] Event sent:", event.event_type);
  } catch (error) {
    console.error("[Tracking] Failed to send event:", error);
  }
}

// Pre-defined tracking functions for common events
export function trackCTAClick(buttonLabel: string, destination: string, pageSource: string) {
  return trackEvent({
    event_type: "cta_click",
    button_label: buttonLabel,
    destination,
    page_source: pageSource,
  });
}

export function trackFormRedirect(formType: "pilot" | "partners" | "work_with_us", pageSource: string) {
  return trackEvent({
    event_type: "form_redirect",
    button_label: formType,
    destination: `google_form_${formType}`,
    page_source: pageSource,
  });
}

export function trackEmailCapture(pageSource: string) {
  return trackEvent({
    event_type: "email_capture",
    page_source: pageSource,
  });
}
